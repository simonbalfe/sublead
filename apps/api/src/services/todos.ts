interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

const todoStore: Todo[] = []

function serializeTodo(todo: Todo) {
  return { ...todo, createdAt: todo.createdAt.toISOString() }
}

export function listTodos() {
  return todoStore.map(serializeTodo)
}

export function createTodo(text: string) {
  const todo: Todo = {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
    createdAt: new Date(),
  }
  todoStore.push(todo)
  return serializeTodo(todo)
}

export function toggleTodo(id: string) {
  const todo = todoStore.find((t) => t.id === id)
  if (!todo) return null

  todo.completed = !todo.completed
  return serializeTodo(todo)
}

export function deleteTodo(id: string) {
  const index = todoStore.findIndex((t) => t.id === id)
  if (index === -1) return false

  todoStore.splice(index, 1)
  return true
}
