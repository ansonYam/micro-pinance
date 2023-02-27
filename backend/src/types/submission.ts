export interface Submission {
    _id: string;
    user: string;
    amount: number;
    memo: string;
    amount_raised: number;
    fully_funded: boolean;
    created_at: Date;
    expired: boolean;
}
