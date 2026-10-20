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

// Picture width as a share of the screen width. 16:9 video.
export const SIZES = [
    { label: "S", value: 0.2 },
    { label: "M", value: 0.28 },
    { label: "L", value: 0.36 },
    { label: "XL", value: 0.46 },
];
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

export const hostOf = (url: string) => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
};

export const normalizeUrl = (input: string) => {
    const t = input.trim();
    if (!t) return t;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) return t;
    // Bare IPs and local names (a home Jellyfin server) are usually plain http.
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/|$)/.test(t) || /^[^./]+(:\d+)(\/|$)/.test(t) || /\.local(:\d+)?(\/|$)/.test(t)) {
        return "http://" + t;
    }
    return "https://" + t;
};
