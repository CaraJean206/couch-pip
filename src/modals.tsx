import { ConfirmModal, DialogButton, Focusable, ModalRoot, TextField, showModal } from "@decky/ui";
import { useEffect, useState } from "react";

import { Bookmark, getState, setState, useStore } from "./store";
import { ViewMode, hostOf, normalizeUrl } from "./util";

/** Steam's browser view draws above modals, so hide it while one is open. */
export const useHidePip = () => {
    useEffect(() => {
        setState({ visible: false });
        return () => setState({ visible: true });
    }, []);
};

export const BUILT_IN: Bookmark[] = [
    { name: "YouTube", url: "https://www.youtube.com" },
    { name: "Netflix", url: "https://www.netflix.com/browse" },
    { name: "Twitch", url: "https://www.twitch.tv" },
    { name: "Plex (app.plex.tv)", url: "https://app.plex.tv/desktop" },
    { name: "Disney+", url: "https://www.disneyplus.com" },
    { name: "Prime Video", url: "https://www.primevideo.com" },
];

export const openUrl = (url: string) => {
    setState((s) => ({
        url: normalizeUrl(url),
        viewMode: s.viewMode === ViewMode.Closed ? ViewMode.Picture : s.viewMode,
        visible: true,
    }));
};

const AddressModal = ({ closeModal, title, withName }: { closeModal?: () => void; title: string; withName?: boolean }) => {
    useHidePip();
    const [url, setUrl] = useState(withName ? "" : getState().url);
    const [name, setName] = useState("");
    return (
        <ConfirmModal
            closeModal={closeModal}
            strTitle={title}
            strOKButtonText={withName ? "Save and open" : "Open"}
            onOK={() => {
                if (!url.trim()) return;
                const full = normalizeUrl(url);
                if (withName) {
                    const bm = { name: name.trim() || hostOf(full), url: full };
                    setState((s) => ({ bookmarks: [...s.bookmarks.filter((b) => b.url !== full), bm] }));
                }
                openUrl(full);
            }}
        >
            {withName && (
                <TextField label="Name" placeholder="Jellyfin" value={name} onChange={(e: { target: { value: string } }) => setName(e.target.value)} />
            )}
            <TextField
                label="Address"
                description={withName ? "For a home server, e.g. 192.168.1.20:8096 (Jellyfin) or 192.168.1.20:32400/web (Plex)" : undefined}
                value={url}
                focusOnMount={!withName}
                onChange={(e: { target: { value: string } }) => setUrl(e.target.value)}
            />
        </ConfirmModal>
    );
};

export const showAddressModal = () => showModal(<AddressModal title="Go to address" />);
export const showAddServerModal = () => showModal(<AddressModal title="Add a site or server" withName />);

const SourcesModal = ({ closeModal }: { closeModal?: () => void }) => {
    useHidePip();
    const { bookmarks, url } = useStore();
    const pick = (u: string) => {
        openUrl(u);
        closeModal?.();
    };
    const row = { width: "100%", marginBottom: 8, textAlign: "left" as const };

    return (
        <ModalRoot closeModal={closeModal} onCancel={closeModal}>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Watch…</div>
            <Focusable style={{ display: "flex", flexDirection: "column", maxHeight: "60vh", overflowY: "auto" }}>
                {bookmarks.map((b) => (
                    <DialogButton
                        key={b.url}
                        style={row}
                        onClick={() => pick(b.url)}
                        onSecondaryActionDescription="Remove"
                        onSecondaryButton={() => setState((s) => ({ bookmarks: s.bookmarks.filter((x) => x.url !== b.url) }))}
                    >
                        ★ {b.name}
                        <span style={{ opacity: 0.6, marginLeft: 8, fontSize: "0.8em" }}>{hostOf(b.url)}</span>
                    </DialogButton>
                ))}
                {BUILT_IN.map((b) => (
                    <DialogButton key={b.url} style={row} onClick={() => pick(b.url)}>
                        {b.name}
                    </DialogButton>
                ))}
                <DialogButton
                    style={row}
                    onClick={() => {
                        closeModal?.();
                        showAddServerModal();
                    }}
                >
                    + Add Jellyfin, Plex server or any site…
                </DialogButton>
                {!bookmarks.some((b) => b.url === url) && url && (
                    <DialogButton
                        style={row}
                        onClick={() =>
                            setState((s) => ({ bookmarks: [...s.bookmarks, { name: hostOf(s.url), url: s.url }] }))
                        }
                    >
                        ☆ Save current page ({hostOf(url)})
                    </DialogButton>
                )}
            </Focusable>
            <div style={{ opacity: 0.6, fontSize: 13, marginTop: 8 }}>Press X on a saved item to remove it.</div>
        </ModalRoot>
    );
};

export const showSourcesModal = () => showModal(<SourcesModal />);

const TypeModal = ({ closeModal, onSend }: { closeModal?: () => void; onSend: (text: string, enter: boolean) => void }) => {
    useHidePip();
    const [text, setText] = useState("");
    const [hidden, setHidden] = useState(false);
    return (
        <ConfirmModal
            closeModal={closeModal}
            strTitle="Type into the page"
            strOKButtonText="Type"
            strMiddleButtonText="Type + Enter"
            onMiddleButton={() => {
                onSend(text, true);
                closeModal?.();
            }}
            onOK={() => onSend(text, false)}
        >
            <Focusable
                onSecondaryActionDescription={hidden ? "Show text" : "Hide text"}
                onSecondaryButton={() => setHidden(!hidden)}
            >
                <TextField
                    focusOnMount
                    bIsPassword={hidden}
                    description="Press X to hide the text (for passwords)."
                    value={text}
                    onChange={(e: { target: { value: string } }) => setText(e.target.value)}
                />
            </Focusable>
        </ConfirmModal>
    );
};

export const showTypeModal = (onSend: (text: string, enter: boolean) => void) =>
    showModal(<TypeModal onSend={onSend} />);

