import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Loader2, Volume2, VolumeX } from 'lucide-react'
import { getChapterAudio } from '../lib/churchAudio'

export default function AudioPlayer({ scriptureId, bookName, chapter }) {
  const [urls, setUrls] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [voice, setVoice] = useState(() => localStorage.getItem('st_audioVoice') || 'male')
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

    getChapterAudio(scriptureId, bookName, chapter).then(result => {
      if (!result) {
        setUnavailable(true)
      } else {
        setUrls(result)
      }
      setLoading(false)
    })
  }, [scriptureId, bookName, chapter])

  // Swap audio source when voice changes
  useEffect(() => {
    if (!audioRef.current || !urls) return
    const wasPlaying = playing
    const time = audioRef.current.currentTime
    audioRef.current.src = urls[voice]
    audioRef.current.load()
    audioRef.current.currentTime = time
    if (wasPlaying) audioRef.current.play().catch(() => {})
  }, [voice, urls])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio || !urls) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      if (!audio.src || audio.src === window.location.href) {
        audio.src = urls[voice]
      }
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
  }

  function handleLoaded() {
    setDuration(audioRef.current?.duration || 0)
  }

  function handleEnded() {
    setPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    if (audioRef.current) audioRef.current.currentTime = 0
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

      {/* Voice toggle */}
      <div className="audio-voice-toggle">
        <button
          className={`audio-voice-btn ${voice === 'male' ? 'active' : ''}`}
          onClick={() => switchVoice('male')}
        >
          ♂ Male
        </button>
        <button
          className={`audio-voice-btn ${voice === 'female' ? 'active' : ''}`}
          onClick={() => switchVoice('female')}
        >
          ♀ Female
        </button>
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
