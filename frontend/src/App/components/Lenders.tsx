import React, { useState } from 'react';
import LoanCard from './LoanCard';
import { Loan } from '../types/loan';
import { Contribution } from '../types/contribution';

interface Props {
    outstandingLoans: Contribution[];
    loans: Loan[];
    entriesPerPage: number;
    handleLoanClick: (loan: { loan: Loan; loanAmount: number; }) => void;
}

const Lenders = ({ outstandingLoans, loans, entriesPerPage, handleLoanClick }: Props) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(loans.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const displayedBorrowers = loans.slice(startIndex, endIndex);

    return (
        <section id="lenders-section">
            <h2>For Lenders</h2>
            <div>
                <h3>Your existing loans to borrowers:</h3>
                <ul>
                {outstandingLoans.map((loan) => (
                    <li key={loan._id}>{loan.amount} Test-π in support of loan ID {loan.loan_id}</li>
                ))}
            </ul>
            </div>

            <div>
                <h3>Make a new loan: </h3>
            </div>
            {loans.map(loan => (
                <LoanCard
                    key={loan._id}
                    loan={loan}
                    handleLoanClick={(loan) => handleLoanClick(loan)}
                />
            ))}
            <div>
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    Previous
                </button>
                <span>{currentPage} of {totalPages}</span>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next
                </button>
            </div>
        </section>
    );
};

export default Lenders;