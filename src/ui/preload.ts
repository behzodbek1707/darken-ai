const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("darken", {
    sendCommand: (input: string) => ipcRenderer.invoke("send-command", input),
    getHistory: () => ipcRenderer.invoke("get-history"),
    getActiveApps: () => ipcRenderer.invoke("get-active-apps"),
    getSystemStats: () => ipcRenderer.invoke("get-system-stats"),
    minimize: () => ipcRenderer.send("minimize-window"),
    maximize: () => ipcRenderer.send("maximize-window"),
    close: () => ipcRenderer.send("close-window"),
    getEnv: (key: string) => ipcRenderer.invoke("get-env", key),
})