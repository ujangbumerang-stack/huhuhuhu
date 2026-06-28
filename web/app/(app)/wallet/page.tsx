'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { idr } from '@/lib/format';

interface TopUp {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
}

interface Withdrawal {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    bankName: string;
    accountNumber: string;
}

export default function WalletPage() {
    const [balance, setBalance] = useState<number>(0);
    const [topups, setTopups] = useState<TopUp[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);

    const [showTopupModal, setShowTopupModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    
    const [topupForm, setTopupForm] = useState({ amount: '' });
    const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const [balRes, topupsRes, wdrawsRes] = await Promise.all([
                api.get<any>('/wallet/balance'),
                api.get<TopUp[]>('/wallet/topups'),
                api.get<Withdrawal[]>('/wallet/withdrawals')
            ]);
            setBalance(balRes.balance || 0);
            setTopups(topupsRes || []);
            setWithdrawals(wdrawsRes || []);
        } catch (err) {
            console.error('Failed to load wallet data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post<any>('/wallet/topup', { amount: parseFloat(topupForm.amount) });
            if (res.token) {
                // If midtrans is integrated, we would show snap here
                alert('Top up request created. Status is pending (Mock integration).');
            } else {
                alert('Top up successful (Mocked fallback).');
            }
            setShowTopupModal(false);
            setTopupForm({ amount: '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Topup failed');
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/wallet/withdraw', {
                amount: parseFloat(withdrawForm.amount),
                bankName: withdrawForm.bankName,
                accountNumber: withdrawForm.accountNumber,
                accountHolder: withdrawForm.accountHolder
            });
            setShowWithdrawModal(false);
            setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });
            alert('Permintaan penarikan berhasil dibuat. Menunggu persetujuan admin.');
            loadData();
        } catch (err: any) {
            alert(err.message || 'Withdrawal failed');
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Personal Wallet</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">Manage your personal funds, top up balance, and withdraw money.</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#0B1E26] to-primary rounded-2xl p-6 shadow-sm flex flex-col justify-between text-white max-w-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <div className="relative z-10">
                    <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Available Balance</span>
                    <div className="space-y-1 mt-4">
                        <p className="font-serif text-3xl font-black tracking-tight text-white">
                            {loading ? '...' : idr(balance)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                        <button 
                            onClick={() => setShowTopupModal(true)}
                            className="flex-1 py-2.5 bg-white text-[#0B1E26] rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-sm cursor-pointer"
                        >
                            Top Up
                        </button>
                        <button 
                            onClick={() => setShowWithdrawModal(true)}
                            className="flex-1 py-2.5 border border-white/20 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition shadow-sm cursor-pointer"
                        >
                            Withdraw
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                        <h3 className="font-serif text-base font-bold text-slate-800 tracking-tight">Top Up History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <tbody className="divide-y divide-gray-50">
                                {topups.length === 0 ? (
                                    <tr><td className="px-6 py-8 text-center text-xs text-gray-400">Tidak ada riwayat top up.</td></tr>
                                ) : topups.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50/30">
                                        <td className="px-6 py-3.5">
                                            <p className="text-xs font-bold text-slate-800">Top Up</p>
                                            <p className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-3.5 text-xs font-extrabold text-[#0284C7]">{idr(t.amount)}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                {t.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                        <h3 className="font-serif text-base font-bold text-slate-800 tracking-tight">Withdrawal History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <tbody className="divide-y divide-gray-50">
                                {withdrawals.length === 0 ? (
                                    <tr><td className="px-6 py-8 text-center text-xs text-gray-400">Tidak ada riwayat penarikan.</td></tr>
                                ) : withdrawals.map(w => (
                                    <tr key={w.id} className="hover:bg-gray-50/30">
                                        <td className="px-6 py-3.5">
                                            <p className="text-xs font-bold text-slate-800">Withdrawal to {w.bankName}</p>
                                            <p className="text-[10px] text-gray-400">{w.accountNumber} • {new Date(w.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-3.5 text-xs font-extrabold text-slate-800">-{idr(w.amount)}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${w.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : w.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                {w.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showTopupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <form onSubmit={handleTopup} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                        <h3 className="font-serif text-lg font-bold">Top Up Wallet</h3>
                        <input 
                            type="number" required value={topupForm.amount}
                            onChange={e => setTopupForm({ amount: e.target.value })}
                            placeholder="Amount (e.g. 100000)"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowTopupModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm">Top Up</button>
                        </div>
                    </form>
                </div>
            )}

            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <form onSubmit={handleWithdraw} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                        <h3 className="font-serif text-lg font-bold">Withdraw Funds</h3>
                        <input 
                            type="number" required value={withdrawForm.amount}
                            onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                            placeholder="Amount (e.g. 50000)"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <input 
                            type="text" required value={withdrawForm.bankName}
                            onChange={e => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                            placeholder="Bank Name (e.g. BCA)"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <input 
                            type="text" required value={withdrawForm.accountNumber}
                            onChange={e => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                            placeholder="Account Number"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <input 
                            type="text" required value={withdrawForm.accountHolder}
                            onChange={e => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                            placeholder="Account Holder Name"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm">Withdraw</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

