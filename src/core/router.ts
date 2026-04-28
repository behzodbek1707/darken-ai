import { resolveAction } from "./resolver.js"
import { resolveContext } from "./context.js"
import { execute } from "./executor.js"

type Command = {
    action: string | null
    target: string | null
}

export function routeCommand(input: string) {

    let result: Command | null = resolveAction(input)

    const context = resolveContext(input)

    if (context) {
        console.log(`⚫ Darken: Using context → ${context.target}`)

        const invalidTargets = ["it", "again", "same", "repeat"]

        const action =
            context.action ??
            result?.action ??
            null

        const target =
            invalidTargets.includes(result?.target || "")
                ? context.target
                : (context.target ?? result?.target ?? null)

        result = { action, target }
    }

    if (!result || !result.action || !result.target) {
        console.log("⚫ Darken: I don't understand that yet.")
        return
    }

    execute(result.action, result.target)
}