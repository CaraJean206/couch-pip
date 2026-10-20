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

// Updates may only come from this repository, pinned to an exact commit,
// with a SHA-256 that Decky checks before installing.
const ZIP_PATTERN = /^https:\/\/raw\.githubusercontent\.com\/CaraJean206\/couch-pip\/[0-9a-f]{40}\/couch-pip\.zip$/;

export const isValidUpdate = (info: any): info is UpdateInfo =>
    !!info &&
    typeof info.version === "string" &&
    /^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(info.version) &&
    typeof info.zip === "string" &&
    ZIP_PATTERN.test(info.zip) &&
    typeof info.sha256 === "string" &&
    /^[0-9a-f]{64}$/.test(info.sha256);

export const checkForUpdate = async (): Promise<UpdateInfo | null> => {
    const info = await getJson(`${VERSION_URL}?t=${Date.now()}`);
    if (!isValidUpdate(info)) throw new Error("version.json failed validation");
    const update = isNewer(info.version, VERSION) ? info : null;
    setState({ update });
    return update;
};

export const installUpdate = (u: UpdateInfo) => {
    const backend = (window as any).DeckyBackend;
    // 2 = "update" in Decky's install prompt.
    if (!isValidUpdate(u)) return Promise.reject(new Error("invalid update"));
    return backend.call("utilities/install_plugin", u.zip, PLUGIN_NAME, u.version, u.sha256, 2);
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
