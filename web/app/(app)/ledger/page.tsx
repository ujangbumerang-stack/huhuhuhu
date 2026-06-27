'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Transaction {
    id: string;
    ref: string;
    date: string;
    descriptionTitle: string;
    descriptionDetails: string;
    iconType: 'contributions' | 'maintenance' | 'gala' | 'charge' | 'donation';
    pocket: string;
    status: 'Verified' | 'Pending' | 'Flagged';
    amount: number;
}

const DEFAULT_TRANSACTIONS: Transaction[] = [
    {
        id: "txn_1",
        ref: "TXN-894A",
        date: "Oct 24, 2023",
        descriptionTitle: "Monthly Member Contributions",
        descriptionDetails: "Batch deposit from 45 members",
        iconType: "contributions",
        pocket: "Operational",
        status: "Verified",
        amount: 4500.00
    },
    {
        id: "txn_2",
        ref: "TXN-893B",
        date: "Oct 22, 2023",
        descriptionTitle: "Facility Maintenance",
        descriptionDetails: "Plumbing repairs main hall",
        iconType: "maintenance",
        pocket: "Reserve Fund",
        status: "Verified",
        amount: -850.00
    },
    {
        id: "txn_3",
        ref: "TXN-892A",
        date: "Oct 21, 2023",
        descriptionTitle: "Annual Gala Deposit",
        descriptionDetails: "Venue booking fee (Pending clea...",
        iconType: "gala",
        pocket: "Event Planning",
        status: "Pending",
        amount: -2000.00
    },
    {
        id: "txn_4",
        ref: "TXN-891X",
        date: "Oct 18, 2023",
        descriptionTitle: "Unknown Vendor Charge",
        descriptionDetails: "Requires committee review",
        iconType: "charge",
        pocket: "Operational",
        status: "Flagged",
        amount: -145.50
    },
    {
        id: "txn_5",
        ref: "TXN-890A",
        date: "Oct 15, 2023",
        descriptionTitle: "Anonymous Donation",
        descriptionDetails: "Direct wire transfer",
        iconType: "donation",
        pocket: "Reserve Fund",
        status: "Verified",
        amount: 1000.00
    }
];

function usd(val: number) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    });
    return formatter.format(val);
}

export default function LedgerPage() {
    const router = useRouter();
    const [slug, setSlug] = useState<string>('keluarga-cemara');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedPocketFilter, setSelectedPocketFilter] = useState('All Pockets');
    const [selectedDateFilter, setSelectedDateFilter] = useState('Last 30 Days');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses');
    const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');

    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    useEffect(() => {
        const storedTx = localStorage.getItem(`kyklos_ledger_${slug}`);
        if (storedTx) {
            try {
                setTransactions(JSON.parse(storedTx));
            } catch {
                setTransactions(DEFAULT_TRANSACTIONS);
            }
        } else {
            setTransactions(DEFAULT_TRANSACTIONS);
        }
    }, [slug]);

    const totalLedgerBalanceUsd = transactions.reduce((sum, t) => sum + t.amount, 124500.00 - DEFAULT_TRANSACTIONS.reduce((s, d) => s + d.amount, 0));
    const totalInflowYtd = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 45200.00);
    const totalOutflowYtd = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, -12850.00));

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = 
            t.descriptionTitle.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) ||
            t.descriptionDetails.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) ||
            t.ref.toLowerCase().includes(ledgerSearchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedPocketFilter !== 'All Pockets') {
            if (selectedPocketFilter === 'Operational' && t.pocket !== 'Operational') return false;
            if (selectedPocketFilter === 'Reserve Fund' && t.pocket !== 'Reserve Fund') return false;
            if (selectedPocketFilter === 'Event Planning' && t.pocket !== 'Event Planning') return false;
        }

        if (selectedStatusFilter !== 'All Statuses') {
            if (t.status !== selectedStatusFilter) return false;
        }

        return true;
    });

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">
                        Transaction Ledger
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                        A comprehensive record of all incoming and outgoing funds across community pockets.
                    </p>
                </div>

                <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer select-none self-start sm:self-auto">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Ledger Balance</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                        <p className="font-serif text-2xl font-extrabold text-slate-800 tracking-tight">{usd(totalLedgerBalanceUsd)}</p>
                        <span className="text-[11px] font-semibold text-emerald-600">↑ +2.4% vs last month</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Inflow (YTD)</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
                        </svg>
                    </div>
                    <div className="space-y-2 mt-4">
                        <p className="font-serif text-2xl font-extrabold text-slate-800 tracking-tight">{usd(totalInflowYtd)}</p>
                        <span className="inline-block text-[9px] font-extrabold bg-[#E0F2FE] text-[#0284C7] px-2 py-0.5 rounded tracking-wider uppercase">324 Transactions</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Outflow (YTD)</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                        </svg>
                    </div>
                    <div className="space-y-2 mt-4">
                        <p className="font-serif text-2xl font-extrabold text-slate-800 tracking-tight">{usd(totalOutflowYtd)}</p>
                        <span className="inline-block text-[9px] font-extrabold bg-rose-50 text-rose-600 px-2 py-0.5 rounded tracking-wider uppercase">86 Transactions</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div className="relative">
                    <select 
                        value={selectedPocketFilter} 
                        onChange={e => setSelectedPocketFilter(e.target.value)}
                        className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0F3A4B] appearance-none cursor-pointer"
                    >
                        <option>All Pockets</option>
                        <option>Operational</option>
                        <option>Reserve Fund</option>
                        <option>Event Planning</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                <div className="relative">
                    <select 
                        value={selectedDateFilter} 
                        onChange={e => setSelectedDateFilter(e.target.value)}
                        className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0F3A4B] appearance-none cursor-pointer"
                    >
                        <option>Last 30 Days</option>
                        <option>Last 60 Days</option>
                        <option>This Year</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                <div className="relative">
                    <select 
                        value={selectedStatusFilter} 
                        onChange={e => setSelectedStatusFilter(e.target.value)}
                        className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0F3A4B] appearance-none cursor-pointer"
                    >
                        <option value="All Statuses">All Statuses</option>
                        <option value="Verified">Verified</option>
                        <option value="Pending">Pending</option>
                        <option value="Flagged">Flagged</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input 
                        type="text" 
                        value={ledgerSearchQuery}
                        onChange={e => setLedgerSearchQuery(e.target.value)}
                        placeholder="Search ref, memo..."
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] bg-white text-slate-900 placeholder:text-slate-500 transition"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                                <th className="px-6 py-4">Date & Ref</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Pocket</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-xs text-gray-400 font-medium">
                                        Tidak ada riwayat transaksi yang cocok dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => {
                                    const isVerified = t.status === 'Verified';
                                    const isPending = t.status === 'Pending';
                                    const isFlagged = t.status === 'Flagged';
                                    const isPositive = t.amount > 0;

                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50/30 transition duration-150">
                                            <td className="px-6 py-3.5">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 leading-tight">{t.date}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{t.ref}</p>
                                                </div>
                                            </td>

                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                                        {t.iconType === 'contributions' && (
                                                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        )}
                                                        {t.iconType === 'maintenance' && (
                                                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        )}
                                                        {t.iconType === 'gala' && (
                                                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                                                        )}
                                                        {t.iconType === 'charge' && (
                                                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                        )}
                                                        {t.iconType === 'donation' && (
                                                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 leading-tight">{t.descriptionTitle}</p>
                                                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{t.descriptionDetails}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-3.5 text-xs font-semibold text-slate-600">
                                                {t.pocket}
                                            </td>

                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded ${
                                                    isVerified
                                                        ? 'bg-sky-50 text-[#0284C7] border border-[#E0F2FE]'
                                                        : isPending
                                                            ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                    <span className={`w-1 h-1 rounded-full ${isVerified ? 'bg-[#0284C7]' : isPending ? 'bg-orange-500' : 'bg-rose-500'}`}></span>
                                                    {t.status}
                                                </span>
                                            </td>

                                            <td className={`px-6 py-3.5 text-xs font-extrabold text-right ${isPositive ? 'text-[#0284C7]' : 'text-slate-800'}`}>
                                                {isPositive ? `+${usd(t.amount)}` : usd(t.amount)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/10">
                    <p className="text-[10px] text-gray-400 font-semibold select-none">
                        Showing 1 to {filteredTransactions.length} of 410 entries
                    </p>
                    <div className="flex gap-1.5 select-none self-end sm:self-auto">
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:bg-slate-50 transition cursor-pointer">
                            &lt;
                        </button>
                        <button className="w-7 h-7 rounded-lg bg-[#0F3A4B] text-white flex items-center justify-center text-xs font-bold">
                            1
                        </button>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:bg-slate-50 transition cursor-pointer">
                            2
                        </button>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:bg-slate-50 transition cursor-pointer">
                            3
                        </button>
                        <span className="w-7 h-7 flex items-end justify-center text-xs text-gray-400 select-none pb-1">...</span>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:bg-slate-50 transition cursor-pointer">
                            82
                        </button>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:bg-slate-50 transition cursor-pointer">
                            &gt;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
