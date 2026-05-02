import fs from "fs"
import path from "path"
import os from "os"

export type Track = {
    id: string
    title: string
    artist: string
    filename: string
    filepath: string
    format: string
}

const MUSIC_DIR = path.join(os.homedir(), "Music")
const SUPPORTED = [".mp3", ".m4a", ".flac", ".wav", ".ogg"]

function parseFilename(filename: string): { title: string; artist: string } {
    const name = filename.replace(/\.[^.]+$/, "")

    if (name.includes(" - ")) {
        const parts = name.split(" - ")
        return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(" - ").trim()
        }
    }

    return { artist: "Unknown", title: name.trim() }
}

export function scanMusicLibrary(): Track[] {
    if (!fs.existsSync(MUSIC_DIR)) return []

    const files = fs.readdirSync(MUSIC_DIR)
    const tracks: Track[] = []

    for (const file of files) {
        const ext = path.extname(file).toLowerCase()
        if (!SUPPORTED.includes(ext)) continue

        const filepath = path.join(MUSIC_DIR, file)
        const { title, artist } = parseFilename(file)

        tracks.push({
            id: Buffer.from(filepath).toString("base64"),
            title,
            artist,
            filename: file,
            filepath,
            format: ext.slice(1),
        })
    }

    return tracks.sort((a, b) => a.title.localeCompare(b.title))
}

export function findTrack(query: string, tracks: Track[]): Track | null {
    const q = query.toLowerCase()

    const exact = tracks.find(t => t.title.toLowerCase() === q)
    if (exact) return exact

    const partial = tracks.find(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.filename.toLowerCase().includes(q)
    )

    return partial ?? null
}