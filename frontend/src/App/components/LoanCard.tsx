import React, { useState } from 'react';
import styles from './LoanCard.module.css';
import { Borrower } from '../types/borrower';

interface Props {
    borrower: Borrower,
    handleLoanClick: ({ borrower, loanAmount }: { borrower: Borrower, loanAmount: number }) => void;
}

export default function LoanCard(props: Props) {
    const [loanAmount, setLoanAmount] = useState<number>(1);

    const handleLoanAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        setLoanAmount(value);
    }

    const progress = Math.round((props.borrower.amount_raised / props.borrower.amount) * 100);

    return (
        <div className={styles["loan-card"]}>
            <h4>Borrower: {props.borrower.user}</h4>
            <p>How they will use the loan: {props.borrower.memo}</p>
            <progress value={props.borrower.amount_raised} max={props.borrower.amount} />
            <div>
                Raised: {props.borrower.amount_raised} / {props.borrower.amount} Test-π ({progress}%)
            </div>
            <label htmlFor="loan-amount">Loan amount: </label>
            <input
                type="number"
                id="loan-amount"
                name="loan-amount"
                min="1" max={props.borrower.amount - props.borrower.amount_raised}
                value={loanAmount}
                onChange={handleLoanAmountChange}
            /> Test-π
            <br></br>
            <button onClick={() => props.handleLoanClick({ borrower: props.borrower, loanAmount })}>Lend Now</button>
        </div>
    )
}