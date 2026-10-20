// Small stand-in for @decky/api, talking to Decky Loader's plugin API
// directly. PLUGIN_NAME must match "name" in plugin.json.
import { PLUGIN_NAME } from "./util";

declare global {
    interface Window {
        __DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit?: {
            connect: (version: number, pluginName: string) => any;
        };
    }
}

const api = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit!.connect(1, PLUGIN_NAME);

export const callable = <Args extends any[] = any[], Ret = any>(method: string) =>
    (...args: Args): Promise<Ret> => api.call(method, ...args);

export const routerHook = api.routerHook;
export const toaster = api.toaster;

export const definePlugin = <T,>(fn: () => T) => () => fn();
