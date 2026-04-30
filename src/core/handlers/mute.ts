import { exec } from "child_process"
import { HandlerResult } from "./types.js"

export const mute = (_target: string): Promise<HandlerResult> => {
    return new Promise((resolve) => {
        exec("pactl set-sink-mute @DEFAULT_SINK@ toggle", (err) => {
            if (err) {
                resolve({ success: false, action: "mute", target: "system", message: `mute failed — ${err.message}` })
            } else {
                resolve({ success: true, action: "mute", target: "system" })
            }
        })
    })
}