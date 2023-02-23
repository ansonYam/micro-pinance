import React, { useState } from 'react';
import LoanCard from './LoanCard';

export type Borrower = {
    _id: string;
    user: string;
    amount: number;
    memo: string;
    amount_raised: number;
}

interface Props {
    borrowers: Borrower[];
    entriesPerPage: number;
    handleLoanClick: (borrower: Borrower) => void;
}

const Lenders = ({ borrowers, entriesPerPage, handleLoanClick }: Props) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(borrowers.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const displayedBorrowers = borrowers.slice(startIndex, endIndex);

    return (
        <div>
            {borrowers.map(borrower => (
                <LoanCard
                    key={borrower._id}
                    user={borrower.user}
                    amount={borrower.amount}
                    memo={borrower.memo}
                    amount_raised={borrower.amount_raised}
                    handleLoanClick={() => handleLoanClick(borrower)}
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

        </div>
    );
};

export default Lenders;