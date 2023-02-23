import { Router } from "express";
import "../types/session";

export default function mountSubmissionsEndpoints(router: Router) {
    // this is defo broken
    router.post('/submitText', async (req, res) => {
        if (!req.session.currentUser) {
            return res.status(401).json({ error: 'unauthorized', message: "User needs to sign in first" });
        }
        const app = req.app;

        const { loanAmount, businessDescription } = req.body;

        const submissionCollection = app.locals.submissionCollection;

        // really, the unique key should be the uid,
        // but for development purposes I want to be able to submit more than one loan request
        await submissionCollection.insertOne({
            user: req.session.currentUser.uid,
            amount: loanAmount,
            memo: businessDescription,
            amount_raised: 0,
        });
        res.status(200).send('Submission successful!');
    })

    router.get('/submissions', async (req, res) => {
        const app = req.app;
        const submissionCollection = app.locals.submissionCollection;
        const submissions = await submissionCollection.find().toArray();
        res.send(submissions);
    })
}