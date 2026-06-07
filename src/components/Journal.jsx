import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export default function Journal({ notes, setNotes }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [expanded, setExpanded] = useState(null)

  function save() {
    if (!body.trim()) return
    const entry = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Entry',
      body: body.trim(),
      date: new Date().toISOString(),
    }
    setNotes(prev => [entry, ...prev])
    setTitle('')
    setBody('')
    setOpen(false)
  }

  function deleteNote(id) {
    if (confirm('Delete this journal entry?')) {
      setNotes(prev => prev.filter(n => n.id !== id))
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Journal</h1>
        <button className="btn-icon" onClick={() => setOpen(o => !o)}>
          <Plus size={20} />
        </button>
      </div>

      {open && (
        <div className="card journal-compose">
          <input
            className="form-input"
            placeholder="Entry title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            className="journal-textarea"
            placeholder="Write your reflection, insight, or notes…"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={6}
            autoFocus
          />
          <div className="compose-actions">
            <button className="btn-primary btn-sm" onClick={save}>Save Entry</button>
            <button className="btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {notes.length === 0 && !open && (
        <div className="empty-state">
          <div className="empty-icon">✍️</div>
          <h2>No Journal Entries</h2>
          <p>Tap + to write your first reflection or spiritual insight.</p>
        </div>
      )}

      <div className="journal-list">
        {notes.map(note => (
          <div key={note.id} className="card journal-entry">
            <div className="journal-entry-header" onClick={() => setExpanded(e => e === note.id ? null : note.id)}>
              <div>
                <div className="journal-entry-title">{note.title}</div>
                <div className="journal-entry-date">
                  {new Date(note.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="journal-entry-actions">
                <button className="delete-btn" onClick={e => { e.stopPropagation(); deleteNote(note.id) }}>
                  <Trash2 size={14} />
                </button>
                {expanded === note.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expanded === note.id && (
              <div className="journal-entry-body">{note.body}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
