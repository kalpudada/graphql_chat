import { DateTimeResolver } from 'graphql-scalars'
import { prisma, context } from './context'
import { APP_SECRET, getUserId } from './utils'
import { compare, hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

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
  Mutation: {
    signupUser: async (
      _parent,
      args: { data: UserCreateInput },
      context,
    ) => {
      const hashedPassword = await hash(args.data.password, 10)
      const postData = args.data.posts?.map((post) => {
        return { title: post.title, content: post.content || undefined }
      })
      const user = await prisma.user.create({
        data: {
          name: args.data.name,
          email: args.data.email,
          password: hashedPassword,
          posts: {
            create: postData,
          },
        },
      })
      console.log(user);
      return { token: sign({ userId: user.id }, APP_SECRET), ...user };
    },
    login: async (
      _parent,
      args: UserSignInInput, // { email: string, password: string },
      context,
    ) => {
      const user = await context.prisma.user.findUnique({
        where: {
          email: args.email,
        },
      })
      if (!user) {
        throw new Error(`No user found for email: ${args.email}`)
      }
      const passwordValid = await compare(args.password, user.password)
      if (!passwordValid) {
        throw new Error('Invalid password')
      }
      return {
        token: sign({ userId: user.id }, APP_SECRET),
        ...user,
      }
    },
    createDraft: (
      _parent,
      args: { data: PostCreateInput; authorEmail: string },
      context,
    ) => {
      const userId = getUserId(context)
      return prisma.post.create({
        data: {
          title: args.data.title,
          content: args.data.content,
          authorId: userId
          // author: {
          //   connect: { email: args.authorEmail },
          // },
        },
      }).then((response) => {
        console.log(response);
        context.pubsub.publish('POST_CREATED', {
          postCreated: response,
        });
        return response
      })
      // console.log(response);


      // return response
    },
    togglePublishPost: async (
      _parent,
      args: { id: number },
      context,
    ) => {
      try {
        const post = await prisma.post.findUnique({
          where: { id: args.id || undefined },
          select: {
            published: true,
          },
        })

        return prisma.post.update({
          where: { id: args.id || undefined },
          data: { published: !post?.published },
        })
      } catch (error) {
        throw new Error(
          `Post with ID ${args.id} does not exist in the database.`,
        )
      }
    },
    incrementPostViewCount: (
      _parent,
      args: { id: number },
      context,
    ) => {
      return prisma.post.update({
        where: { id: args.id || undefined },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      })
    },
    deletePost: (_parent, args: { id: number }, context) => {
      return prisma.post.delete({
        where: { id: args.id },
      })
    },
    createRoom: (_parent, args: { data: RoomCreateInput }, context) => {
      const participantData = args.data.participants.map((p) => {
        return { userId: p }
      })
      return prisma.room.create({
        data: {
          roomName: args.data.roomName,
          createdBy: 1,
          Participant: {
            create: participantData
          }
        }
      })
      // return prisma.post.delete({
      //   where: { id: args.id },
      // })
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
  Subscription: {
    // hello: {
    //   subscribe: async function* () {
    //     for await (const word of ['Hello', 'Bonjour', 'Ciao']) {
    //       yield { hello: word };
    //     }
    //   },
    // },
    postCreated: {
      // More on pubsub below
      subscribe: () => context.pubsub.asyncIterator(['POST_CREATED']),
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