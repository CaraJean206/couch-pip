import { ButtonItem, Field, Focusable, DialogButton, PanelSection, PanelSectionRow, SliderField, ToggleField } from "@decky/ui";
import { useEffect, useState } from "react";
import { FaBackward, FaForward, FaGamepad, FaPlay, FaTv, FaVolumeDown, FaVolumeUp } from "react-icons/fa";

import * as backend from "./backend";
import { showAddressModal, showSourcesModal } from "./modals";
import { lastBounds } from "./pip";
import { showRemote } from "./remote";
import { getState, setState, useStore } from "./store";
import { MARGINS, POSITION_LABELS, Position, SIZES, ViewMode, getScreen, hostOf } from "./util";

const nearestIndex = (list: { value: number }[], v: number) =>
    list.reduce((best, item, i) => (Math.abs(item.value - v) < Math.abs(list[best].value - v) ? i : best), 0);

const POSITION_ORDER = [
    Position.TopLeft, Position.Top, Position.TopRight, Position.Right,
    Position.BottomRight, Position.Bottom, Position.BottomLeft, Position.Left,
];

const iconButton = { minWidth: 0, padding: "10px 0", flex: 1, display: "flex", justifyContent: "center" };

const MediaRow = () => {
    const [msg, setMsg] = useState("");
    const act = async (action: string, amount = 0) => {
        const r = await backend.withPage(getState().url, () => backend.media(action, amount));
        setMsg(r.ok ? String(r.result ?? "") : r.error ?? "");
    };
    return (
        <>
            <PanelSectionRow>
                <Focusable style={{ display: "flex", gap: 6 }} flow-children="horizontal">
                    <DialogButton style={iconButton} onClick={() => act("seek", -10)}><FaBackward /></DialogButton>
                    <DialogButton style={iconButton} onClick={() => act("toggle")}><FaPlay /></DialogButton>
                    <DialogButton style={iconButton} onClick={() => act("seek", 10)}><FaForward /></DialogButton>
                    <DialogButton style={iconButton} onClick={() => act("volume", -0.1)}><FaVolumeDown /></DialogButton>
                    <DialogButton style={iconButton} onClick={() => act("volume", 0.1)}><FaVolumeUp /></DialogButton>
                </Focusable>
            </PanelSectionRow>
            {msg && (
                <PanelSectionRow>
                    <div style={{ fontSize: 12, opacity: 0.7, padding: "0 4px" }}>{msg}</div>
                </PanelSectionRow>
            )}
        </>
    );
};

const Diagnostics = () => {
    const s = useStore();
    const [targets, setTargets] = useState<string>("");
    const screen = getScreen();
    return (
        <PanelSection title="Diagnostics">
            <PanelSectionRow>
                <div style={{ fontSize: 12, lineHeight: 1.5, wordBreak: "break-all" }}>
                    Screen: {screen.width}×{screen.height} CSS px, scale {screen.dpr}
                    {screen.detected ? "" : " (not detected, using Steam Deck size)"}
                    <br />
                    PiP bounds: {lastBounds ? `${lastBounds.x},${lastBounds.y} ${lastBounds.width}×${lastBounds.height}` : "none"}
                    <br />
                    Page: {s.url}
                </div>
            </PanelSectionRow>
            <PanelSectionRow>
                <ToggleField
                    label="Use device pixels"
                    description="Turn on if the picture is the wrong size or in the wrong place."
                    checked={s.useDevicePixels}
                    onChange={(v: boolean) => setState({ useDevicePixels: v })}
                />
            </PanelSectionRow>
            <PanelSectionRow>
                <ButtonItem
                    layout="below"
                    onClick={async () => {
                        const r = await backend.listTargets();
                        if (!r.ok) return setTargets(r.error ?? "error");
                        setTargets(
                            (r.targets ?? [])
                                .filter((t) => t.type === "page")
                                .map((t) => `${t.id === r.attached ? "▶ " : ""}${t.title || "(no title)"} — ${t.url}`)
                                .join("\n"),
                        );
                    }}
                >
                    List browser pages
                </ButtonItem>
            </PanelSectionRow>
            {targets && (
                <PanelSectionRow>
                    <div style={{ fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", opacity: 0.8 }}>{targets}</div>
                </PanelSectionRow>
            )}
        </PanelSection>
    );
};

export const Settings = () => {
    const s = useStore();
    const open = s.viewMode !== ViewMode.Closed;

    // Opening the panel shows the picture again if it was hidden by a modal.
    useEffect(() => {
        setState({ visible: true });
    }, []);

    if (!open) {
        return (
            <PanelSection>
                <PanelSectionRow>
                    <ButtonItem layout="below" onClick={() => setState({ viewMode: ViewMode.Picture, visible: true })}>
                        <FaTv style={{ marginRight: 8 }} />
                        Open {hostOf(s.url)}
                    </ButtonItem>
                </PanelSectionRow>
                <PanelSectionRow>
                    <ButtonItem layout="below" onClick={showSourcesModal}>
                        Choose what to watch…
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>
        );
    }

    const sizeIndex = nearestIndex(SIZES, s.size);
    const marginIndex = nearestIndex(MARGINS, s.margin);

    return (
        <>
            <PanelSection>
                <PanelSectionRow>
                    <ButtonItem layout="below" onClick={showRemote}>
                        <FaGamepad style={{ marginRight: 8 }} />
                        Control page with controller
                    </ButtonItem>
                </PanelSectionRow>
                <MediaRow />
                <PanelSectionRow>
                    <ButtonItem layout="below" label="Watching" description={hostOf(s.url)} onClick={showSourcesModal}>
                        Change…
                    </ButtonItem>
                </PanelSectionRow>
                <PanelSectionRow>
                    <ButtonItem layout="below" onClick={showAddressModal}>
                        Go to address…
                    </ButtonItem>
                </PanelSectionRow>
                <PanelSectionRow>
                    <ToggleField
                        label="Large"
                        description="Fill most of the screen"
                        checked={s.viewMode === ViewMode.Expand}
                        onChange={(v: boolean) => setState({ viewMode: v ? ViewMode.Expand : ViewMode.Picture })}
                    />
                </PanelSectionRow>
            </PanelSection>

            {s.viewMode === ViewMode.Picture && (
                <PanelSection title="Picture">
                    <PanelSectionRow>
                        <Field label="Position" childrenContainerWidth="max">
                            <Focusable style={{ display: "flex", gap: 6 }} flow-children="horizontal">
                                <DialogButton
                                    style={{ minWidth: 0, flex: 1 }}
                                    onClick={() => {
                                        const i = POSITION_ORDER.indexOf(s.position);
                                        setState({ position: POSITION_ORDER[(i + POSITION_ORDER.length - 1) % POSITION_ORDER.length] });
                                    }}
                                >
                                    ◀
                                </DialogButton>
                                <div style={{ flex: 3, textAlign: "center", alignSelf: "center" }}>{POSITION_LABELS[s.position]}</div>
                                <DialogButton
                                    style={{ minWidth: 0, flex: 1 }}
                                    onClick={() => {
                                        const i = POSITION_ORDER.indexOf(s.position);
                                        setState({ position: POSITION_ORDER[(i + 1) % POSITION_ORDER.length] });
                                    }}
                                >
                                    ▶
                                </DialogButton>
                            </Focusable>
                        </Field>
                    </PanelSectionRow>
                    <PanelSectionRow>
                        <SliderField
                            label="Size"
                            value={sizeIndex}
                            min={0}
                            max={SIZES.length - 1}
                            step={1}
                            notchCount={SIZES.length}
                            notchTicksVisible
                            notchLabels={SIZES.map((x, i) => ({ label: x.label, notchIndex: i, value: i }))}
                            onChange={(i: number) => setState({ size: SIZES[i].value })}
                        />
                    </PanelSectionRow>
                    <PanelSectionRow>
                        <SliderField
                            label="Edge spacing"
                            value={marginIndex}
                            min={0}
                            max={MARGINS.length - 1}
                            step={1}
                            notchCount={MARGINS.length}
                            notchTicksVisible
                            notchLabels={MARGINS.map((x, i) => ({ label: x.label, notchIndex: i, value: i }))}
                            onChange={(i: number) => setState({ margin: MARGINS[i].value })}
                        />
                    </PanelSectionRow>
                </PanelSection>
            )}

            <PanelSection>
                <PanelSectionRow>
                    <ToggleField
                        label="Show diagnostics"
                        checked={s.showDiagnostics}
                        onChange={(v: boolean) => setState({ showDiagnostics: v })}
                    />
                </PanelSectionRow>
                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => {
                            backend.detach();
                            setState({ viewMode: ViewMode.Closed });
                        }}
                    >
                        Close picture
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>

            {s.showDiagnostics && <Diagnostics />}
        </>
    );
};
