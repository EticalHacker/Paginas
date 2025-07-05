// Variables globales
let isPlaying = false
let audioPlayer
let envelope
let flap
let content
let playButton
let currentLineElement
let nextLineElement
let progressFill
let musicWaves
let lyricsInterval
let progressInterval

// Letras sincronizadas con timestamps correctos - ORDENADAS CRONOLÓGICAMENTE
const lyricsData = [
  // Primera parte vocal
  { time: 6, text: "Oh baby, oh man", duration: 6 },
  { time: 16, text: "You're making me crazy, really driving me mad", duration: 6 },
  { time: 26, text: "But that's alright with me, it's really no fuss", duration: 9 },
  { time: 37, text: "As long as you're next to me just the two of us", duration: 7 },

  // Coro 1 - CORREGIDO Y ORDENADO
  { time: 47, text: "You're my, my, my, my kind of woman", duration: 5 },
  { time: 52, text: "And I'm down on my hands and knees", duration: 4 },
  { time: 56, text: "Begging you please, baby, show me your world", duration: 5 },
  { time: 53, text: "You're my, my, my, my kind of woman", duration: 7 },
  { time: 59, text: "My, oh my, what a girl", duration: 5 },

  // Segunda parte vocal
  { time: 71, text: "Oh brother, sweetheart", duration: 5 },
  { time: 76, text: "I'm feeling so tired, really falling apart", duration: 6 },
  { time: 82, text: "And it just don't make sense to me, I really don't know", duration: 6 },
  { time: 88, text: "Why you stick right next to me, wherever I go", duration: 6 },

  // Coro 2
  { time: 94, text: "You're my, my, my, my kind of woman", duration: 6 },
  { time: 100, text: "My, oh my, what a girl", duration: 5 },
  { time: 105, text: "You're my, my, my, my kind of woman", duration: 5 },
  { time: 110, text: "And I'm down on my hands and knees", duration: 4 },
  { time: 114, text: "Begging you please, baby, show me your world", duration: 5 },

  // Coro final
  { time: 127, text: "You're my, my, my, my kind of woman", duration: 6 },
  { time: 133, text: "My, oh my, what a girl", duration: 5 },
  { time: 138, text: "You're my, my, my, my kind of woman", duration: 5 },
  { time: 143, text: "And I'm down on my hands and knees", duration: 4 },
  { time: 147, text: "Begging you please, baby, show me your world", duration: 5 },
].sort((a, b) => a.time - b.time) // Asegurar orden cronológico

// Inicialización cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  initializeElements()
  setupEventListeners()
  createFloatingHearts()
})

// Inicializar elementos del DOM
function initializeElements() {
  envelope = document.getElementById("envelope")
  flap = document.getElementById("flap")
  content = document.getElementById("content")
  playButton = document.getElementById("playButton")
  audioPlayer = document.getElementById("audioPlayer")
  currentLineElement = document.getElementById("currentLine")
  nextLineElement = document.getElementById("nextLine")
  progressFill = document.getElementById("progressFill")
  musicWaves = document.getElementById("musicWaves")
}

// Configurar event listeners
function setupEventListeners() {
  envelope.addEventListener("click", openEnvelope)
  playButton.addEventListener("click", toggleMusic)
  audioPlayer.addEventListener("ended", () => {
    resetPlayButton()
    isPlaying = false
    stopLyricsSync()
    musicWaves.classList.remove("active")
  })
  audioPlayer.addEventListener("error", () => {
    showAudioError()
  })
  audioPlayer.addEventListener("timeupdate", updateProgress)
}

// Función para abrir la carta
function openEnvelope() {
  flap.classList.add("open")
  setTimeout(() => {
    content.classList.add("show")
    createConfetti()
    playOpeningSound()
  }, 800)
  envelope.removeEventListener("click", openEnvelope)
  envelope.style.animation = "shake 0.5s ease-in-out"
}

// Función para reproducir/pausar música
function toggleMusic() {
  if (!isPlaying) {
    playMusic()
  } else {
    pauseMusic()
  }
}

// Función para reproducir música
function playMusic() {
  audioPlayer
    .play()
    .then(() => {
      isPlaying = true
      updatePlayButton(true)
      startLyricsSync()
      musicWaves.classList.add("active")
      startProgressUpdate()
    })
    .catch((error) => {
      console.error("Error al reproducir audio:", error)
      showAudioError()
    })
}

// Función para pausar música
function pauseMusic() {
  audioPlayer.pause()
  isPlaying = false
  updatePlayButton(false)
  stopLyricsSync()
  musicWaves.classList.remove("active")
  stopProgressUpdate()
}

// Función mejorada para mostrar indicadores durante partes instrumentales
function showInstrumentalIndicator(startTime, endTime, message = "🎸 Solo Instrumental 🎸") {
  const currentTime = audioPlayer.currentTime
  if (currentTime >= startTime && currentTime < endTime) {
    // Verificar si no hay letra activa en este momento
    const hasActiveLyric = lyricsData.some(
      (lyric) => currentTime >= lyric.time && currentTime < lyric.time + lyric.duration,
    )
    if (!hasActiveLyric) {
      // Verificar si ya existe un indicador instrumental para evitar duplicados
      const existingIndicator = document.querySelector(".instrumental-indicator")
      if (!existingIndicator) {
        // Limpiar letras anteriores
        clearLyricsDisplay()
        // Crear indicador instrumental
        const instrumentalBox = document.createElement("div")
        instrumentalBox.className = "instrumental-indicator"
        instrumentalBox.innerHTML = `<div class="instrumental-text">${message}</div>`
        const lyricsDisplay = document.getElementById("lyricsDisplay")
        lyricsDisplay.appendChild(instrumentalBox)
        // Animar entrada
        setTimeout(() => {
          instrumentalBox.style.opacity = "1"
          instrumentalBox.style.transform = "translateY(0)"
        }, 100)
      }
    }
  }
}

// Función mejorada para limpiar el display de letras
function clearLyricsDisplay() {
  const lyricsDisplay = document.getElementById("lyricsDisplay")
  const existingBoxes = lyricsDisplay.querySelectorAll(".lyric-box, .instrumental-indicator")
  existingBoxes.forEach((box) => {
    box.style.opacity = "0"
    box.style.transform = "translateY(-20px)"
    setTimeout(() => {
      if (box.parentNode) {
        box.remove()
      }
    }, 300)
  })
}

// Mostrar letra actual en cuadro bonito
function displayLyric(lyric) {
  // Verificar si ya existe esta letra para evitar duplicados
  const existingLyric = document.querySelector(".lyric-box .lyric-text")
  if (existingLyric && existingLyric.textContent === lyric.text) {
    return // No crear duplicado
  }

  // Limpiar letras anteriores
  clearLyricsDisplay()

  // Esperar un poco antes de mostrar la nueva letra
  setTimeout(() => {
    // Crear cuadro de letra
    const lyricBox = document.createElement("div")
    lyricBox.className = "lyric-box"
    const lyricText = document.createElement("div")
    lyricText.className = "lyric-text"
    lyricText.textContent = lyric.text
    lyricBox.appendChild(lyricText)

    // Agregar al display
    const lyricsDisplay = document.getElementById("lyricsDisplay")
    lyricsDisplay.appendChild(lyricBox)

    // Animar entrada
    setTimeout(() => {
      lyricBox.classList.add("show")
      lyricBox.classList.add("active")
      lyricBox.classList.add("highlight")
    }, 100)

    // Crear efecto de partículas
    createTextParticlesForBox(lyricBox)

    // Remover clase activa después de un tiempo
    setTimeout(() => {
      lyricBox.classList.remove("active")
    }, 3500)
  }, 100)
}

// Crear partículas específicas para el cuadro de letra
function createTextParticlesForBox(lyricBox) {
  const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"]
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const particle = document.createElement("div")
      particle.style.position = "absolute"
      particle.style.left = Math.random() * 100 + "%"
      particle.style.top = Math.random() * 100 + "%"
      particle.style.width = "6px"
      particle.style.height = "6px"
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      particle.style.borderRadius = "50%"
      particle.style.pointerEvents = "none"
      particle.style.zIndex = "10"
      particle.style.animation = `textParticle ${Math.random() * 2 + 1}s ease-out forwards`
      particle.style.boxShadow = `0 0 8px ${colors[Math.floor(Math.random() * colors.length)]}`
      lyricBox.appendChild(particle)
      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove()
        }
      }, 3000)
    }, i * 80)
  }
}

// Sincronización de letras mejorada
function startLyricsSync() {
  let currentLyricIndex = -1
  let lastInstrumentalCheck = -1

  lyricsInterval = setInterval(() => {
    if (!isPlaying) {
      clearInterval(lyricsInterval)
      return
    }

    const currentTime = audioPlayer.currentTime

    // Buscar la letra actual basada en el tiempo
    let foundLyric = false
    for (let i = 0; i < lyricsData.length; i++) {
      if (currentTime >= lyricsData[i].time && currentTime < lyricsData[i].time + lyricsData[i].duration) {
        if (currentLyricIndex !== i) {
          currentLyricIndex = i
          displayLyric(lyricsData[i])
          foundLyric = true
          console.log(`Mostrando letra en tiempo ${currentTime.toFixed(1)}s: "${lyricsData[i].text}"`) // Debug
        }
        break
      }
    }

    // Solo mostrar indicadores instrumentales si no hay letra activa
    if (!foundLyric) {
      // Verificar partes instrumentales
      if (currentTime >= 0 && currentTime < 6 && lastInstrumentalCheck !== 1) {
        showInstrumentalIndicator(0, 6, "🎵 Comenzando... 🎵")
        lastInstrumentalCheck = 1
      } else if (currentTime >= 61 && currentTime < 71 && lastInstrumentalCheck !== 2) {
        showInstrumentalIndicator(61, 71, "🎸 Interludio Musical 🎸")
        lastInstrumentalCheck = 2
      } else if (currentTime >= 119 && currentTime < 127 && lastInstrumentalCheck !== 3) {
        showInstrumentalIndicator(119, 127, "🎸 Solo de Guitarra 🎸")
        lastInstrumentalCheck = 3
      } else if (currentTime >= 152 && lastInstrumentalCheck !== 4) {
        showInstrumentalIndicator(152, 999, "🎶 Outro Instrumental 🎶")
        lastInstrumentalCheck = 4
      }
    }
  }, 200)
}

// Detener sincronización de letras
function stopLyricsSync() {
  if (lyricsInterval) {
    clearInterval(lyricsInterval)
  }
  // Limpiar display y mostrar mensaje inicial
  clearLyricsDisplay()
  setTimeout(() => {
    const initialBox = document.createElement("div")
    initialBox.className = "lyric-box show"
    initialBox.innerHTML =
      '<div class="lyric-text" style="font-size: 1.8rem; color: #7f8c8d;">Presiona play para comenzar...</div>'
    const lyricsDisplay = document.getElementById("lyricsDisplay")
    lyricsDisplay.appendChild(initialBox)
  }, 300)
}

// Actualizar barra de progreso
function updateProgress() {
  if (audioPlayer.duration) {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100
    progressFill.style.width = progress + "%"
  }
}

// Iniciar actualización de progreso
function startProgressUpdate() {
  progressInterval = setInterval(updateProgress, 100)
}

// Detener actualización de progreso
function stopProgressUpdate() {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
}

// Actualizar el botón de reproducción
function updatePlayButton(playing) {
  if (playing) {
    playButton.classList.add("playing")
    playButton.innerHTML = '<div class="play-icon">⏸</div><span>Pausar Música</span>'
    playButton.style.background = "linear-gradient(45deg, #2ecc71, #27ae60)"
  } else {
    playButton.classList.remove("playing")
    playButton.innerHTML = '<div class="play-icon">▶</div><span>Reproducir Música</span>'
    playButton.style.background = "linear-gradient(45deg, #ff6b6b, #ee5a24)"
  }
}

// Resetear el botón cuando termine la canción
function resetPlayButton() {
  updatePlayButton(false)
  stopLyricsSync()
  progressFill.style.width = "0%"
}

// Mostrar error de audio
function showAudioError() {
  playButton.innerHTML = '<div class="play-icon">⚠</div><span>Audio no disponible</span>'
  playButton.style.background = "linear-gradient(45deg, #e74c3c, #c0392b)"
  playButton.disabled = true
  const errorMessage = document.createElement("p")
  errorMessage.textContent =
    'Para escuchar la música, agrega el archivo "my-kind-of-woman.mp3" a la carpeta del proyecto.'
  errorMessage.style.color = "#e74c3c"
  errorMessage.style.fontSize = "0.9rem"
  errorMessage.style.marginTop = "10px"
  errorMessage.style.fontStyle = "italic"
  playButton.parentNode.appendChild(errorMessage)
}

// Crear efecto de confetti mejorado
function createConfetti() {
  const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3"]
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div")
      confetti.style.position = "fixed"
      confetti.style.left = Math.random() * 100 + "vw"
      confetti.style.top = "-10px"
      confetti.style.width = Math.random() * 15 + 5 + "px"
      confetti.style.height = Math.random() * 15 + 5 + "px"
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0"
      confetti.style.pointerEvents = "none"
      confetti.style.zIndex = "1000"
      confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`
      confetti.style.boxShadow = `0 0 10px ${colors[Math.floor(Math.random() * colors.length)]}`
      document.body.appendChild(confetti)
      setTimeout(() => {
        confetti.remove()
      }, 5000)
    }, i * 50)
  }
}

// Crear corazones flotantes mejorados
function createFloatingHearts() {
  setInterval(() => {
    const heart = document.createElement("div")
    heart.innerHTML = "♥"
    heart.style.position = "fixed"
    heart.style.left = Math.random() * 100 + "vw"
    heart.style.bottom = "-50px"
    heart.style.fontSize = Math.random() * 25 + 20 + "px"
    heart.style.color = `hsl(${Math.random() * 60 + 300}, 70%, 70%)`
    heart.style.pointerEvents = "none"
    heart.style.zIndex = "-1"
    heart.style.animation = `floatUp ${Math.random() * 8 + 12}s linear forwards`
    heart.style.textShadow = "0 0 10px rgba(255, 182, 193, 0.8)"
    document.body.appendChild(heart)
    setTimeout(() => {
      heart.remove()
    }, 20000)
  }, 4000)
}

// Sonido de apertura mejorado
function playOpeningSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    // Crear una secuencia de notas
    const notes = [800, 1000, 1200, 1500]
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
        oscillator.type = "sine"
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      }, index * 200)
    })
  } catch (error) {
    console.log("Web Audio API no disponible")
  }
}

// Añadir estilos CSS dinámicos para animaciones adicionales
const style = document.createElement("style")
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
    
    @keyframes floatUp {
        to {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes textParticle {
        0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
        }
        50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 0.8;
        }
        100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
        }
    }
`
document.head.appendChild(style)
