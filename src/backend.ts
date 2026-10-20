import { callable } from "./decky";

export interface Result<T = any> {
    ok: boolean;
    result?: T;
    error?: string;
}

export const attach = callable<[url: string], Result & { url?: string; title?: string; id?: string }>("attach");
export const detach = callable<[], Result>("detach");
export const listTargets = callable<[], { ok: boolean; error?: string; attached?: string; targets?: { id: string; type: string; title: string; url: string }[] }>("list_targets");
export const nav = callable<[direction: "up" | "down" | "left" | "right"], Result<string>>("nav");
export const click = callable<[], Result<string>>("click");
export const key = callable<[name: string], Result<string>>("key");
export const insertText = callable<[text: string], Result<string>>("insert_text");
export const media = callable<[action: string, amount: number], Result<any>>("media");
export const back = callable<[], Result<string>>("back");
export const reload = callable<[], Result>("reload");
export const setOptions = callable<[autofill: boolean, safe: boolean], Result>("set_options");
export const listInputDevices = callable<[], { ok: boolean; error?: string; user?: string; devices?: { name: string; events: string[]; readable: string[]; abs: string }[]; hidraw?: { dev: string; readable: boolean }[] }>("list_input_devices");
export interface PadStatus { ok: boolean; devices: number; reports: number; touches: number; sent: number; error: string }
export const padsStart = callable<[], PadStatus>("pads_start");
export const padsStop = callable<[], Result>("pads_stop");
export const padsStatus = callable<[], PadStatus>("pads_status");
export const snapshot = callable<[], Result<string>>("snapshot");
export const fillStatus = callable<[], Result<any>>("fill_status");
export const pointer = callable<[dx: number, dy: number, wheel: number, click: boolean], Result<string>>("pointer");

/** Connect to the PiP page, retrying while it loads. */
export const ensureAttached = async (url: string, tries = 8): Promise<Result> => {
    let last: Result = { ok: false, error: "not tried" };
    for (let i = 0; i < tries; i++) {
        last = await attach(url);
        if (last.ok) return last;
        await new Promise((r) => setTimeout(r, 500));
    }
    return last;
};

/** Run a remote action, attaching first (once) if the page isn't connected. */
export const withPage = async <T>(url: string, action: () => Promise<Result<T>>): Promise<Result<T>> => {
    let res = await action();
    if (!res.ok && /not connected|session closed|websocket closed/i.test(res.error ?? "")) {
        const a = await ensureAttached(url, 4);
        if (!a.ok) return { ok: false, error: a.error };
        res = await action();
    }
    return res;
};
