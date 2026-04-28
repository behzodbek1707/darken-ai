const activeApps: Record<string, number[]> = {}

export function addApp(name: string, pid: number) {
    if (!activeApps[name]) activeApps[name] = []
    activeApps[name].push(pid)
}

export function getApp(name: string) {
    return activeApps[name] || []
}

export function removeApp(name: string) {
    delete activeApps[name]
}

let lastCommand: { action: string, target: string } | null = null

export function setLast(cmd: { action: string, target: string }) {
    lastCommand = cmd
}

export function getLast() {
    return lastCommand
}