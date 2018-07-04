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
    const UserDetails = db.collection('jobs_applied')
    const Feedbacks = db.collection('feedback')

    const typeDefs = [`
      type Query {
       details(email: String): Detail
      }
      type Feedback{
        email: String!,
        question1: Int,
        question2: Int,
        question3: Int,
        question4: Int,
        comment: String
      }
      type Detail {
        _id: String
        user_name: String,
        email: String,
        password: String,
        first_name: String,
        last_name: String,
        jobInfo: [JobInfo]
        
     }
     type JobInfo{
      jobId: String,
      designation : String,
      skill: String,
      location: String,
      hiringManager: String,
      hiringHr: String,
      progressDetails : [Progress],
      detail : [Detail]
     }

     type Progress{
      roundType: String, 
			status: String,
			feedback: String,
			result: String,
      date: String,
      jobInfo : JobInfo
     }

      type Mutation {
        createDetails(user_name: String, email: String, password: String): Detail
        createFeedbacks(email: String,question1 : Int,question2 : Int,question3 : Int,question4 : Int,comment : String) : Feedback
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `];

    const resolvers = {
      Query: {
        details: async (root, {email}) => {
          return (await UserDetails.findOne({"email" :email}))
        },
      },
      Mutation: {
       createDetails: async (root, args) => {
          const res = await UserDetails.insert(args)
          console.log(res)
          return prepare(await UserDetails.findOne({_id: res.insertedIds[1]}))
        },
        createFeedbacks: async (root, args) => {
          const res = await Feedbacks.insert(args)
          console.log(res)
          return prepare(await Feedbacks.findOne({_id: res.insertedIds[1]}))
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
