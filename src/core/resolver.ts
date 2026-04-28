export function resolveAction(input: string) {
    const words = input.toLowerCase().split(" ")

    const actions = ["open", "close", "restart"]

    let action: string | null = null

    for (let w of words) {
        if (actions.includes(w)) {
            action = w
            break
        }
    }

    const target = words[words.length - 1]

    if (!action || !target) {
        return null
    }

    return { action, target }
}