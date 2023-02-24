export type Order = {
    _id: string;
    pi_payment_id: string;
    product_id: string;
    amount: number;
    user: string;
    txid: string;
    paid: boolean;
    cancelled: boolean;
    created_at: Date;
}