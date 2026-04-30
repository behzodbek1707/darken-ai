export function resolveAction(input: string) {
    const words = input.toLowerCase().split(" ")
    const actions = ["open", "close", "restart", "mute", "screenshot", "volume", "brightness", "lock"]

    let action: string | null = null
    for (let w of words) {
        if (actions.includes(w)) {
            action = w
            break
        }
    }

    const noTargetActions = ["mute", "screenshot", "lock"]
    const actionIndex = words.findIndex(w => w === action)
    const nextWord = words[actionIndex + 1] ?? null

    if (!action) return null

    if (noTargetActions.includes(action)) {
        return { action, target: "system" }
    }

    const target = nextWord ?? words[words.length - 1]
    if (!target) return null

    return { action, target }
}