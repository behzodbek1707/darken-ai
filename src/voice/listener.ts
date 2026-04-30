import { exec } from "child_process"
import { promises as fs } from "fs"
import os from "os"
import path from "path"

const WHISPER_CLI = `${os.homedir()}/whisper.cpp/build/bin/whisper-cli`
const WHISPER_MODEL = `${os.homedir()}/whisper.cpp/models/ggml-base.bin`
const WHISPER_VAD_MODEL = `${os.homedir()}/whisper.cpp/models/ggml-silero-v5.1.2.bin`
const AUDIO_FILE = path.join(os.tmpdir(), "darken-voice.wav")

export async function recordAndTranscribe(seconds = 8): Promise<string | null> {
    await record(seconds)
    const text = await transcribe()
    await fs.unlink(AUDIO_FILE).catch(() => {})
    return text
}

function record(seconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const cmd = `sox -d -r 16000 -c 1 ${AUDIO_FILE} trim 0 ${seconds}`
        exec(cmd, (err) => {
            if (err) reject(new Error(`Recording failed: ${err.message}`))
            else resolve()
        })
    })
}

function transcribe(): Promise<string | null> {
    return new Promise((resolve) => {
        const cmd = [
            WHISPER_CLI,
            `-m ${WHISPER_MODEL}`,
            `--vad`,
            `-vm ${WHISPER_VAD_MODEL}`,
            `--language en`,
            `--no-timestamps`,
            `--no-prints`,
            `-f ${AUDIO_FILE}`
        ].join(" ")

        exec(cmd, (err, stdout) => {
            if (err) {
                console.error("⚫ Whisper error:", err.message)
                resolve(null)
                return
            }

            const text = stdout.trim()
            if (!text) {
                resolve(null)
                return
            }

            const cleaned = cleanTranscript(text)
            resolve(cleaned)
        })
    })
}

function cleanTranscript(text: string): string | null {
    const artifacts = ["[BLANK_AUDIO]", "[inaudible]", "(speaking", "(singing", "["]
    for (const artifact of artifacts) {
        if (text.includes(artifact)) return null
    }

    const cleaned = text.replace(/[.,!?]/g, "").trim()
    return cleaned.length > 0 ? cleaned : null
}