let WEATHER_API_KEY = ""
let WEATHER_CITY = "Tashkent"
let commandCount = 0
let uptimeBase = 0

window.addEventListener("DOMContentLoaded", async () => {
    WEATHER_API_KEY = await window.darken.getEnv("OPENWEATHER_API_KEY") || ""
    WEATHER_CITY = await window.darken.getEnv("WEATHER_CITY") || "Tashkent"

    document.getElementById("init-time").textContent = formatTime(new Date())
    startClock()
    await loadStats()
    await loadWeather()
    setInterval(loadStats, 5000)
    setInterval(loadWeather, 300000)
    loadHistory()
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

  await window.darken.sendCommand(text)

  setTimeout(() => {
    addDarkenResponse(text)
  }, 300)
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
  const reply = action ? responses[action] : "got it"

  const chat = document.getElementById("chat-messages")
  const msg = document.createElement("div")
  msg.className = "message darken-msg"
  msg.innerHTML = `
    <div class="msg-avatar">D</div>
    <div class="msg-content">
      <p>${reply}</p>
      <span class="msg-time">${formatTime(new Date())}</span>
    </div>
  `
  chat.appendChild(msg)
  chat.scrollTop = chat.scrollHeight
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

let listening = false

function toggleListening() {
  listening = !listening
  const btn = document.getElementById("mic-btn")
  const ring = document.getElementById("voice-ring")
  const label = document.getElementById("listening-label")

  if (listening) {
    btn.classList.add("active")
    ring.classList.add("listening")
    label.textContent = "⬡ LISTENING... ⬡"
    label.style.color = "#a855f7"
  } else {
    btn.classList.remove("active")
    ring.classList.remove("listening")
    label.textContent = "⬡ STANDBY ⬡"
    label.style.color = "var(--purple)"
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

let musicPlaying = false
let musicProgress = 0
let musicInterval = null

const playlist = [
  { title: "No track playing", artist: "--", duration: 0 },
]

let currentTrack = 0

function togglePlay() {
  musicPlaying = !musicPlaying
  const btn = document.querySelectorAll(".music-btn")[1]

  if (musicPlaying) {
    btn.textContent = "⏸"
    musicInterval = setInterval(() => {
      const track = playlist[currentTrack]
      if (track.duration === 0) return
      musicProgress = Math.min(musicProgress + 1, track.duration)
      updateMusicProgress()
      if (musicProgress >= track.duration) nextTrack()
    }, 1000)
  } else {
    btn.textContent = "▶"
    clearInterval(musicInterval)
  }
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % playlist.length
  musicProgress = 0
  updateMusicInfo()
}

function prevTrack() {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length
  musicProgress = 0
  updateMusicInfo()
}

function updateMusicInfo() {
  const track = playlist[currentTrack]
  document.getElementById("music-title").textContent = track.title
  document.getElementById("music-artist").textContent = track.artist
  document.getElementById("music-total").textContent = formatMusicTime(track.duration)
  updateMusicProgress()
}

function updateMusicProgress() {
  const track = playlist[currentTrack]
  const pct = track.duration > 0 ? (musicProgress / track.duration) * 100 : 0
  document.getElementById("music-fill").style.width = `${pct}%`
  document.getElementById("music-elapsed").textContent = formatMusicTime(musicProgress)
}

function formatMusicTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function setMusicVolume(val) {
  console.log("Volume:", val)
}