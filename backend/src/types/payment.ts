export interface PaymentDTO {
    // Payment data:
    identifier: string, // payment identifier
    user_uid: string, // user's app-specific ID
    amount: number, // payment amount
    memo: string, // a string provided by the developer, shown to the user
    metadata: object, // an object provided by the developer for their own usage
    from_address: string, // sender address of the blockchain transaction
    to_address: string, // recipient address of the blockchain transaction
    direction: string, // direction of the payment ("user_to_app" | "app_to_user")
    created_at: string, // payment's creation timestamp
    network: string, // a network of the payment ("Pi Network" | "Pi Testnet")
    // Status flags representing the current state of this payment
    status: {
      developer_approved: boolean, // Server-Side Approval (automatically approved for A2U payment)
      transaction_verified: boolean, // blockchain transaction verified
      developer_completed: boolean, // Server-Side Completion (handled by the create_payment! method)
      cancelled: boolean, // cancelled by the developer or by Pi Network
      user_cancelled: boolean, // cancelled by the user
    },
    // Blockchain transaction data:
    transaction: null | { // This is null if no transaction has been made yet
      txid: string, // id of the blockchain transaction
      verified: boolean, // true if the transaction matches the payment, false otherwise
      _link: string, // a link to the operation on the Pi Blockchain API
    }
  }
  