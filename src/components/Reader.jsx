import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, Loader2 } from 'lucide-react'
import { SCRIPTURE_BOOKS } from '../data/scriptureIndex'

const FONT_SIZE_MAP = { sm: '0.9rem', md: '1.05rem', lg: '1.25rem', xl: '1.5rem' }
const FONT_SIZE_KEYS = ['sm', 'md', 'lg', 'xl']

const FONT_FAMILY_MAP = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  palatino: '"Palatino Linotype", Palatino, serif',
  bookman: '"Book Antiqua", Palatino, serif',
}

export default function Reader({ scriptureId, book, chapter, prefs, onBack }) {
  const { fontSize, fontFamily } = prefs
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentBook, setCurrentBook] = useState(book)
  const [currentChapter, setCurrentChapter] = useState(chapter)
  const [localFontSize, setLocalFontSize] = useState(fontSize)
  const contentRef = useRef(null)

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

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [currentBook, currentChapter])

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

      <div className="reader-content" ref={contentRef}>
        <div className="reader-reference">{chapterObj?.reference}</div>
        <div
          className="reader-verses"
          style={{
            fontSize: FONT_SIZE_MAP[localFontSize],
            fontFamily: FONT_FAMILY_MAP[fontFamily] || FONT_FAMILY_MAP.system,
          }}
        >
          {chapterObj?.verses?.map(v => (
            <p key={v.verse} className="verse">
              <sup className="verse-num">{v.verse}</sup>
              {v.text}
            </p>
          ))}
        </div>
      </div>

      <div className="reader-footer">
        <button className="nav-arrow" onClick={goPrev} disabled={bookIdx === 0 && currentChapter === 1}>
          <ChevronLeft size={20} /> Prev
        </button>
        <span className="chapter-indicator">{chapterIdx + 1} / {totalChapters}</span>
        <button className="nav-arrow" onClick={goNext} disabled={bookIdx === books.length - 1 && currentChapter === totalChapters}>
          Next <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
