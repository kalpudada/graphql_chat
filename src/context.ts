import { PrismaClient } from '@prisma/client'
import { PubSub } from 'graphql-subscriptions'
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

const pubsub = new PubSub()

export interface Context {
  prisma: PrismaClient
  pubsub: PubSub
}

export const context: Context = {
  prisma: prisma,
  pubsub: pubsub,
}
