export type Contribution = {
    _id: string;
    pi_payment_id: string;
    loan_id: string;
    amount: number;
    lender: string;
    txid: string;
    borrower: string;
    paid: boolean;
    cancelled: boolean;
    created_at: Date;
}
  