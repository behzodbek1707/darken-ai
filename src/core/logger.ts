import fs from "fs";
import path from "path";

const LOG_PATH = path.resolve("data/history.json");

export type LogEntry = {
    action: string;
    target: string;
    timestamp: string;
};

function ensureFile() {
    const dir = path.dirname(LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(LOG_PATH)) fs.writeFileSync(LOG_PATH, "[]");
}

export function logCommand(action: string, target: string) {
    ensureFile();
    const history: LogEntry[] = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
    history.push({ action, target, timestamp: new Date().toISOString() });
    fs.writeFileSync(LOG_PATH, JSON.stringify(history, null, 2));
}

export function getHistory(limit = 10): LogEntry[] {
    ensureFile();
    const history: LogEntry[] = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
    return history.slice(-limit);
}