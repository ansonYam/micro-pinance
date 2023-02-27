import axios from "axios";
import { Router } from "express";
import platformAPIClient from "../services/platformAPIClient";
import "../types/session";
import { ObjectId } from 'mongodb';
import { Order } from '../types/order';
import processPayment from "../services/processPayment";
import initializePiNetwork from "../services/PiNodeJS";
import { Collection, Db } from 'mongodb';

export default function mountPaymentsEndpoints(router: Router) {
  // const pi = initializePiNetwork();

  // handle the incomplete payment
  router.post('/incomplete', async (req, res) => {
    const payment = req.body.payment;
    const paymentId = payment.identifier;
    const txid = payment.transaction && payment.transaction.txid;
    const txURL = payment.transaction && payment.transaction._link;
    console.log("txid: ", txid, "txURL: ", txURL);
    /* 
      implement your logic here
      e.g. verifying the payment, delivering the item to the user, etc...

      below is a naive example
    */

    // find the incomplete order
    const app = req.app;
    const orderCollection = app.locals.orderCollection;
    const order = await orderCollection.findOne({ pi_payment_id: paymentId });

    // order doesn't exist 
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }

    // check the transaction on the Pi blockchain
    const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL);
    const paymentIdOnBlock = horizonResponse.data.memo;

    // and check other data as well e.g. amount
    if (paymentIdOnBlock !== order.pi_payment_id) {
      return res.status(400).json({ message: "Payment id doesn't match." });
    }

    // mark the order as paid
    await orderCollection.updateOne({ pi_payment_id: paymentId }, { $set: { txid, paid: true } });

    // let Pi Servers know that the payment is completed
    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });
    return res.status(200).json({ message: `Handled the incomplete payment ${paymentId}` });
  });

  // approve the current payment
  router.post('/approve', async (req, res) => {
    // this route only works in firefox, some setting in chrome interferes with my session storage
    if (!req.session.currentUser) {
      return res.status(401).json({ error: 'unauthorized', message: "User needs to sign in first" });
    }

    const app = req.app;

    const paymentId = req.body.paymentId;
    const currentPayment = await platformAPIClient.get(`/v2/payments/${paymentId}`);
    const orderCollection = app.locals.orderCollection;

    /* 
      implement your logic here 
      e.g. creating an order record, reserve an item if the quantity is limited, etc...
    */

    await orderCollection.insertOne({
      pi_payment_id: paymentId,
      product_id: currentPayment.data.metadata.borrower_id,
      amount: currentPayment.data.amount,
      lender: req.session.currentUser.uid,
      txid: null,
      recipient: currentPayment.data.metadata.loan_recipient,
      paid: false,
      cancelled: false,
      created_at: new Date(),
    });

    // let Pi Servers know that you're ready
    await platformAPIClient.post(`/v2/payments/${paymentId}/approve`);
    return res.status(200).json({ message: `Approved the payment ${paymentId}` });
  });

  // complete the current payment
  router.post('/complete', async (req, res) => {
    const app = req.app;

    const paymentId = req.body.paymentId;
    const txid = req.body.txid;
    const borrowerId = req.body.borrowerId;
    const newAmount = req.body.amount;

    const orderCollection = app.locals.orderCollection;
    const submissionCollection = app.locals.submissionCollection;
    /* 
      implement your logic here
      e.g. verify the transaction, deliver the item to the user, etc...
    */

    let payBorrowerFlag = false;
    let amount_raised = 0; // will be assigned later
    let user = "";

    await orderCollection.updateOne({ pi_payment_id: paymentId }, { $set: { txid: txid, paid: true, } });

    try {
      const submission = await submissionCollection.findOne({ _id: new ObjectId(borrowerId) });
      if (submission) {
        // console.log('submission.amount_raised: ', submission.amount_raised);

        const updatedSubmission = await submissionCollection.findOneAndUpdate(
          { _id: new ObjectId(borrowerId) },
          { $set: { amount_raised: submission.amount_raised + newAmount } },
          // { returnOriginal: false } was deprecated
          { returnDocument: "after" }
        );

        const { amount, fully_funded, _id } = updatedSubmission.value;
        amount_raised = updatedSubmission.value.amount_raised;
        user = updatedSubmission.value.user;
        console.log(`Submission ${borrowerId} updated with new amount raised ${amount_raised}.`);

        if (amount_raised === amount) {
          if (fully_funded) {
            console.log(`Borrower ${user} has already been paid out.`);
          } else {
            await submissionCollection.updateOne(
              { _id: new ObjectId(borrowerId) },
              { $set: { fully_funded: true } },
            ).then(() => {
              console.log("Payment amount: ", amount_raised, "loan recipient: ", user);
              payBorrowerFlag = true;
            });
          }
        }
      } else {
        console.log(`Submission ${borrowerId} not found.`);
      }
    } catch (err) {
      console.error(err);
    }

    // let Pi server know that the payment is completed
    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });

    if (payBorrowerFlag) {
      try {
        await processPayment(app.locals.db, user, amount_raised, `Funds from ${borrowerId}`, { productId: "apple-pie-1" });
      } catch (err) {
        console.log(err);
      }
    }

    return res.status(200).json({ message: `Completed the payment ${paymentId}` });
  });

  async function callProcessPayment(db: Db) {
    await processPayment(db, '36360451-108e-42f1-b04e-84c3a5eb7164', 1, `Funds from test payment`, { productId: "apple-pie-1" });
  }

  // handle the cancelled payment
  router.post('/cancelled_payment', async (req, res) => {
    const app = req.app;

    const paymentId = req.body.paymentId;
    const orderCollection = app.locals.orderCollection;

    /*
      implement your logic here
      e.g. mark the order record to cancelled, etc...
    */

    await orderCollection.updateOne({ pi_payment_id: paymentId }, { $set: { cancelled: true } });
    return res.status(200).json({ message: `Cancelled the payment ${paymentId}` });
  });

  // TODO: filter before pulling in the entire collection
  router.get('/matching_user', async (req, res) => {
    if (!req.session.currentUser) {
      return res.status(401).json({ error: 'unauthorized', message: "User needs to sign in first" });
    }
    const app = req.app;
    const user = req.session.currentUser.uid;

    const orderCollection = app.locals.orderCollection;

    try {
      const orders: Order[] = await orderCollection.find().toArray();
      const filteredOrders = orders.filter(order => order.lender === user);
      res.send(filteredOrders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'No matching lenders' });
    }
  });

  router.get('/matching_recipient', async (req, res) => {
    if (!req.session.currentUser) {
      return res.status(401).json({ error: 'unauthorized', message: "User needs to sign in first" });
    }
    const app = req.app;
    const user = req.session.currentUser.uid;

    const orderCollection = app.locals.orderCollection;

    try {
      const orders: Order[] = await orderCollection.find().toArray();
      const filteredOrders = orders.filter(order => order.recipient === user);
      res.send(filteredOrders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'No matching borrowers' });
    }
  });
}