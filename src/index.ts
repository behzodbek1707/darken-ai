import readLine from "readline"
import { routeCommand } from "./core/router.js"

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout

})

console.log("⚫ Darken is online...")
console.log("Type a command:")

rl.on("line", (input: string)=>{
    routeCommand(input)
})