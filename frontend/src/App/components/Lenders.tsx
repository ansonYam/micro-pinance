import React from 'react';

interface Props {
    viewSubmissions: () => void,
}

interface State {
    submissions: Submission[],
}

interface Submission {
    _id: string,
    text: string,
}

export default function Lenders(props: Props, state: State) {
    return (
        <section id="lenders-section">
            <h2>Lenders</h2>
            <button onClick={props.viewSubmissions}>View Borrowers</button>
            <ul>
                {state.submissions.map((submission, index) => {
                    return (
                        <li key={index}>
                            {submission._id}: {submission.text}
                        </li>
                    );
                })}
            </ul>
        </section>
    )
}