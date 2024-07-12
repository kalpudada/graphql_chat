// import { createYoga } from 'graphql-yoga'
// import { createServer } from 'node:http'
// import { typeDefs } from './schema'
import { resolvers } from './resolver'
import { Context, context, createContext } from './context'
import { getUserId } from './utils';
import { permissions } from './permissions'

import { ApolloServer } from '@apollo/server';
import { applyMiddleware } from 'graphql-middleware'
import { GraphQLError } from 'graphql';
// import { ApolloServer } from 'apollo-server'
import { makeExecutableSchema } from '@graphql-tools/schema';
import { expressMiddleware } from '@apollo/server/express4';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { resolve, dirname } from "path";
import { readFileSync } from "fs";
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import gql from 'graphql-tag';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
const PORT = process.env.PORT || 4000
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);


const typeDefs = gql(
  readFileSync(resolve("src", "schema.graphql"), {
    encoding: "utf-8",
  })
);
// this is for crud apis only
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
// });
// server.listen({ port: 4000 }).then((serData) => console.log(`🚀 Query endpoint ready at ${serData.url}`));



const app = express()
const httpServer = createServer(app)

const schema = makeExecutableSchema({ typeDefs, resolvers });
const schemaWithMiddleware = applyMiddleware(schema, permissions)
async function start() {
  /** Create WS Server */
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })

  /** hand-in created schema and have the WS Server start listening */
  const serverCleanup = useServer({ schema, context }, wsServer)

  // Set up ApolloServer.
  const server = new ApolloServer<Context>({
    schema: schemaWithMiddleware,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })

  await server.start()
  app.use('/graphql', cors<cors.CorsRequest>(), bodyParser.json(), expressMiddleware(server, {
    context: createContext
    //  async ({ req, res }) => {
    //   // get the user token from the headers
    //   // const token = req.headers.authorization || '';

    //   // try to retrieve a user with the token
    //   const user = getUserId(req);
    //   if (!user)
    //     throw new GraphQLError('User is not authenticated', {
    //       extensions: {
    //         code: 'UNAUTHENTICATED',
    //         http: { status: 401 },
    //       },
    //     });
    //   return { user, ...context };
    // },
  }))
  // context }));

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
    console.log(`⏰ Subscriptions ready at http://localhost:${PORT}/graphql`)
    console.log(
      `⭐️ See sample queries: http://pris.ly/e/ts/graphql-subscriptions#using-the-graphql-api`,
    )
  })
}

start()
