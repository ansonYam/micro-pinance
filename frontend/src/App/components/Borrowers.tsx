import React from 'react';

interface Props {
    handleChange: () => void;
    handleSubmit: () => void;
}

export default function Borrowers(props: Props) {
    return (
        <section id="borrowers-section">
            <h2>Borrowers</h2>
            <form className="loan-request-form" onSubmit={props.handleSubmit}>
                <label htmlFor="loan-request-form">Request a loan here: </label>
                <input type="text" name="loanAmount" onChange={props.handleChange} />
                <input type="text" name="businessDescription" onChange={props.handleChange} />

                <input type="submit"></input>
            </form>
        </section>
    );
}