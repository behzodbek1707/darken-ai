import { resolveAction } from "./resolver.js"
import { resolveContext } from "./context.js"
import { execute } from "./executor.js"
import { askBrain } from "./brain.js"
import { getHistory } from "./logger.js"
import { getActiveApps } from "./memory.js"

type Command = {
    action: string | null
    target: string | null
}

export async function routeCommand(input: string) {
    const trimmed = input.toLowerCase().trim()

    if (trimmed.includes("what did i do") || trimmed.includes("history")) {
        const entries = getHistory(5)
        if (entries.length === 0) {
            console.log("⚫ Darken: No history yet.")
        } else {
            console.log("⚫ Darken: Recent commands:")
            entries.forEach(e => {
                const time = new Date(e.timestamp).toLocaleTimeString()
                console.log(`   [${time}] ${e.action} ${e.target}`)
            })
        }
        return
    }

    if (trimmed.includes("what's open") || trimmed.includes("what is open")) {
        const apps = getActiveApps()
        if (apps.length === 0) {
            console.log("⚫ Darken: No apps tracked as open.")
        } else {
            console.log(`⚫ Darken: Open apps → ${apps.join(", ")}`)
        }
        return
    }

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
        console.log("⚫ Darken: Thinking...")
        try {
            result = await askBrain(input)
        } catch (err) {
            console.log("⚫ Darken: Brain is unavailable right now.")
            return
        }
    }

    if (!result || !result.action || !result.target) {
        console.log("⚫ Darken: I don't understand that yet.")
        return
    }

    execute(result.action, result.target)
}