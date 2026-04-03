import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { openAPIRouteHandler } from 'hono-openapi'
import { cors } from 'hono/cors'
import { auth } from './auth'
import { config } from './config'
import { authRoutes } from './routes/auth'
import { serverInfoRoutes } from './routes/server-info'
import { todoRoutes } from './routes/todos'
import { userRoutes } from './routes/users'

interface OpenAPISchema {
  paths?: Record<string, unknown>
  components?: {
    schemas?: Record<string, unknown>
    [key: string]: unknown
  }
  [key: string]: unknown
}

const app = new Hono()
  .basePath('/api')
  .use(
    '*',
    cors({
      origin: config.APP_URL,
      credentials: true,
    }),
  )
  .use('*', async (c, next) => {
    await next()
    console.log(`[HONO] ${c.req.method} ${c.req.path} -> ${c.res.status}`)
  })
  .route('/', authRoutes)
  .route('/', todoRoutes)
  .route('/', userRoutes)
  .route('/', serverInfoRoutes)

app.get('/app-openapi', async (c) => {
  const handler = openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'API',
        version: '1.0.0',
      },
      servers: [
        {
          url: config.APP_URL,
          description: 'API server',
        },
      ],
    },
  })
  return handler(c, async () => {})
})

app.get('/openapi', async (c) => {
  const authSchema = (await auth.api.generateOpenAPISchema()) as OpenAPISchema
  const appResponse = await Promise.resolve(app.request('/api/app-openapi'))
  const appSchema = (await appResponse.json()) as OpenAPISchema

  const mergedSchema = {
    ...appSchema,
    paths: {
      ...appSchema.paths,
      ...authSchema.paths,
    },
    components: {
      ...(appSchema.components ?? {}),
      schemas: {
        ...(appSchema.components?.schemas ?? {}),
        ...(authSchema.components?.schemas ?? {}),
      },
    },
  }

  return c.json(mergedSchema)
})

app.get(
  '/docs',
  Scalar({
    theme: 'saturn',
    url: '/api/openapi',
  }),
)

export { app }
export type AppRouter = typeof app
