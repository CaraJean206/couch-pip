import { Focusable, GamepadButton, GamepadEvent, ModalRoot, showModal } from "@decky/ui";
import { useEffect, useRef, useState } from "react";

import * as backend from "./backend";
import { showTypeModal } from "./modals";
import { getState, setState } from "./store";
import { ViewMode } from "./util";

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

/**
 * Turns the Steam Controller's trackpads (and right stick) into a mouse for
 * the page: right pad moves, right pad click clicks, left pad scrolls.
 */
const usePadMouse = () => {
    useEffect(() => {
        const input = (window as any).SteamClient?.Input;
        if (!input?.RegisterForControllerStateChanges) return;

        const acc = { dx: 0, dy: 0, wheel: 0, click: false };
        let right: { x: number; y: number } | null = null;
        let left: { x: number; y: number } | null = null;
        let rightClickDown = false;
        let stick = { x: 0, y: 0 };
        let inflight = false;

        const reg = input.RegisterForControllerStateChanges((changes: any[]) => {
            for (const c of changes) {
                const b = c.ulButtons;
                const rTouch = bit(b, 20) || c.sRightPadX !== 0 || c.sRightPadY !== 0;
                const lTouch = bit(b, 19) || c.sLeftPadX !== 0 || c.sLeftPadY !== 0;
                if (rTouch) {
                    if (right) {
                        const dx = (c.sRightPadX - right.x) / PAD_RANGE;
                        const dy = (c.sRightPadY - right.y) / PAD_RANGE;
                        // Ignore jumps (finger lifted and put down elsewhere).
                        if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
                            acc.dx += dx * PAD_SPEED;
                            acc.dy -= dy * PAD_SPEED * ASPECT_FIX;
                        }
                    }
                    right = { x: c.sRightPadX, y: c.sRightPadY };
                } else {
                    right = null;
                }
                if (lTouch) {
                    if (left) {
                        const dy = (c.sLeftPadY - left.y) / PAD_RANGE;
                        if (Math.abs(dy) < 0.25) acc.wheel -= dy * SCROLL_SPEED;
                    }
                    left = { x: c.sLeftPadX, y: c.sLeftPadY };
                } else {
                    left = null;
                }
                const click = bit(b, 18);
                if (click && !rightClickDown) acc.click = true;
                rightClickDown = click;
                stick = { x: (c.sRightStickX ?? 0) / 32767, y: (c.sRightStickY ?? 0) / 32767 };
            }
        });

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
            backend
                .pointer(send.dx, send.dy, scrolled ? send.wheel : 0, send.click)
                .catch(() => undefined)
                .finally(() => {
                    inflight = false;
                });
        }, 33);

        return () => {
            clearInterval(timer);
            reg?.unregister?.();
        };
    }, []);
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
            default: return;
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
            </Focusable>
        </ModalRoot>
    );
};

export const showRemote = () => showModal(<RemoteModal />);
