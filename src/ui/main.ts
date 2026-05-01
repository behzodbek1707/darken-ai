import { app, BrowserWindow, ipcMain, screen } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import { routeCommand } from "../core/router.js"
import { getHistory } from "../core/logger.js"
import { getActiveApps } from "../core/memory.js"
import os from "os"
import { exec } from "child_process"
import "dotenv/config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 860,
        minWidth: 1100,
        minHeight: 700,
        x: Math.round((width - 1400) / 2),
        y: Math.round((height - 860) / 2),
        frame: false,
        transparent: false,
        backgroundColor: "#0d0d0f",
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"))
    // mainWindow.webContents.openDevTools({ mode: 'detach' })
}

app.commandLine.appendSwitch("ozone-platform", "wayland")
app.commandLine.appendSwitch("disable-gpu")

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

ipcMain.handle("send-command", async (_, input: string) => {
    await routeCommand(input)
    return { ok: true }
})

ipcMain.handle("get-history", async () => {
    return getHistory(20)
})

ipcMain.handle("get-active-apps", async () => {
    return getActiveApps()
})

ipcMain.handle("get-env", (_, key: string) => {
    const allowed = ["OPENWEATHER_API_KEY", "WEATHER_CITY"]
    if (!allowed.includes(key)) return null
    return process.env[key] ?? null
})

ipcMain.handle("get-system-stats", async () => {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const ramPercent = Math.round((usedMem / totalMem) * 100)

    const cpuPercent = await getCpuUsage()
    const diskStats = await getDiskUsage()

    return {
        cpu: cpuPercent,
        ram: {
            percent: ramPercent,
            used: Math.round(usedMem / 1024 / 1024 / 1024 * 10) / 10,
            total: Math.round(totalMem / 1024 / 1024 / 1024 * 10) / 10,
        },
        disk: diskStats,
        uptime: Math.floor(os.uptime()),
    }
})

ipcMain.on("minimize-window", () => mainWindow?.minimize())
ipcMain.on("maximize-window", () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow?.maximize()
    }
})
ipcMain.on("close-window", () => mainWindow?.close())

function getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
        const start = os.cpus().map(c => c.times)
        setTimeout(() => {
            const end = os.cpus().map(c => c.times)
            let idle = 0, total = 0
            for (let i = 0; i < start.length; i++) {
                const idleDiff = end[i].idle - start[i].idle
                const totalDiff = Object.values(end[i]).reduce((a, b) => a + b, 0) -
                    Object.values(start[i]).reduce((a, b) => a + b, 0)
                idle += idleDiff
                total += totalDiff
            }
            resolve(Math.round(100 - (idle / total) * 100))
        }, 200)
    })
}

function getDiskUsage(): Promise<{ percent: number; used: string; total: string }> {
    return new Promise((resolve) => {
        exec("df -h / | tail -1 | awk '{print $3, $2, $5}'", (err, stdout) => {
            if (err) {
                resolve({ percent: 0, used: "0", total: "0" })
                return
            }
            const [used, total, percentStr] = stdout.trim().split(" ")
            resolve({
                percent: parseInt(percentStr),
                used,
                total,
            })
        })
    })
}