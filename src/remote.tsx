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
    ["Menu", "Video only / full page"],
];

/**
 * Full-screen remote. Its only focusable element swallows every controller
 * button and turns it into an action on the page, so the D-pad never wanders
 * off into Steam's menus.
 */
const RemoteModal = ({ closeModal }: { closeModal?: () => void }) => {
    const [status, setStatus] = useState("Connecting to the page…");
    const busy = useRef(false);

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
            case GamepadButton.START: run(() => backend.media("videoonly", 0)); break;
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
