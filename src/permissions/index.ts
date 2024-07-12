import { rule, shield } from 'graphql-shield'
import { getUserId } from '../utils'
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
    console.log(`userData_${JSON.stringify(userData)}`)
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
    console.log(`i_am_here_inrom_member_`)
    const {body} =context.req;
    console.log(`i_am_here_inrom_member_ ${JSON.stringify(body)}`)
    const userId = getUserId(context)
    console.log(`i_am_here_inrom_member_${userId}`)
    const participant = await prisma.participant
      .findFirst({
        where: {
          roomId: Number(body.variables?.data?.roomId),
          userId: Number(userId)
        },
      })
    console.log('i_am_here_inrom_member_2')
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
