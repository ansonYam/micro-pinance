export type Loan = {
    _id: string;
    borrower: string;
    amount: number;
    memo: string;
    amount_raised: number;
    fully_funded: boolean;
    created_at: Date;
    expired: boolean;
}
