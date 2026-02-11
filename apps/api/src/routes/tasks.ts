import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { PublicKey } from '@solana/web3.js'
import { DISCRIMINATOR, decodeTask, PROGRAM_ID } from '@verbitto/program'
import { getConnection } from '../lib/solana.js'
import { AddressParamSchema, ErrorSchema } from '../schemas/common.js'
import { TaskResponseSchema, TasksListResponseSchema, TasksQuerySchema } from '../schemas/task.js'

const app = new OpenAPIHono()

function serializeTask(task: ReturnType<typeof decodeTask>) {
  return {
    address: task.publicKey.toBase58(),
    title: task.title,
    status: task.status,
    creator: task.creator.toBase58(),
    agent: task.agent.toBase58(),
    bountyLamports: task.bountyLamports.toString(),
    bountySol: Number(task.bountyLamports) / 1e9,
    deadline: Number(task.deadline),
    deadlineIso: new Date(Number(task.deadline) * 1000).toISOString(),
    createdAt: Number(task.createdAt),
    reputationReward: Number(task.reputationReward),
    descriptionHash: Buffer.from(task.descriptionHash).toString('hex'),
    deliverableHash: Buffer.from(task.deliverableHash).toString('hex'),
    taskIndex: task.taskIndex.toString(),
    rejectionCount: task.rejectionCount,
  }
}

// List all tasks
const listTasksRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Tasks'],
  summary: 'List all tasks',
  description: 'Get a paginated list of tasks with optional filters',
  request: {
    query: TasksQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TasksListResponseSchema,
        },
      },
      description: 'List of tasks',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

// @ts-expect-error - Hono OpenAPI type inference limitation with multiple status codes
app.openapi(listTasksRoute, async (c) => {
  const connection = getConnection()
  const query = c.req.query()

  try {
    const statusFilter = query.status
    const minBountyStr = query.minBounty
    const creatorStr = query.creator
    const agentStr = query.agent
    const activeOnly = query.active === 'true'
    const limit = Math.min(parseInt(query.limit ?? '100', 10), 500)
    const offset = parseInt(query.offset ?? '0', 10)

    // Build RPC-level memcmp filters for efficiency
    const rpcFilters: Array<{
      memcmp: { offset: number; bytes: string; encoding?: 'base58' | 'base64' }
    }> = [
      {
        memcmp: {
          offset: 0,
          bytes: DISCRIMINATOR.Task.toString('base64'),
          encoding: 'base64' as const,
        },
      },
    ]

    // Status byte is at offset 56 (disc:8 + creator:32 + taskIndex:8 + bounty:8)
    // Map status string to on-chain enum index for memcmp
    const STATUS_BYTE_MAP: Record<string, number> = {
      Open: 0,
      Claimed: 1,
      Submitted: 2,
      Approved: 3,
      Rejected: 4,
      Cancelled: 5,
      Expired: 6,
      Disputed: 7,
    }
    if (statusFilter && statusFilter in STATUS_BYTE_MAP) {
      rpcFilters.push({
        memcmp: {
          offset: 56,
          bytes: Buffer.from([STATUS_BYTE_MAP[statusFilter]]).toString('base64'),
          encoding: 'base64' as const,
        },
      })
    }

    // Creator pubkey is at offset 8 (after discriminator)
    if (creatorStr) {
      try {
        const creatorKey = new PublicKey(creatorStr)
        rpcFilters.push({
          memcmp: {
            offset: 8,
            bytes: creatorKey.toBase58(),
          },
        })
      } catch {
        /* invalid pubkey, skip filter */
      }
    }

    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: rpcFilters,
    })

    let tasks = accounts
      .map(({ pubkey, account }) => {
        try {
          return decodeTask(pubkey, Buffer.from(account.data))
        } catch {
          return null
        }
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => Number(b.createdAt - a.createdAt))

    // Client-side filters for fields not covered by memcmp
    if (minBountyStr) {
      const minLamports = BigInt(Math.floor(parseFloat(minBountyStr) * 1e9))
      tasks = tasks.filter((t) => t.bountyLamports >= minLamports)
    }
    if (agentStr) {
      try {
        const agentKey = new PublicKey(agentStr)
        tasks = tasks.filter((t) => t.agent.equals(agentKey))
      } catch {
        /* invalid pubkey, skip filter */
      }
    }
    if (activeOnly) {
      const now = BigInt(Math.floor(Date.now() / 1000))
      tasks = tasks.filter((t) => t.deadline > now)
    }

    const total = tasks.length
    const paginatedTasks = tasks.slice(offset, offset + limit)

    return c.json({
      tasks: paginatedTasks.map(serializeTask),
      total,
      limit,
      offset,
    })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500)
  }
})

// Get single task by address
const getTaskRoute = createRoute({
  method: 'get',
  path: '/{address}',
  tags: ['Tasks'],
  summary: 'Get task by address',
  description: 'Retrieve a single task by its PDA address',
  request: {
    params: AddressParamSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TaskResponseSchema,
        },
      },
      description: 'Task details',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Invalid address',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Task not found',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

// @ts-expect-error - Hono OpenAPI type inference limitation with multiple status codes
app.openapi(getTaskRoute, async (c) => {
  const { address } = c.req.valid('param')
  const connection = getConnection()

  let pubkey: PublicKey
  try {
    pubkey = new PublicKey(address)
  } catch {
    return c.json({ error: 'Invalid address' }, 400)
  }

  try {
    const info = await connection.getAccountInfo(pubkey)
    if (!info || !info.owner.equals(PROGRAM_ID)) {
      return c.json({ error: 'Task not found' }, 404)
    }

    const task = decodeTask(pubkey, Buffer.from(info.data))

    return c.json(serializeTask(task))
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500)
  }
})

export default app
