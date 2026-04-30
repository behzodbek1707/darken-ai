import fs from "fs"
import { HandlerResult } from "./types.js"

const BRIGHTNESS_FILE = "/sys/class/backlight/intel_backlight/brightness"
const MAX_BRIGHTNESS = 19200

export const brightness = (target: string): Promise<HandlerResult> => {
    return new Promise((resolve) => {
        try {
            const current = parseInt(fs.readFileSync(BRIGHTNESS_FILE, "utf-8").trim())
            let next: number

            if (target === "up") {
                next = Math.min(current + Math.round(MAX_BRIGHTNESS * 0.1), MAX_BRIGHTNESS)
            } else if (target === "down") {
                next = Math.max(current - Math.round(MAX_BRIGHTNESS * 0.1), 0)
            } else {
                const pct = parseInt(target)
                if (!isNaN(pct) && pct >= 0 && pct <= 100) {
                    next = Math.round((pct / 100) * MAX_BRIGHTNESS)
                } else {
                    resolve({ success: false, action: "brightness", target, message: "try 'brightness up', 'brightness down', or 'brightness 50'" })
                    return
                }
            }

            fs.writeFileSync(BRIGHTNESS_FILE, String(next))
            resolve({ success: true, action: "brightness", target })
        } catch (err: any) {
            resolve({ success: false, action: "brightness", target, message: `brightness failed — ${err.message}` })
        }
    })
}