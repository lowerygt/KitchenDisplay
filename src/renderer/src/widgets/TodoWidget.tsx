import { useState, type FormEvent } from 'react'
import type { Todo } from '@shared/types'
import { useTodos } from '../hooks/useTodos'

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M5 10l3.5 3.5L15 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TodoRow({
  todo,
  onToggle,
  onRemove,
  dragHandlers
}: {
  todo: Todo
  onToggle: () => void
  onRemove: () => void
  dragHandlers: {
    draggable: boolean
    onDragStart: () => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: () => void
    onDragEnd: () => void
    isDragging: boolean
    isOver: boolean
  }
}) {
  return (
    <li
      draggable={dragHandlers.draggable}
      onDragStart={dragHandlers.onDragStart}
      onDragOver={dragHandlers.onDragOver}
      onDrop={dragHandlers.onDrop}
      onDragEnd={dragHandlers.onDragEnd}
      className={`group flex items-center gap-3 rounded-xl px-2 py-2 transition ${
        dragHandlers.isDragging ? 'opacity-40' : ''
      } ${dragHandlers.isOver ? 'ring-2 ring-white/30' : ''}`}
    >
      <span className="cursor-grab select-none text-neutral-600 group-hover:text-neutral-400">⠿</span>
      <button
        onClick={onToggle}
        aria-label={todo.done ? 'Mark not done' : 'Mark done'}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition ${
          todo.done
            ? 'border-emerald-500 bg-emerald-500 text-neutral-950'
            : 'border-neutral-600 text-transparent hover:border-neutral-400'
        }`}
      >
        <CheckIcon />
      </button>
      <span
        className={`flex-1 truncate text-2xl ${
          todo.done ? 'text-neutral-600 line-through' : 'text-neutral-100'
        }`}
      >
        {todo.text}
      </span>
      <button
        onClick={onRemove}
        aria-label="Delete"
        className="shrink-0 px-2 text-2xl leading-none text-neutral-700 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
      >
        ×
      </button>
    </li>
  )
}

export function TodoWidget() {
  const { todos, loading, add, update, remove, reorder, clearCompleted } = useTodos()
  const [text, setText] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const remaining = todos.filter((t) => !t.done).length
  const hasCompleted = todos.some((t) => t.done)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    void add(text)
    setText('')
  }

  function handleDrop(targetId: string) {
    if (dragId && dragId !== targetId) {
      const ids = todos.map((t) => t.id)
      const from = ids.indexOf(dragId)
      const to = ids.indexOf(targetId)
      if (from !== -1 && to !== -1) {
        ids.splice(to, 0, ids.splice(from, 1)[0])
        void reorder(ids)
      }
    }
    setDragId(null)
    setOverId(null)
  }

  return (
    <div className="flex h-full flex-col">
      <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 rounded-xl bg-neutral-800 px-4 py-2 text-xl text-neutral-100 placeholder:text-neutral-500 outline-none ring-1 ring-white/5 focus:ring-white/20"
        />
        <button
          type="submit"
          className="rounded-xl bg-neutral-700 px-4 text-2xl leading-none text-neutral-100 hover:bg-neutral-600"
          aria-label="Add task"
        >
          +
        </button>
      </form>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {loading ? (
          <li className="px-2 py-2 text-neutral-600">Loading…</li>
        ) : todos.length === 0 ? (
          <li className="px-2 py-6 text-center text-neutral-600">Nothing to do 🎉</li>
        ) : (
          todos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onToggle={() => void update(todo.id, { done: !todo.done })}
              onRemove={() => void remove(todo.id)}
              dragHandlers={{
                draggable: true,
                isDragging: dragId === todo.id,
                isOver: overId === todo.id && dragId !== todo.id,
                onDragStart: () => setDragId(todo.id),
                onDragOver: (e) => {
                  e.preventDefault()
                  if (overId !== todo.id) setOverId(todo.id)
                },
                onDrop: () => handleDrop(todo.id),
                onDragEnd: () => {
                  setDragId(null)
                  setOverId(null)
                }
              }}
            />
          ))
        )}
      </ul>

      <footer className="mt-2 flex shrink-0 items-center justify-between border-t border-white/5 pt-2 text-sm text-neutral-500">
        <span>{remaining} left</span>
        {hasCompleted && (
          <button onClick={() => void clearCompleted()} className="hover:text-neutral-300">
            Clear completed
          </button>
        )}
      </footer>
    </div>
  )
}
