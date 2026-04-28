import { launchApp } from "../system/launcher.js";
import { addApp, removeApp, setLast } from "./memory.js";
import { exec } from "child_process";

export function execute(action: string, target: string){

    if(action === "open"){
        console.log(`⚫ Darken: Opening ${target}`)

        const pid = launchApp(target)

        setLast({ action, target })

        if (pid) addApp(target, pid)

        return
    }

    if (action === "close") {
        console.log(`⚫ Darken: Closing ${target}`)

        const nameMap: Record<string, string> = {
            vscode: "code",
            firefox: "firefox",
            chrome: "google-chrome",
            telegram: "telegram-desktop"
        }

        const processName = nameMap[target] || target

        exec(`pkill ${processName}`, (err) => {
            if (err) {
                console.log(`⚫ Darken: ${target} is not running`)
            } else {
                console.log(`⚫ Darken: Closed ${target}`)
                removeApp(target)
            }
        })
        setLast({ action, target })
    }
}