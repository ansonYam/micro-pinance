import { Router } from "express";

export default function mountSubmissionsEndpoints(router: Router) {
    router.post('/submitText', async (req, res) => {
        const text = req.body.text;
        const myTxtObj = { text: text };

        const app = req.app;
        const submissionCollection = app.locals.submissionCollection;

        try {
            await submissionCollection.insertOne(myTxtObj);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    })

    router.get('/submissions', async (req, res) => {
        const app = req.app;
        const submissionCollection = app.locals.submissionCollection;
        const submissions = await submissionCollection.find().toArray();
        res.send(submissions);
    })
}