import { Router, findModuleChild, findModuleExport, getGamepadNavigationTrees } from "@decky/ui";
import { useEffect, useState } from "react";

import * as backend from "./backend";
import { State, useStore } from "./store";
import { Position, ViewMode, ASPECT, getScreen } from "./util";

// Ask Steam to keep its UI layer drawn over the game (like a notification
// toast) without taking the controller away from the game.
enum UIComposition {
    Hidden = 0,
    Notification = 1,
    Overlay = 2,
    Opaque = 3,
    OverlayKeyboard = 4,
}

const isCompositionHook = (fn: any) => {
    if (typeof fn !== "function") return false;
    const src = fn.toString();
    return (
        src.includes("AddMinimumCompositionStateRequest") &&
        src.includes("ChangeMinimumCompositionStateRequest") &&
        src.includes("RemoveMinimumCompositionStateRequest") &&
        !src.includes("m_mapCompositionStateRequests")
    );
};

// Newer @decky/ui has findModuleExport; older builds only findModuleChild.
const useUIComposition: ((c: UIComposition) => void) | undefined =
    findModuleExport?.(isCompositionHook) ??
    findModuleChild?.((m: any) => {
        if (typeof m !== "object") return undefined;
        for (const prop in m) if (isCompositionHook(m[prop])) return m[prop];
    });

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Last bounds sent to Steam, shown in the diagnostics panel. */
export let lastBounds: Rect | null = null;

const VIEW_NAME = "couchpip";

const Browser = ({ url, visible, bounds, devicePixels }: { url: string; visible: boolean; bounds: Rect; devicePixels: boolean }) => {
    useUIComposition?.(UIComposition.Notification);

    const [{ view, browser }] = useState(() => {
        const root: any = Router.WindowStore?.GamepadUIMainWindowInstance;
        const view = root.CreateBrowserView(VIEW_NAME);
        return { view, browser: view.GetBrowser() };
    });

    useEffect(() => {
        browser.SetVisible(visible);
    }, [visible]);
    useEffect(() => {
        view.LoadURL(url);
    }, [url]);
    useEffect(() => {
        const scale = devicePixels ? getScreen().dpr : 1;
        const b = {
            x: Math.round(bounds.x * scale),
            y: Math.round(bounds.y * scale),
            width: Math.round(bounds.width * scale),
            height: Math.round(bounds.height * scale),
        };
        lastBounds = b;
        browser.SetBounds(b.x, b.y, b.width, b.height);
    }, [bounds.x, bounds.y, bounds.width, bounds.height, devicePixels]);
    useEffect(() => () => {
        view.Destroy();
    }, []);

    return null;
};

/** Width of Steam's side menu and Quick Access Menu when they're open. */
const getObstructions = () => {
    const trees = getGamepadNavigationTrees();
    const widthOf = (id: string) => {
        const win = trees.find((t: any) => t?.id === id)?.m_Root?.m_element?.ownerDocument?.defaultView;
        return win && !win.document.hidden ? win.outerWidth : 0;
    };
    const keyboard = !!trees.find((t: any) => t?.id === "virtual keyboard");
    return { nav: widthOf("MainNavMenuContainer"), qam: widthOf("QuickAccess-NA"), keyboard };
};

const useObstructions = () => {
    const [state, setState] = useState(getObstructions());
    useEffect(() => {
        const timer = setInterval(() => {
            setState((cur) => {
                const next = getObstructions();
                return next.nav === cur.nav && next.qam === cur.qam && next.keyboard === cur.keyboard ? cur : next;
            });
        }, 250);
        return () => clearInterval(timer);
    }, []);
    return state;
};

export const computeBounds = (s: State, obs: { nav: number; qam: number; keyboard: boolean }): Rect => {
    const screen = getScreen();
    // Space not covered by Steam's menus or the on-screen keyboard.
    const area = {
        x: obs.nav,
        y: 0,
        width: screen.width - obs.nav - obs.qam,
        height: screen.height - (obs.keyboard ? screen.height * 0.45 : 0),
    };

    if (s.viewMode === ViewMode.Remote) {
        // Big view at the top, leaving the bottom of the screen for the
        // remote's button guide.
        const m = Math.round(screen.height * 0.03);
        return { x: area.x + m, y: m, width: area.width - m * 2, height: Math.round(screen.height * 0.72) };
    }

    const margin = Math.round(screen.height * (s.viewMode === ViewMode.Expand ? 0.04 : s.margin));
    const box = { x: area.x + margin, y: area.y + margin, width: area.width - margin * 2, height: area.height - margin * 2 };

    if (s.viewMode === ViewMode.Expand) return box;

    let width = Math.round(screen.width * s.size);
    let height = Math.round(width * ASPECT);
    // Never bigger than the free space.
    if (width > box.width) {
        width = box.width;
        height = Math.round(width * ASPECT);
    }
    if (height > box.height) {
        height = box.height;
        width = Math.round(height / ASPECT);
    }

    let x = box.x;
    let y = box.y;
    const right = box.x + box.width - width;
    const bottom = box.y + box.height - height;
    const centerX = box.x + (box.width - width) / 2;
    const centerY = box.y + (box.height - height) / 2;

    switch (s.position) {
        case Position.Top: x = centerX; break;
        case Position.TopRight: x = right; break;
        case Position.Right: x = right; y = centerY; break;
        case Position.BottomRight: x = right; y = bottom; break;
        case Position.Bottom: x = centerX; y = bottom; break;
        case Position.BottomLeft: y = bottom; break;
        case Position.Left: y = centerY; break;
        case Position.TopLeft: break;
        case Position.Center: x = centerX; y = centerY; break;
    }
    return { x: Math.round(x), y: Math.round(y), width, height };
};

/** Connect to the page as soon as it loads, so scrollbars hide and auto-fill works. */
const useAutoAttach = (url: string, autofill: boolean) => {
    useEffect(() => {
        let cancelled = false;
        (async () => {
            await backend.setOptions(autofill);
            const r = await backend.ensureAttached(url, 20);
            if (!cancelled && !r.ok) console.warn("Couch PiP: couldn't connect to page", r.error);
        })();
        return () => {
            cancelled = true;
        };
    }, [url, autofill]);
};

const Pip = () => {
    const s = useStore();
    useAutoAttach(s.url, s.autofill);
    const obs = useObstructions();
    const bounds = computeBounds(s, s.viewMode === ViewMode.Remote ? { nav: 0, qam: 0, keyboard: false } : obs);
    return <Browser url={s.url} visible={s.visible} bounds={bounds} devicePixels={s.useDevicePixels} />;
};

export const PipOuter = () => {
    const { viewMode } = useStore();
    return viewMode === ViewMode.Closed ? null : <Pip />;
};
