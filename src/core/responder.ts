import { HandlerResult } from "./handlers/types.js"

const responses: Record<string, string[]> = {
    open_success: [
        "opening {target} for you",
        "launching {target}",
        "got it, starting {target}",
        "on it — {target} coming up",
    ],
    close_success: [
        "closed {target}",
        "{target} is gone",
        "shut down {target}",
        "done, {target} is closed",
    ],
    close_not_running: [
        "{target} wasn't running",
        "couldn't find {target} running",
        "{target} is already closed",
    ],
    restart_success: [
        "restarting {target}, give me a second",
        "on it — restarting {target}",
        "closing and reopening {target}",
    ],
    mute_success: [
        "toggled mute",
        "done",
        "mute toggled",
    ],
    volume_success: [
        "volume {target}",
        "turned volume {target}",
        "done, volume went {target}",
    ],
    brightness_success: [
        "brightness {target}",
        "turned brightness {target}",
        "done, brightness went {target}",
    ],
    screenshot_success: [
        "screenshot saved",
        "got it, screenshot taken",
        "saved to your Pictures folder",
    ],
    lock_success: [
        "locking your screen",
        "screen locked",
        "locked",
    ],
    failure: [
        "something went wrong with {target}",
        "that didn't work — {target} failed",
        "couldn't do that",
    ],
}

function pick(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)]
}

function formatTarget(action: string, target: string): string {
    if (action === "volume" || action === "brightness") {
        if (target === "up") return "higher"
        if (target === "down") return "lower"
    }
    return target
}

function format(template: string, target: string): string {
    return template.replace("{target}", target)
}

export function respond(result: HandlerResult): void {
    if (result.message) {
        console.log(`⚫ Darken: ${result.message}`)
        return
    }

    const key = result.success
        ? `${result.action}_success`
        : "failure"

    const templates = responses[key] || responses["failure"]
    const template = pick(templates)
    const displayTarget = formatTarget(result.action, result.target)
    const message = format(template, displayTarget)

    console.log(`⚫ Darken: ${message}`)
}