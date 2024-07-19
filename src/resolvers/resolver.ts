import { DateTimeResolver } from 'graphql-scalars'
import { prisma, context } from '../context'
import { APP_SECRET, getUserId } from '../utils/utils'
import { compare, hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { CONSTANT } from '../constants/constant'

export const resolvers = {
  Query: {
    allUsers: async (_parent, _args, context) => {
      return await prisma.user.findMany()
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
      console.log(args)
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
          published: false,
          ...or,
        },
        take: args?.take,
        skip: args?.skip,
        orderBy: args?.orderBy,
      })
    },
    // draftsByUser: (
    //   _parent,
    //   args: { userUniqueInput: UserUniqueInput },
    //   context,
    // ) => {
    //   return prisma.user
    //     .findUnique({
    //       where: {
    //         id: args.userUniqueInput.id || undefined,
    //         email: args.userUniqueInput.email || undefined,
    //       },
    //     })
    //     .posts({
    //       where: {
    //         published: false,
    //       },
    //     })
    // },
    search: async (
      _parent,
      args: { contains: string },
      context,
    ) => {
      console.log(args)
      const or = args.contains
        ? {
          OR: [
            { name: { contains: args.contains } },
          ],
        }
        : {}

      const orPost = args.contains
        ? {
          OR: [
            { title: { contains: args.contains } },
            { content: { contains: args.contains } },
          ],
        }
        : {}

      const res = await prisma.post.findMany({
        where: {
          published: false,
          ...orPost,
        },
      })

      const users = await prisma.user.findMany({
        where: {
          createdAt: { gte: new Date('2024-07-01') },
          ...or,
        },
      })
      console.log(users)
      // return 'Post'
      return [...users, ...res]
    },
  },
  SearchResult: {
    __resolveType(obj, contextValue, info) {
      // console.log(`_______inside_${JSON.stringify(obj)}`)
      // Only Author has a name field
      if (obj.name) {
        return 'Author';
      }
      // Only Posts has a title field
      if (obj.title) {
        return 'UserPosts';
      }
      return null; // GraphQLError is thrown
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