import React, { useState } from 'react';
import LoanCard from './LoanCard';
import { Submission } from '../types/borrower';
import { Order } from '../types/order';

interface Props {
    outstandingLoans: Order[];
    borrowers: Submission[];
    entriesPerPage: number;
    handleLoanClick: (loan: { borrower: Submission; loanAmount: number; }) => void;
}

const Lenders = ({ outstandingLoans, borrowers, entriesPerPage, handleLoanClick }: Props) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(borrowers.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const displayedBorrowers = borrowers.slice(startIndex, endIndex);

    return (
        <section id="lenders-section">
            <h2>For Lenders</h2>
            <div>
                <h3>Your existing loans to borrowers:</h3>
                <ul>
                {outstandingLoans.map((loan) => (
                    <li key={loan._id}>{loan.amount} Test-π to {loan.product_id}</li>
                ))}
            </ul>
            </div>

            <div>
                <h3>Make a new loan: </h3>
            </div>
            {borrowers.map(borrower => (
                <LoanCard
                    key={borrower._id}
                    borrower={borrower}
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