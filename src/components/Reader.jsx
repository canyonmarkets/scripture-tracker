import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, Loader2, CheckCircle2, BookOpen, Bookmark, BookmarkCheck, MessageSquare, X } from 'lucide-react'
import { SCRIPTURE_BOOKS } from '../data/scriptureIndex'
import AudioPlayer from './AudioPlayer'
import NoteModal from './NoteModal'
import { getHighlights, setHighlight, updateNote, clearHighlight } from '../lib/highlights'

const FONT_SIZE_MAP = { sm: '0.9rem', md: '1.05rem', lg: '1.25rem', xl: '1.5rem' }
const FONT_SIZE_KEYS = ['sm', 'md', 'lg', 'xl']

const FONT_FAMILY_MAP = {
  system:   '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif:    'Georgia, "Times New Roman", serif',
  palatino: '"Palatino Linotype", Palatino, serif',
  bookman:  '"Book Antiqua", Palatino, serif',
}

// Parse "1 Nephi 3" → { book: "1 Nephi", chapter: 3 }
function parseChapterRef(ref) {
  const parts = ref.trim().split(' ')
  const chNum = parseInt(parts[parts.length - 1])
  const book = parts.slice(0, -1).join(' ')
  return { book, chapter: chNum }
}

export default function Reader({ scriptureId, book, chapter, prefs, todayAssignment, planId, bookmark, onMarkRead, onBookmark, onBack }) {
  const { fontSize, fontFamily } = prefs
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // If a bookmark exists for this plan, start there instead of the passed-in chapter
  const startBook    = bookmark?.book    || book
  const startChapter = bookmark?.chapter || chapter

  const [currentBook, setCurrentBook] = useState(startBook)
  const [currentChapter, setCurrentChapter] = useState(startChapter)
  const [localFontSize, setLocalFontSize] = useState(fontSize)
  const [visitedRefs, setVisitedRefs] = useState(new Set())
  const [showCompletion, setShowCompletion] = useState(false)
  const [alreadyMarked, setAlreadyMarked] = useState(false)
  const [bookmarkToast, setBookmarkToast] = useState(false) // show "Bookmarked ✓" briefly
  const [highlights, setHighlights] = useState({})
  const [activeVerse, setActiveVerse] = useState(null) // verseNum with toolbar open
  const [noteVerse, setNoteVerse] = useState(null)     // verseNum with note modal open
  const contentRef = useRef(null)
  const longPressTimer = useRef(null)
  const longPressVerse = useRef(null)

  const scripture = SCRIPTURE_BOOKS.find(s => s.id === scriptureId)

  useEffect(() => {
    if (!scripture) return
    setLoading(true)
    setError(null)
    fetch(scripture.jsonUrl)
      .then(r => r.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => { setError('Failed to load scripture. Check your internet connection.'); setLoading(false) })
  }, [scriptureId])

  // Parse today's assigned chapters into a structured list
  const assignedChapters = useMemo(() => {
    if (!todayAssignment?.chapters) return []
    return todayAssignment.chapters.map(parseChapterRef)
  }, [todayAssignment])

  const totalAssignedVerses = todayAssignment?.verses || 0

  // Track current chapter as visited
  useEffect(() => {
    if (!currentBook || !currentChapter) return
    const ref = `${currentBook} ${currentChapter}`
    setVisitedRefs(prev => {
      if (prev.has(ref)) return prev
      return new Set([...prev, ref])
    })
  }, [currentBook, currentChapter])

  // Check if all assigned chapters have been visited
  useEffect(() => {
    if (assignedChapters.length === 0 || alreadyMarked) return
    const allDone = assignedChapters.every(ac =>
      visitedRefs.has(`${ac.book} ${ac.chapter}`)
    )
    if (allDone && visitedRefs.size > 0) {
      // Small delay so they land on the last chapter first
      const t = setTimeout(() => setShowCompletion(true), 600)
      return () => clearTimeout(t)
    }
  }, [visitedRefs, assignedChapters, alreadyMarked])

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
    setActiveVerse(null)
    setHighlights(getHighlights(scriptureId, currentBook, currentChapter))
  }, [currentBook, currentChapter])

  function handleMarkRead() {
    if (planId && onMarkRead) onMarkRead(planId)
    setAlreadyMarked(true)
    setShowCompletion(false)
  }

  function handleBookmark() {
    if (planId && onBookmark) onBookmark(planId, currentBook, currentChapter)
    setBookmarkToast(true)
    setTimeout(() => setBookmarkToast(false), 2200)
  }

  const isCurrentlyBookmarked = bookmark?.book === currentBook && bookmark?.chapter === currentChapter

  if (loading) {
    return (
      <div className="reader-loading">
        <Loader2 size={36} className="spin" />
        <p>Loading scriptures…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reader-loading">
        <p className="error-msg">{error}</p>
        <button className="btn-outline" onClick={onBack}>Go Back</button>
      </div>
    )
  }

  const books = data?.books || []
  const bookObj = books.find(b => b.book === currentBook) || books[0]
  const chapterObj = bookObj?.chapters?.find(c => c.chapter === currentChapter) || bookObj?.chapters?.[0]
  const bookNames = books.map(b => b.book)
  const bookIdx = bookNames.indexOf(bookObj?.book)
  const chapterIdx = (chapterObj?.chapter || 1) - 1
  const totalChapters = bookObj?.chapters?.length || 1
  const fsIdx = FONT_SIZE_KEYS.indexOf(localFontSize)

  function goNext() {
    if (currentChapter < totalChapters) {
      setCurrentChapter(c => c + 1)
    } else if (bookIdx < books.length - 1) {
      const nextBook = books[bookIdx + 1]
      setCurrentBook(nextBook.book)
      setCurrentChapter(1)
    }
  }

  function goPrev() {
    if (currentChapter > 1) {
      setCurrentChapter(c => c - 1)
    } else if (bookIdx > 0) {
      const prevBook = books[bookIdx - 1]
      setCurrentBook(prevBook.book)
      setCurrentChapter(prevBook.chapters.length)
    }
  }

  const HIGHLIGHT_COLORS = [
    { key: 'yellow', label: 'Yellow', bg: '#FFF176', text: '#333' },
    { key: 'green',  label: 'Green',  bg: '#A5D6A7', text: '#1a3a1a' },
    { key: 'blue',   label: 'Blue',   bg: '#90CAF9', text: '#0d2a4a' },
    { key: 'pink',   label: 'Pink',   bg: '#F48FB1', text: '#3a0a18' },
  ]

  function startLongPress(verseNum) {
    longPressVerse.current = verseNum
    longPressTimer.current = setTimeout(() => {
      setActiveVerse(prev => prev === verseNum ? null : verseNum)
      // Gentle haptic feedback on supported devices
      if (navigator.vibrate) navigator.vibrate(40)
    }, 500)
  }

  function cancelLongPress() {
    clearTimeout(longPressTimer.current)
    longPressVerse.current = null
  }

  function applyHighlight(verseNum, color) {
    const existing = highlights[verseNum]
    const note = existing?.note || ''
    setHighlight(scriptureId, currentBook, currentChapter, verseNum, color, note)
    setHighlights(getHighlights(scriptureId, currentBook, currentChapter))
    setActiveVerse(null)
  }

  function handleClearHighlight(verseNum) {
    clearHighlight(scriptureId, currentBook, currentChapter, verseNum)
    setHighlights(getHighlights(scriptureId, currentBook, currentChapter))
    setActiveVerse(null)
  }

  function handleSaveNote(verseNum, text) {
    updateNote(scriptureId, currentBook, currentChapter, verseNum, text)
    setHighlights(getHighlights(scriptureId, currentBook, currentChapter))
  }

  function handleDeleteNote(verseNum) {
    const h = highlights[verseNum]
    if (h) {
      setHighlight(scriptureId, currentBook, currentChapter, verseNum, h.color, '')
    }
    setHighlights(getHighlights(scriptureId, currentBook, currentChapter))
  }

  // Goal strip logic
  const showGoalStrip = assignedChapters.length > 0
  const completedCount = assignedChapters.filter(ac =>
    visitedRefs.has(`${ac.book} ${ac.chapter}`)
  ).length
  const goalPct = assignedChapters.length > 0
    ? Math.round((completedCount / assignedChapters.length) * 100)
    : 0

  return (
    <div className="reader-shell">
      <header className="reader-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="reader-nav-center">
          <select
            className="reader-book-select"
            value={bookObj?.book || ''}
            onChange={e => { setCurrentBook(e.target.value); setCurrentChapter(1) }}
          >
            {bookNames.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            className="reader-ch-select"
            value={currentChapter}
            onChange={e => setCurrentChapter(parseInt(e.target.value))}
          >
            {bookObj?.chapters?.map(c => (
              <option key={c.chapter} value={c.chapter}>Ch. {c.chapter}</option>
            ))}
          </select>
        </div>
        <div className="font-controls">
          <button
            className="font-btn"
            onClick={() => setLocalFontSize(FONT_SIZE_KEYS[Math.max(0, fsIdx - 1)])}
            disabled={fsIdx === 0}
          ><Minus size={14} /></button>
          <span className="font-label">A</span>
          <button
            className="font-btn"
            onClick={() => setLocalFontSize(FONT_SIZE_KEYS[Math.min(FONT_SIZE_KEYS.length - 1, fsIdx + 1)])}
            disabled={fsIdx === FONT_SIZE_KEYS.length - 1}
          ><Plus size={14} /></button>
        </div>
      </header>

      {/* Today's Goal Strip */}
      {showGoalStrip && (
        <div className="goal-strip">
          <div className="goal-strip-top">
            <BookOpen size={12} className="goal-icon" />
            <span className="goal-label">Today's reading</span>
            <span className="goal-count">{completedCount} of {assignedChapters.length} chapters</span>
          </div>
          <div className="goal-bar">
            <div className="goal-bar-fill" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="goal-chapters">
            {assignedChapters.map((ac, i) => {
              const ref = `${ac.book} ${ac.chapter}`
              const done = visitedRefs.has(ref)
              const current = ac.book === currentBook && ac.chapter === currentChapter
              return (
                <span
                  key={i}
                  className={`goal-chip ${done ? 'done' : ''} ${current ? 'current' : ''}`}
                >
                  {done && <CheckCircle2 size={10} />}
                  {ac.book.replace('1 ', '1 ').replace('2 ', '2 ').replace('3 ', '3 ')} {ac.chapter}
                </span>
              )
            })}
          </div>
        </div>
      )}

      <AudioPlayer
        scriptureId={scriptureId}
        bookName={currentBook}
        chapter={currentChapter}
      />

      <div className="reader-content" ref={contentRef} onClick={() => { setActiveVerse(null) }}>
        <div className="reader-reference">{chapterObj?.reference}</div>
        <div
          className="reader-verses"
          style={{
            fontSize: FONT_SIZE_MAP[localFontSize],
            fontFamily: FONT_FAMILY_MAP[fontFamily] || FONT_FAMILY_MAP.system,
          }}
        >
          {chapterObj?.verses?.map(v => {
            const hi = highlights[v.verse]
            const isActive = activeVerse === v.verse
            const colorMeta = HIGHLIGHT_COLORS.find(c => c.key === hi?.color)
            return (
              <div key={v.verse} className="verse-block">
                <p
                  className={`verse ${hi ? 'highlighted' : ''}`}
                  style={hi ? { background: colorMeta?.bg, color: colorMeta?.text, borderRadius: '4px', padding: '2px 4px', margin: '0 -4px' } : {}}
                  onTouchStart={e => { e.preventDefault(); startLongPress(v.verse) }}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onMouseDown={() => startLongPress(v.verse)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onContextMenu={e => e.preventDefault()}
                >
                  <sup className="verse-num">{v.verse}</sup>
                  {v.text}
                  {hi?.note ? (
                    <button
                      className="verse-note-indicator"
                      onClick={e => { e.stopPropagation(); setNoteVerse(v.verse) }}
                      title="View note"
                    >
                      <MessageSquare size={13} />
                    </button>
                  ) : null}
                </p>

                {/* Highlight toolbar */}
                {isActive && (
                  <div className="verse-toolbar" onClick={e => e.stopPropagation()}>
                    {HIGHLIGHT_COLORS.map(c => (
                      <button
                        key={c.key}
                        className={`verse-color-btn ${hi?.color === c.key ? 'active' : ''}`}
                        style={{ background: c.bg }}
                        onClick={() => applyHighlight(v.verse, c.key)}
                        title={c.label}
                      />
                    ))}
                    <button
                      className="verse-note-btn"
                      onClick={() => { setNoteVerse(v.verse); setActiveVerse(null) }}
                      title="Add note"
                    >
                      <MessageSquare size={14} />
                    </button>
                    {hi && (
                      <button
                        className="verse-clear-btn"
                        onClick={() => handleClearHighlight(v.verse)}
                        title="Remove highlight"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="reader-footer">
        <button className="nav-arrow" onClick={goPrev} disabled={bookIdx === 0 && currentChapter === 1}>
          <ChevronLeft size={20} /> Prev
        </button>

        <button
          className={`bookmark-btn ${isCurrentlyBookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmark}
          title="Save your place"
        >
          {isCurrentlyBookmarked
            ? <BookmarkCheck size={20} />
            : <Bookmark size={20} />}
        </button>

        <span className="chapter-indicator">{chapterIdx + 1} / {totalChapters}</span>
        <button className="nav-arrow" onClick={goNext} disabled={bookIdx === books.length - 1 && currentChapter === totalChapters}>
          Next <ChevronRight size={20} />
        </button>
      </div>

      {/* Note modal */}
      {noteVerse !== null && (
        <NoteModal
          verseNum={noteVerse}
          verseText={chapterObj?.verses?.find(v => v.verse === noteVerse)?.text || ''}
          existingNote={highlights[noteVerse]?.note || ''}
          onSave={text => handleSaveNote(noteVerse, text)}
          onDelete={() => handleDeleteNote(noteVerse)}
          onClose={() => setNoteVerse(null)}
        />
      )}

      {/* Bookmark toast */}
      {bookmarkToast && (
        <div className="bookmark-toast">
          <BookmarkCheck size={15} /> Bookmark saved — you'll start here next time
        </div>
      )}

      {/* Completion overlay */}
      {showCompletion && (
        <div className="completion-overlay" onClick={() => setShowCompletion(false)}>
          <div className="completion-card" onClick={e => e.stopPropagation()}>
            <div className="completion-emoji">🎉</div>
            <h2 className="completion-title">Today's Reading Complete!</h2>
            <p className="completion-sub">
              You read {assignedChapters.length} chapter{assignedChapters.length !== 1 ? 's' : ''} and
              approximately {totalAssignedVerses} verses — great work!
            </p>
            <div className="completion-chapters">
              {assignedChapters.map((ac, i) => (
                <span key={i} className="completion-chip">
                  <CheckCircle2 size={12} /> {ac.book} {ac.chapter}
                </span>
              ))}
            </div>
            {!alreadyMarked && (
              <button className="completion-mark-btn" onClick={handleMarkRead}>
                <CheckCircle2 size={18} /> Mark Today as Read
              </button>
            )}
            {alreadyMarked && (
              <div className="completion-marked">
                <CheckCircle2 size={16} /> Day marked complete
              </div>
            )}
            <button className="completion-continue-btn" onClick={() => setShowCompletion(false)}>
              Keep Reading
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
