import React from 'react';

interface Props {
    name: string,
    description: string,
    loanAmount: number,
    pictureCaption: string,
    pictureURL: string,
    onClickLoan: () => void,
}

export default function BorrowerCard(props: Props) {
    return (
    <div id="container">
    <div>
        <h3>Borrower: {props.name}</h3>
        <img style={{ width: "500px" }} src={props.pictureURL} alt={props.name} />
        <p>How they will use the loan: {props.description}</p>          
    </div>
    <div>
        <strong>{props.loanAmount} Test-π</strong> <br />
        <button onClick={props.onClickLoan}>Loan to Borrower</button>
    </div>
    <span style={{fontSize: '0.6em'}}>{props.pictureCaption}</span>
    </div>
    )
}