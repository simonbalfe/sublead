import { useUser } from '@shared/hooks/use-user'
import { api } from '@shared/lib/api'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Input } from '@ui/components/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export function DashboardPage() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [newTodo, setNewTodo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await api.api.todos.$get()
      return res.json() as Promise<{ success: boolean; todos: Todo[] }>
    },
  })

  const createMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.api.todos.$post({ json: { text } })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setNewTodo('')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api.todos.toggle.$post({ json: { id } })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api.todos.delete.$post({ json: { id } })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTodo.trim()) createMutation.mutate(newTodo.trim())
  }

  const todos = data?.todos ?? []

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">Here are your todos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos</CardTitle>
          <CardDescription>{todos.length} items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="Add a todo..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
            />
            <Button type="submit" size="icon" disabled={createMutation.isPending}>
              <Plus className="size-4" />
            </Button>
          </form>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : todos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No todos yet.</p>
          ) : (
            <ul className="space-y-1">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50"
                >
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate(todo.id)}
                    className="flex size-5 shrink-0 items-center justify-center rounded border border-input"
                  >
                    {todo.completed ? (
                      <Check className="size-3 text-primary" />
                    ) : (
                      <X className="size-3 text-transparent" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${todo.completed ? 'text-muted-foreground line-through' : ''}`}
                  >
                    {todo.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(todo.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
