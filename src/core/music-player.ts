import { execSync, spawn, ChildProcess } from "child_process"
import { Track } from "./music-scanner.js"
import os from "os"
import path from "path"
import fs from "fs"

export type PlayerStatus = {
    playing: boolean
    track: Track | null
    position: number
    duration: number
    repeat: boolean
}

const MPV_SOCKET = path.join(os.tmpdir(), "darken-mpv.sock")

let currentProcess: ChildProcess | null = null
let currentTrack: Track | null = null
let isPlaying = false
let trackDuration = 0
let currentPosition = 0
let repeatOne = false
let positionTimer: NodeJS.Timeout | null = null
let onTrackEnd: (() => void) | null = null

export function setOnTrackEnd(cb: () => void) {
    onTrackEnd = cb
}

export function toggleRepeat(): boolean {
    repeatOne = !repeatOne
    return repeatOne
}

function sendMpvCommand(command: object): boolean {
    try {
        const json = JSON.stringify(command)
        execSync(`echo '${json}' | socat - ${MPV_SOCKET}`, { stdio: "pipe", timeout: 1000 })
        return true
    } catch { return false }
}

function killAll() {
    if (positionTimer) { clearInterval(positionTimer); positionTimer = null }
    try { execSync("pkill -x mpv", { stdio: "ignore" }) } catch {}
    try { fs.unlinkSync(MPV_SOCKET) } catch {}
    currentProcess = null
    isPlaying = false
    currentPosition = 0
}

function startPositionTimer() {
    if (positionTimer) clearInterval(positionTimer)
    positionTimer = setInterval(() => {
        if (isPlaying) currentPosition = Math.min(currentPosition + 1, trackDuration)
    }, 1000)
}

export function playTrack(track: Track): void {
    killAll()

    try {
        const probe = execSync(
            `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${track.filepath}"`,
            { timeout: 5000 }
        ).toString().trim()
        trackDuration = Math.round(parseFloat(probe))
    } catch { trackDuration = 0 }

    currentTrack = track
    currentPosition = 0
    isPlaying = false  // ← false until actually spawned

    setTimeout(() => {
        currentProcess = spawn("mpv", [
            "--no-video",
            "--really-quiet",
            "--no-terminal",
            `--input-ipc-server=${MPV_SOCKET}`,
            track.filepath
        ], { detached: false, stdio: "ignore" })

        isPlaying = true

        currentProcess.on("exit", (code) => {
            isPlaying = false
            currentProcess = null
            if (positionTimer) { clearInterval(positionTimer); positionTimer = null }
            if (code === 0 && onTrackEnd) {
                if (repeatOne && currentTrack) {
                    playTrack(currentTrack)
                } else {
                    onTrackEnd()
                }
            }
        })

        startPositionTimer()
    }, 500)
}

export function pauseTrack(): void {
    if (!isPlaying) return
    const ok = sendMpvCommand({ command: ["set_property", "pause", true] })
    if (ok) isPlaying = false
}

export function resumeTrack(): void {
    if (isPlaying) return
    const ok = sendMpvCommand({ command: ["set_property", "pause", false] })
    if (ok) isPlaying = true
}

export function togglePlayPause(): void {
    if (!currentTrack) return
    if (isPlaying) pauseTrack()
    else resumeTrack()
}

export function stopTrack(): void {
    killAll()
    currentTrack = null
    trackDuration = 0
}

export function setVolume(percent: number): void {
    const vol = Math.max(0, Math.min(100, percent))
    sendMpvCommand({ command: ["set_property", "volume", vol] })
}

export function getStatus(): PlayerStatus {
    return {
        playing: isPlaying,
        track: currentTrack,
        position: currentPosition,
        duration: trackDuration,
        repeat: repeatOne,
    }
}