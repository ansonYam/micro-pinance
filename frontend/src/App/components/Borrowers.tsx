import React, { useState } from 'react';
import { Order } from '../types/order';
import styles from './Borrowers.module.css';

interface Props {
    loansToBeRepaid: Order[];
    handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function Borrowers({ loansToBeRepaid, handleSubmit }: Props) {
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
            <h2>For Borrowers</h2>
            <div>
                <h3>Your outstanding loans to be repaid: </h3>
                <ul>
                {loansToBeRepaid.map((loan) => (
                    <li key={loan._id}>{loan.amount} Test-π from {loan.user}</li>
                ))}
                </ul>
            </div>
            <form className={styles["loan-request-form"]} onSubmit={handleSubmit}>
                <label htmlFor="loan-request-form"><h3>Request a loan here: </h3></label>
                <label htmlFor="loanAmount">Loan amount: </label>
                <input type="number" name="loanAmount" value={loanAmount} onChange={handleChange} step="1" min="0"/><br></br>
                <label htmlFor="businessDescription">Describe what you will do with the loan: </label>
                <input type="text" name="businessDescription" value={businessDescription} onChange={handleChange} />
                <input type="submit" />
            </form>
        </section>
    );
}