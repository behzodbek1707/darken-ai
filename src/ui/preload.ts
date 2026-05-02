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
    getMusicLibrary: () => ipcRenderer.invoke("get-music-library"),
    playTrack: (id: string) => ipcRenderer.invoke("play-track", id),
    searchAndPlay: (query: string) => ipcRenderer.invoke("search-and-play", query),
    togglePlay: () => ipcRenderer.invoke("toggle-play"),
    stopMusic: () => ipcRenderer.invoke("stop-music"),
    getPlayerStatus: () => ipcRenderer.invoke("get-player-status"),
    nextTrack: () => ipcRenderer.invoke("next-track"),
    prevTrack: () => ipcRenderer.invoke("prev-track"),
    setVolume: (val: number) => ipcRenderer.invoke("set-volume", val),
    toggleRepeat: () => ipcRenderer.invoke("toggle-repeat"),
    onTrackChanged: (cb: (track: unknown) => void) => {
        ipcRenderer.on("track-changed", (_event: Electron.IpcRendererEvent, track: unknown) => cb(track))
    },
    recordVoice: () => ipcRenderer.invoke("record-voice"),
})