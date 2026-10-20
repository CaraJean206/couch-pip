import { Focusable, GamepadButton, GamepadEvent, ModalRoot, showModal } from "@decky/ui";
import { useEffect, useRef, useState } from "react";

import * as backend from "./backend";
import { showTypeModal } from "./modals";
import { getState, setState } from "./store";
import { ViewMode, getMainWindow } from "./util";

const GUIDE: [string, string][] = [
    ["D-pad", "Move highlight"],
    ["A", "Select / click"],
    ["B", "Exit remote"],
    ["X", "Play / pause"],
    ["Y", "Type text"],
    ["L1 / R1", "Back / ahead 10s"],
    ["L2 / R2", "Volume"],
    ["View", "Browser back"],
    ["Menu", "Fill window / full page"],
    ["Right pad / stick", "Mouse"],
    ["Right pad click", "Click"],
    ["Left pad", "Scroll"],
];

const bit = (value: number, n: number) => Math.floor(Number(value) / 2 ** n) % 2 === 1;
const PAD_RANGE = 65536; // trackpad coordinates run from about -32768 to 32767
const PAD_SPEED = 0.9; // one full swipe moves the cursor across 90% of the page
const SCROLL_SPEED = 2; // one full swipe scrolls two screens
const ASPECT_FIX = 16 / 9; // pads are square, the page is wide

/** What the remote has received, shown in a small line so problems can be reported. */
export const padStats = {
    state: 0, // controller state packets from Steam
    stateWithPads: 0, // packets with trackpad movement or touch
    last: "",
    wheel: 0, // DOM scroll-wheel events
    mouse: 0, // DOM mouse movement events
    clicks: 0,
    buttons: [] as number[], // recent button codes we didn't otherwise use
    sent: 0, // pointer commands sent to the page
    error: "",
};

/**
 * Turns the Steam Controller's trackpads (and right stick) into a mouse for
 * the page: right pad moves, right pad click clicks, left pad scrolls.
 * Steam can deliver trackpads in different ways, so this listens to all of
 * them: raw controller state, and mouse / wheel events in Steam's window.
 */
const usePadMouse = () => {
    useEffect(() => {
        const acc = { dx: 0, dy: 0, wheel: 0, click: false };
        let right: { x: number; y: number } | null = null;
        let left: { x: number; y: number } | null = null;
        let rightClickDown = false;
        let stick = { x: 0, y: 0 };
        let inflight = false;
        const cleanups: (() => void)[] = [];

        // 1. Raw controller state.
        const input = (window as any).SteamClient?.Input;
        if (input?.RegisterForControllerStateChanges) {
            const reg = input.RegisterForControllerStateChanges((changes: any[]) => {
                for (const c of changes) {
                    padStats.state++;
                    const b = c.ulButtons;
                    const rx = c.sRightPadX ?? 0, ry = c.sRightPadY ?? 0;
                    const lx = c.sLeftPadX ?? 0, ly = c.sLeftPadY ?? 0;
                    const rTouch = bit(b, 20) || rx !== 0 || ry !== 0;
                    const lTouch = bit(b, 19) || lx !== 0 || ly !== 0;
                    if (rTouch || lTouch) {
                        padStats.stateWithPads++;
                        padStats.last = `R ${rx},${ry} L ${lx},${ly} btn ${Number(b).toString(16)}`;
                    }
                    if (rTouch) {
                        if (right) {
                            const dx = (rx - right.x) / PAD_RANGE;
                            const dy = (ry - right.y) / PAD_RANGE;
                            // Ignore jumps (finger lifted and put down elsewhere).
                            if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
                                acc.dx += dx * PAD_SPEED;
                                acc.dy -= dy * PAD_SPEED * ASPECT_FIX;
                            }
                        }
                        right = { x: rx, y: ry };
                    } else {
                        right = null;
                    }
                    if (lTouch) {
                        if (left) {
                            const dy = (ly - left.y) / PAD_RANGE;
                            if (Math.abs(dy) < 0.25) acc.wheel -= dy * SCROLL_SPEED;
                        }
                        left = { x: lx, y: ly };
                    } else {
                        left = null;
                    }
                    const click = bit(b, 18);
                    if (click && !rightClickDown) acc.click = true;
                    rightClickDown = click;
                    stick = { x: (c.sRightStickX ?? 0) / 32767, y: (c.sRightStickY ?? 0) / 32767 };
                }
            });
            cleanups.push(() => reg?.unregister?.());
        } else {
            padStats.error = "Steam controller-state API not found";
        }

        // 2. Mouse and scroll-wheel events Steam sends to its own window.
        const win = getMainWindow();
        if (win) {
            const onWheel = (e: WheelEvent) => {
                padStats.wheel++;
                const px = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * win.innerHeight : e.deltaY;
                acc.wheel += px / win.innerHeight;
            };
            const onMove = (e: MouseEvent) => {
                if (!e.movementX && !e.movementY) return;
                padStats.mouse++;
                acc.dx += e.movementX / win.innerWidth;
                acc.dy += e.movementY / win.innerHeight;
            };
            const onDown = (e: MouseEvent) => {
                if (e.button !== 0) return;
                padStats.clicks++;
                acc.click = true;
            };
            win.addEventListener("wheel", onWheel, { passive: true, capture: true });
            win.addEventListener("mousemove", onMove, { capture: true });
            win.addEventListener("mousedown", onDown, { capture: true });
            cleanups.push(() => {
                win.removeEventListener("wheel", onWheel, { capture: true } as any);
                win.removeEventListener("mousemove", onMove, { capture: true } as any);
                win.removeEventListener("mousedown", onDown, { capture: true } as any);
            });
        }

        // 3. Send to the page about 30 times a second.
        const timer = setInterval(() => {
            // Right stick: speed grows with how far it's pushed.
            const mag = Math.hypot(stick.x, stick.y);
            const deadzone = 0.2;
            if (mag > deadzone) {
                const k = (((mag - deadzone) / (1 - deadzone)) ** 2 * 0.02) / mag;
                acc.dx += stick.x * k;
                acc.dy -= stick.y * k * ASPECT_FIX;
            }
            const moved = Math.abs(acc.dx) + Math.abs(acc.dy) > 0.0005;
            const scrolled = Math.abs(acc.wheel) > 0.002;
            if ((!moved && !scrolled && !acc.click) || inflight) return;
            const send = { ...acc };
            acc.dx = acc.dy = acc.wheel = 0;
            acc.click = false;
            inflight = true;
            padStats.sent++;
            backend
                .pointer(send.dx, send.dy, scrolled ? send.wheel : 0, send.click)
                .then((r) => {
                    padStats.error = r.ok ? "" : r.error ?? "";
                })
                .catch((e) => {
                    padStats.error = String(e);
                })
                .finally(() => {
                    inflight = false;
                });
        }, 33);
        cleanups.push(() => clearInterval(timer));

        return () => cleanups.forEach((f) => f());
    }, []);
};

/** Click under the cursor (for trackpad clicks that arrive as buttons). */
const clickAtCursor = () => backend.pointer(0, 0, 0, true);

const PadReadout = () => {
    const [, tick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => tick((n) => n + 1), 500);
        return () => clearInterval(t);
    }, []);
    const p = padStats;
    return (
        <div style={{ fontSize: 11, opacity: 0.55, marginTop: 8, fontFamily: "monospace" }}>
            pads: state {p.state} (touch {p.stateWithPads}) · wheel {p.wheel} · mouse {p.mouse} · clicks {p.clicks} · sent{" "}
            {p.sent}
            {p.buttons.length ? ` · buttons ${p.buttons.join(",")}` : ""}
            {p.last ? ` · ${p.last}` : ""}
            {p.error ? ` · ${p.error}` : ""}
        </div>
    );
};

/**
 * Full-screen remote. Its only focusable element swallows every controller
 * button and turns it into an action on the page, so the D-pad never wanders
 * off into Steam's menus.
 */
const RemoteModal = ({ closeModal }: { closeModal?: () => void }) => {
    const [status, setStatus] = useState("Connecting to the page…");
    const busy = useRef(false);
    usePadMouse();

    useEffect(() => {
        setState((s) => ({
            previousMode: s.viewMode === ViewMode.Remote || s.viewMode === ViewMode.Closed ? ViewMode.Picture : s.viewMode,
            viewMode: ViewMode.Remote,
            visible: true,
        }));
        backend.ensureAttached(getState().url).then((r) =>
            setStatus(r.ok ? "Ready. Use the D-pad to move around the page." : `Can't control this page: ${r.error}`),
        );
        return () => setState((s) => ({ viewMode: s.previousMode, visible: true }));
    }, []);

    const run = async (action: () => Promise<backend.Result<any>>, label?: (r: any) => string) => {
        if (busy.current) return null;
        busy.current = true;
        try {
            const r = await backend.withPage(getState().url, action);
            if (r.ok) {
                const text = label ? label(r.result) : typeof r.result === "string" ? r.result : "";
                if (text) setStatus(text);
            } else {
                setStatus(r.error ?? "Something went wrong");
            }
            return r;
        } finally {
            busy.current = false;
        }
    };

    const typeText = () =>
        showTypeModal(async (text, enter) => {
            if (text) await run(() => backend.insertText(text));
            if (enter) await run(() => backend.key("Enter"));
        });

    const onButtonDown = (e: GamepadEvent) => {
        switch (e.detail.button) {
            case GamepadButton.DIR_UP: run(() => backend.nav("up")); break;
            case GamepadButton.DIR_DOWN: run(() => backend.nav("down")); break;
            case GamepadButton.DIR_LEFT: run(() => backend.nav("left")); break;
            case GamepadButton.DIR_RIGHT: run(() => backend.nav("right")); break;
            case GamepadButton.SECONDARY: run(() => backend.media("toggle", 0)); break;
            case GamepadButton.OPTIONS: typeText(); break;
            case GamepadButton.BUMPER_LEFT: run(() => backend.media("seek", -10)); break;
            case GamepadButton.BUMPER_RIGHT: run(() => backend.media("seek", 10)); break;
            case GamepadButton.TRIGGER_LEFT: run(() => backend.media("volume", -0.1)); break;
            case GamepadButton.TRIGGER_RIGHT: run(() => backend.media("volume", 0.1)); break;
            case GamepadButton.SELECT: run(() => backend.back()); break;
            case GamepadButton.START: run(() => backend.media("fill", 0)); break;
            case 22: // right trackpad click
                padStats.clicks++;
                clickAtCursor();
                break;
            default:
                padStats.buttons = [...padStats.buttons.slice(-5), e.detail.button];
                return;
        }
    };

    const onActivate = async () => {
        const r = await run(() => backend.click(), (res) => (res === "editable" ? "Text box selected" : res));
        // Clicking a text box pops up the keyboard straight away.
        if (r?.ok && r.result === "editable") typeText();
    };

    return (
        <ModalRoot closeModal={closeModal} onCancel={closeModal} bAllowFullSize>
            <Focusable
                noFocusRing
                onActivate={onActivate}
                onButtonDown={onButtonDown}
                onOKActionDescription="Select"
                onCancelActionDescription="Exit remote"
                onSecondaryActionDescription="Play / pause"
                onOptionsActionDescription="Type"
                style={{ minHeight: "86vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
            >
                <div style={{ fontSize: 16, marginBottom: 10, color: "#dcdedf" }}>{status}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", fontSize: 13, opacity: 0.75 }}>
                    {GUIDE.map(([button, action]) => (
                        <span key={button}>
                            <b>{button}</b> {action}
                        </span>
                    ))}
                </div>
                <PadReadout />
            </Focusable>
        </ModalRoot>
    );
};

export const showRemote = () => showModal(<RemoteModal />);
