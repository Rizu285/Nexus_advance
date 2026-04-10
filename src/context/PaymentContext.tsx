import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PaymentContextType, PaymentTransaction, WalletAccount } from '../types';
import { findUserById, users } from '../data/users';

interface PaymentState {
  wallets: WalletAccount[];
  transactions: PaymentTransaction[];
}

const PAYMENT_STORAGE_KEY = 'business_nexus_payments';

const createId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const toCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const getDefaultBalance = (userId: string): number => {
  const user = findUserById(userId);
  if (!user) {
    return 0;
  }

  return user.role === 'investor' ? 250000 : 25000;
};

const seedPaymentState = (): PaymentState => {
  const wallets = users.map((user) => ({
    userId: user.id,
    balance: getDefaultBalance(user.id),
  }));

  const sampleTransactions: PaymentTransaction[] = [
    {
      id: 'txn_seed_1',
      type: 'funding',
      amount: 50000,
      senderId: 'i1',
      receiverId: 'e1',
      status: 'completed',
      note: 'Seed extension for product launch milestone',
      createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    },
    {
      id: 'txn_seed_2',
      type: 'deposit',
      amount: 12000,
      senderId: 'bank',
      receiverId: 'e1',
      status: 'completed',
      note: 'Bridge cash deposit',
      createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    },
  ];

  return {
    wallets,
    transactions: sampleTransactions,
  };
};

const loadPaymentState = (): PaymentState => {
  try {
    const stored = localStorage.getItem(PAYMENT_STORAGE_KEY);
    if (!stored) {
      return seedPaymentState();
    }

    const parsed = JSON.parse(stored) as PaymentState;
    return {
      wallets: parsed.wallets ?? [],
      transactions: parsed.transactions ?? [],
    };
  } catch {
    return seedPaymentState();
  }
};

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PaymentState>(() => loadPaymentState());

  useEffect(() => {
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<PaymentContextType>(() => {
    const ensureWallet = (wallets: WalletAccount[], userId: string): WalletAccount[] => {
      if (wallets.some((wallet) => wallet.userId === userId)) {
        return wallets;
      }

      return [...wallets, { userId, balance: getDefaultBalance(userId) }];
    };

    const getWalletBalance = (userId: string): number => {
      const wallet = state.wallets.find((item) => item.userId === userId);
      if (!wallet) {
        return getDefaultBalance(userId);
      }

      return wallet.balance;
    };

    const getTransactionsForUser = (userId: string): PaymentTransaction[] => {
      return state.transactions
        .filter((transaction) => transaction.senderId === userId || transaction.receiverId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const deposit = (userId: string, amount: number, note: string = ''): PaymentTransaction | null => {
      if (amount <= 0) {
        toast.error('Amount must be greater than 0.');
        return null;
      }

      const transaction: PaymentTransaction = {
        id: createId('txn'),
        type: 'deposit',
        amount,
        senderId: 'bank',
        receiverId: userId,
        status: 'completed',
        note: note || 'Deposit',
        createdAt: new Date().toISOString(),
      };

      setState((prev) => {
        const walletsWithUser = ensureWallet(prev.wallets, userId);
        return {
          wallets: walletsWithUser.map((wallet) =>
            wallet.userId === userId ? { ...wallet, balance: wallet.balance + amount } : wallet
          ),
          transactions: [transaction, ...prev.transactions],
        };
      });

      toast.success(`Deposited ${toCurrency(amount)}.`);
      return transaction;
    };

    const withdraw = (userId: string, amount: number, note: string = ''): PaymentTransaction | null => {
      if (amount <= 0) {
        toast.error('Amount must be greater than 0.');
        return null;
      }

      const currentBalance = getWalletBalance(userId);
      if (currentBalance < amount) {
        toast.error('Insufficient wallet balance.');
        return null;
      }

      const transaction: PaymentTransaction = {
        id: createId('txn'),
        type: 'withdraw',
        amount,
        senderId: userId,
        receiverId: 'bank',
        status: 'completed',
        note: note || 'Withdrawal',
        createdAt: new Date().toISOString(),
      };

      setState((prev) => {
        const walletsWithUser = ensureWallet(prev.wallets, userId);
        return {
          wallets: walletsWithUser.map((wallet) =>
            wallet.userId === userId ? { ...wallet, balance: wallet.balance - amount } : wallet
          ),
          transactions: [transaction, ...prev.transactions],
        };
      });

      toast.success(`Withdrew ${toCurrency(amount)}.`);
      return transaction;
    };

    const transfer = (
      senderId: string,
      receiverId: string,
      amount: number,
      note: string = '',
      type: 'transfer' | 'funding' = 'transfer'
    ): PaymentTransaction | null => {
      if (amount <= 0) {
        toast.error('Amount must be greater than 0.');
        return null;
      }

      if (senderId === receiverId) {
        toast.error('Sender and receiver cannot be the same.');
        return null;
      }

      const currentBalance = getWalletBalance(senderId);
      if (currentBalance < amount) {
        toast.error('Insufficient wallet balance.');
        return null;
      }

      const transaction: PaymentTransaction = {
        id: createId('txn'),
        type,
        amount,
        senderId,
        receiverId,
        status: 'completed',
        note: note || (type === 'funding' ? 'Funding' : 'Transfer'),
        createdAt: new Date().toISOString(),
      };

      setState((prev) => {
        const senderEnsured = ensureWallet(prev.wallets, senderId);
        const receiverEnsured = ensureWallet(senderEnsured, receiverId);

        return {
          wallets: receiverEnsured.map((wallet) => {
            if (wallet.userId === senderId) {
              return { ...wallet, balance: wallet.balance - amount };
            }
            if (wallet.userId === receiverId) {
              return { ...wallet, balance: wallet.balance + amount };
            }
            return wallet;
          }),
          transactions: [transaction, ...prev.transactions],
        };
      });

      toast.success(`${type === 'funding' ? 'Funding sent' : 'Transfer successful'}: ${toCurrency(amount)}.`);
      return transaction;
    };

    const fundingTransfer = (
      investorId: string,
      entrepreneurId: string,
      amount: number,
      note: string = ''
    ): PaymentTransaction | null => {
      const investor = findUserById(investorId);
      if (!investor || investor.role !== 'investor') {
        toast.error('Only investors can create funding deals.');
        return null;
      }

      return transfer(
        investorId,
        entrepreneurId,
        amount,
        note || 'Funding Deal',
        'funding'
      );
    };

    return {
      wallets: state.wallets,
      transactions: state.transactions,
      getWalletBalance,
      getTransactionsForUser,
      deposit,
      withdraw,
      transfer,
      fundingTransfer,
    };
  }, [state]);

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

export const usePayments = (): PaymentContextType => {
  const context = useContext(PaymentContext);

  if (!context) {
    throw new Error('usePayments must be used within PaymentProvider');
  }

  return context;
};
