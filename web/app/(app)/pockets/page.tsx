'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { idr } from '@/lib/format';

interface Pocket {
    id: string;
    name: string;
    type: 'general' | 'arisan' | 'social';
    description: string;
    balance: number;
    targetLabel: string;
    targetAmount: number;
    targetPercentage: number;
    cycleInfo?: string;
    buttonType: 'general' | 'arisan' | 'social';
}

const DEFAULT_POCKETS: Pocket[] = [
    {
        id: "pocket_kas_umum",
        name: "Kas Umum",
        type: "general",
        description: "General Operating Fund",
        balance: 45200000,
        targetLabel: "Monthly Target",
        targetAmount: 50000000,
        targetPercentage: 90,
        buttonType: "general"
    },
    {
        id: "pocket_arisan",
        name: "Arisan Bulanan",
        type: "arisan",
        description: "Rotational Savings Pool",
        balance: 60000000,
        targetLabel: "Collection Progress",
        targetAmount: 60000000,
        targetPercentage: 100,
        cycleInfo: "Cycle 4/12",
        buttonType: "arisan"
    },
    {
        id: "pocket_social",
        name: "Social Fund",
        type: "social",
        description: "Emergency & Charity",
        balance: 19300000,
        targetLabel: "Replenishment Goal",
        targetAmount: 30000000,
        targetPercentage: 64,
        buttonType: "social"
    }
];

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

export default function PocketsPage() {
    const router = useRouter();
    const [slug, setSlug] = useState<string>('keluarga-cemara');
    const [pockets, setPockets] = useState<Pocket[]>([]);
    const [showNewPocketModal, setShowNewPocketModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState<{
        type: 'deposit' | 'transfer' | 'disburse' | 'donate' | 'expense' | 'rebalance';
        pocketId?: string;
    } | null>(null);

    // Form inputs
    const [newPocketForm, setNewPocketForm] = useState({
        name: '',
        type: 'general' as 'general' | 'arisan' | 'social',
        description: '',
        initialBalance: '',
        targetAmount: '',
        cycleTotal: '12'
    });

    const [txForm, setTxForm] = useState({
        amount: '',
        destinationPocketId: '',
        notes: ''
    });

    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    // Ambil data pockets
    useEffect(() => {
        const stored = localStorage.getItem(`kyklos_pockets_${slug}`);
        if (stored) {
            try {
                setPockets(JSON.parse(stored));
            } catch {
                setPockets(DEFAULT_POCKETS);
            }
        } else {
            setPockets(DEFAULT_POCKETS);
        }
    }, [slug]);

    const savePockets = (newPockets: Pocket[]) => {
        setPockets(newPockets);
        localStorage.setItem(`kyklos_pockets_${slug}`, JSON.stringify(newPockets));
    };

    // Hitung total likuiditas
    const totalLiquidity = pockets.reduce((sum, p) => sum + p.balance, 0);

    // Handler membuat pocket baru
    const handleCreatePocket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPocketForm.name.trim()) return;

        const initial = parseFloat(newPocketForm.initialBalance) || 0;
        const target = parseFloat(newPocketForm.targetAmount) || 10000000;
        const percentage = target > 0 ? Math.min(100, Math.round((initial / target) * 100)) : 100;

        const newPocket: Pocket = {
            id: `pocket_${Date.now()}`,
            name: newPocketForm.name,
            type: newPocketForm.type,
            description: newPocketForm.description || (newPocketForm.type === 'general' ? 'Operational Fund' : newPocketForm.type === 'arisan' ? 'Rotational Pool' : 'Social Aid'),
            balance: initial,
            targetLabel: newPocketForm.type === 'general' ? 'Monthly Target' : newPocketForm.type === 'arisan' ? 'Collection Progress' : 'Replenishment Goal',
            targetAmount: target,
            targetPercentage: percentage,
            cycleInfo: newPocketForm.type === 'arisan' ? `Cycle 1/${newPocketForm.cycleTotal}` : undefined,
            buttonType: newPocketForm.type
        };

        const updated = [...pockets, newPocket];
        savePockets(updated);

        // Catat transaksi saldo awal ke ledger
        if (initial > 0) {
            const storedTx = localStorage.getItem(`kyklos_ledger_${slug}`);
            let txs: Transaction[] = [];
            if (storedTx) {
                try { txs = JSON.parse(storedTx); } catch {}
            }
            const newTx: Transaction = {
                id: `txn_${Date.now()}`,
                ref: `TXN-${Math.floor(100 + Math.random() * 900)}X`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                descriptionTitle: `Initial Deposit: ${newPocket.name}`,
                descriptionDetails: "Kantong kas baru didepositkan",
                iconType: "donation",
                pocket: newPocket.type === 'general' ? 'Operational' : newPocket.type === 'arisan' ? 'Arisan Pool' : 'Reserve Fund',
                status: "Verified",
                amount: initial / 15000
            };
            localStorage.setItem(`kyklos_ledger_${slug}`, JSON.stringify([newTx, ...txs]));
        }

        setShowNewPocketModal(false);
        setNewPocketForm({
            name: '',
            type: 'general',
            description: '',
            initialBalance: '',
            targetAmount: '',
            cycleTotal: '12'
        });
    };

    // Handler transaksi
    const handleTransactionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showTransactionModal) return;

        const amountNum = parseFloat(txForm.amount) || 0;
        if (amountNum <= 0) return;

        const targetPocketId = showTransactionModal.pocketId;
        const type = showTransactionModal.type;
        const activePocket = pockets.find(p => p.id === targetPocketId);

        let updated = pockets.map(p => {
            if (p.id === targetPocketId) {
                let newBal = p.balance;
                if (type === 'deposit' || type === 'donate') {
                    newBal += amountNum;
                } else if (type === 'expense') {
                    newBal = Math.max(0, newBal - amountNum);
                } else if (type === 'disburse') {
                    newBal = 0;
                }

                const percentage = p.targetAmount > 0 ? Math.min(100, Math.round((newBal / p.targetAmount) * 100)) : 100;
                return {
                    ...p,
                    balance: newBal,
                    targetPercentage: percentage
                };
            }
            return p;
        });

        // Rebalance
        if (type === 'transfer' || type === 'rebalance') {
            const sourceId = targetPocketId || pockets[0]?.id;
            const destId = txForm.destinationPocketId;

            if (sourceId && destId && sourceId !== destId) {
                updated = pockets.map(p => {
                    if (p.id === sourceId) {
                        const newBal = Math.max(0, p.balance - amountNum);
                        const percentage = p.targetAmount > 0 ? Math.min(100, Math.round((newBal / p.targetAmount) * 100)) : 100;
                        return { ...p, balance: newBal, targetPercentage: percentage };
                    }
                    if (p.id === destId) {
                        const newBal = p.balance + amountNum;
                        const percentage = p.targetAmount > 0 ? Math.min(100, Math.round((newBal / p.targetAmount) * 100)) : 100;
                        return { ...p, balance: newBal, targetPercentage: percentage };
                    }
                    return p;
                });
            }
        }

        savePockets(updated);

        // Catat ke ledger
        const storedTx = localStorage.getItem(`kyklos_ledger_${slug}`);
        let txs: Transaction[] = [];
        if (storedTx) {
            try { txs = JSON.parse(storedTx); } catch {}
        }
        const newTx: Transaction = {
            id: `txn_${Date.now()}`,
            ref: `TXN-${Math.floor(100 + Math.random() * 900)}Y`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            descriptionTitle: type === 'deposit' ? 'Member Deposit Contribution' 
                : type === 'donate' ? 'Charity Donation Received'
                : type === 'expense' ? 'Social Fund Disbursement'
                : type === 'disburse' ? 'Rotational Arisan Payout'
                : 'Pockets Rebalance Transfer',
            descriptionDetails: txForm.notes || `Transaksi ${type} via dasbor`,
            iconType: type === 'deposit' ? 'contributions' 
                : type === 'donate' ? 'donation'
                : type === 'expense' ? 'charge'
                : type === 'disburse' ? 'gala'
                : 'maintenance',
            pocket: activePocket ? (activePocket.type === 'general' ? 'Operational' : activePocket.type === 'arisan' ? 'Arisan Pool' : 'Reserve Fund') : 'Operational',
            status: "Verified",
            amount: (type === 'expense' || type === 'disburse') ? -(amountNum / 15000) : (amountNum / 15000)
        };
        localStorage.setItem(`kyklos_ledger_${slug}`, JSON.stringify([newTx, ...txs]));

        setShowTransactionModal(null);
        setTxForm({ amount: '', destinationPocketId: '', notes: '' });
    };

    // Hapus pocket
    const handleDeletePocket = (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus kantong kas ini?")) {
            const updated = pockets.filter(p => p.id !== id);
            savePockets(updated);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Header Pockets */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">
                        Pockets
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                        Manage and track your distributed funds across various distinct containers.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowTransactionModal({ type: 'rebalance' })}
                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer select-none"
                    >
                        Rebalance
                    </button>
                    <button 
                        onClick={() => setShowNewPocketModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0F3A4B] text-white rounded-xl text-xs font-bold hover:bg-[#0c2e3c] transition shadow-sm cursor-pointer select-none"
                    >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Pocket
                    </button>
                </div>
            </div>

            {/* Total Liquidity Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between max-w-xs min-h-[120px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Liquidity</span>
                <div className="space-y-1 mt-4">
                    <p className="font-serif text-2xl font-black text-slate-800 tracking-tight">
                        {idr(totalLiquidity)}
                    </p>
                    <p className="text-[11px] font-semibold text-gray-400">
                        <span className="text-emerald-600">↑ +4.2%</span> from last month
                    </p>
                </div>
            </div>

            {/* Pockets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {pockets.map((p) => {
                    const isGeneral = p.type === 'general';
                    const isArisan = p.type === 'arisan';
                    const isSocial = p.type === 'social';

                    return (
                        <div key={p.id} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between space-y-6 relative hover:shadow-md transition duration-300">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-[#E0F2FE]/50 flex items-center justify-center flex-shrink-0">
                                        {isGeneral && (
                                            <svg className="w-5 h-5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        )}
                                        {isArisan && (
                                            <svg className="w-5 h-5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        )}
                                        {isSocial && (
                                            <svg className="w-5 h-5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-serif text-lg font-bold text-slate-800 leading-tight">
                                            {p.name}
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wide">
                                            {p.description}
                                        </p>
                                    </div>
                                </div>

                                {isArisan && p.cycleInfo ? (
                                    <span className="text-[9px] font-bold bg-[#E0F2FE] text-[#0284C7] px-2.5 py-1 rounded">
                                        {p.cycleInfo}
                                    </span>
                                ) : (
                                    <button 
                                        onClick={() => handleDeletePocket(p.id)}
                                        className="p-1 hover:bg-slate-50 rounded-lg text-gray-400 hover:text-rose-600 transition cursor-pointer select-none"
                                        title="Hapus Kantong Kas"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {isArisan ? "Pool Balance" : "Available Balance"}
                                </span>
                                <p className="font-serif text-2xl font-black text-[#0F3A4B] tracking-tight">
                                    {idr(p.balance)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-slate-500 uppercase tracking-wider">{p.targetLabel}</span>
                                    <span className="text-slate-800">{p.targetPercentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#0F3A4B] rounded-full transition-all duration-500" 
                                        style={{ width: `${p.targetPercentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-right text-gray-400 font-semibold">
                                    {isArisan && p.targetPercentage === 100 
                                        ? "Ready for Disbursement" 
                                        : idr(p.targetAmount)
                                    }
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                {isGeneral && (
                                    <>
                                        <button 
                                            onClick={() => setShowTransactionModal({ type: 'deposit', pocketId: p.id })}
                                            className="flex-1 py-2.5 bg-[#0F3A4B] text-white rounded-xl text-xs font-bold hover:bg-[#0c2e3c] transition shadow-sm cursor-pointer select-none text-center"
                                        >
                                            Deposit
                                        </button>
                                        <button 
                                            onClick={() => setShowTransactionModal({ type: 'transfer', pocketId: p.id })}
                                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer select-none text-center"
                                        >
                                            Transfer
                                        </button>
                                    </>
                                )}

                                {isArisan && (
                                    <button 
                                        onClick={() => setShowTransactionModal({ type: 'disburse', pocketId: p.id })}
                                        className="w-full py-2.5 border border-[#0284C7] text-[#0284C7] rounded-xl text-xs font-bold hover:bg-sky-50/50 transition cursor-pointer select-none text-center bg-white"
                                    >
                                        Initiate Disbursement
                                    </button>
                                )}

                                {isSocial && (
                                    <>
                                        <button 
                                            onClick={() => setShowTransactionModal({ type: 'donate', pocketId: p.id })}
                                            className="flex-1 py-2.5 bg-[#0F3A4B] text-white rounded-xl text-xs font-bold hover:bg-[#0c2e3c] transition shadow-sm cursor-pointer select-none text-center"
                                        >
                                            Donate
                                        </button>
                                        <button 
                                            onClick={() => setShowTransactionModal({ type: 'expense', pocketId: p.id })}
                                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer select-none text-center"
                                        >
                                            Log Expense
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL: Create New Pocket */}
            {showNewPocketModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <form 
                        onSubmit={handleCreatePocket}
                        className="bg-white rounded-2xl max-w-md w-full border border-gray-100 p-6 shadow-2xl space-y-5 animate-scale-up"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <h3 className="font-serif text-lg font-bold text-slate-800 tracking-tight">Buat Kantong Kas Baru</h3>
                            <button 
                                type="button"
                                onClick={() => setShowNewPocketModal(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer select-none"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Kantong</label>
                            <input 
                                type="text"
                                required
                                value={newPocketForm.name}
                                onChange={e => setNewPocketForm({ ...newPocketForm, name: e.target.value })}
                                placeholder="contoh: Dana Sosial Peduli"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tipe Kantong</label>
                            <select
                                value={newPocketForm.type}
                                onChange={e => setNewPocketForm({ ...newPocketForm, type: e.target.value as any })}
                                className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                            >
                                <option value="general">Kas Umum (Deposit & Transfer)</option>
                                <option value="arisan">Arisan (Save & Payout)</option>
                                <option value="social">Sosial & Charity (Donate & Spend)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Kategori / Deskripsi</label>
                            <input 
                                type="text"
                                value={newPocketForm.description}
                                onChange={e => setNewPocketForm({ ...newPocketForm, description: e.target.value })}
                                placeholder="contoh: Emergency & Charity"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Saldo Awal (Rp)</label>
                                <input 
                                    type="number"
                                    value={newPocketForm.initialBalance}
                                    onChange={e => setNewPocketForm({ ...newPocketForm, initialBalance: e.target.value })}
                                    placeholder="0"
                                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Target Kas (Rp)</label>
                                <input 
                                    type="number"
                                    value={newPocketForm.targetAmount}
                                    onChange={e => setNewPocketForm({ ...newPocketForm, targetAmount: e.target.value })}
                                    placeholder="50000000"
                                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        {newPocketForm.type === 'arisan' && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Total Siklus Arisan (Bulan)</label>
                                <input 
                                    type="number"
                                    value={newPocketForm.cycleTotal}
                                    onChange={e => setNewPocketForm({ ...newPocketForm, cycleTotal: e.target.value })}
                                    placeholder="12"
                                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={() => setShowNewPocketModal(false)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer select-none"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-2.5 bg-[#0F3A4B] text-white rounded-xl text-xs font-bold hover:bg-[#0c2e3c] transition shadow-sm cursor-pointer select-none"
                            >
                                Buat Kantong
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL: Transaksi */}
            {showTransactionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <form 
                        onSubmit={handleTransactionSubmit}
                        className="bg-white rounded-2xl max-w-md w-full border border-gray-100 p-6 shadow-2xl space-y-5 animate-scale-up"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <h3 className="font-serif text-lg font-bold text-slate-800 tracking-tight capitalize">
                                {showTransactionModal.type === 'disburse' ? 'Cairkan Arisan (Disbursement)' : `${showTransactionModal.type} Dana`}
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setShowTransactionModal(null)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer select-none"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {showTransactionModal.type === 'disburse' ? (
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                Apakah Anda yakin ingin mencairkan seluruh dana arisan bulanan saat ini? Dana akan disalurkan ke pemenang arisan dan saldo kantong akan kembali ke nol.
                            </p>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Jumlah (Rupiah)</label>
                                    <input 
                                        type="number"
                                        required
                                        value={txForm.amount}
                                        onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                                        placeholder="contoh: 5000000"
                                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                                    />
                                </div>

                                {(showTransactionModal.type === 'transfer' || showTransactionModal.type === 'rebalance') && (
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Kantong Tujuan</label>
                                        <select
                                            required
                                            value={txForm.destinationPocketId}
                                            onChange={e => setTxForm({ ...txForm, destinationPocketId: e.target.value })}
                                            className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                                        >
                                            <option value="">-- Pilih Kantong Tujuan --</option>
                                            {pockets
                                                .filter(p => p.id !== showTransactionModal.pocketId)
                                                .map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({idr(p.balance)})</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Keterangan / Catatan</label>
                                    <input 
                                        type="text"
                                        value={txForm.notes}
                                        onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
                                        placeholder="contoh: Setoran rutin warga bulanan"
                                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={() => setShowTransactionModal(null)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer select-none"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-2.5 bg-[#0F3A4B] text-white rounded-xl text-xs font-bold hover:bg-[#0c2e3c] transition shadow-sm cursor-pointer select-none"
                            >
                                {showTransactionModal.type === 'disburse' ? 'Cairkan Sekarang' : 'Proses Transaksi'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
