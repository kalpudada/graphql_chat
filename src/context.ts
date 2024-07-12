import { PrismaClient } from '@prisma/client'
import { PubSub } from 'graphql-subscriptions'
import { request } from 'http'
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

const pubsub = new PubSub()

export interface Context {
  prisma: PrismaClient
  pubsub: PubSub
  req: any
}

export const context: Context = {
  prisma: prisma,
  pubsub: pubsub,
  req: request
}
