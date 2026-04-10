export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface MeetingAvailabilitySlot {
  id: string;
  userId: string;
  start: string;
  end: string;
  createdAt: string;
}

export interface MeetingRequest {
  id: string;
  slotId: string;
  senderId: string;
  recipientId: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface ConfirmedMeeting {
  id: string;
  slotId: string;
  entrepreneurId: string;
  investorId: string;
  requestId: string;
  start: string;
  end: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  pendingLoginRole: UserRole | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  initiateTwoFactorLogin: (email: string, password: string, role: UserRole) => Promise<string>;
  verifyTwoFactorOtp: (otp: string) => Promise<void>;
  clearPendingLogin: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SchedulingContextType {
  availabilitySlots: MeetingAvailabilitySlot[];
  meetingRequests: MeetingRequest[];
  confirmedMeetings: ConfirmedMeeting[];
  getAvailabilityForUser: (userId: string) => MeetingAvailabilitySlot[];
  getRequestsForUser: (userId: string) => MeetingRequest[];
  getConfirmedMeetingsForUser: (userId: string) => ConfirmedMeeting[];
  addAvailabilitySlot: (userId: string, start: string, end: string) => MeetingAvailabilitySlot;
  updateAvailabilitySlot: (slotId: string, start: string, end: string) => MeetingAvailabilitySlot | null;
  removeAvailabilitySlot: (slotId: string) => void;
  sendMeetingRequest: (senderId: string, recipientId: string, slotId: string, message: string) => MeetingRequest;
  respondToMeetingRequest: (requestId: string, status: 'accepted' | 'declined') => MeetingRequest | null;
}

export interface WalletAccount {
  userId: string;
  balance: number;
}

export interface PaymentTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'funding';
  amount: number;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'completed' | 'failed';
  note: string;
  createdAt: string;
}

export interface PaymentContextType {
  wallets: WalletAccount[];
  transactions: PaymentTransaction[];
  getWalletBalance: (userId: string) => number;
  deposit: (userId: string, amount: number) => void;
  withdraw: (userId: string, amount: number) => void;
  transfer: (senderId: string, receiverId: string, amount: number, note: string) => void;
  fundingTransfer: (investorId: string, entrepreneurId: string, amount: number, note: string) => void;
  getTransactionsForUser: (userId: string) => PaymentTransaction[];
}