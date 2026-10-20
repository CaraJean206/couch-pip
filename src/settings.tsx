import { ButtonItem, Focusable, DialogButton, PanelSection, PanelSectionRow, SliderField, ToggleField } from "@decky/ui";
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

// 3×3 grid of spots, laid out like the screen.
const GRID: Position[][] = [
    [Position.TopLeft, Position.Top, Position.TopRight],
    [Position.Left, Position.Center, Position.Right],
    [Position.BottomLeft, Position.Bottom, Position.BottomRight],
];

const PositionGrid = () => {
    const { position } = useStore();
    return (
        <div style={{ width: "100%" }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}>
                Position: <b>{POSITION_LABELS[position]}</b>
            </div>
            <Focusable
                flow-children="grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 4,
                    aspectRatio: "16 / 9",
                    padding: 4,
                    borderRadius: 6,
                    border: "2px solid rgba(255,255,255,0.25)",
                    background: "rgba(0,0,0,0.25)",
                }}
            >
                {GRID.flat().map((p) => (
                    <DialogButton
                        key={p}
                        onClick={() => setState({ position: p })}
                        style={{
                            minWidth: 0,
                            minHeight: 0,
                            height: "100%",
                            padding: 0,
                            background: p === position ? "#1a9fff" : undefined,
                            color: p === position ? "#fff" : undefined,
                        }}
                    >
                        {p === position ? "■" : ""}
                    </DialogButton>
                ))}
            </Focusable>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                While this menu is open the picture moves left to stay visible.
            </div>
        </div>
    );
};
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
                <PanelSectionRow>
                    <ToggleField
                        label="Fill window when a video plays"
                        description="Hides the rest of the website. Press Menu in the remote to switch back."
                        checked={s.autofill}
                        onChange={(v: boolean) => setState({ autofill: v })}
                    />
                </PanelSectionRow>
            </PanelSection>

            {s.viewMode === ViewMode.Picture && (
                <PanelSection title="Picture">
                    <PanelSectionRow>
                        <PositionGrid />
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
