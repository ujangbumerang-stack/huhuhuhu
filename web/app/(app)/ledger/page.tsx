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
    iconType: string;
    pocket: string;
    status: string;
    amount: number;
}

export default function LedgerPage() {
    const router = useRouter();
    const [slug, setSlug] = useState<string>('keluarga-cemara');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedPocketFilter, setSelectedPocketFilter] = useState('All Pockets');
    const [selectedDateFilter, setSelectedDateFilter] = useState('Last 30 Days');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses');
    const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    useEffect(() => {
        const fetchLedger = async () => {
            setLoading(true);
            try {
                const list = await api.get<any[]>('/communities');
                const c = list.find(x => x.slug === slug) || list[0];
                if (!c) {
                    router.push('/login');
                    return;
                }
                const dashboard = await api.get<any>(`/communities/${c.id}/dashboard`);
                const formattedTxs = dashboard.recentTransactions.map((t: any) => ({
                    id: t.id,
                    ref: t.id.substring(0, 8).toUpperCase(),
                    date: new Date(t.createdAt).toLocaleDateString(),
                    descriptionTitle: t.note || (t.direction === 'in' ? 'Deposit' : 'Withdrawal'),
                    descriptionDetails: t.member?.name || 'System',
                    iconType: t.direction === 'in' ? 'contributions' : 'charge',
                    pocket: t.pocket?.name || 'Kas Umum',
                    status: 'Verified',
                    amount: t.direction === 'in' ? Number(t.amount) : -Number(t.amount)
                }));
                setTransactions(formattedTxs);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, [slug, router]);

    const usd = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    const totalLedgerBalanceUsd = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalInflowYtd = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalOutflowYtd = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Ledger Balance</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                        <p className="font-serif text-2xl font-extrabold text-slate-800 tracking-tight">{usd(totalLedgerBalanceUsd)}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Inflow (YTD)</span>
                    </div>
                    <div className="space-y-2 mt-4">
                        <p className="font-serif text-2xl font-extrabold text-slate-800 tracking-tight">{usd(totalInflowYtd)}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Outflow (YTD)</span>
                    </div>
                    <div className="space-y-2 mt-4">
                        <p className="font-serif text-2xl font-extrabold text-slate-800 tracking-tight">{usd(totalOutflowYtd)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden mt-6">
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
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs text-gray-400">Loading...</td></tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-xs text-gray-400 font-medium">
                                        Tidak ada riwayat transaksi yang cocok dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => {
                                    const isVerified = t.status === 'Verified';
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
                                                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded bg-sky-50 text-[#0284C7] border border-[#E0F2FE]">
                                                    <span className="w-1 h-1 rounded-full bg-[#0284C7]"></span>
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
            </div>
        </div>
    );
}
