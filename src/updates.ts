// Self-update from GitHub.
//
// version.json in the repo says which version is newest and where its zip is
// (pinned to a commit, with its SHA-256). Installing goes through Decky's own
// install prompt, the same one "Install plugin from URL" uses.
import { fetchNoCors, toaster } from "./decky";
import { setState } from "./store";
import { PLUGIN_NAME } from "./util";

declare const __VERSION__: string;
export const VERSION: string = typeof __VERSION__ === "string" ? __VERSION__ : "0.0.0";

const VERSION_URL = "https://raw.githubusercontent.com/CaraJean206/couch-pip/main/version.json";

export interface UpdateInfo {
    version: string;
    zip: string;
    sha256?: string;
}

/** True if version a is newer than version b ("0.10.0" > "0.9.2"). */
export const isNewer = (a: string, b: string) => {
    const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
    const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (d !== 0) return d > 0;
    }
    return false;
};

const getJson = async (url: string) => {
    try {
        const r = await fetch(url, { cache: "no-store" });
        if (r.ok) return await r.json();
    } catch {
        // fall through to Decky's proxy
    }
    if (fetchNoCors) {
        const r = await fetchNoCors(url);
        if (r.ok) return await r.json();
    }
    throw new Error("Couldn't reach GitHub");
};

export const checkForUpdate = async (): Promise<UpdateInfo | null> => {
    const info = (await getJson(`${VERSION_URL}?t=${Date.now()}`)) as UpdateInfo;
    if (!info?.version || !info?.zip) throw new Error("version.json is incomplete");
    const update = isNewer(info.version, VERSION) ? info : null;
    setState({ update });
    return update;
};

export const installUpdate = (u: UpdateInfo) => {
    const backend = (window as any).DeckyBackend;
    // 2 = "update" in Decky's install prompt.
    return backend.call("utilities/install_plugin", u.zip, PLUGIN_NAME, u.version, u.sha256 ?? "", 2);
};

/** Check shortly after Steam starts and then every few hours. */
export const startUpdateChecks = () => {
    let notified = "";
    const run = async () => {
        try {
            const u = await checkForUpdate();
            if (u && notified !== u.version) {
                notified = u.version;
                toaster?.toast?.({
                    title: `${PLUGIN_NAME} ${u.version} is available`,
                    body: `Open ${PLUGIN_NAME} in the Quick Access Menu to update.`,
                });
            }
        } catch (e) {
            console.warn(`${PLUGIN_NAME}: update check failed`, e);
        }
    };
    const first = setTimeout(run, 20_000);
    const every = setInterval(run, 6 * 60 * 60 * 1000);
    return () => {
        clearTimeout(first);
        clearInterval(every);
    };
};
