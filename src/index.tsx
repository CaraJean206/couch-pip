import { staticClasses } from "@decky/ui";
import { FaTv } from "react-icons/fa";

import { definePlugin, routerHook } from "./decky";
import { PipOuter } from "./pip";
import { Settings } from "./settings";
import { setState } from "./store";
import { startUpdateChecks } from "./updates";
import { PLUGIN_NAME, ViewMode } from "./util";

export default definePlugin(() => {
    // Start closed after every reboot or reload; settings are remembered.
    setState({ viewMode: ViewMode.Closed, visible: true });
    routerHook.addGlobalComponent("CouchPiP", PipOuter);
    const stopUpdates = startUpdateChecks();

    return {
        name: PLUGIN_NAME,
        titleView: <div className={staticClasses.Title}>{PLUGIN_NAME}</div>,
        icon: <FaTv />,
        content: <Settings />,
        onDismount() {
            routerHook.removeGlobalComponent("CouchPiP");
            stopUpdates();
        },
    };
});
