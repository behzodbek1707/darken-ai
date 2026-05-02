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

const COMMAND_SPLITS = ["and", "then", "also", "after that"]

function splitCommands(input: string): string[] {
    let parts = [input]

    for (const splitter of COMMAND_SPLITS) {
        parts = parts.flatMap(p =>
            p.toLowerCase().includes(` ${splitter} `)
                ? p.split(new RegExp(` ${splitter} `, "i"))
                : [p]
        )
    }

    parts = parts.flatMap(p => p.split(/[.!?]+/))

    return parts
        .map(p => p.trim())
        .filter(p => p.length > 0)
}

export async function routeCommand(input: string): Promise<void> {
    const commands = splitCommands(input)

    if (commands.length > 1) {
        for (const cmd of commands) {
            await routeSingle(cmd)
            await new Promise(res => setTimeout(res, 800))
        }
        return
    }

    await routeSingle(input)
}

async function routeSingle(input: string): Promise<void> {
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
    const unknownTargets = ["browser", "editor", "terminal", "music", "player"]

    if (result && unknownTargets.includes(result.target?.toLowerCase() || "")) {
        result = null
    }

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

    await execute(result.action, result.target)
}