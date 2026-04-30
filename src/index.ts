import readLine from "readline"
import { routeCommand } from "./core/router.js"
import { recordAndTranscribe } from "./voice/listener.js"

const args = process.argv.slice(2)
const VOICE_MODE = args.includes("--voice")

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
})

console.log(`⚫ Darken is online... (${VOICE_MODE ? "voice mode" : "text mode"})`)

if (VOICE_MODE) {
    console.log("⚫ Speak your command after the prompt.")
    voiceLoop()
} else {
    console.log("Type a command:")
    rl.on("line", async (input: string) => {
        const trimmed = input.trim()
        if (!trimmed) return

        if (trimmed === "exit" || trimmed === "quit") {
            console.log("⚫ Darken: Shutting down...")
            rl.close()
            process.exit(0)
        }

        await routeCommand(trimmed)
    })
}

async function voiceLoop() {
    while (true) {
        await waitForEnter()
        console.log("⚫ Listening... (up to 8 seconds, speak when ready)")

        const text = await recordAndTranscribe(8)

        if (!text) {
            console.log("⚫ Darken: Didn't catch that.")
            continue
        }

        console.log(`⚫ Heard: "${text}"`)

        if (text.toLowerCase().includes("exit") || text.toLowerCase().includes("quit")) {
            console.log("⚫ Darken: Shutting down...")
            process.exit(0)
        }

        await routeCommand(text)
        await new Promise(res => setTimeout(res, 600))
    }
}

function waitForEnter(): Promise<void> {
    return new Promise((resolve) => {
        process.stdout.write("\n⚫ Press Enter to speak...")
        process.stdin.once("data", () => resolve())
    })
}