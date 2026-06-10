import { useCallback, useEffect, useState } from 'react'
import type { TodoPatch } from '@shared/ipc'
import type { Todo } from '@shared/types'

/**
 * To-do state lives in the main process (electron-store). Every mutation
 * returns the authoritative list, which we mirror locally.
 */
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void window.api.todos.list().then((list) => {
      if (mounted) {
        setTodos(list)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const add = useCallback((text: string) => window.api.todos.add(text).then(setTodos), [])
  const update = useCallback(
    (id: string, patch: TodoPatch) => window.api.todos.update(id, patch).then(setTodos),
    []
  )
  const remove = useCallback((id: string) => window.api.todos.remove(id).then(setTodos), [])
  const reorder = useCallback(
    (orderedIds: string[]) => window.api.todos.reorder(orderedIds).then(setTodos),
    []
  )
  const clearCompleted = useCallback(() => window.api.todos.clearCompleted().then(setTodos), [])

  return { todos, loading, add, update, remove, reorder, clearCompleted }
}
