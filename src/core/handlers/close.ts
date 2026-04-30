import { exec } from "child_process"
import { HandlerResult } from "./types.js"
import { removeApp, setLast } from "../memory.js"
import { logCommand } from "../logger.js"

const killMap: Record<string, string> = {
    chrome: "chrome",
    vscode: "code", 
    firefox: "firefox",
    telegram: "telegram-desktop",
}
export const close = (target: string): Promise<HandlerResult> => {
    return new Promise((resolve) => {
        const processName = killMap[target] || target

        exec(`pgrep "${processName}"`, (checkErr) => {
            if (checkErr) {
                resolve({
                    success: false,
                    action: "close",
                    target,
                    message: `${target} wasn't running`
                })
                return
            }

            exec(`pkill "${processName}"`, () => {
                removeApp(target)
                logCommand("close", target)
                setLast({ action: "close", target })
                resolve({ success: true, action: "close", target })
            })
        })
    })
}