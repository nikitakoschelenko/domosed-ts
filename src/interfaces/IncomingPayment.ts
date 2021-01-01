export interface IncomingPayment {
  type: 'transfer';
  amount: number;
  fromId: number;
  hash: string;
}
