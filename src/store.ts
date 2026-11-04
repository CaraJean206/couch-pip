import { useEffect, useState } from "react";
import { Position, ViewMode } from "./util";

export interface Bookmark {
    name: string;
    url: string;
}

export interface State {
    viewMode: ViewMode;
    previousMode: ViewMode;
    position: Position;
    visible: boolean;
    margin: number; // share of screen height
    size: number; // share of screen width
    url: string;
    bookmarks: Bookmark[];
    useDevicePixels: boolean;
    showDiagnostics: boolean;
    autofill: boolean;
    posX: number | null; // 0 = left edge .. 1 = right edge of the free space (null: use the grid spot)
    posY: number | null; // 0 = top edge .. 1 = bottom edge
    update: { version: string; zip: string; sha256?: string } | null;
    safe: boolean;
    remoteGuideTop: number | null; // where the remote's guide starts on screen (CSS px)
    dark: "off" | "prefer" | "force"; // prefer = use sites' dark theme; force = darken every site
    opacity: number; // 0.3 .. 1 (1 = solid)
}

const STORAGE_KEY = "couch-pip";
const PERSISTED: (keyof State)[] = ["position", "margin", "size", "url", "bookmarks", "useDevicePixels", "autofill", "posX", "posY", "safe", "dark", "opacity"];

const defaults: State = {
    viewMode: ViewMode.Closed,
    previousMode: ViewMode.Picture,
    position: Position.TopRight,
    visible: true,
    margin: 0.04,
    size: 0.28,
    url: "https://www.youtube.com",
    bookmarks: [],
    useDevicePixels: false,
    showDiagnostics: false,
    autofill: true,
    posX: null,
    posY: null,
    update: null,
    safe: false,
    remoteGuideTop: null,
    dark: "prefer",
    opacity: 1,
};

const load = (): State => {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
        const state = { ...defaults, ...saved };
        // Only ever restore normal web addresses.
        if (!/^https?:\/\//i.test(state.url)) state.url = defaults.url;
        state.bookmarks = (Array.isArray(state.bookmarks) ? state.bookmarks : []).filter(
            (b: any) => b && typeof b.name === "string" && /^https?:\/\//i.test(b.url),
        );
        if (!["off", "prefer", "force"].includes(state.dark)) state.dark = defaults.dark;
        if (typeof state.opacity !== "number" || !isFinite(state.opacity)) state.opacity = 1;
        state.opacity = Math.min(1, Math.max(0.3, state.opacity));
        return state;
    } catch {
        return { ...defaults };
    }
};

let state: State = load();
const listeners = new Set<(s: State) => void>();

export const getState = () => state;

export const setState = (update: Partial<State> | ((s: State) => Partial<State>)) => {
    const patch = typeof update === "function" ? update(state) : update;
    state = { ...state, ...patch };
    try {
        const saved: Partial<State> = {};
        for (const k of PERSISTED) (saved as any)[k] = state[k];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
        // storage is a convenience only
    }
    listeners.forEach((l) => l(state));
};

export const useStore = (): State => {
    const [s, set] = useState(state);
    useEffect(() => {
        listeners.add(set);
        set(state);
        return () => {
            listeners.delete(set);
        };
    }, []);
    return s;
};
