import React, { useState } from 'react';
import BorrowerCard from './BorrowerCard';

interface Props {
    borrowers: Array<{
        _id: number;
        text: string;
    }>,
    entriesPerPage: number;
}

const Lenders = ({ borrowers, entriesPerPage }: Props) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(borrowers.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const displayedBorrowers = borrowers.slice(startIndex, endIndex);

    return (
        <div>
            {borrowers.map(borrower => (
                <div key={borrower._id}>
                    <p>{borrower.text}</p>
                </div>
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