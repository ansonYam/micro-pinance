import React, { useState } from 'react';

interface Props {
    handleSubmit: () => void;
}

export default function Borrowers(props: Props) {
    const [loanAmount, setLoanAmount] = useState('');
    const [businessDescription, setBusinessDescription] = useState('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.name === 'loanAmount') {
            setLoanAmount(event.target.value);
        } else if (event.target.name === 'businessDescription') {
            setBusinessDescription(event.target.value);
        }
    }

    return (
        <section id="borrowers-section">
            <h2>Borrowers</h2>
            <form className="loan-request-form" onSubmit={props.handleSubmit}>
                <label htmlFor="loan-request-form">Request a loan here: </label>
                <input type="text" name="loanAmount" value={loanAmount} onChange={handleChange} />
                <input type="text" name="businessDescription" value={businessDescription} onChange={handleChange} />
                <input type="submit" />
            </form>
        </section>
    );
}