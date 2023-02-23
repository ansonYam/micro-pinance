import axios from "axios";
import { Router } from "express";
import platformAPIClient from "../services/platformAPIClient";
import initializePiNetwork from "../services/PiNodeJS";
import "../types/session";

export default function mountPaymentsEndpoints(router: Router) {
  const pi = initializePiNetwork();

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
      product_id: currentPayment.data.metadata.productId,
      user: req.session.currentUser.uid,
      txid: null,
      paid: false,
      cancelled: false,
      created_at: new Date()
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
    const orderCollection = app.locals.orderCollection;

    /* 
      implement your logic here
      e.g. verify the transaction, deliver the item to the user, etc...
    */

    await orderCollection.updateOne({ pi_payment_id: paymentId }, { $set: { txid: txid, paid: true } });

    // let Pi server know that the payment is completed
    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });
    return res.status(200).json({ message: `Completed the payment ${paymentId}` });
    // update the 'amount_raised' field only once the tx has been completed
  });

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

  /** 
   * Logic for making an app-to-user payment 
   * TODO: handle incomplete payments
  */
  router.post('/make_payment', async (req, res) => {
    const app = req.app;

    // hard-coded to my wallet for now, need to read off the borrower request later
    const userUid = '36360451-108e-42f1-b04e-84c3a5eb7164';
    const paymentData = {
      amount: 1,
      memo: 'Test A2U Payment',
      metadata: { productId: 'apple-pie-1' }, // can't be blank
      uid: userUid,
    }

    const paymentsCollection = app.locals.paymentsCollection;

    try {
      const paymentId = await pi.createPayment(paymentData);
      console.log("Payment created with ID: ", paymentId);

      const result = await paymentsCollection.insertOne({
        _id: paymentId,
        uid: userUid,
        amount: paymentData.amount,
        memo: paymentData.memo,
        txid: null,
      });

      const txid = await pi.submitPayment(paymentId);
      console.log("Payment submitted with tx ID: ", txid);

      const updateResult = await paymentsCollection.updateOne({ _id: paymentId }, { $set: { txid: txid } });

      const completedPayment = await pi.completePayment(paymentId, txid);

      res.send(completedPayment);

    } catch (err) {
      console.error("Error processing payment: ", err);
    }
  });
}