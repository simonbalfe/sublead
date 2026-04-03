import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { requireAuth } from '../middleware/auth'
import { createTodo, deleteTodo, listTodos, toggleTodo } from '../services/todos'

export const todoRoutes = new Hono()
  .get(
    '/todos',
    describeRoute({
      tags: ['Todos'],
      summary: 'List todos',
      description: 'Returns all todos for the authenticated user',
      responses: { 200: { description: 'List of todos' } },
    }),
    requireAuth,
    async (c) => {
      return c.json({ success: true, todos: listTodos() })
    },
  )
  .post(
    '/todos',
    describeRoute({
      tags: ['Todos'],
      summary: 'Create todo',
      description: 'Creates a new todo for the authenticated user',
      responses: {
        200: { description: 'Created todo' },
        400: { description: 'Invalid request' },
      },
    }),
    requireAuth,
    async (c) => {
      const body = await c.req.json()
      const text = body?.text

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return c.json({ success: false, error: 'Todo text is required' }, 400)
      }

      if (text.length > 200) {
        return c.json({ success: false, error: 'Todo text must be less than 200 characters' }, 400)
      }

      return c.json({ success: true, todo: createTodo(text) })
    },
  )
  .post(
    '/todos/delete',
    describeRoute({
      tags: ['Todos'],
      summary: 'Delete todo',
      description: 'Deletes a todo by ID',
      responses: {
        200: { description: 'Deleted successfully' },
        400: { description: 'Invalid request' },
        404: { description: 'Todo not found' },
      },
    }),
    requireAuth,
    async (c) => {
      const body = await c.req.json()
      const id = body?.id

      if (!id || typeof id !== 'string') {
        return c.json({ success: false, error: 'Todo ID is required' }, 400)
      }

      const deleted = deleteTodo(id)
      if (!deleted) {
        return c.json({ success: false, error: 'Todo not found' }, 404)
      }

      return c.json({ success: true })
    },
  )
  .post(
    '/todos/toggle',
    describeRoute({
      tags: ['Todos'],
      summary: 'Toggle todo',
      description: 'Toggles the completed state of a todo',
      responses: {
        200: { description: 'Updated todo' },
        400: { description: 'Invalid request' },
        404: { description: 'Todo not found' },
      },
    }),
    requireAuth,
    async (c) => {
      const body = await c.req.json()
      const id = body?.id

      if (!id || typeof id !== 'string') {
        return c.json({ success: false, error: 'Todo ID is required' }, 400)
      }

      const todo = toggleTodo(id)
      if (!todo) {
        return c.json({ success: false, error: 'Todo not found' }, 404)
      }

      return c.json({ success: true, todo })
    },
  )
