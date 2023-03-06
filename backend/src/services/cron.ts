import CronJob from 'node-cron';
import { MongoClient, Collection, Db } from 'mongodb';
import env from '../environments';
import processRefund from './processRefunds';

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

        const loans = await db.collection('loans').find().toArray();
        const currentDate = new Date();
        for (const loan of loans) {
            const created_at = new Date(loan.created_at);
            const diff = currentDate.getTime() - created_at.getTime();
            const diffInDays = diff / (1000 * 60 * 60 * 24);
            if (diffInDays >= 30 && !loan.expired) {
                await db.collection('loans').updateOne(
                    { _id: loan._id },
                    { $set: { expired: true } }
                );
                console.log(`Loan ${loan._id} has expired`);

                giveOutRefunds(loan._id.toString(), db);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

async function giveOutRefunds(loanId: string, db: Db): Promise<void> {
    const contributionCollection = db.collection('contributions');
    const contributions = await contributionCollection.find({ loan_id: loanId }).toArray();
    const uids = new Set(contributions.map((contribution) => contribution.lender));
    for (const uid in uids) {
        const amountForLender = contributions.reduce((total, contribution) => {
            if (contribution.lender === uid) {
                return total + contribution.amount;
            }
            return total;
        }, 0);
        await processRefund(db, uid, amountForLender, `Refund from loan ${loanId}`, {});
    }
}

const job = CronJob.schedule('0 0 * * *', () => {
    console.log('running a task every day at midnight');
    checkLoanExpiry();
});

export default job;