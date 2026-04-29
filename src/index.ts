import readLine from "readline"
import { routeCommand } from "./core/router.js"

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout

})

console.log("⚫ Darken is online...")
console.log("Type a command:")

rl.on("line", async (input: string)=>{
    const trimmed = input.trim().toLowerCase();

    if (trimmed === "exit" || trimmed === "quit") {
        console.log("⚫ Darken: Shutting down...");
        rl.close();
        process.exit(0);
    }
    await routeCommand(input.trim())
})