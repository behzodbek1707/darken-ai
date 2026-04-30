import { close } from "./close.js"
import { open } from "./open.js"
import { setLast } from "../memory.js"
import { HandlerResult } from "./types.js"

export const restart = async (target: string): Promise<HandlerResult> => {
    await close(target)
    await new Promise(res => setTimeout(res, 1500))
    await open(target)
    setLast({ action: "restart", target })
    return { success: true, action: "restart", target }
}