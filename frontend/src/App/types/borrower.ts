export type Borrower = {
    _id: string;
    user: string;
    amount: number;
    memo: string;
    amount_raised: number;
    fully_funded: boolean;
}