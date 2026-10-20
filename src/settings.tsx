import { ButtonItem, Focusable, DialogButton, PanelSection, PanelSectionRow, SliderField, ToggleField } from "@decky/ui";
import { useEffect, useState } from "react";
import { FaBackward, FaExpand, FaForward, FaGamepad, FaPlay, FaTv, FaVolumeDown, FaVolumeUp } from "react-icons/fa";

import * as backend from "./backend";
import { showAddressModal, showSourcesModal } from "./modals";
import { lastBounds } from "./pip";
import { showRemote } from "./remote";
import { VERSION, checkForUpdate, installUpdate } from "./updates";
import { getState, setState, useStore } from "./store";
import { MARGINS, POSITION_LABELS, Position, ViewMode, getScreen, hostOf } from "./util";

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
                        onClick={() => setState({ position: p, nudgeX: 0, nudgeY: 0 })}
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
                    <DialogButton style={iconButton} onClick={() => act("fill")}><FaExpand /></DialogButton>
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
    const [shot, setShot] = useState<string>("");
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
            <PanelSectionRow>
                <ButtonItem
                    layout="below"
                    onClick={async () => {
                        const r = await backend.withPage(getState().url, () => backend.fillStatus());
                        setTargets(r.ok ? JSON.stringify(r.result, null, 1) : r.error ?? "error");
                    }}
                >
                    Check video fill
                </ButtonItem>
            </PanelSectionRow>
            <PanelSectionRow>
                <ButtonItem
                    layout="below"
                    description="Shows what the browser itself is drawing in the picture"
                    onClick={async () => {
                        setShot("");
                        setTargets("Taking snapshot…");
                        const r = await backend.withPage(getState().url, () => backend.snapshot());
                        if (r.ok && r.result) {
                            setShot(r.result);
                            setTargets("");
                        } else setTargets(r.error ?? "Snapshot failed");
                    }}
                >
                    Snapshot page
                </ButtonItem>
            </PanelSectionRow>
            {shot && (
                <PanelSectionRow>
                    <img src={shot} style={{ width: "100%", border: "1px solid rgba(255,255,255,0.3)" }} />
                </PanelSectionRow>
            )}
            <PanelSectionRow>
                <ToggleField
                    label="Safe mode"
                    description="Don't change the page at all (no scrollbar hiding, fill or mouse). Reloads the page."
                    checked={s.safe}
                    onChange={(v: boolean) => setState({ safe: v })}
                />
            </PanelSectionRow>
            {targets && (
                <PanelSectionRow>
                    <div style={{ fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", opacity: 0.8 }}>{targets}</div>
                </PanelSectionRow>
            )}
        </PanelSection>
    );
};

const UpdateBanner = () => {
    const { update } = useStore();
    if (!update) return null;
    return (
        <PanelSection>
            <PanelSectionRow>
                <ButtonItem layout="below" onClick={() => installUpdate(update)}>
                    ⬆ Update to {update.version}
                </ButtonItem>
            </PanelSectionRow>
        </PanelSection>
    );
};

const VersionRow = () => {
    const [msg, setMsg] = useState("");
    return (
        <PanelSection>
            <PanelSectionRow>
                <ButtonItem
                    layout="below"
                    description={msg || `Version ${VERSION}`}
                    onClick={async () => {
                        setMsg("Checking…");
                        try {
                            const u = await checkForUpdate();
                            setMsg(u ? `Version ${u.version} is available` : `Version ${VERSION} is the newest`);
                        } catch (e: any) {
                            setMsg(`Couldn't check: ${e?.message ?? e}`);
                        }
                    }}
                >
                    Check for updates
                </ButtonItem>
            </PanelSectionRow>
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
            <>
            <UpdateBanner />
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
            <VersionRow />
            </>
        );
    }

        const marginIndex = nearestIndex(MARGINS, s.margin);

    return (
        <>
            <UpdateBanner />
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
                            description="Width of the picture as a share of the screen"
                            value={Math.round(s.size * 100)}
                            min={10}
                            max={80}
                            step={1}
                            showValue
                            valueSuffix="%"
                            resetValue={28}
                            onChange={(v: number) => setState({ size: v / 100 })}
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
                    <PanelSectionRow>
                        <SliderField
                            label="Fine tune: left / right"
                            value={Math.round((s.nudgeX ?? 0) * 100)}
                            min={-30}
                            max={30}
                            step={1}
                            showValue
                            valueSuffix="%"
                            resetValue={0}
                            onChange={(v: number) => setState({ nudgeX: v / 100 })}
                        />
                    </PanelSectionRow>
                    <PanelSectionRow>
                        <SliderField
                            label="Fine tune: up / down"
                            value={Math.round((s.nudgeY ?? 0) * 100)}
                            min={-30}
                            max={30}
                            step={1}
                            showValue
                            valueSuffix="%"
                            resetValue={0}
                            onChange={(v: number) => setState({ nudgeY: v / 100 })}
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
            <VersionRow />
        </>
    );
};
