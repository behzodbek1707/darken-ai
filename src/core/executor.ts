import { launchApp } from "../system/launcher.js";
import { addApp, removeApp, setLast } from "./memory.js";
import { exec } from "child_process";
import { logCommand } from "./logger.js";

const killMap: Record<string, string> = {
    chrome: "/opt/google/chrome/chrome",
    vscode: "/usr/share/code/code",
    firefox: "firefox",
    telegram: "telegram-desktop",
};

export function execute(action: string, target: string) {

    if (action === "open") {
        console.log(`⚫ Darken: Opening ${target}`);
        const pid = launchApp(target);
        setLast({ action, target });
        logCommand(action, target);
        if (pid) addApp(target, pid);
        return;
    }

    if (action === "close") {
        console.log(`⚫ Darken: Closing ${target}`);

        const pattern = killMap[target] || target;

        exec(`pgrep -f "${pattern}"`, (checkErr) => {
            if (checkErr) {
                console.log(`⚫ Darken: ${target} is not running`);
                return;
            }

            exec(`pkill -f "${pattern}"`, () => {
                console.log(`⚫ Darken: Closed ${target}`);
                logCommand(action, target);
                removeApp(target);
            });
        });

        setLast({ action, target });
        return;
    }

    console.log(`⚫ Darken: Unknown action "${action}"`);
}