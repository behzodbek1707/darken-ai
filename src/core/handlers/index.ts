import { Handler } from "./types.js"
import { open } from "./open.js"
import { close } from "./close.js"
import { restart } from "./restart.js"
import { mute } from "./mute.js"
import { screenshot } from "./screenshot.js"
import { brightness } from "./brightness.js"
import { volume } from "./volume.js"
import { lock } from "./lock.js"

const registry: Record<string, Handler> = {
    open,
    close,
    restart,
    mute,
    screenshot,
    brightness,
    volume,
    lock
}

export function getHandler(action: string): Handler | null {
    return registry[action] ?? null
}