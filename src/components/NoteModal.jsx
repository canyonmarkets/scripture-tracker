import { useState, useEffect, useRef } from 'react'
import { X, Trash2 } from 'lucide-react'

export default function NoteModal({ verseNum, verseText, existingNote, onSave, onDelete, onClose }) {
  const [text, setText] = useState(existingNote || '')
  const textareaRef = useRef(null)

  useEffect(() => {
    // Focus and move cursor to end
    const ta = textareaRef.current
    if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length) }
  }, [])

  function handleSave() {
    onSave(text.trim())
    onClose()
  }

  function handleDelete() {
    onDelete()
    onClose()
  }

  return (
    <div
      className="note-modal-overlay"
      onClick={onClose}
    >
      <div
        className="note-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="note-modal-header">
          <span className="note-modal-title">Verse {verseNum}</span>
          <button className="note-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="note-modal-verse-text">"{verseText}"</p>

        <textarea
          ref={textareaRef}
          className="note-modal-textarea"
          placeholder="Add a note or insight…"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
        />

        <div className="note-modal-actions">
          {existingNote && (
            <button className="note-modal-delete" onClick={handleDelete}>
              <Trash2 size={15} /> Delete
            </button>
          )}
          <button className="note-modal-save" onClick={handleSave}>
            Save Note
          </button>
        </div>
      </div>
    </div>
  )
}
