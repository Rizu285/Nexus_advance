export type TransactionType = 'deposit' | 'withdraw' | 'transfer' | 'funding';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  senderId?: string;
  receiverId?: string;
  senderName?: string;
  receiverName?: string;
  description: string;
  status: TransactionStatus;
  timestamp: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
}

export interface PaymentContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  getWalletBalance: (userId: string) => number;
  getUserTransactions: (userId: string) => Transaction[];
  deposit: (userId: string, amount: number) => Transaction;
  withdraw: (userId: string, amount: number) => Transaction;
  transfer: (senderId: string, senderName: string, receiverId: string, receiverName: string, amount: number, description: string) => Transaction;
  fundingDeal: (investorId: string, investorName: string, entrepreneurId: string, entrepreneurName: string, amount: number, dealName: string) => Transaction;
}
