import { MongoClient, Db } from 'mongodb';
import initializePiNetwork from "../services/PiNodeJS";
import { ObjectId } from 'mongodb';
import { PaymentDTO } from '../types/payment';

// Following https://github.com/pi-apps/pi-nodejs

/**
 * @param db - database connection instance
 * @param useruid - "user_uid_of_your_app"
 * @param amount - 1 (or any number)
 * @param memo - "Refund for apple pie",
 * @param metadata - {productId: "apple-pie-1"},
 */

async function processPayment(db: Db, useruid: string, amount: number, memo: string, metadata: any): Promise<any> {
    const pi = initializePiNetwork();

    // clear any incomplete payments first
    const incompletePayments: PaymentDTO[] = await pi.getIncompleteServerPayments();
    // is this line of code real or fake? TypeScript compilers hate him
    const payment = ((incompletePayments as any)['incomplete_server_payments']);

    if (Object.keys(payment).length === 0) {
        console.log("No incomplete payments.");
    } else {
        const paymentIdToBeCancelled = payment[0].identifier;
        console.log(`Found incomplete payment ${paymentIdToBeCancelled}`);
        await pi.cancelPayment(paymentIdToBeCancelled);
    }

    // make a new A2U payment
    const userUid = useruid;
    const paymentData = {
        amount: amount,
        memo: memo,
        metadata: metadata,
        uid: userUid,
    };

    const paymentsCollection = db.collection('payments');

    try {
        console.log(`Attempting to create a payment with uid ${userUid} and paymentData ${amount} ${memo} ${metadata}`);
        const paymentId = await pi.createPayment(paymentData);
        console.log("Payment created with ID: ", paymentId);

        const result = await paymentsCollection.insertOne({
            uid: userUid,
            amount: paymentData.amount,
            memo: paymentData.memo,
            payment_id: paymentId,
            txid: null,
        });

        const txid = await pi.submitPayment(paymentId);
        console.log("Payment submitted with tx ID: ", txid);

        const updateResult = await paymentsCollection.updateOne({ payment_id: paymentId }, { $set: { txid: txid } });

        const completedPayment = await pi.completePayment(paymentId, txid);

        return completedPayment;
    } catch (err) {
        console.error("Error processing payment: ", err);
    }
}

export default processPayment