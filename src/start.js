import {MongoClient, ObjectId} from 'mongodb'
import express from 'express'
import bodyParser from 'body-parser'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'
import cors from 'cors'

const URL = 'http://localhost'
const PORT = 3001
const MONGO_URL = 'mongodb://localhost:27017/employee_onboarding'

const prepare = (o) => {
 
  return o
}

export const start = async () => {
  try {
    const db = await MongoClient.connect(MONGO_URL)

    const Posts = db.collection('posts')
    const Comments = db.collection('comments')
    const UserDetails = db.collection('jobs_applied')

    const typeDefs = [`
      type Query {
        post(_id: String): Post
        posts: [Post]
        comment(_id: String): Comment
        details(email: String): Detail
        progress: [Progress]
      }

      type Post {
        _id: String
        title: String
        content: String
        comments: [Comment]
      }

      type Comment {
        _id: String
        postId: String
        content: String
        post: Post
      }

      type Detail {
        _id: String
        user_name: String,
        email: String,
        password: String,
        first_name: String,
        last_name: String,
        jobid: String,
        designation : String,
        skill: String,
        location: String,
        progressDetails : [Progress]
     }

     type Progress{
      roundType: String, 
			status: String,
			feedback: String,
			result: String,
      date: String,
      details : Detail
     }

      type Mutation {
        createPost(title: String, content: String): Post
        createComment(postId: String, content: String): Comment
        createDetails(user_name: String, email: String, password: String): Detail
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `];

    const resolvers = {
      Query: {
        post: async (root, {_id}) => {
          return prepare(await Posts.findOne(ObjectId(_id)))
        },
        posts: async () => {
          return (await Posts.find({}).toArray()).map(prepare)
        },
        comment: async (root, {_id}) => {
          return prepare(await Comments.findOne(ObjectId(_id)))
        },
        details: async (root, {email}) => {
          return (await UserDetails.findOne({"email" :email}))
        },
        progress: async (root, {email}) => {
          return (await UserDetails.find({}).toArray()).map(prepare)
        },
      },
      Post: {
        comments: async ({_id}) => {
          return (await Comments.find({postId: _id}).toArray()).map(prepare)
        }
      },
      Comment: {
        post: async ({postId}) => {
          return prepare(await Posts.findOne(ObjectId(postId)))
        }
      },
      Mutation: {
        createPost: async (root, args, context, info) => {
          const res = await Posts.insert(args)
          return prepare(await Posts.findOne({_id: res.insertedIds[1]}))
        },
        createComment: async (root, args) => {
          const res = await Comments.insert(args)
          return prepare(await Comments.findOne({_id: res.insertedIds[1]}))
        },
        createDetails: async (root, args) => {
          const res = await UserDetails.insert(args)
          console.log(res)
          return prepare(await UserDetails.findOne({_id: res.insertedIds[1]}))
        },
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    })

    const app = express()

    app.use(cors())

    app.use('/graphql', bodyParser.json(), graphqlExpress({schema}))

    const homePath = '/graphiql'

    app.use(homePath, graphiqlExpress({
      endpointURL: '/graphql'
    }))

    app.listen(PORT, () => {
      console.log(`Visit ${URL}:${PORT}${homePath}`)
    })

  } catch (e) {
    console.log(e)
  }

}
