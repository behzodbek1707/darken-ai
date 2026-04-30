import { exec } from "child_process"
import { HandlerResult } from "./types.js"

export const volume = (target: string): Promise<HandlerResult> => {
    return new Promise((resolve) => {
        const num = parseInt(target)
        let cmd: string

        if (target === "up") {
            cmd = "pactl set-sink-volume @DEFAULT_SINK@ +10%"
        } else if (target === "down") {
            cmd = "pactl set-sink-volume @DEFAULT_SINK@ -10%"
        } else if (!isNaN(num) && num >= 0 && num <= 100) {
            cmd = `pactl set-sink-volume @DEFAULT_SINK@ ${num}%`
        } else {
            resolve({ success: false, action: "volume", target, message: "try 'volume up', 'volume down', or 'volume 50'" })
            return
        }

        exec(cmd, (err) => {
            if (err) {
                resolve({ success: false, action: "volume", target, message: `volume failed — ${err.message}` })
            } else {
                resolve({ success: true, action: "volume", target })
            }
        })
    })
}