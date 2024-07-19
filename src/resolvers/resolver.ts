import { DateTimeResolver } from 'graphql-scalars'
import { prisma, context } from '../context'
import { APP_SECRET, getUserId } from '../utils/utils'
import { compare, hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { CONSTANT } from '../constants/constant'

export const resolvers = {
  Query: {
    allUsers: (_parent, _args, context) => {
      return prisma.user.findMany()
    },
    postById: (_parent, args: { id: number }, context) => {
      return prisma.post.findUnique({
        where: { id: args.id || undefined },
      })
    },
    feed: (
      _parent,
      args: {
        searchString: string
        skip: number
        take: number
        orderBy: PostOrderByUpdatedAtInput
      },
      context,
    ) => {
      const or = args.searchString
        ? {
          OR: [
            { title: { contains: args.searchString } },
            { content: { contains: args.searchString } },
          ],
        }
        : {}

      return prisma.post.findMany({
        where: {
          published: true,
          ...or,
        },
        take: args?.take,
        skip: args?.skip,
        orderBy: args?.orderBy,
      })
    },
    draftsByUser: (
      _parent,
      args: { userUniqueInput: UserUniqueInput },
      context,
    ) => {
      return prisma.user
        .findUnique({
          where: {
            id: args.userUniqueInput.id || undefined,
            email: args.userUniqueInput.email || undefined,
          },
        })
        .posts({
          where: {
            published: false,
          },
        })
    },
  },
  DateTime: DateTimeResolver,
  Post: {
    author: (parent, _args, context) => {
      return prisma.post
        .findUnique({
          where: { id: parent?.id },
        })
        .author()
    },
  },
  User: {
    posts: (parent, _args, context) => {
      return prisma.user
        .findUnique({
          where: { id: parent?.id },
        })
        .posts()
    },
  },
}

enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

interface PostOrderByUpdatedAtInput {
  updatedAt: SortOrder
}

interface UserUniqueInput {
  id?: number
  email?: string
}

interface PostCreateInput {
  title: string
  content?: string
}

interface UserCreateInput {
  email: string
  password: string
  name?: string
  posts?: PostCreateInput[]
}

interface RoomCreateInput {
  roomName: string
  participants: [number]
}

interface UserSignInInput {
  email: string
  password: string
}

interface AddParticipantInput {
  roomId: number
  participants: [number]
}

interface AddMessageInput {
  roomId: number
  message: string
}