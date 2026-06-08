import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'
import { getChapterAudio } from '../lib/churchAudio'

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2]

// Save/restore audio position per chapter so bookmark resumes at exact timestamp
function posKey(bookName, chapter) { return `st_audioPos_${bookName}_${chapter}` }

export default function AudioPlayer({ scriptureId, bookName, chapter }) {
  const [urls, setUrls] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [voice, setVoice] = useState(() => localStorage.getItem('st_audioVoice') || 'male')
  const [speed, setSpeed] = useState(() => parseFloat(localStorage.getItem('st_audioSpeed') || '1'))
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef(null)

  // Fetch audio URLs when chapter changes
  useEffect(() => {
    setLoading(true)
    setUnavailable(false)
    setPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)

    // Reset the audio element so it doesn't hold the previous chapter's src
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    getChapterAudio(scriptureId, bookName, chapter).then(result => {
      if (!result) {
        setUnavailable(true)
      } else {
        setUrls(result)
      }
      setLoading(false)
    })
  }, [scriptureId, bookName, chapter])

  // Apply speed to audio element whenever it changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  // Swap audio source when voice changes
  useEffect(() => {
    if (!audioRef.current || !urls) return
    const wasPlaying = playing
    const time = audioRef.current.currentTime
    audioRef.current.src = urls[voice]
    audioRef.current.load()
    audioRef.current.playbackRate = speed
    audioRef.current.currentTime = time
    if (wasPlaying) audioRef.current.play().catch(() => {})
  }, [voice, urls])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio || !urls) return
    if (playing) {
      audio.pause()
      // Save position so bookmark can resume here
      localStorage.setItem(posKey(bookName, chapter), String(audio.currentTime))
      setPlaying(false)
    } else {
      if (!audio.src || audio.src === window.location.href) {
        audio.src = urls[voice]
        audio.load()
        audio.playbackRate = speed
      }
      // Restore saved position if any
      const saved = parseFloat(localStorage.getItem(posKey(bookName, chapter)) || '0')
      if (saved > 0 && audio.readyState >= 1) audio.currentTime = saved
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    // Auto-save position every ~5 seconds
    if (Math.round(audio.currentTime) % 5 === 0) {
      localStorage.setItem(posKey(bookName, chapter), String(audio.currentTime))
    }
  }

  function handleLoaded() {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = speed
    setDuration(audio.duration || 0)
    // Restore saved position
    const saved = parseFloat(localStorage.getItem(posKey(bookName, chapter)) || '0')
    if (saved > 0) {
      audio.currentTime = saved
      setCurrentTime(saved)
      setProgress((saved / audio.duration) * 100)
    }
  }

  function handleEnded() {
    setPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    localStorage.removeItem(posKey(bookName, chapter))
    if (audioRef.current) audioRef.current.currentTime = 0
  }

  function changeSpeed(s) {
    setSpeed(s)
    localStorage.setItem('st_audioSpeed', String(s))
  }

  function handleSeek(e) {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    audio.currentTime = pct * audio.duration
    setProgress(pct * 100)
  }

  function switchVoice(v) {
    setVoice(v)
    localStorage.setItem('st_audioVoice', v)
  }

  function fmt(secs) {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (unavailable) return null

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoaded}
        onEnded={handleEnded}
        preload="none"
      />

      {/* Voice + speed controls */}
      <div className="audio-top-row">
        <div className="audio-voice-toggle">
          <button className={`audio-voice-btn ${voice === 'male' ? 'active' : ''}`} onClick={() => switchVoice('male')}>♂ Male</button>
          <button className={`audio-voice-btn ${voice === 'female' ? 'active' : ''}`} onClick={() => switchVoice('female')}>♀ Female</button>
        </div>
        <div className="audio-speed-toggle">
          {SPEEDS.map(s => (
            <button
              key={s}
              className={`audio-speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => changeSpeed(s)}
            >
              {s === 1 ? '1×' : `${s}×`}
            </button>
          ))}
        </div>
      </div>

      {/* Player controls */}
      <div className="audio-controls">
        <button
          className="audio-play-btn"
          onClick={togglePlay}
          disabled={loading}
        >
          {loading
            ? <Loader2 size={18} className="spin" />
            : playing
              ? <Pause size={18} />
              : <Play size={18} />
          }
        </button>

        {/* Progress bar */}
        <div className="audio-progress-wrap" onClick={handleSeek}>
          <div className="audio-progress-track">
            <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Time */}
        <span className="audio-time">
          {playing || currentTime > 0 ? fmt(currentTime) : fmt(duration)}
        </span>
      </div>
    </div>
  )
}
