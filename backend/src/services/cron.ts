import CronJob from 'node-cron';
import { MongoClient, Collection, Db } from 'mongodb';
import env from '../environments';
import processPayment from './processPayment';
import { Order } from '../types/order';

const dbName = env.mongo_db_name;
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

const client = new MongoClient(mongoUri, mongoClientOptions)

async function checkLoanExpiry() {
    try {
        await client.connect();
        const db = client.db(dbName);

        const submissions = await db.collection('submissions').find().toArray();
        const currentDate = new Date();
        for (const submission of submissions) {
            const created_at = new Date(submission.created_at);
            const diff = currentDate.getTime() - created_at.getTime();
            const diffInDays = diff / (1000 * 60 * 60 * 24);
            if (diffInDays >= 30 && !submission.expired) {
                await db.collection('submissions').updateOne(
                    { _id: submission._id },
                    { $set: { expired: true } }
                );
                console.log(`Submission ${submission._id} has expired`);

                giveOutRefunds(submission._id.toString(), db);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

async function giveOutRefunds(submissionId: string, db: Db): Promise<void> {
    const orderCollection = db.collection('orders');
    const orders = await orderCollection.find({ product_id: submissionId }).toArray();
    const uids = new Set(orders.map((order) => order.lender));
    for (const uid in uids) {
        const amountForLender = orders.reduce((total, order) => {
            if (order.lender === uid) {
                return total + order.amount;
            }
            return total;
        }, 0);
        await processPayment(db, uid, amountForLender, `Refund for ${submissionId}`, {});
    }
}

const job = CronJob.schedule('0 0 * * *', () => {
    console.log('running a task every day at midnight');
    checkLoanExpiry();
});

export default job;