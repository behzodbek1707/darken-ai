import { exec } from "child_process"
import { HandlerResult } from "./types.js"

export const lock = (_target: string): Promise<HandlerResult> => {
    return new Promise((resolve) => {
        const commands = [
            "gnome-screensaver-command -l",
            "loginctl lock-session",
            "xdg-screensaver lock",
        ]

        const tryNext = (index: number) => {
            if (index >= commands.length) {
                resolve({ success: false, action: "lock", target: "system", message: "no screen locker found" })
                return
            }

            exec(commands[index], (err) => {
                if (err) tryNext(index + 1)
                else resolve({ success: true, action: "lock", target: "system" })
            })
        }

        tryNext(0)
    })
}