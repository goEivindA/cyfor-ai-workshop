import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { prisma } from './db.js'

const RootResponseSchema = z.object({
  message: z.string(),
  openapi: z.string()
}).openapi('RootResponse')

const HealthResponseSchema = z.object({
  status: z.literal('ok')
}).openapi('HealthResponse')

const RESOURCE_TYPES = ['general', 'room', 'equipment', 'vehicle', 'person'] as const

const ResourceSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  title: z.string().min(1).max(120).openapi({ example: 'Conference Room A' }),
  description: z.string().max(500).openapi({ example: 'Large meeting room with a projector' }),
  resourceType: z.string().openapi({ example: 'room' }),
  createdAt: z.string().datetime().openapi({ example: '2024-01-01T00:00:00.000Z' })
}).openapi('Resource')

const ResourceListResponseSchema = z.object({
  resources: z.array(ResourceSchema)
}).openapi('ResourceListResponse')

const CreateResourceSchema = z.object({
  title: z.string().trim().min(1).max(120).openapi({ example: 'Conference Room A' }),
  description: z.string().trim().max(500).default('').openapi({ example: 'Large meeting room with a projector' }),
  resourceType: z.enum(RESOURCE_TYPES).default('general').openapi({ example: 'room' })
}).openapi('CreateResource')

const UpdateResourceSchema = z.object({
  title: z.string().trim().min(1).max(120).optional().openapi({ example: 'Conference Room A' }),
  description: z.string().trim().max(500).optional().openapi({ example: 'Large meeting room with a projector' }),
  resourceType: z.enum(RESOURCE_TYPES).optional().openapi({ example: 'room' })
}).openapi('UpdateResource')

const ResourceParamsSchema = z.object({
  id: z.coerce.number().int().positive().openapi({
    param: {
      name: 'id',
      in: 'path'
    },
    example: 1
  })
}).openapi('ResourceParams')

const rootRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['System'],
  responses: {
    200: {
      description: 'Basic API information',
      content: {
        'application/json': {
          schema: RootResponseSchema
        }
      }
    }
  }
})

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  responses: {
    200: {
      description: 'Health check',
      content: {
        'application/json': {
          schema: HealthResponseSchema
        }
      }
    }
  }
})

const listResourcesRoute = createRoute({
  method: 'get',
  path: '/resources',
  tags: ['Resources'],
  responses: {
    200: {
      description: 'List persisted resources',
      content: {
        'application/json': {
          schema: ResourceListResponseSchema
        }
      }
    }
  }
})

const createResourceRoute = createRoute({
  method: 'post',
  path: '/resources',
  tags: ['Resources'],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateResourceSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Create a persisted resource',
      content: {
        'application/json': {
          schema: ResourceSchema
        }
      }
    }
  }
})

const updateResourceRoute = createRoute({
  method: 'patch',
  path: '/resources/{id}',
  tags: ['Resources'],
  request: {
    params: ResourceParamsSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateResourceSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Update a persisted resource',
      content: {
        'application/json': {
          schema: ResourceSchema
        }
      }
    },
    404: {
      description: 'Resource not found'
    }
  }
})

const deleteResourceRoute = createRoute({
  method: 'delete',
  path: '/resources/{id}',
  tags: ['Resources'],
  request: {
    params: ResourceParamsSchema
  },
  responses: {
    204: {
      description: 'Remove a persisted resource'
    }
  }
})

const toResourceResponse = (resource: {
  id: number
  title: string
  description: string
  resourceType: string
  createdAt: Date
}) => ({
  id: resource.id,
  title: resource.title,
  description: resource.description,
  resourceType: resource.resourceType,
  createdAt: resource.createdAt.toISOString()
})

const defaultCorsOrigins = ['http://localhost:4173', 'http://localhost:5173']
const configuredCorsOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const openApiDocumentConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Cyfor Workshop API',
    version: '1.0.0',
    description: 'Workshop starter API built with Hono, Prisma, and SQLite.'
  }
}

export const app = new OpenAPIHono()

app.use('*', cors({
  origin: configuredCorsOrigins?.length ? configuredCorsOrigins : defaultCorsOrigins
}))

app.doc('/openapi.json', openApiDocumentConfig)

app.openapi(rootRoute, (c) => {
  return c.json({
    message: 'Cyfor workshop API',
    openapi: '/openapi.json'
  }, 200)
})

app.openapi(healthRoute, (c) => {
  return c.json({
    status: 'ok'
  }, 200)
})

app.openapi(listResourcesRoute, async (c) => {
  const resources = await prisma.resource.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return c.json({
    resources: resources.map(toResourceResponse)
  }, 200)
})

app.openapi(createResourceRoute, async (c) => {
  const { title, description, resourceType } = c.req.valid('json')
  const resource = await prisma.resource.create({
    data: {
      title,
      description,
      resourceType
    }
  })

  return c.json(toResourceResponse(resource), 201)
})

app.openapi(updateResourceRoute, async (c) => {
  const { id } = c.req.valid('param')
  const updates = c.req.valid('json')

  const existing = await prisma.resource.findUnique({ where: { id } })
  if (!existing) {
    return c.body(null, 404)
  }

  const resource = await prisma.resource.update({
    where: { id },
    data: updates
  })

  return c.json(toResourceResponse(resource), 200)
})

app.openapi(deleteResourceRoute, async (c) => {
  const { id } = c.req.valid('param')

  await prisma.resource.deleteMany({
    where: {
      id
    }
  })

  return c.body(null, 204)
})

export type AppType = typeof app
