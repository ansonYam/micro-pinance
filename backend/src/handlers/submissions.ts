import { Router } from "express";
import "../types/session";
import { Submission } from "../types/submission";

export default function mountSubmissionsEndpoints(router: Router) {
    // this is defo broken
    router.post('/submitText', async (req, res) => {
        if (!req.session.currentUser) {
            return res.status(401).json({ error: 'unauthorized', message: "User needs to sign in first" });
        }
        const app = req.app;

        const { loanAmount, businessDescription } = req.body;

        // Parse loanAmount value as a number
        const amount = parseFloat(loanAmount);

        // Check if amount is a valid number
        if (isNaN(amount)) {
            return res.status(400).json({ error: 'invalid_data', message: "Loan amount must be a valid number" });
        }

        const submissionCollection = app.locals.submissionCollection;

        // really, the unique key should be the uid,
        // but for development purposes I want to be able to submit more than one loan request
        await submissionCollection.insertOne({
            user: req.session.currentUser.uid,
            amount: amount,
            memo: businessDescription,
            amount_raised: 0,
            fully_funded: false,
            created_at: new Date(),
            expired: false,
        });
        res.status(200).send('Submission successful!');
    })

    // TODO: filter before pulling in the entire collection
    router.get('/submissions', async (req, res) => {
        const app = req.app;
        const submissionCollection = app.locals.submissionCollection;
        const submissions: Submission[] = await submissionCollection.find().toArray();
        const filteredSubmissions = submissions.filter(submission => {
            if (submission.amount_raised === submission.amount) {
                submission.fully_funded = true;
                return false;
            }
            return true;
        });
        // console.log(filteredSubmissions);
        res.send(filteredSubmissions);
    })
}