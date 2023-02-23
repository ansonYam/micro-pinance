import React, { useState } from 'react';
import styles from './LoanCard.module.css';

interface Props {
    user: string,
    amount: number,
    memo: string,
    amount_raised: number,
    handleLoanClick: (loanAmount: number) => void,
}

export default function LoanCard(props: Props) {
    const [loanAmount, setLoanAmount] = useState<number>(1);

    const handleLoanAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        setLoanAmount(value);
    }

    const progress = Math.round((props.amount_raised / props.amount) * 100);

    return (
        <div className={styles.container}>
            <div>
                <h3>Borrower: {props.user}</h3>
                <p>How they will use the loan: {props.memo}</p>
                <progress value={props.amount_raised} max={props.amount} />
                <div>
                    Raised: {props.amount_raised} / {props.amount} Test-π ({progress}%)
                </div>
                <label htmlFor="loan-amount">Loan amount: </label>
                <input
                    type="number"
                    id="loan-amount"
                    name="loan-amount"
                    min="1" max={props.amount - props.amount_raised}
                    value={loanAmount}
                    onChange={handleLoanAmountChange}
                /> Test-π
                <br></br>
                <button onClick={() => props.handleLoanClick(loanAmount)}>Lend Now</button>
            </div>
        </div>
    )
}