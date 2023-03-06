import axios from "axios";
import { Router } from "express";
import platformAPIClient from "../services/platformAPIClient";
import "../types/session";
import { Contribution } from '../types/contribution';
import processRepayment from "../services/processRepayments";

export default function mountRepaymentsEndpoints(router: Router) {
    // handle the incomplete payment
    router.post('/incomplete', async (req, res) => {
        const payment = req.body.payment;
        const paymentId = payment.identifier;
        const txid = payment.transaction && payment.transaction.txid;
        const txURL = payment.transaction && payment.transaction._link;
        console.log("txid: ", txid, "txURL: ", txURL);

        // find the incomplete order
        const app = req.app;
        const repaymentCollection = app.locals.u2a_repaymentCollection;
        const repayment = await repaymentCollection.findOne({ pi_payment_id: paymentId });

        // order doesn't exist 
        if (!repayment) {
            return res.status(400).json({ message: "Loan repayment not found" });
        }

        // check the transaction on the Pi blockchain
        const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL);
        const paymentIdOnBlock = horizonResponse.data.memo;

        // and check other data as well e.g. amount
        if (paymentIdOnBlock !== repayment.pi_payment_id) {
            return res.status(400).json({ message: "Payment id doesn't match." });
        }

        // mark the order as paid
        await repaymentCollection.updateOne({ pi_payment_id: paymentId }, { $set: { txid, paid: true } });

        // let Pi Servers know that the payment is completed
        await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });
        return res.status(200).json({ message: `Handled the incomplete payment ${paymentId}` });
    });

    router.post('/approve', async (req, res) => {
        if (!req.session.currentUser) {
            return res.status(401).json({ error: 'unauthorized', message: "User needs to sign in first" });
        }

        const app = req.app;

        const paymentId = req.body.paymentId;
        const currentPayment = await platformAPIClient.get(`/v2/payments/${paymentId}`);
        const repaymentCollection = app.locals.u2a_repaymentCollection;

        await repaymentCollection.insertOne({
            pi_payment_id: paymentId,
            loan_id: currentPayment.data.metadata.loanId,
            amount: currentPayment.data.amount,
            txid: null,
            paid: false,
            cancelled: false,
            created_at: new Date(),
        });

        await platformAPIClient.post(`/v2/payments/${paymentId}/approve`);
        return res.status(200).json({ message: `Approved the payment ${paymentId}` });
    });

    router.post('/complete', async (req, res) => {
        const app = req.app;
        const paymentId = req.body.paymentId;
        const txid = req.body.txid;
        const loanId = req.body.loanId;
        const amount = req.body.amount;

        const repaymentCollection = app.locals.u2a_repaymentCollection;
        const contributionCollection = app.locals.contributionCollection;
        const paymentCollection = app.locals.paymentCollection;
        /* 
          implement your logic here
          e.g. verify the transaction, deliver the item to the user, etc...
        */

        await repaymentCollection.updateOne({ pi_payment_id: paymentId }, { $set: { txid: txid, paid: true, } });

        try {
            const payment = await paymentCollection.findOne({ memo: loanId });
            if (payment) {
                console.log(`Found matching loan payment ${payment}`);
                const updatedLoan = await paymentCollection.findOneAndUpdate(
                    { memo: loanId },
                    { $set: { repaid: true } },
                    // { returnOriginal: false } was deprecated
                    { returnDocument: "after" }
                );
            } else {
                console.log(`Loan payment ${payment} not found.`);
            }
        } catch (err) {
            console.error(err);
        }

        // let Pi server know that the payment is completed
        await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });

        // pay out each lender that contributed to the loan
        try {
            const contributions: Contribution[] = await contributionCollection.find().toArray();
            const filteredContribs = contributions.filter(contribution => contribution.loan_id === loanId);
            filteredContribs.forEach(filteredContrib => {
                console.log("Repaying lender ", filteredContrib.lender);
                processRepayment(app.locals.db, filteredContrib.lender, filteredContrib.amount, loanId, { productId: "apple-pie-1" });
            });
        } catch (err) {
            console.error(err);
        }

        return res.status(200).json({ message: `Completed the repayment ${paymentId}` });
    });

    // handle the cancelled payment
    router.post('/cancelled_payment', async (req, res) => {
        const app = req.app;

        const paymentId = req.body.paymentId;
        const repaymentCollection = app.locals.u2a_repaymentCollection;

        /*
          implement your logic here
          e.g. mark the order record to cancelled, etc...
        */

        await repaymentCollection.updateOne({ pi_payment_id: paymentId }, { $set: { cancelled: true } });
        return res.status(200).json({ message: `Cancelled the payment ${paymentId}` });
    });


}