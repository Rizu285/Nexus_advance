import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePayments } from '../../context/PaymentContext';
import { findUserById, entrepreneurs, investors } from '../../data/users';
import { CreditCard, Send, TrendingUp, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { PaymentTransaction } from '../../types';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { getWalletBalance, getTransactionsForUser, deposit, withdraw, transfer, fundingTransfer } = usePayments();

  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'transfer' | 'funding'>('overview');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [fundingRecipient, setFundingRecipient] = useState('');
  const [fundingDealName, setFundingDealName] = useState('');

  if (!user) return null;

  const balance = getWalletBalance(user.id);
  const transactions = getTransactionsForUser(user.id);

  const availableRecipients = user.role === 'entrepreneur' ? investors : entrepreneurs;

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      deposit(user.id, amount);
      setDepositAmount('');
      setActiveTab('overview');
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= balance) {
      withdraw(user.id, amount);
      setWithdrawAmount('');
      setActiveTab('overview');
    }
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    const recipient = availableRecipients.find((r) => r.id === transferRecipient);
    if (amount > 0 && amount <= balance && recipient) {
      transfer(user.id, recipient.id, amount, transferNote);
      setTransferAmount('');
      setTransferRecipient('');
      setTransferNote('');
      setActiveTab('overview');
    }
  };

  const handleFunding = () => {
    const amount = parseFloat(fundingAmount);
    const recipient = availableRecipients.find((r) => r.id === fundingRecipient);
    if (amount > 0 && amount <= balance && recipient && fundingDealName) {
      fundingTransfer(user.id, recipient.id, amount, fundingDealName);
      setFundingAmount('');
      setFundingRecipient('');
      setFundingDealName('');
      setActiveTab('overview');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'deposit' || type === 'funding') {
      return <ArrowDownLeft size={18} className="text-green-500" />;
    }
    return <ArrowUpRight size={18} className="text-red-500" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'success' : status === 'pending' ? 'warning' : 'error';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments & Wallet</h1>
          <p className="text-gray-600 mt-1">Manage your balance and transactions</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
          <CreditCard size={20} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Stripe-style mock</span>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
        <CardBody className="p-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-2">Total Balance</p>
              <h2 className="text-5xl font-bold">{formatCurrency(balance)}</h2>
              <p className="text-blue-100 text-sm mt-4">Available for transactions</p>
            </div>
            <DollarSign size={80} className="text-blue-400 opacity-50" />
          </div>
        </CardBody>
      </Card>

      {/* Action Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'deposit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'withdraw'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'transfer'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Transfer
        </button>
        {user.role === 'investor' && (
          <button
            onClick={() => setActiveTab('funding')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'funding'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Fund Deal
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              </CardHeader>
              <CardBody>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((txn: PaymentTransaction) => {
                      const counterpart =
                        txn.senderId === user.id
                          ? findUserById(txn.receiverId || '')
                          : findUserById(txn.senderId || '');

                      return (
                        <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-full">{getTransactionIcon(txn.type)}</div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {txn.type === 'deposit'
                                  ? 'Deposit'
                                  : txn.type === 'withdraw'
                                    ? 'Withdrawal'
                                    : txn.type === 'funding'
                                      ? `Funding to ${counterpart?.name || 'Unknown'}`
                                      : `Transfer to ${counterpart?.name || 'Unknown'}`}
                              </p>
                              <p className="text-sm text-gray-600">{txn.note}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                txn.senderId === user.id ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {txn.senderId === user.id ? '-' : '+'}
                              {formatCurrency(txn.amount)}
                            </p>
                            <Badge variant={getStatusColor(txn.status as string)} size="sm">
                              {txn.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'deposit' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Add Funds</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Amount (USD)"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  fullWidth
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Quick add:</strong> Click a button to add preset amounts
                  </p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[100, 500, 1000, 5000].map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount(amt.toString())}
                      >
                        +${amt}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleDeposit} fullWidth size="lg" disabled={!depositAmount || parseFloat(depositAmount) <= 0}>
                  Deposit Now
                </Button>
              </CardBody>
            </Card>
          )}

          {activeTab === 'withdraw' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Withdraw Funds</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Amount (USD)"
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  fullWidth
                />
                <p className="text-sm text-gray-600">Available: {formatCurrency(balance)}</p>
                <Button
                  onClick={handleWithdraw}
                  fullWidth
                  size="lg"
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > balance}
                >
                  Withdraw
                </Button>
              </CardBody>
            </Card>
          )}

          {activeTab === 'transfer' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Send Money</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                  >
                    <option value="">Select a recipient</option>
                    {availableRecipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                        {r.role === 'entrepreneur' && ` - ${(r as any).startupName}`}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Amount (USD)"
                  type="number"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  fullWidth
                />
                <Input
                  label="Note (optional)"
                  placeholder="What is this for?"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  fullWidth
                />
                <Button
                  onClick={handleTransfer}
                  fullWidth
                  size="lg"
                  leftIcon={<Send size={18} />}
                  disabled={!transferRecipient || !transferAmount || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > balance}
                >
                  Send Money
                </Button>
              </CardBody>
            </Card>
          )}

          {activeTab === 'funding' && user.role === 'investor' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Fund a Deal</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Founder</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={fundingRecipient}
                    onChange={(e) => setFundingRecipient(e.target.value)}
                  >
                    <option value="">Select a founder</option>
                    {entrepreneurs.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} - {e.startupName}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Deal Name"
                  placeholder="e.g., Seed Round, Series A"
                  value={fundingDealName}
                  onChange={(e) => setFundingDealName(e.target.value)}
                  fullWidth
                />
                <Input
                  label="Amount (USD)"
                  type="number"
                  placeholder="0.00"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  fullWidth
                />
                <Button
                  onClick={handleFunding}
                  fullWidth
                  size="lg"
                  leftIcon={<TrendingUp size={18} />}
                  disabled={!fundingRecipient || !fundingAmount || !fundingDealName || parseFloat(fundingAmount) <= 0 || parseFloat(fundingAmount) > balance}
                >
                  Fund Deal
                </Button>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar - Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Quick Stats</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Deposited</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    transactions
                      .filter((t: PaymentTransaction) => t.type === 'deposit')
                      .reduce((sum: number, t: PaymentTransaction) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    transactions
                      .filter((t: PaymentTransaction) => t.senderId === user.id && (t.type === 'transfer' || t.type === 'funding'))
                      .reduce((sum: number, t: PaymentTransaction) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    transactions
                      .filter((t: PaymentTransaction) => t.receiverId === user.id && (t.type === 'transfer' || t.type === 'funding'))
                      .reduce((sum: number, t: PaymentTransaction) => sum + t.amount, 0)
                  )}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Payment Methods</h3>
            </CardHeader>
            <CardBody className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">•••• 4242</p>
                <p className="text-xs text-gray-600">Visa • Expires 12/2026</p>
              </div>
              <Button variant="outline" fullWidth size="sm">
                Add Payment Method
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
