'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Group {
  id: string
  name: string
  currency: string
  membersCount: number
  totalContributions: number
  totalShares: number
  outstandingLoans: number
  availableCash: number
  bankBalance: number
  jamiiFund: number
  outstandingFines: number
  startDate?: string
  endDate?: string
}

export interface Member {
  id: string
  groupId: string
  name: string
  memberNo: string
  phone: string
  email: string
  role: 'Administrator' | 'Treasurer' | 'Loan Officer' | 'Member'
  status: 'ACTIVE' | 'INACTIVE'
  shares: number
  contributions: number
  loanBalance: number
  fines: number
  joinDate: string
}

export interface Contribution {
  id: string
  groupId: string
  memberId: string
  expected: number
  paid: number
  balance: number
  lastPaymentDate: string
  status: 'PAID' | 'PARTIALLY PAID' | 'PENDING' | 'OVERDUE'
  period: string
}

export interface ShareTransaction {
  id: string
  memberId: string
  sharesCount: number
  value: number
  type: 'BUY' | 'TRANSFER' | 'REDEEM'
  date: string
  status: string
}

export interface Loan {
  id: string
  groupId: string
  memberId: string
  loanProduct: string
  amount: number
  interestRate: number // e.g. 10%
  principal: number
  interest: number
  totalPaid: number
  remainingBalance: number
  requestedDate: string
  guarantors: string[]
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED'
  purpose: string
  nextPaymentDate: string
  maturityDate: string
  progress: number // repayment progress %
}

export interface RepaymentScheduleItem {
  id: string
  loanId: string
  installmentNumber: number
  dueDate: string
  principal: number
  interest: number
  penalty: number
  totalDue: number
  paid: number
  balance: number
  status: 'PAID' | 'PENDING' | 'OVERDUE'
}

export interface Fine {
  id: string
  groupId: string
  memberId: string
  fineType: 'Late Meeting' | 'Absence' | 'Late Contribution' | 'Late Loan Payment' | 'Other'
  amount: number
  paid: number
  outstanding: number
  date: string
  status: 'PAID' | 'UNPAID' | 'WAIVED'
}

export interface JamiiRequest {
  id: string
  groupId: string
  memberId: string
  type: 'Death' | 'Hospital' | 'Wedding' | 'Emergency' | 'Education' | 'Accident'
  requestedAmount: number
  approvedAmount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  date: string
}

export interface Meeting {
  id: string
  groupId: string
  date: string
  time: string
  location: string
  attendanceRate: number
  agenda: string
  minutes?: string
  resolution?: string
  status: 'UPCOMING' | 'COMPLETED'
}

export interface Attendance {
  id: string
  meetingId: string
  memberId: string
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'
  arrivalTime?: string
  fineAmount?: number
  reason?: string
}

export interface Payment {
  reference: string
  groupId: string
  memberId: string
  amount: number
  type: 'Contribution' | 'Loan Repayment' | 'Share Purchase' | 'Fine Payment' | 'Jamii Contribution' | 'Expense'
  method: 'Cash' | 'Bank' | 'Mobile Money' | 'Control Number'
  date: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED'
}

export interface Expense {
  id: string
  groupId: string
  category: 'Transport' | 'Bank Charges' | 'Stationery' | 'Meeting Expenses' | 'Communication' | 'Other'
  description: string
  amount: number
  date: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdBy: string
}

export interface LedgerTransaction {
  id: string
  groupId: string
  date: string
  reference: string
  description: string
  account: 'Cash' | 'Bank' | 'Mobile Money'
  debit: number
  credit: number
  balance: number
}

export interface AuditLog {
  id: string
  groupId: string
  date: string
  user: string
  action: string
  module: string
  reference: string
  ipAddress: string
  details: string
}

export interface Notification {
  id: string
  groupId: string
  message: string
  category: 'loan' | 'contribution' | 'meeting' | 'general'
  date: string
  read: boolean
}

// Initial Mock Data Sets
const initialGroups: Group[] = [
  { id: 'umoja', name: 'Umoja VIKOBA', currency: 'TZS', membersCount: 52, totalContributions: 18450000, totalShares: 7500000, outstandingLoans: 9250000, availableCash: 3250000, bankBalance: 8450000, jamiiFund: 1250000, outstandingFines: 180000, startDate: '2024-01-15', endDate: '2030-01-15' },
  { id: 'mshikamano', name: 'Mshikamano VIKOBA', currency: 'TZS', membersCount: 38, totalContributions: 12100000, totalShares: 5200000, outstandingLoans: 5800000, availableCash: 1950000, bankBalance: 6150000, jamiiFund: 850000, outstandingFines: 60000, startDate: '2023-08-10', endDate: '2029-08-10' },
  { id: 'tumaini', name: 'Tumaini VIKOBA', currency: 'TZS', membersCount: 45, totalContributions: 15300000, totalShares: 6100000, outstandingLoans: 7200000, availableCash: 2100000, bankBalance: 7100000, jamiiFund: 1100000, outstandingFines: 90000, startDate: '2024-03-20', endDate: '2030-03-20' },
  { id: 'maendeleo', name: 'Maendeleo VIKOBA', currency: 'TZS', membersCount: 30, totalContributions: 9800000, totalShares: 4100000, outstandingLoans: 3100000, availableCash: 1200000, bankBalance: 5100000, jamiiFund: 600000, outstandingFines: 20000, startDate: '2023-11-12', endDate: '2029-11-12' }
]

const initialMembers: Member[] = [
  { id: 'm1', groupId: 'umoja', name: 'Juma Majid', memberNo: 'VIKOBA-00027', phone: '+255 712 345 678', email: 'juma@vikoba360.com', role: 'Administrator', status: 'ACTIVE', shares: 350, contributions: 1750000, loanBalance: 1200000, fines: 0, joinDate: '2025-01-10' },
  { id: 'm2', groupId: 'umoja', name: 'Asha Salum', memberNo: 'VIKOBA-00003', phone: '+255 754 987 654', email: 'asha.salum@gmail.com', role: 'Treasurer', status: 'ACTIVE', shares: 420, contributions: 2100000, loanBalance: 0, fines: 10000, joinDate: '2025-01-02' },
  { id: 'm3', groupId: 'umoja', name: 'Rehema Hassan', memberNo: 'VIKOBA-00015', phone: '+255 788 333 444', email: 'rehema.h@yahoo.com', role: 'Loan Officer', status: 'ACTIVE', shares: 300, contributions: 1500000, loanBalance: 850000, fines: 0, joinDate: '2025-02-14' },
  { id: 'm4', groupId: 'umoja', name: 'John Joseph', memberNo: 'VIKOBA-00042', phone: '+255 655 444 555', email: 'john.j@outlook.com', role: 'Member', status: 'ACTIVE', shares: 150, contributions: 750000, loanBalance: 4500000, fines: 15000, joinDate: '2025-04-20' },
  { id: 'm5', groupId: 'umoja', name: 'Neema Peter', memberNo: 'VIKOBA-00050', phone: '+255 767 111 222', email: 'neema.peter@gmail.com', role: 'Member', status: 'ACTIVE', shares: 280, contributions: 1400000, loanBalance: 2700000, fines: 0, joinDate: '2025-05-18' },
  { id: 'm6', groupId: 'umoja', name: 'Mariam Said', memberNo: 'VIKOBA-00011', phone: '+255 711 999 888', email: 'mariam.said@gmail.com', role: 'Member', status: 'ACTIVE', shares: 310, contributions: 1550000, loanBalance: 0, fines: 5000, joinDate: '2025-02-01' },
  { id: 'm7', groupId: 'umoja', name: 'Baraka Amos', memberNo: 'VIKOBA-00019', phone: '+255 752 888 777', email: 'baraka.amos@gmail.com', role: 'Member', status: 'ACTIVE', shares: 200, contributions: 1000000, loanBalance: 0, fines: 0, joinDate: '2025-03-03' },
  { id: 'm8', groupId: 'umoja', name: 'Sarah Emmanuel', memberNo: 'VIKOBA-00033', phone: '+255 784 222 333', email: 'sarah.e@gmail.com', role: 'Member', status: 'ACTIVE', shares: 180, contributions: 900000, loanBalance: 0, fines: 30000, joinDate: '2025-03-29' }
]

const initialContributions: Contribution[] = [
  { id: 'c1', groupId: 'umoja', memberId: 'm1', expected: 50000, paid: 50000, balance: 0, lastPaymentDate: '2026-08-19', status: 'PAID', period: 'Week 34, 2026' },
  { id: 'c2', groupId: 'umoja', memberId: 'm2', expected: 50000, paid: 50000, balance: 0, lastPaymentDate: '2026-08-20', status: 'PAID', period: 'Week 34, 2026' },
  { id: 'c3', groupId: 'umoja', memberId: 'm3', expected: 50000, paid: 25000, balance: 25000, lastPaymentDate: '2026-08-19', status: 'PARTIALLY PAID', period: 'Week 34, 2026' },
  { id: 'c4', groupId: 'umoja', memberId: 'm4', expected: 50000, paid: 0, balance: 50000, lastPaymentDate: '', status: 'OVERDUE', period: 'Week 34, 2026' },
  { id: 'c5', groupId: 'umoja', memberId: 'm5', expected: 50000, paid: 0, balance: 50000, lastPaymentDate: '', status: 'PENDING', period: 'Week 34, 2026' },
  { id: 'c6', groupId: 'umoja', memberId: 'm6', expected: 50000, paid: 50000, balance: 0, lastPaymentDate: '2026-08-18', status: 'PAID', period: 'Week 34, 2026' }
]

const initialShares: ShareTransaction[] = [
  { id: 's1', memberId: 'm1', sharesCount: 5, value: 25000, type: 'BUY', date: '2026-08-17', status: 'COMPLETED' },
  { id: 's2', memberId: 'm2', sharesCount: 10, value: 50000, type: 'BUY', date: '2026-08-18', status: 'COMPLETED' },
  { id: 's3', memberId: 'm3', sharesCount: 5, value: 25000, type: 'BUY', date: '2026-08-19', status: 'COMPLETED' },
  { id: 's4', memberId: 'm8', sharesCount: 8, value: 40000, type: 'BUY', date: '2026-08-20', status: 'COMPLETED' }
]

const initialLoans: Loan[] = [
  { id: 'l1', groupId: 'umoja', memberId: 'm1', loanProduct: 'Standard Dev Loan', amount: 2000000, interestRate: 10, principal: 2000000, interest: 200000, totalPaid: 1000000, remainingBalance: 1200000, requestedDate: '2026-05-10', guarantors: ['Asha Salum', 'Rehema Hassan'], status: 'DISBURSED', purpose: 'Business expansion', nextPaymentDate: '2026-09-10', maturityDate: '2026-11-10', progress: 50 },
  { id: 'l2', groupId: 'umoja', memberId: 'm4', loanProduct: 'Emergency Loan', amount: 5000000, interestRate: 10, principal: 5000000, interest: 500000, totalPaid: 1000000, remainingBalance: 4500000, requestedDate: '2026-07-01', guarantors: ['Juma Majid', 'Neema Peter'], status: 'DISBURSED', purpose: 'Medical bill support', nextPaymentDate: '2026-08-25', maturityDate: '2026-12-01', progress: 20 },
  { id: 'l3', groupId: 'umoja', memberId: 'm5', loanProduct: 'Education Loan', amount: 3000000, interestRate: 10, principal: 3000000, interest: 300005, totalPaid: 600000, remainingBalance: 2700000, requestedDate: '2026-06-12', guarantors: ['Mariam Said'], status: 'DISBURSED', purpose: 'University school fees', nextPaymentDate: '2026-09-12', maturityDate: '2026-12-12', progress: 20 },
  { id: 'l4', groupId: 'umoja', memberId: 'm7', loanProduct: 'Standard Dev Loan', amount: 1500000, interestRate: 10, principal: 1500000, interest: 150000, totalPaid: 0, remainingBalance: 0, requestedDate: '2026-08-15', guarantors: ['Juma Majid', 'Rehema Hassan'], status: 'PENDING', purpose: 'Farming inputs purchase', nextPaymentDate: '', maturityDate: '', progress: 0 },
  { id: 'l5', groupId: 'umoja', memberId: 'm8', loanProduct: 'Emergency Loan', amount: 500000, interestRate: 5, principal: 500000, interest: 25000, totalPaid: 0, remainingBalance: 0, requestedDate: '2026-08-20', guarantors: ['Asha Salum'], status: 'UNDER_REVIEW', purpose: 'Repairing water pump', nextPaymentDate: '', maturityDate: '', progress: 0 }
]

const initialRepayments: RepaymentScheduleItem[] = [
  { id: 'r1_1', loanId: 'l1', installmentNumber: 1, dueDate: '2026-06-10', principal: 500000, interest: 50000, penalty: 0, totalDue: 550000, paid: 550000, balance: 0, status: 'PAID' },
  { id: 'r1_2', loanId: 'l1', installmentNumber: 2, dueDate: '2026-07-10', principal: 500000, interest: 50000, penalty: 0, totalDue: 550000, paid: 550000, balance: 0, status: 'PAID' },
  { id: 'r1_3', loanId: 'l1', installmentNumber: 3, dueDate: '2026-08-10', principal: 500000, interest: 50000, penalty: 0, totalDue: 550000, paid: 0, balance: 550000, status: 'OVERDUE' },
  { id: 'r1_4', loanId: 'l1', installmentNumber: 4, dueDate: '2026-09-10', principal: 500000, interest: 50000, penalty: 0, totalDue: 550000, paid: 0, balance: 550000, status: 'PENDING' },

  { id: 'r2_1', loanId: 'l2', installmentNumber: 1, dueDate: '2026-08-01', principal: 1000000, interest: 100000, penalty: 0, totalDue: 1100000, paid: 1100000, balance: 0, status: 'PAID' },
  { id: 'r2_2', loanId: 'l2', installmentNumber: 2, dueDate: '2026-08-25', principal: 1000000, interest: 100000, penalty: 0, totalDue: 1100000, paid: 0, balance: 1100000, status: 'PENDING' }
]

const initialFines: Fine[] = [
  { id: 'f1', groupId: 'umoja', memberId: 'm4', fineType: 'Absence', amount: 15000, paid: 0, outstanding: 15000, date: '2026-08-15', status: 'UNPAID' },
  { id: 'f2', groupId: 'umoja', memberId: 'm2', fineType: 'Late Meeting', amount: 5000, paid: 0, outstanding: 5000, date: '2026-08-15', status: 'UNPAID' },
  { id: 'f3', groupId: 'umoja', memberId: 'm6', fineType: 'Late Meeting', amount: 5000, paid: 0, outstanding: 5000, date: '2026-08-15', status: 'UNPAID' },
  { id: 'f4', groupId: 'umoja', memberId: 'm8', fineType: 'Late Contribution', amount: 10000, paid: 10000, outstanding: 0, date: '2026-08-10', status: 'PAID' },
  { id: 'f5', groupId: 'umoja', memberId: 'm8', fineType: 'Late Loan Payment', amount: 20000, paid: 0, outstanding: 20000, date: '2026-08-12', status: 'UNPAID' }
]

const initialJamiiRequests: JamiiRequest[] = [
  { id: 'j1', groupId: 'umoja', memberId: 'm4', type: 'Hospital', requestedAmount: 200000, approvedAmount: 200000, status: 'PAID', date: '2026-07-20' },
  { id: 'j2', groupId: 'umoja', memberId: 'm6', type: 'Wedding', requestedAmount: 300000, approvedAmount: 300000, status: 'APPROVED', date: '2026-08-12' },
  { id: 'j3', groupId: 'umoja', memberId: 'm8', type: 'Emergency', requestedAmount: 150000, approvedAmount: 0, status: 'PENDING', date: '2026-08-19' }
]

const initialMeetings: Meeting[] = [
  { id: 'mt1', groupId: 'umoja', date: '2026-08-15', time: '10:00 AM', location: 'Community Hall, Mikocheni', attendanceRate: 85, agenda: 'Review of Share Capital & Loan Approvals', minutes: 'Discussed increasing the share limit to 500 per member. Approved Juma Majid loan.', resolution: 'Approved Standard Loan for Juma Majid. Shared dividend timeline.', status: 'COMPLETED' },
  { id: 'mt2', groupId: 'umoja', date: '2026-08-22', time: '10:00 AM', location: 'Community Hall, Mikocheni', attendanceRate: 0, agenda: 'Weekly Contribution Round & Emergency Fund review', status: 'UPCOMING' },
  { id: 'mt3', groupId: 'umoja', date: '2026-08-29', time: '10:00 AM', location: 'Community Hall, Mikocheni', attendanceRate: 0, agenda: 'General progress report & fine collections', status: 'UPCOMING' }
]

const initialAttendance: Attendance[] = [
  { id: 'at1', meetingId: 'mt1', memberId: 'm1', status: 'PRESENT', arrivalTime: '09:55 AM' },
  { id: 'at2', meetingId: 'mt1', memberId: 'm2', status: 'LATE', arrivalTime: '10:15 AM', fineAmount: 5000, reason: 'Traffic delay' },
  { id: 'at3', meetingId: 'mt1', memberId: 'm3', status: 'PRESENT', arrivalTime: '09:48 AM' },
  { id: 'at4', meetingId: 'mt1', memberId: 'm4', status: 'ABSENT', fineAmount: 15000, reason: 'No explanation' },
  { id: 'at5', meetingId: 'mt1', memberId: 'm5', status: 'PRESENT', arrivalTime: '09:50 AM' },
  { id: 'at6', meetingId: 'mt1', memberId: 'm6', status: 'LATE', arrivalTime: '10:08 AM', fineAmount: 5000, reason: 'Rain delay' },
  { id: 'at7', meetingId: 'mt1', memberId: 'm7', status: 'PRESENT', arrivalTime: '09:58 AM' },
  { id: 'at8', meetingId: 'mt1', memberId: 'm8', status: 'EXCUSED', reason: 'Sick relative' }
]

const initialPayments: Payment[] = [
  { reference: 'PAY-00124', groupId: 'umoja', memberId: 'm2', amount: 50000, type: 'Contribution', method: 'Mobile Money', date: '2026-08-20', status: 'COMPLETED' },
  { reference: 'PAY-00125', groupId: 'umoja', memberId: 'm1', amount: 50000, type: 'Contribution', method: 'Mobile Money', date: '2026-08-19', status: 'COMPLETED' },
  { reference: 'PAY-00126', groupId: 'umoja', memberId: 'm1', amount: 180000, type: 'Loan Repayment', method: 'Bank', date: '2026-08-19', status: 'COMPLETED' },
  { reference: 'PAY-00127', groupId: 'umoja', memberId: 'm8', amount: 25000, type: 'Share Purchase', method: 'Cash', date: '2026-08-19', status: 'COMPLETED' },
  { reference: 'PAY-00128', groupId: 'umoja', memberId: 'm8', amount: 10000, type: 'Fine Payment', method: 'Cash', date: '2026-08-10', status: 'COMPLETED' }
]

const initialExpenses: Expense[] = [
  { id: 'exp1', groupId: 'umoja', category: 'Stationery', description: 'Counter books and pens for recording minutes', amount: 45000, date: '2026-08-05', status: 'APPROVED', createdBy: 'Asha Salum' },
  { id: 'exp2', groupId: 'umoja', category: 'Transport', description: 'Treasurer transport to bank to deposit weekly collection', amount: 25000, date: '2026-08-12', status: 'APPROVED', createdBy: 'Asha Salum' },
  { id: 'exp3', groupId: 'umoja', category: 'Meeting Expenses', description: 'Refreshments (Water and bites) for monthly meeting', amount: 120000, date: '2026-08-15', status: 'APPROVED', createdBy: 'Juma Majid' },
  { id: 'exp4', groupId: 'umoja', category: 'Communication', description: 'SMS bundle recharge for sending contribution reminders', amount: 15000, date: '2026-08-18', status: 'PENDING', createdBy: 'Asha Salum' }
]

const initialLedger: LedgerTransaction[] = [
  { id: 'l_tx1', groupId: 'umoja', date: '2026-08-15', reference: 'MT-0015', description: 'Weekly meeting contributions collection', account: 'Mobile Money', debit: 1250000, credit: 0, balance: 8450000 },
  { id: 'l_tx2', groupId: 'umoja', date: '2026-08-15', reference: 'EXP-003', description: 'Meeting refreshments purchase', account: 'Cash', debit: 0, credit: 120000, balance: 3130000 },
  { id: 'l_tx3', groupId: 'umoja', date: '2026-08-18', reference: 'SH-0045', description: 'Asha Salum Share Purchase', account: 'Mobile Money', debit: 50000, credit: 0, balance: 8500000 },
  { id: 'l_tx4', groupId: 'umoja', date: '2026-08-19', reference: 'PAY-126', description: 'Juma Majid Loan Repayment', account: 'Bank', debit: 180000, credit: 0, balance: 8630000 }
]

const initialAuditLogs: AuditLog[] = [
  { id: 'aud1', groupId: 'umoja', date: '2026-08-20 16:34:10', user: 'Juma Majid', action: 'Approve Loan Application', module: 'Loans', reference: 'LN-00034', ipAddress: '197.250.22.45', details: 'Juma approved Standard Loan application for Baraka Amos of TZS 1,500,000' },
  { id: 'aud2', groupId: 'umoja', date: '2026-08-20 14:12:05', user: 'Asha Salum', action: 'Record Payment', module: 'Contributions', reference: 'PAY-00124', ipAddress: '197.250.22.82', details: 'Recorded contribution payment of TZS 50,000 for Asha Salum' },
  { id: 'aud3', groupId: 'umoja', date: '2026-08-19 11:05:44', user: 'System', action: 'Generate Overdue Fines', module: 'Fines', reference: 'FN-00088', ipAddress: 'localhost', details: 'Fines generated automatically for absent members in meeting #mt1' },
  { id: 'aud4', groupId: 'umoja', date: '2026-08-18 09:15:30', user: 'Juma Majid', action: 'Update Share Settings', module: 'Administration', reference: 'SET-0001', ipAddress: '197.250.22.45', details: 'Changed share unit price from TZS 4,500 to TZS 5,000' }
]

const initialNotifications: Notification[] = [
  { id: 'n1', groupId: 'umoja', message: 'Loan application #l4 from Baraka Amos requires approval.', category: 'loan', date: '2026-08-20', read: false },
  { id: 'n2', groupId: 'umoja', message: 'John Joseph has an overdue contribution for Week 34.', category: 'contribution', date: '2026-08-20', read: false },
  { id: 'n3', groupId: 'umoja', message: 'Umoja VIKOBA weekly meeting scheduled for Saturday, 22 Aug.', category: 'meeting', date: '2026-08-21', read: false },
  { id: 'n4', groupId: 'umoja', message: 'Emergency support claim requested by Sarah Emmanuel.', category: 'general', date: '2026-08-19', read: true }
]

interface VikobaStoreType {
  isHydrated: boolean
  groups: Group[]
  currentGroupId: string
  setCurrentGroupId: (id: string) => void
  currentGroup: Group
  members: Member[]
  contributions: Contribution[]
  shareTransactions: ShareTransaction[]
  loans: Loan[]
  repayments: RepaymentScheduleItem[]
  fines: Fine[]
  jamiiRequests: JamiiRequest[]
  meetings: Meeting[]
  attendance: Attendance[]
  payments: Payment[]
  expenses: Expense[]
  ledger: LedgerTransaction[]
  auditLogs: AuditLog[]
  notifications: Notification[]

  // Mutator operations
  addMember: (member: Omit<Member, 'id' | 'groupId' | 'shares' | 'contributions' | 'loanBalance' | 'fines' | 'joinDate'>) => void
  recordPayment: (payment: Omit<Payment, 'groupId' | 'reference' | 'date'>) => void
  applyLoan: (loan: Omit<Loan, 'id' | 'groupId' | 'principal' | 'interest' | 'totalPaid' | 'remainingBalance' | 'status' | 'nextPaymentDate' | 'maturityDate' | 'progress'>) => void
  approveLoan: (loanId: string) => void
  rejectLoan: (loanId: string) => void
  issueFine: (fine: Omit<Fine, 'id' | 'groupId' | 'date' | 'status' | 'paid'>) => void
  waiveFine: (fineId: string) => void
  payFine: (fineId: string) => void
  requestJamiiSupport: (req: Omit<JamiiRequest, 'id' | 'groupId' | 'approvedAmount' | 'status' | 'date'>) => void
  approveJamiiSupport: (requestId: string, amount: number) => void
  rejectJamiiSupport: (requestId: string) => void
  payJamiiSupport: (requestId: string) => void
  createMeeting: (meeting: Omit<Meeting, 'id' | 'groupId' | 'attendanceRate' | 'status'>) => void
  saveAttendance: (meetingId: string, attendanceList: Omit<Attendance, 'id'>[]) => void
  recordExpense: (expense: Omit<Expense, 'id' | 'groupId' | 'date' | 'status'>) => void
  approveExpense: (expenseId: string) => void
  rejectExpense: (expenseId: string) => void
  markAllNotificationsRead: () => void
  addAuditLog: (action: string, module: string, reference: string, details: string) => void
}

const VikobaStoreContext = createContext<VikobaStoreType | undefined>(undefined)

export const VikobaStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getPersistedGroup = (): Group | null => {
    if (typeof window === 'undefined') return null

    const storedGroup = localStorage.getItem('v360_currentGroup')
    if (!storedGroup) return null

    try {
      const parsed = JSON.parse(storedGroup)
      if (!parsed?.id) return null

      return {
        id: String(parsed.id),
        name: parsed.name || 'My Group',
        currency: parsed.currency || 'TZS',
        membersCount: 0,
        totalContributions: 0,
        totalShares: 0,
        outstandingLoans: 0,
        availableCash: 0,
        bankBalance: 0,
        jamiiFund: 0,
        outstandingFines: 0,
        startDate: parsed.startDate || parsed.startedAt || '',
        endDate: parsed.endDate || parsed.endsAt || '',
      }
    } catch {
      return null
    }
  }

  const [isHydrated, setIsHydrated] = useState(false)
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [currentGroupId, setCurrentGroupId] = useState<string>('umoja')
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [contributions, setContributions] = useState<Contribution[]>(initialContributions)
  const [shareTransactions, setShareTransactions] = useState<ShareTransaction[]>(initialShares)
  const [loans, setLoans] = useState<Loan[]>(initialLoans)
  const [repayments, setRepayments] = useState<RepaymentScheduleItem[]>(initialRepayments)
  const [fines, setFines] = useState<Fine[]>(initialFines)
  const [jamiiRequests, setJamiiRequests] = useState<JamiiRequest[]>(initialJamiiRequests)
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance)
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [ledger, setLedger] = useState<LedgerTransaction[]>(initialLedger)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  // Load from local storage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGroup = localStorage.getItem('v360_currentGroup')
      const parsedStoredGroup = storedGroup ? JSON.parse(storedGroup) : null
      const persistedGroup = parsedStoredGroup && (parsedStoredGroup.id || parsedStoredGroup.groupId) ? {
        id: String(parsedStoredGroup.id ?? parsedStoredGroup.groupId),
        name: parsedStoredGroup.groupName || parsedStoredGroup.name || 'My Group',
        currency: parsedStoredGroup.currency || 'TZS',
        membersCount: 0,
        totalContributions: 0,
        totalShares: 0,
        outstandingLoans: 0,
        availableCash: 0,
        bankBalance: 0,
        jamiiFund: 0,
        outstandingFines: 0,
        startDate: parsedStoredGroup.startDate || parsedStoredGroup.startedAt || '',
        endDate: parsedStoredGroup.endDate || parsedStoredGroup.endsAt || '',
      } : null

      if (persistedGroup) {
        setGroups((prev) => {
          const filtered = prev.filter(g => g.id !== persistedGroup.id)
          return [persistedGroup, ...filtered]
        })
        setCurrentGroupId(persistedGroup.id)
      }

      const storedGroupId = localStorage.getItem('v360_currentGroupId')
      if (storedGroupId) setCurrentGroupId(storedGroupId)

      const storedMembers = localStorage.getItem('v360_members')
      if (storedMembers) setMembers(JSON.parse(storedMembers))

      const storedLoans = localStorage.getItem('v360_loans')
      if (storedLoans) setLoans(JSON.parse(storedLoans))

      const storedFines = localStorage.getItem('v360_fines')
      if (storedFines) setFines(JSON.parse(storedFines))

      const storedContributions = localStorage.getItem('v360_contributions')
      if (storedContributions) setContributions(JSON.parse(storedContributions))

      const storedPayments = localStorage.getItem('v360_payments')
      if (storedPayments) setPayments(JSON.parse(storedPayments))

      const storedMeetings = localStorage.getItem('v360_meetings')
      if (storedMeetings) setMeetings(JSON.parse(storedMeetings))

      const storedExpenses = localStorage.getItem('v360_expenses')
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses))

      const storedJamii = localStorage.getItem('v360_jamii')
      if (storedJamii) setJamiiRequests(JSON.parse(storedJamii))

      const storedLedger = localStorage.getItem('v360_ledger')
      if (storedLedger) setLedger(JSON.parse(storedLedger))

      const storedAudit = localStorage.getItem('v360_auditLogs')
      if (storedAudit) setAuditLogs(JSON.parse(storedAudit))

      const storedNotifications = localStorage.getItem('v360_notifications')
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications))

      setIsHydrated(true)
    }
  }, [])

  // Sync back to local storage on edits
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('v360_currentGroupId', currentGroupId)
    }
  }, [currentGroupId])

  const saveAndSync = (key: string, data: any, updater: Function) => {
    updater(data)
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data))
    }
  }

  const currentGroup = groups.find(g => g.id === currentGroupId) || groups[0]

  // Add Member
  const addMember = (newMem: Omit<Member, 'id' | 'groupId' | 'shares' | 'contributions' | 'loanBalance' | 'fines' | 'joinDate'>) => {
    const id = 'm_' + Math.random().toString(36).substr(2, 9)
    const memberNo = `VIKOBA-${String(members.length + 1).padStart(5, '0')}`
    const joinDate = new Date().toISOString().split('T')[0]

    const added: Member = {
      ...newMem,
      id,
      groupId: currentGroupId,
      shares: 0,
      contributions: 0,
      loanBalance: 0,
      fines: 0,
      joinDate
    }

    const updated = [added, ...members]
    saveAndSync('v360_members', updated, setMembers)

    // Add default expected contribution for current period
    const defaultCont: Contribution = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      groupId: currentGroupId,
      memberId: id,
      expected: 50000,
      paid: 0,
      balance: 50000,
      lastPaymentDate: '',
      status: 'PENDING',
      period: 'Week 34, 2026'
    }
    saveAndSync('v360_contributions', [defaultCont, ...contributions], setContributions)

    // Recalculate group counts
    const updatedGroups = groups.map(g => {
      if (g.id === currentGroupId) {
        return { ...g, membersCount: g.membersCount + 1 }
      }
      return g
    })
    setGroups(updatedGroups)

    addAuditLog('Add Member', 'Members', memberNo, `Added new member ${newMem.name} (${memberNo})`)
  }

  // Record Payment
  const recordPayment = (newPay: Omit<Payment, 'groupId' | 'reference' | 'date'>) => {
    const reference = 'PAY-' + Math.floor(10000 + Math.random() * 90000)
    const date = new Date().toISOString().split('T')[0]
    const pRecord: Payment = {
      ...newPay,
      groupId: currentGroupId,
      reference,
      date,
      status: 'COMPLETED'
    }

    const updatedPayments = [pRecord, ...payments]
    saveAndSync('v360_payments', updatedPayments, setPayments)

    // Update member aggregates and financial cards
    const updatedMembers = members.map(m => {
      if (m.id === newPay.memberId) {
        if (newPay.type === 'Contribution') {
          return { ...m, contributions: m.contributions + newPay.amount }
        } else if (newPay.type === 'Share Purchase') {
          const sharesBought = Math.floor(newPay.amount / 5000)
          return { ...m, shares: m.shares + sharesBought }
        } else if (newPay.type === 'Loan Repayment') {
          return { ...m, loanBalance: Math.max(0, m.loanBalance - newPay.amount) }
        } else if (newPay.type === 'Fine Payment') {
          return { ...m, fines: Math.max(0, m.fines - newPay.amount) }
        }
      }
      return m
    })
    saveAndSync('v360_members', updatedMembers, setMembers)

    // Update specific modules (Contributions tracker, Loans balance, etc.)
    if (newPay.type === 'Contribution') {
      const updatedCont = contributions.map(c => {
        if (c.memberId === newPay.memberId && c.groupId === currentGroupId) {
          const newPaid = c.paid + newPay.amount
          const newBal = Math.max(0, c.expected - newPaid)
          return {
            ...c,
            paid: newPaid,
            balance: newBal,
            lastPaymentDate: date,
            status: newBal === 0 ? 'PAID' : 'PARTIALLY PAID' as any
          }
        }
        return c
      })
      saveAndSync('v360_contributions', updatedCont, setContributions)
    }

    if (newPay.type === 'Share Purchase') {
      const sharesBought = Math.floor(newPay.amount / 5000)
      const shareTx: ShareTransaction = {
        id: 'st_' + Math.random().toString(36).substr(2, 9),
        memberId: newPay.memberId,
        sharesCount: sharesBought,
        value: newPay.amount,
        type: 'BUY',
        date,
        status: 'COMPLETED'
      }
      saveAndSync('v360_shares_tx', [shareTx, ...shareTransactions], setShareTransactions)
    }

    if (newPay.type === 'Loan Repayment') {
      // Find active loan for member and deduct
      const activeLoan = loans.find(l => l.memberId === newPay.memberId && l.status === 'DISBURSED')
      if (activeLoan) {
        const updatedLoans = loans.map(l => {
          if (l.id === activeLoan.id) {
            const paid = l.totalPaid + newPay.amount
            const balance = Math.max(0, (l.principal + l.interest) - paid)
            const progress = Math.min(100, Math.floor((paid / (l.principal + l.interest)) * 100))
            return {
              ...l,
              totalPaid: paid,
              remainingBalance: balance,
              progress,
              status: balance === 0 ? 'APPROVED' : 'DISBURSED' as any
            }
          }
          return l
        })
        saveAndSync('v360_loans', updatedLoans, setLoans)

        // Mark repayment schedule as paid
        const sched = repayments.map(r => {
          if (r.loanId === activeLoan.id && r.status !== 'PAID') {
            return { ...r, paid: r.totalDue, balance: 0, status: 'PAID' as any }
          }
          return r
        })
        saveAndSync('v360_repayments', sched, setRepayments)
      }
    }

    if (newPay.type === 'Fine Payment') {
      const fineList = fines.map(f => {
        if (f.memberId === newPay.memberId && f.status === 'UNPAID') {
          return { ...f, paid: f.amount, outstanding: 0, status: 'PAID' as any }
        }
        return f
      })
      saveAndSync('v360_fines', fineList, setFines)
    }

    // Ledger update (debit cash or bank)
    const ledgerAccount = newPay.method === 'Bank' ? 'Bank' : newPay.method === 'Mobile Money' ? 'Mobile Money' : 'Cash'
    const newLRecord: LedgerTransaction = {
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      groupId: currentGroupId,
      date,
      reference,
      description: `Payment received: ${newPay.type} from ${members.find(m => m.id === newPay.memberId)?.name || 'Member'}`,
      account: ledgerAccount as any,
      debit: newPay.amount,
      credit: 0,
      balance: (currentGroup.availableCash + newPay.amount)
    }
    saveAndSync('v360_ledger', [newLRecord, ...ledger], setLedger)

    // Recalculate group dashboard values
    const updatedGroups = groups.map(g => {
      if (g.id === currentGroupId) {
        let contAddition = newPay.type === 'Contribution' ? newPay.amount : 0
        let shareAddition = newPay.type === 'Share Purchase' ? newPay.amount : 0
        let outstandingDeduction = newPay.type === 'Loan Repayment' ? newPay.amount : 0
        let cashAddition = newPay.amount

        return {
          ...g,
          totalContributions: g.totalContributions + contAddition,
          totalShares: g.totalShares + shareAddition,
          outstandingLoans: Math.max(0, g.outstandingLoans - outstandingDeduction),
          availableCash: newPay.method !== 'Bank' ? g.availableCash + cashAddition : g.availableCash,
          bankBalance: newPay.method === 'Bank' ? g.bankBalance + cashAddition : g.bankBalance,
          outstandingFines: newPay.type === 'Fine Payment' ? Math.max(0, g.outstandingFines - newPay.amount) : g.outstandingFines
        }
      }
      return g
    })
    setGroups(updatedGroups)

    addAuditLog('Record Payment', 'Finance', reference, `Recorded payment ref ${reference} of TZS ${newPay.amount.toLocaleString()} type ${newPay.type}`)
  }

  // Loan Request Application
  const applyLoan = (newLoan: Omit<Loan, 'id' | 'groupId' | 'principal' | 'interest' | 'totalPaid' | 'remainingBalance' | 'status' | 'nextPaymentDate' | 'maturityDate' | 'progress'>) => {
    const id = 'l_' + Math.random().toString(36).substr(2, 9)
    const requestedDate = new Date().toISOString().split('T')[0]

    const addedLoan: Loan = {
      ...newLoan,
      id,
      groupId: currentGroupId,
      principal: newLoan.amount,
      interest: Math.floor(newLoan.amount * 0.1),
      totalPaid: 0,
      remainingBalance: Math.floor(newLoan.amount * 1.1),
      requestedDate,
      status: 'PENDING',
      nextPaymentDate: '',
      maturityDate: '',
      progress: 0
    }

    const updated = [...loans, addedLoan]
    saveAndSync('v360_loans', updated, setLoans)

    // Notify administrators
    const newNotification: Notification = {
      id: 'not_' + Math.random().toString(36).substr(2, 9),
      groupId: currentGroupId,
      message: `New Loan Application from ${members.find(m => m.id === newLoan.memberId)?.name || 'Member'} for TZS ${newLoan.amount.toLocaleString()}`,
      category: 'loan',
      date: requestedDate,
      read: false
    }
    saveAndSync('v360_notifications', [newNotification, ...notifications], setNotifications)

    addAuditLog('Apply Loan', 'Loans', id, `Member requested loan of TZS ${newLoan.amount.toLocaleString()}`)
  }

  // Approve Loan Application
  const approveLoan = (loanId: string) => {
    const date = new Date().toISOString().split('T')[0]
    const nextPayDate = new Date()
    nextPayDate.setMonth(nextPayDate.getMonth() + 1)
    const nextPayStr = nextPayDate.toISOString().split('T')[0]
    const maturity = new Date()
    maturity.setMonth(maturity.getMonth() + 4)
    const maturityStr = maturity.toISOString().split('T')[0]

    let loanDetails: Loan | undefined

    const updatedLoans = loans.map(l => {
      if (l.id === loanId) {
        loanDetails = l
        return {
          ...l,
          status: 'DISBURSED' as const,
          nextPaymentDate: nextPayStr,
          maturityDate: maturityStr
        }
      }
      return l
    })
    saveAndSync('v360_loans', updatedLoans, setLoans)

    if (loanDetails) {
      const loan = loanDetails as Loan
      const reference = 'PAY-' + Math.floor(10000 + Math.random() * 90000)
      const pRecord: Payment = {
        reference,
        groupId: currentGroupId,
        memberId: loan.memberId,
        amount: loan.amount,
        type: 'Expense',
        method: 'Mobile Money',
        date,
        status: 'COMPLETED'
      }
      saveAndSync('v360_payments', [pRecord, ...payments], setPayments)

      const installmentAmt = Math.floor((loan.principal + loan.interest) / 4)
      const principalInst = Math.floor(loan.principal / 4)
      const interestInst = Math.floor(loan.interest / 4)

      const schedules: RepaymentScheduleItem[] = Array.from({ length: 4 }).map((_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() + (i + 1))
        return {
          id: `r_${loanId}_${i + 1}`,
          loanId,
          installmentNumber: i + 1,
          dueDate: d.toISOString().split('T')[0],
          principal: principalInst,
          interest: interestInst,
          penalty: 0,
          totalDue: installmentAmt,
          paid: 0,
          balance: installmentAmt,
          status: 'PENDING'
        }
      })
      saveAndSync('v360_repayments', [...schedules, ...repayments], setRepayments)

      const updatedMembers = members.map(m => {
        if (m.id === loan.memberId) {
          return { ...m, loanBalance: m.loanBalance + (loan.principal + loan.interest) }
        }
        return m
      })
      saveAndSync('v360_members', updatedMembers, setMembers)

      const updatedGroups = groups.map(g => {
        if (g.id === currentGroupId) {
          return {
            ...g,
            outstandingLoans: g.outstandingLoans + (loan.principal + loan.interest),
            availableCash: Math.max(0, g.availableCash - loan.amount)
          }
        }
        return g
      })
      setGroups(updatedGroups)

      addAuditLog('Approve Loan', 'Loans', loanId, `Disbursed Loan #${loanId} to member. Amount TZS ${loan.amount.toLocaleString()}`)
    }
  }

  // Reject Loan
  const rejectLoan = (loanId: string) => {
    const updatedLoans = loans.map(l => {
      if (l.id === loanId) {
        return { ...l, status: 'REJECTED' as const }
      }
      return l
    })
    saveAndSync('v360_loans', updatedLoans, setLoans)
    addAuditLog('Reject Loan', 'Loans', loanId, `Rejected loan application #${loanId}`)
  }

  // Issue Fine
  const issueFine = (newFine: Omit<Fine, 'id' | 'groupId' | 'date' | 'status' | 'paid'>) => {
    const id = 'f_' + Math.random().toString(36).substr(2, 9)
    const date = new Date().toISOString().split('T')[0]

    const addedFine: Fine = {
      ...newFine,
      id,
      groupId: currentGroupId,
      date,
      paid: 0,
      outstanding: newFine.amount,
      status: 'UNPAID'
    }

    saveAndSync('v360_fines', [addedFine, ...fines], setFines)

    const updatedMembers = members.map(m => {
      if (m.id === newFine.memberId) {
        return { ...m, fines: m.fines + newFine.amount }
      }
      return m
    })
    saveAndSync('v360_members', updatedMembers, setMembers)

    const updatedGroups = groups.map(g => {
      if (g.id === currentGroupId) {
        return { ...g, outstandingFines: g.outstandingFines + newFine.amount }
      }
      return g
    })
    setGroups(updatedGroups)

    addAuditLog('Issue Fine', 'Fines', id, `Issued fine to member. Type: ${newFine.fineType}, Amount: TZS ${newFine.amount.toLocaleString()}`)
  }

  // Waive Fine
  const waiveFine = (fineId: string) => {
    let waivedAmt = 0
    let memberId = ''

    const updatedFines = fines.map(f => {
      if (f.id === fineId) {
        waivedAmt = f.outstanding
        memberId = f.memberId
        return { ...f, outstanding: 0, status: 'WAIVED' as const }
      }
      return f
    })
    saveAndSync('v360_fines', updatedFines, setFines)

    if (memberId) {
      const updatedMembers = members.map(m => {
        if (m.id === memberId) {
          return { ...m, fines: Math.max(0, m.fines - waivedAmt) }
        }
        return m
      })
      saveAndSync('v360_members', updatedMembers, setMembers)

      const updatedGroups = groups.map(g => {
        if (g.id === currentGroupId) {
          return { ...g, outstandingFines: Math.max(0, g.outstandingFines - waivedAmt) }
        }
        return g
      })
      setGroups(updatedGroups)
    }

    addAuditLog('Waive Fine', 'Fines', fineId, `Waived fine #${fineId} of TZS ${waivedAmt.toLocaleString()}`)
  }

  // Pay Fine Directly
  const payFine = (fineId: string) => {
    const fineRecord = fines.find(f => f.id === fineId)
    if (fineRecord) {
      recordPayment({
        memberId: fineRecord.memberId,
        amount: fineRecord.outstanding,
        type: 'Fine Payment',
        method: 'Cash'
      })
    }
  }

  // Jamii Support Claim request
  const requestJamiiSupport = (req: Omit<JamiiRequest, 'id' | 'groupId' | 'approvedAmount' | 'status' | 'date'>) => {
    const id = 'j_' + Math.random().toString(36).substr(2, 9)
    const date = new Date().toISOString().split('T')[0]
    const added: JamiiRequest = {
      ...req,
      id,
      groupId: currentGroupId,
      approvedAmount: 0,
      status: 'PENDING',
      date
    }
    saveAndSync('v360_jamii', [added, ...jamiiRequests], setJamiiRequests)
    addAuditLog('Jamii Support Request', 'Community', id, `Requested Jamii Fund support claim of TZS ${req.requestedAmount.toLocaleString()}`)
  }

  // Approve Jamii Support
  const approveJamiiSupport = (requestId: string, amount: number) => {
    const updated = jamiiRequests.map(r => {
      if (r.id === requestId) {
        return { ...r, approvedAmount: amount, status: 'APPROVED' as const }
      }
      return r
    })
    saveAndSync('v360_jamii', updated, setJamiiRequests)
    addAuditLog('Approve Jamii Support', 'Community', requestId, `Approved Jamii support claim #${requestId} with amount TZS ${amount.toLocaleString()}`)
  }

  // Reject Jamii Support
  const rejectJamiiSupport = (requestId: string) => {
    const updated = jamiiRequests.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'REJECTED' as const }
      }
      return r
    })
    saveAndSync('v360_jamii', updated, setJamiiRequests)
    addAuditLog('Reject Jamii Support', 'Community', requestId, `Rejected Jamii support claim #${requestId}`)
  }

  // Disburse Jamii Support (Paid)
  const payJamiiSupport = (requestId: string) => {
    const req = jamiiRequests.find(r => r.id === requestId)
    if (req) {
      const updated = jamiiRequests.map(r => {
        if (r.id === requestId) {
          return { ...r, status: 'PAID' as const }
        }
        return r
      })
      saveAndSync('v360_jamii', updated, setJamiiRequests)

      const updatedGroups = groups.map(g => {
        if (g.id === currentGroupId) {
          return {
            ...g,
            jamiiFund: Math.max(0, g.jamiiFund - req.approvedAmount),
            availableCash: Math.max(0, g.availableCash - req.approvedAmount)
          }
        }
        return g
      })
      setGroups(updatedGroups)

      const reference = 'PAY-' + Math.floor(10000 + Math.random() * 90000)
      const ledgerRecord: LedgerTransaction = {
        id: 'l_' + Math.random().toString(36).substr(2, 9),
        groupId: currentGroupId,
        date: new Date().toISOString().split('T')[0],
        reference,
        description: `Jamii Fund claim paid: ${req.type} support to ${members.find(m => m.id === req.memberId)?.name || 'Member'}`,
        account: 'Cash',
        debit: 0,
        credit: req.approvedAmount,
        balance: (currentGroup.availableCash - req.approvedAmount)
      }
      saveAndSync('v360_ledger', [ledgerRecord, ...ledger], setLedger)

      addAuditLog('Disburse Jamii Support', 'Community', requestId, `Disbursed TZS ${req.approvedAmount.toLocaleString()} support cash from Jamii Fund`)
    }
  }

  // Create Meeting
  const createMeeting = (newM: Omit<Meeting, 'id' | 'groupId' | 'attendanceRate' | 'status'>) => {
    const id = 'mt_' + Math.random().toString(36).substr(2, 9)
    const added: Meeting = {
      ...newM,
      id,
      groupId: currentGroupId,
      attendanceRate: 0,
      status: 'UPCOMING'
    }
    saveAndSync('v360_meetings', [...meetings, added], setMeetings)
    addAuditLog('Create Meeting', 'Meetings', id, `Scheduled a new meeting for ${newM.date}`)
  }

  // Save Attendance Register
  const saveAttendance = (meetingId: string, list: Omit<Attendance, 'id'>[]) => {
    const attendanceRecords: Attendance[] = list.map(item => ({
      ...item,
      id: 'at_' + Math.random().toString(36).substr(2, 9)
    }))

    const filtered = attendance.filter(a => a.meetingId !== meetingId)
    saveAndSync('v360_attendance', [...filtered, ...attendanceRecords], setAttendance)

    const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
    const attendanceRate = Math.round((presentCount / members.length) * 100)

    const updatedMeetings = meetings.map(m => {
      if (m.id === meetingId) {
        return {
          ...m,
          status: 'COMPLETED' as const,
          attendanceRate
        }
      }
      return m
    })
    saveAndSync('v360_meetings', updatedMeetings, setMeetings)

    // Issue fines
    attendanceRecords.forEach(att => {
      if (att.status === 'ABSENT') {
        issueFine({
          memberId: att.memberId,
          fineType: 'Absence',
          amount: 15000
        })
      } else if (att.status === 'LATE') {
        issueFine({
          memberId: att.memberId,
          fineType: 'Late Meeting',
          amount: 5000
        })
      }
    })

    addAuditLog('Record Attendance', 'Meetings', meetingId, `Recorded attendance register for meeting #${meetingId}. Rate: ${attendanceRate}%`)
  }

  // Record Expense
  const recordExpense = (newExp: Omit<Expense, 'id' | 'groupId' | 'date' | 'status'>) => {
    const id = 'exp_' + Math.random().toString(36).substr(2, 9)
    const date = new Date().toISOString().split('T')[0]

    const added: Expense = {
      ...newExp,
      id,
      groupId: currentGroupId,
      date,
      status: 'PENDING'
    }

    saveAndSync('v360_expenses', [added, ...expenses], setExpenses)
    addAuditLog('Record Expense', 'Finance', id, `Logged a new expense: TZS ${newExp.amount.toLocaleString()} for ${newExp.description}`)
  }

  // Approve Expense
  const approveExpense = (expenseId: string) => {
    const exp = expenses.find(e => e.id === expenseId)
    if (exp) {
      const updated = expenses.map(e => {
        if (e.id === expenseId) {
          return { ...e, status: 'APPROVED' as const }
        }
        return e
      })
      saveAndSync('v360_expenses', updated, setExpenses)

      const updatedGroups = groups.map(g => {
        if (g.id === currentGroupId) {
          return {
            ...g,
            availableCash: Math.max(0, g.availableCash - exp.amount)
          }
        }
        return g
      })
      setGroups(updatedGroups)

      const reference = 'PAY-' + Math.floor(10000 + Math.random() * 90000)
      const ledgerRecord: LedgerTransaction = {
        id: 'l_' + Math.random().toString(36).substr(2, 9),
        groupId: currentGroupId,
        date: new Date().toISOString().split('T')[0],
        reference,
        description: `Expense approved & paid: ${exp.category} - ${exp.description}`,
        account: 'Cash',
        debit: 0,
        credit: exp.amount,
        balance: (currentGroup.availableCash - exp.amount)
      }
      saveAndSync('v360_ledger', [ledgerRecord, ...ledger], setLedger)

      addAuditLog('Approve Expense', 'Finance', expenseId, `Approved & settled expense: TZS ${exp.amount.toLocaleString()}`)
    }
  }

  // Reject Expense
  const rejectExpense = (expenseId: string) => {
    const updated = expenses.map(e => {
      if (e.id === expenseId) {
        return { ...e, status: 'REJECTED' as const }
      }
      return e
    })
    saveAndSync('v360_expenses', updated, setExpenses)
    addAuditLog('Reject Expense', 'Finance', expenseId, `Rejected expense #${expenseId}`)
  }

  // Notifications read trigger
  const markAllNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    saveAndSync('v360_notifications', updated, setNotifications)
  }

  // Helper log addition
  const addAuditLog = (action: string, module: string, reference: string, details: string) => {
    const dateStr = new Date().toISOString().replace('T', ' ').substr(0, 19)
    const log: AuditLog = {
      id: 'aud_' + Math.random().toString(36).substr(2, 9),
      groupId: currentGroupId,
      date: dateStr,
      user: 'Juma Majid',
      action,
      module,
      reference,
      ipAddress: '197.250.22.45',
      details
    }
    setAuditLogs(prev => {
      const updated = [log, ...prev]
      if (typeof window !== 'undefined') {
        localStorage.setItem('v360_auditLogs', JSON.stringify(updated))
      }
      return updated
    })
  }

  return (
    <VikobaStoreContext.Provider value={{
      isHydrated,
      groups,
      currentGroupId,
      setCurrentGroupId,
      currentGroup,
      members,
      contributions,
      shareTransactions,
      loans,
      repayments,
      fines,
      jamiiRequests,
      meetings,
      attendance,
      payments,
      expenses,
      ledger,
      auditLogs,
      notifications,

      addMember,
      recordPayment,
      applyLoan,
      approveLoan,
      rejectLoan,
      issueFine,
      waiveFine,
      payFine,
      requestJamiiSupport,
      approveJamiiSupport,
      rejectJamiiSupport,
      payJamiiSupport,
      createMeeting,
      saveAttendance,
      recordExpense,
      approveExpense,
      rejectExpense,
      markAllNotificationsRead,
      addAuditLog
    }}>
      {children}
    </VikobaStoreContext.Provider>
  )
}

export const useVikobaStore = () => {
  const context = useContext(VikobaStoreContext)
  if (!context) throw new Error('useVikobaStore must be used within VikobaStoreProvider')
  return context
}
