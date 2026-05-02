export function resolveAction(input: string) {
    const words = input.toLowerCase().split(" ")
    const actions = ["open", "close", "restart", "mute", "screenshot", "volume", "brightness", "lock"]
    const fillers = ["my", "the", "a", "an", "some", "this", "that", "please", "can", "you"]

    let action: string | null = null
    for (let w of words) {
        if (actions.includes(w)) {
            action = w
            break
        }
    }

    const noTargetActions = ["mute", "screenshot", "lock"]
    const actionIndex = words.findIndex(w => w === action)

    if (!action) return null

    if (noTargetActions.includes(action)) {
        return { action, target: "system" }
    }

    const remaining = words.slice(actionIndex + 1).filter(w => !fillers.includes(w))
    const target = remaining[0] ?? null

    if (!target) return null

    return { action, target }
}