import React, { useState } from 'react';
import { Contribution } from '../types/contribution';
import styles from './Borrowers.module.css';

type ContribsByLoanId = {
    [loanId: string]: Contribution[];
}

interface Props {
    loansToBeRepaid: ContribsByLoanId;
    handleRepayLoan: (loanId: string, amount: number, contributions: Contribution[]) => void;
    handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function Borrowers({ loansToBeRepaid, handleRepayLoan, handleSubmit }: Props) {
    const [formData, setFormData] = useState({
        loanAmount: '',
        businessDescription: ''
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData(prevFormData => ({ ...prevFormData, [name]: value }));
    }

    const handleRepayButtonClick = (loanId: string, amount: number, contributions: Contribution[]) => {
        handleRepayLoan(loanId, amount, contributions);
    };

    return (
        <section id="borrowers-section">
            <h2>For Borrowers</h2>
            <div>
                <h3>Your outstanding loans: </h3>
                {Object.keys(loansToBeRepaid).map((loanId) => {
                    const contributions = loansToBeRepaid[loanId];
                    const totalAmount = contributions.reduce(
                        (acc, contribution) => acc + contribution.amount,
                        0
                    );

                    return (
                        <div key={loanId}>
                            <h4>Loan ID: {loanId}</h4>
                            <p>Total Amount: {totalAmount}</p>
                            <ul>
                                {contributions.map((contribution) => (
                                    <li key={contribution._id}>
                                        Lender ID: {contribution.lender}, Amount: {contribution.amount}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => handleRepayButtonClick(loanId, totalAmount, contributions)}>Pay Loan</button>
                        </div>
                    );
                })}
            </div>
            <form className={styles["loan-request-form"]} onSubmit={handleSubmit}>
                <label htmlFor="loan-request-form"><h3>Request a loan here: </h3></label>
                <label htmlFor="loanAmount">Loan amount: </label>
                <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleChange} step="1" min="0" /><br></br>
                <label htmlFor="businessDescription">Describe what you will do with the loan: </label>
                <textarea name="businessDescription" id="businessDescription" rows={8} cols={70} value={formData.businessDescription} onChange={handleChange}></textarea>
                <input type="submit" />
            </form>
        </section>
    );
}