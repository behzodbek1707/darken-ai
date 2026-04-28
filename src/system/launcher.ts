import { spawn } from "child_process";

const appMap: Record<string, string> = {
    firefox: "firefox",
    vscode: "code",
    chrome: "google-chrome",
    telegram: "telegram-desktop"
}

export function launchApp(name: string){
    const cmd = appMap[name] || name
    const child = spawn(cmd, [], {
        shell: true,
        detached: true,
        stdio: "ignore"
    })

    child.unref()

    return child.pid
}