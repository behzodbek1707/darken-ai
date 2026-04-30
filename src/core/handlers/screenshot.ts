import { exec } from "child_process"
import path from "path"
import os from "os"
import { HandlerResult } from "./types.js"

export const screenshot = (_target: string): Promise<HandlerResult> => {
    return new Promise((resolve) => {
        const filename = `screenshot-${Date.now()}.png`
        const filepath = path.join(os.homedir(), "Pictures", filename)

        exec(`gnome-screenshot -f "${filepath}"`, (err) => {
            if (err) {
                resolve({ success: false, action: "screenshot", target: "system", message: `screenshot failed — ${err.message}` })
            } else {
                resolve({ success: true, action: "screenshot", target: "system" })
            }
        })
    })
}