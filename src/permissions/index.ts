import { rule, shield } from 'graphql-shield'
import { getUserId } from '../utils/utils'
import { Context, prisma } from '../context'

const rules = {
  isAuthenticatedUser: rule()(async (_parent, _args, context: Context) => {
    console.log('i_am_here')
    const userId = getUserId(context)
    context.userId = userId;
    const userData = await prisma.user
      .findFirst({
        where: {
          id: Number(userId)
        },
      })
    return Boolean(userId)
  }),
  isPostOwner: rule()(async (_parent, _args, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.post
      .findUnique({
        where: {
          id: Number(_args.id),
        },
      })
      .author()
    return userId === author.id
  }),
  isRoomMember: rule()(async (_parent, _args, context: Context) => {
    const {body} =context.req;
    const userId = getUserId(context)
    const participant = await prisma.participant
      .findFirst({
        where: {
          roomId: Number(body.variables?.data?.roomId),
          userId: Number(userId)
        },
      })
    return !!participant
  }),
}

export const permissions = shield({
  Query: {
    // me: rules.isAuthenticatedUser,
    draftsByUser: rules.isAuthenticatedUser,
    postById: rules.isAuthenticatedUser,
  },
  Mutation: {
    createDraft: rules.isAuthenticatedUser,
    deletePost: rules.isPostOwner,
    incrementPostViewCount: rules.isAuthenticatedUser,
    togglePublishPost: rules.isPostOwner,
    sendMessage: rules.isRoomMember,
    createRoom: rules.isAuthenticatedUser,
  },
})
