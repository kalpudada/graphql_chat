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
  userId: number
}

export const context: Context = {
  prisma: prisma,
  pubsub: pubsub,
  req: request,
  userId: 0
}

export function createContext(req: any) {
  return {
    ...req,
    prisma,
    pubsub,
    userId: 0
  }
}
