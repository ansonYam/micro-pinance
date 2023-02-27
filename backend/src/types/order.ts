export interface Order {
    _id: string;
    pi_payment_id: string;
    product_id: string;
    amount: number;
    lender: string;
    txid: string;
    recipient: string;
    paid: boolean;
    cancelled: boolean;
    created_at: Date;
  }
  