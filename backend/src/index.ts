import fs from 'fs';
import path from 'path';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import logger from 'morgan';
import MongoStore from 'connect-mongo';
import { MongoClient } from 'mongodb';
import env from './environments';
import mountPaymentsEndpoints from './handlers/payments';
import mountUserEndpoints from './handlers/users';
import mountLoansEndpoints from './handlers/loans';
import mountRepaymentsEndpoints from './handlers/repayments';
import job from './services/cron';

// We must import typedefs for ts-node-dev to pick them up when they change (even though tsc would supposedly
// have no problem here)
// https://stackoverflow.com/questions/65108033/property-user-does-not-exist-on-type-session-partialsessiondata#comment125163548_65381085
import "./types/session";

const dbName = env.mongo_db_name;
// const mongoUri = `mongodb://${env.mongo_host}/${dbName}`;
const mongoUri = `mongodb+srv://${env.mongo_user}:${env.mongo_password}@${env.mongo_host}/${dbName}?retryWrites=true&w=majority`;

const mongoClientOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: "admin",
  auth: {
    username: env.mongo_user,
    password: env.mongo_password,
  },
}


//
// I. Initialize and set up the express app and various middlewares and packages:
//

const app: express.Application = express();

// Log requests to the console in a compact format:
app.use(logger('dev'));

// Full log of all requests to /log/access.log:
app.use(logger('common', {
  stream: fs.createWriteStream(path.join(__dirname, '..', 'log', 'access.log'), { flags: 'a' }),
}));

// Enable response bodies to be sent as JSON:
app.use(express.json())

// Handle CORS:
app.use(cors({
  origin: env.frontend_url,
  credentials: true
}));

// Handle cookies 🍪
app.use(cookieParser());

// Use sessions:
app.use(session({
  secret: env.session_secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    mongoOptions: mongoClientOptions,
    dbName: dbName,
    collectionName: 'user_sessions'
  }),
}));

// start the cron job
job.start();

//
// II. Mount app endpoints:
//

// Payments endpoint under /payments:
const paymentsRouter = express.Router();
mountPaymentsEndpoints(paymentsRouter);
app.use('/payments', paymentsRouter);

// User endpoints (e.g signin, signout) under /user:
const userRouter = express.Router();
mountUserEndpoints(userRouter);
app.use('/user', userRouter);

// Loans endpoint under /submissions
const loansRouter = express.Router();
mountLoansEndpoints(loansRouter);
app.use('/loans', loansRouter);

// Repayments endpoint under /repayments:
const repaymentsRouter = express.Router();
mountRepaymentsEndpoints(repaymentsRouter);
app.use('/repayments', repaymentsRouter);


// Hello World page to check everything works:
app.get('/', async (_, res) => {
  res.status(200).send({ message: "Hello, World!" });
});


// III. Boot up the app:

app.listen(8000, async () => {
  try {
    const client = await MongoClient.connect(mongoUri, mongoClientOptions)
    const db = client.db(dbName);
    app.locals.db = db;
    app.locals.userCollection = db.collection('users');
    app.locals.contributionCollection = db.collection('contributions');
    app.locals.loanCollection = db.collection('loans');
    app.locals.paymentCollection = db.collection('payments');
    app.locals.u2a_repaymentCollection = db.collection('u2a-repayments');
    app.locals.a2u_repaymentCollection = db.collection('a2u-repayments');
    app.locals.refundCollection = db.collection('refunds');
    console.log('Connected to MongoDB on: ', mongoUri)
  } catch (err) {
    console.error('Connection to MongoDB failed: ', err)
  }

  console.log('App platform demo app - Backend listening on port 8000!');
  console.log(`CORS config: configured to respond to a frontend hosted on ${env.frontend_url}`);
});