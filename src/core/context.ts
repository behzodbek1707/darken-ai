import { getLast } from "./memory.js";

export function resolveContext(input: string){
    const words = input.toLowerCase().split(" ")

    const last = getLast()

    if (!last) return null

    if (words.includes("again") || words.includes("repeat")) {
        return {
            action: last.action,
            target: last.target
        }
    }

    if (words.includes("same")) {
        return last
    }

    if (words.includes("it")) {
        return {
            action: null,
            target: last.target
        }
    }

    return null
}