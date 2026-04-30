import { getHandler } from "./handlers/index.js"
import { respond } from "./responder.js"

export async function execute(action: string, target: string) {
    const handler = getHandler(action)

    if (!handler) {
        console.log(`⚫ Darken: I don't know how to "${action}" yet`)
        return
    }

    const result = await handler(target)
    respond(result)
}