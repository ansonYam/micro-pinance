export type Payment = {
    _id: string,
    uid: string,
    amount: number,
    memo: string,
    payment_id: string,
    txid: string,
    repaid: boolean,
}