import { Router } from "@decky/ui";

export const PLUGIN_NAME = "Couch PiP";

export enum ViewMode {
    Expand = 1,
    Picture = 2,
    Closed = 3,
    Remote = 4,
}

export enum Position {
    Top,
    TopRight,
    Right,
    BottomRight,
    Bottom,
    BottomLeft,
    Left,
    TopLeft,
    Center,
}

export const POSITION_LABELS: Record<Position, string> = {
    [Position.TopLeft]: "Top left",
    [Position.Top]: "Top",
    [Position.TopRight]: "Top right",
    [Position.Right]: "Right",
    [Position.BottomRight]: "Bottom right",
    [Position.Bottom]: "Bottom",
    [Position.BottomLeft]: "Bottom left",
    [Position.Left]: "Left",
    [Position.Center]: "Center",
};

/** Where each grid spot sits, as 0..1 of the free space (0 = left/top, 1 = right/bottom). */
export const POSITION_XY: Record<Position, [number, number]> = {
    [Position.TopLeft]: [0, 0],
    [Position.Top]: [0.5, 0],
    [Position.TopRight]: [1, 0],
    [Position.Left]: [0, 0.5],
    [Position.Center]: [0.5, 0.5],
    [Position.Right]: [1, 0.5],
    [Position.BottomLeft]: [0, 1],
    [Position.Bottom]: [0.5, 1],
    [Position.BottomRight]: [1, 1],
};

const clamp01 = (v: unknown, fallback: number) =>
    typeof v === "number" && isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;

/** The picture's place as 0..1 across and down the free space. */
export const placeOf = (s: { position: Position; posX?: number | null; posY?: number | null }): [number, number] => {
    const [gx, gy] = POSITION_XY[s.position] ?? [1, 0];
    return [clamp01(s.posX, gx), clamp01(s.posY, gy)];
};

/** The grid spot matching a place, if it's exactly on one. */
export const spotAt = (x: number, y: number): Position | null => {
    for (const [p, [gx, gy]] of Object.entries(POSITION_XY)) {
        if (Math.abs(gx - x) < 0.005 && Math.abs(gy - y) < 0.005) return Number(p) as Position;
    }
    return null;
};

// Pictures are 16:9.
export const ASPECT = 9 / 16;

// Margin around the picture as a share of the screen height.
export const MARGINS = [
    { label: "0", value: 0 },
    { label: "S", value: 0.02 },
    { label: "M", value: 0.04 },
    { label: "L", value: 0.07 },
];

// Steam Deck's UI size, only used if the real window can't be found.
const FALLBACK = { width: 854, height: 534, dpr: 1.5 };

export const getMainWindow = (): Window | null => {
    const root: any = Router.WindowStore?.GamepadUIMainWindowInstance;
    return root?.BrowserWindow ?? null;
};

/** Size of Steam's Game Mode window in CSS pixels (what SetBounds expects). */
export const getScreen = () => {
    const win = getMainWindow();
    if (win && win.innerWidth > 0 && win.innerHeight > 0) {
        return { width: win.innerWidth, height: win.innerHeight, dpr: win.devicePixelRatio || 1, detected: true };
    }
    return { ...FALLBACK, detected: false };
};

export const isWebUrl = (url: string) => /^https?:\/\/[^\s]+$/i.test(url);

export const hostOf = (url: string) => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
};

/** Turn what was typed into a web address. Only http and https are allowed. */
export const normalizeUrl = (input: string) => {
    const t = input.trim();
    if (!t) return t;
    if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(t)) {
        // Has a scheme (not just "host:port"): keep only http/https.
        return /^https?:\/\//i.test(t) ? t : "";
    }
    // Bare IPs and local names (a home Jellyfin server) are usually plain http.
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/|$)/.test(t) || /^[^./]+(:\d+)(\/|$)/.test(t) || /\.local(:\d+)?(\/|$)/.test(t)) {
        return "http://" + t;
    }
    return "https://" + t;
};
