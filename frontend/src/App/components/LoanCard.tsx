import React, { useState } from 'react';
import styles from './LoanCard.module.css';
import { Loan } from '../types/loan';

interface Props {
    loan: Loan,
    handleLoanClick: ({ loan, loanAmount }: { loan: Loan, loanAmount: number }) => void;
}

export default function LoanCard(props: Props) {
    const [loanAmount, setLoanAmount] = useState<number>(1);

    const handleLoanAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        setLoanAmount(value);
    }

    const progress = Math.round((props.loan.amount_raised / props.loan.amount) * 100);

    return (
        <div className={styles["loan-card"]}>
            <h4>Borrower: {props.loan.borrower}</h4>
            <p>How they will use the loan: {props.loan.memo}</p>
            <progress value={props.loan.amount_raised} max={props.loan.amount} />
            <div>
                Raised: {props.loan.amount_raised} / {props.loan.amount} Test-π ({progress}%)
            </div>
            <label htmlFor="loan-amount">Loan amount: </label>
            <input
                type="number"
                id="loan-amount"
                name="loan-amount"
                min="1" max={props.loan.amount - props.loan.amount_raised}
                value={loanAmount}
                onChange={handleLoanAmountChange}
            /> Test-π
            <br></br>
            <button onClick={() => props.handleLoanClick({ loan: props.loan, loanAmount })}>Lend Now</button>
        </div>
    )
}