let WEATHER_API_KEY = ""
let WEATHER_CITY = "Tashkent"
let commandCount = 0
let uptimeBase = 0
let musicPolling = null
let listening = false
let transitioning = false
let repeatEnabled = false

window.addEventListener("DOMContentLoaded", async () => {
    WEATHER_API_KEY = await window.darken.getEnv("OPENWEATHER_API_KEY") || ""
    WEATHER_CITY = await window.darken.getEnv("WEATHER_CITY") || "Tashkent"

    document.getElementById("init-time").textContent = formatTime(new Date())
    startClock()
    await loadStats()
    await loadWeather()
    buildVisualizer()
    startMusicPolling()
    setInterval(loadStats, 5000)
    setInterval(loadWeather, 300000)
    loadHistory()

    window.darken.onTrackChanged(async () => {
        setTimeout(async () => {
            const status = await window.darken.getPlayerStatus()
            updateMusicUI(status)
            setVisualizerPlaying(true)
        }, 400)
    })
})

function startClock() {
    function tick() {
        const now = new Date()
        document.getElementById("time-display").textContent = formatTime(now)
        document.getElementById("date-display").textContent = formatDate(now)
        if (uptimeBase > 0) {
            const elapsed = Math.floor((Date.now() - uptimeBase) / 1000)
            document.getElementById("uptime-display").textContent = formatUptime(elapsed)
        }
    }
    tick()
    setInterval(tick, 1000)
}

function formatTime(d) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function formatDate(d) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0")
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${h}:${m}:${s}`
}

async function loadStats() {
    const stats = await window.darken.getSystemStats()

    document.getElementById("cpu-val").textContent = `${stats.cpu}%`
    document.getElementById("ram-val").textContent = `${stats.ram.used} GB / ${stats.ram.total} GB`
    document.getElementById("disk-val").textContent = `${stats.disk.used} / ${stats.disk.total}`

    setBar("cpu-bar", stats.cpu)
    setBar("ram-bar", stats.ram.percent)
    setBar("disk-bar", stats.disk.percent)

    setGauge("cpu-gauge", stats.cpu)
    setGauge("ram-gauge", stats.ram.percent)
    setGauge("disk-gauge", stats.disk.percent)

    document.getElementById("cpu-gauge-val").textContent = `${stats.cpu}%`
    document.getElementById("ram-gauge-val").textContent = `${stats.ram.percent}%`
    document.getElementById("disk-gauge-val").textContent = `${stats.disk.percent}%`

    if (uptimeBase === 0) {
        uptimeBase = Date.now() - (stats.uptime * 1000)
    }
}

function setBar(id, percent) {
    document.getElementById(id).style.width = `${Math.min(percent, 100)}%`
}

function setGauge(id, percent) {
    const circumference = 201
    const offset = circumference - (percent / 100) * circumference
    document.getElementById(id).style.strokeDashoffset = offset
}

async function loadWeather() {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CITY}&appid=${WEATHER_API_KEY}&units=metric`
        )
        const data = await res.json()

        const temp = Math.round(data.main.temp)
        const feels = Math.round(data.main.feels_like)
        const desc = data.weather[0].description
        const humidity = data.main.humidity
        const wind = Math.round(data.wind.speed * 10) / 10
        const city = `${data.name}, ${data.sys.country}`
        const icon = getWeatherEmoji(data.weather[0].id)

        document.getElementById("weather-icon").textContent = icon
        document.getElementById("weather-temp").textContent = `${temp}°C`
        document.getElementById("weather-city").textContent = city
        document.getElementById("weather-desc").textContent = desc.charAt(0).toUpperCase() + desc.slice(1)
        document.getElementById("weather-humidity").textContent = `${humidity}%`
        document.getElementById("weather-wind").textContent = `${wind} m/s`
        document.getElementById("weather-feels").textContent = `${feels}°C`
        document.getElementById("temp-top").textContent = `${temp}°C`
        document.getElementById("city-top").textContent = city
    } catch (e) {
        console.error("Weather load failed:", e)
    }
}

function getWeatherEmoji(id) {
    if (id >= 200 && id < 300) return "⛈"
    if (id >= 300 && id < 400) return "🌦"
    if (id >= 500 && id < 600) return "🌧"
    if (id >= 600 && id < 700) return "❄"
    if (id >= 700 && id < 800) return "🌫"
    if (id === 800) return "☀"
    if (id === 801) return "🌤"
    if (id >= 802) return "☁"
    return "⛅"
}

async function submitCommand() {
    const input = document.getElementById("cmd-input")
    const text = input.value.trim()
    if (!text) return

    input.value = ""
    addUserMessage(text)

    commandCount++
    document.getElementById("cmd-count").textContent = commandCount

    if (text.toLowerCase().startsWith("play ")) {
        const query = text.slice(5).trim()
        const result = await window.darken.searchAndPlay(query)
        if (result?.error) {
            addDarkenMessage(`couldn't find "${query}"`)
        } else if (result?.track) {
            addDarkenMessage(`playing ${result.track.title} by ${result.track.artist}`)
        }
        return
    }

    await window.darken.sendCommand(text)
    setTimeout(() => addDarkenResponse(text), 300)
}

function handleKey(e) {
    if (e.key === "Enter") submitCommand()
}

function sendQuickCommand(cmd) {
    document.getElementById("cmd-input").value = cmd
    submitCommand()
}

function focusInput() {
    document.getElementById("cmd-input").focus()
}

function addUserMessage(text) {
    const chat = document.getElementById("chat-messages")
    const msg = document.createElement("div")
    msg.className = "message user-msg"
    msg.innerHTML = `
        <div class="msg-avatar">U</div>
        <div class="msg-content">
            <p>${escapeHtml(text)}</p>
            <span class="msg-time">${formatTime(new Date())}</span>
        </div>
    `
    chat.appendChild(msg)
    chat.scrollTop = chat.scrollHeight
}

function addDarkenMessage(text) {
    const chat = document.getElementById("chat-messages")
    const msg = document.createElement("div")
    msg.className = "message darken-msg"
    msg.innerHTML = `
        <div class="msg-avatar">D</div>
        <div class="msg-content">
            <p>${escapeHtml(text)}</p>
            <span class="msg-time">${formatTime(new Date())}</span>
        </div>
    `
    chat.appendChild(msg)
    chat.scrollTop = chat.scrollHeight
}

function addDarkenResponse(userText) {
    const responses = {
        "open": "on it — launching for you",
        "close": "done, closed it",
        "restart": "restarting now",
        "mute": "toggled mute",
        "volume": "volume adjusted",
        "brightness": "brightness adjusted",
        "screenshot": "screenshot saved to Pictures",
        "lock": "locking screen",
    }
    const action = Object.keys(responses).find(k => userText.toLowerCase().includes(k))
    addDarkenMessage(action ? responses[action] : "got it")
}

function clearChat() {
    const chat = document.getElementById("chat-messages")
    chat.innerHTML = `
        <div class="message darken-msg">
            <div class="msg-avatar">D</div>
            <div class="msg-content">
                <p>Chat cleared. How can I help?</p>
                <span class="msg-time">${formatTime(new Date())}</span>
            </div>
        </div>
    `
}

async function loadHistory() {
    const history = await window.darken.getHistory()
    commandCount = history.length
    document.getElementById("cmd-count").textContent = commandCount
}

async function toggleListening() {
    listening = !listening
    const btn = document.getElementById("mic-btn")
    const ring = document.getElementById("voice-ring")
    const label = document.getElementById("listening-label")

    if (listening) {
        btn.classList.add("active")
        ring.classList.add("listening")
        label.textContent = "⬡ LISTENING... ⬡"
        label.style.color = "#a855f7"

        const result = await window.darken.recordVoice()

        btn.classList.remove("active")
        ring.classList.remove("listening")
        listening = false

        if (result?.text) {
            label.textContent = `⬡ ${result.text} ⬡`
            label.style.color = "#a855f7"

            addUserMessage(result.text)

            if (result.text.toLowerCase().startsWith("play ")) {
                const query = result.text.slice(5).trim()
                const res = await window.darken.searchAndPlay(query)
                if (res?.track) addDarkenMessage(`playing ${res.track.title}`)
                label.textContent = "⬡ Wake Me Up... ⬡"
                label.style.color = "var(--purple)"
            } else {
                await window.darken.sendCommand(result.text)
                setTimeout(() => {
                    addDarkenResponse(result.text)
                    label.textContent = "⬡ Wake Me Up... ⬡"
                    label.style.color = "var(--purple)"
                }, 500)
            }
        } else {
            label.textContent = "⬡ Wake Me Up... ⬡"
            label.style.color = "var(--purple)"
        }
    }
}

async function togglePlay() {
    const status = await window.darken.togglePlay()
    updateMusicUI(status)
}

async function nextTrack() {
    transitioning = true
    setVisualizerPlaying(true)
    await window.darken.nextTrack()

    let attempts = 0
    const checkPlaying = setInterval(async () => {
        attempts++
        const status = await window.darken.getPlayerStatus()
        if (status.playing || attempts >= 10) {
            clearInterval(checkPlaying)
            transitioning = false
            updateMusicUI(status)
            setVisualizerPlaying(true)
        } else {
            if (status.track) {
                document.getElementById("music-title").textContent = status.track.title
                document.getElementById("music-artist").textContent = status.track.artist
            }
        }
    }, 300)
}

async function prevTrack() {
    transitioning = true
    setVisualizerPlaying(true)
    await window.darken.prevTrack()

    let attempts = 0
    const checkPlaying = setInterval(async () => {
        attempts++
        const status = await window.darken.getPlayerStatus()
        if (status.playing || attempts >= 10) {
            clearInterval(checkPlaying)
            transitioning = false
            updateMusicUI(status)
            setVisualizerPlaying(true)
        } else {
            if (status.track) {
                document.getElementById("music-title").textContent = status.track.title
                document.getElementById("music-artist").textContent = status.track.artist
            }
        }
    }, 300)
}

function updateMusicUI(status) {
    if (!status) return

    const playBtn = document.querySelector(".music-btn.play-btn")
    if (playBtn) playBtn.textContent = status.playing ? "⏸" : "▶"

    if (status.track) {
        document.getElementById("music-title").textContent = status.track.title
        document.getElementById("music-artist").textContent = status.track.artist
        document.getElementById("music-elapsed").textContent = formatMusicTime(status.position || 0)

        const remaining = Math.max((status.duration || 0) - (status.position || 0), 0)
        document.getElementById("music-total").textContent = "-" + formatMusicTime(remaining)

        const pct = status.duration > 0
            ? Math.min((status.position / status.duration) * 100, 100)
            : 0
        document.getElementById("music-fill").style.width = `${pct}%`

        if (!transitioning) setVisualizerPlaying(status.playing)
    } else {
        document.getElementById("music-title").textContent = "No track playing"
        document.getElementById("music-artist").textContent = "--"
        document.getElementById("music-elapsed").textContent = "0:00"
        document.getElementById("music-total").textContent = "0:00"
        document.getElementById("music-fill").style.width = "0%"
        if (!transitioning) setVisualizerPlaying(false)
    }
}

function startMusicPolling() {
    if (musicPolling) clearInterval(musicPolling)
    musicPolling = setInterval(async () => {
        const status = await window.darken.getPlayerStatus()
        updateMusicUI(status)
    }, 1000)
}

function setMusicVolume(val) {
    window.darken.setVolume(parseInt(val))
}

function formatMusicTime(sec) {
    sec = Math.floor(sec || 0)
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, "0")}`
}

function buildVisualizer() {
    const svg = document.getElementById("viz-svg")
    if (!svg) return

    const total = 36
    const cx = 60, cy = 60
    const innerR = 36
    const outerR = 54

    svg.innerHTML = ""

    for (let i = 0; i < total; i++) {
        const angle = (i / total) * 360
        const rad = (angle - 90) * Math.PI / 180

        const lengthVariance = 0.8 + (Math.sin(i * 2.5) + 1) * 0.3
        const outer = innerR + (outerR - innerR) * lengthVariance

        const x1 = cx + innerR * Math.cos(rad)
        const y1 = cy + innerR * Math.sin(rad)
        const x2 = cx + outer * Math.cos(rad)
        const y2 = cy + outer * Math.sin(rad)

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line.setAttribute("x1", x1.toFixed(2))
        line.setAttribute("y1", y1.toFixed(2))
        line.setAttribute("x2", x2.toFixed(2))
        line.setAttribute("y2", y2.toFixed(2))
        line.setAttribute("stroke", i % 4 === 0 ? "#a855f7" : "#7c3aed")
        line.setAttribute("stroke-width", "1.5")
        line.setAttribute("stroke-linecap", "round")
        line.classList.add("viz-spike")
        line.style.animationDelay = `${(Math.random() * 0.4).toFixed(2)}s`
        line.style.animationDuration = `${(0.3 + Math.random() * 0.3).toFixed(2)}s`

        svg.appendChild(line)
    }
}

function setVisualizerPlaying(playing) {
    const wrapper = document.getElementById("music-thumb-wrapper")
    if (!wrapper) return
    if (playing) {
        wrapper.classList.add("playing")
    } else {
        wrapper.classList.remove("playing")
    }
}

async function toggleRepeat() {
    repeatEnabled = await window.darken.toggleRepeat()
    const btn = document.getElementById("repeat-btn")
    if (btn) {
        if (repeatEnabled) {
            btn.classList.add("active")
        } else {
            btn.classList.remove("active")
        }
    }
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
