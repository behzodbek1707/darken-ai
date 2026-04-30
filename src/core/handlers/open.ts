import { launchApp } from "../../system/launcher.js"
import { addApp, setLast } from "../memory.js"
import { logCommand } from "../logger.js"
import { HandlerResult } from "./types.js"

export const open = async (target: string): Promise<HandlerResult> => {
    const pid = launchApp(target)
    setLast({ action: "open", target })
    if (pid) addApp(target, pid)
    logCommand("open", target)
    return { success: true, action: "open", target }
}