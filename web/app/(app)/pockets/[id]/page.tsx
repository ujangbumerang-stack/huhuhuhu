"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CommunityContext } from '../../layout';

interface Pocket {
    id: string;
    name: string;
    type: 'KAS' | 'ARISAN' | 'PATUNGAN' | 'IURAN' | string;
    description: string;
    balance: number;
    status: string;
    targetAmount?: number;
}

const idr = (val: any) => {
    const num = Number(val);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(num);
};

export default function PocketDetailPage() {
    const router = useRouter();
    const params = useParams();
    const pocketId = params.id as string;

    const { role } = useContext(CommunityContext);

    const [pocket, setPocket] = useState<Pocket | null>(null);
    const [communityName, setCommunityName] = useState<string>('Kyklos');
    const [loading, setLoading] = useState(true);
    const [pocketTxns, setPocketTxns] = useState<any[]>([]);
    const [loadingTxns, setLoadingTxns] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [submittingTx, setSubmittingTx] = useState(false);

    // Form states
    const [txForm, setTxForm] = useState({
        amount: '',
        notes: ''
    });
    const [activeTab, setActiveTab] = useState<'deposit' | 'expense' | 'disburse'>('deposit');

    const getPocketVA = (p: Pocket) => {
        let hash = 0;
        for (let i = 0; i < p.id.length; i++) {
            hash = p.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const val = Math.abs(hash).toString().padEnd(8, '7').slice(0, 8);
        return `8802-${val.slice(0, 4)}-${val.slice(4, 8)}`;
    };

    const getPocketVAName = (cName: string, pName: string) => {
        const cleanCommunity = cName.slice(0, 15).toUpperCase();
        const cleanPocket = pName.slice(0, 10).toUpperCase();
        return `KYK*${cleanCommunity}*${cleanPocket}`;
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Load pocket detail
            const pData = await api.get<Pocket>(`/pockets/${pocketId}`);
            if (!pData) {
                router.push('/pockets');
                return;
            }
            setPocket(pData);

            // Fetch community info
            const comms = await api.get<any[]>('/communities');
            const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
            const c = comms.find(x => x.slug === activeSlug) || comms[0];
            if (c) {
                setCommunityName(c.name);
                // Fetch payment config
                const cfg = await api.get<any>(`/communities/${c.id}/payment-config`).catch(() => null);
                setPaymentConfig(cfg || null);
            }

            // Load transactions
            setLoadingTxns(true);
            const txns = await api.get<any[]>(`/pockets/${pocketId}/transactions`);
            setPocketTxns(txns || []);
        } catch (err) {
            console.error('Failed to load pocket details', err);
            router.push('/pockets');
        } finally {
            setLoading(false);
            setLoadingTxns(false);
        }
    };

    useEffect(() => {
        if (pocketId) {
            loadData();
        }
    }, [pocketId]);

    const handleTransactionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submittingTx) return;

        const amountNum = parseFloat(txForm.amount) || 0;
        if (amountNum <= 0) {
            alert('Nominal harus lebih besar dari 0');
            return;
        }

        setSubmittingTx(true);
        try {
            if (activeTab === 'disburse') {
                if (!paymentConfig || !paymentConfig.bankName || !paymentConfig.accountNumber) {
                    alert('Harap atur rekening bank komunitas terlebih dahulu di pengaturan.');
                    setSubmittingTx(false);
                    return;
                }
                await api.post(`/pockets/${pocketId}/withdraw`, {
                    amount: amountNum,
                    note: txForm.notes || 'Pencairan dana',
                    bankName: paymentConfig.bankName,
                    accountNumber: paymentConfig.accountNumber,
                    accountHolder: paymentConfig.accountHolder || 'Penerima'
                });
                alert('Permintaan penarikan telah diajukan dan berhasil diproses.');
            } else {
                await api.post(`/pockets/${pocketId}/transactions`, {
                    amount: amountNum,
                    type: activeTab === 'deposit' ? 'in' : 'out',
                    description: txForm.notes || 'Transaksi'
                });
            }
            setTxForm({ amount: '', notes: '' });
            // Reload pocket detail and transactions
            const updatedPocket = await api.get<Pocket>(`/pockets/${pocketId}`);
            setPocket(updatedPocket);
            const txns = await api.get<any[]>(`/pockets/${pocketId}/transactions`);
            setPocketTxns(txns || []);
        } catch (err: any) {
            alert(err.message || 'Gagal memproses transaksi.');
        } finally {
            setSubmittingTx(false);
        }
    };

    if (loading || !pocket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
                <div className="animate-spin h-8 w-8 text-primary border-4 border-slate-200 border-t-primary rounded-full" />
                <p className="text-xs text-gray-400 font-semibold">Memuat Detail Kantong...</p>
            </div>
        );
    }

    const cardTheme: Record<string, { bg: string, text: string, textMuted: string, accent: string, border: string, btnPrimary: string }> = {
        KAS: {
            bg: 'from-[#0F3A4B] to-[#0A2633]',
            text: 'text-white',
            textMuted: 'text-slate-300',
            accent: 'text-amber-400',
            border: 'border-white/10',
            btnPrimary: 'bg-amber-500 text-slate-950 hover:bg-amber-400'
        },
        ARISAN: {
            bg: 'from-[#6E2E1D] to-[#511F12]',
            text: 'text-white',
            textMuted: 'text-amber-100/80',
            accent: 'text-amber-300',
            border: 'border-white/10',
            btnPrimary: 'bg-amber-400 text-slate-950 hover:bg-amber-300'
        },
        DARURAT: {
            bg: 'from-[#7F1D1D] to-[#5C1111]',
            text: 'text-white',
            textMuted: 'text-rose-200/80',
            accent: 'text-rose-300',
            border: 'border-white/10',
            btnPrimary: 'bg-rose-400 text-slate-950 hover:bg-rose-300'
        },
        PATUNGAN: {
            bg: 'from-[#7F1D1D] to-[#5C1111]',
            text: 'text-white',
            textMuted: 'text-rose-200/80',
            accent: 'text-rose-300',
            border: 'border-white/10',
            btnPrimary: 'bg-rose-400 text-slate-950 hover:bg-rose-300'
        },
        IURAN: {
            bg: 'from-[#115E59] to-[#042F2E]',
            text: 'text-white',
            textMuted: 'text-teal-200/80',
            accent: 'text-teal-300',
            border: 'border-white/10',
            btnPrimary: 'bg-teal-400 text-slate-950 hover:bg-teal-300'
        }
    };

    const typeIconWhite: Record<string, React.ReactNode> = {
        KAS: (
            <svg className="w-5 h-5 text-sky-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4m0 0H9m3 0h3" />
            </svg>
        ),
        ARISAN: (
            <svg className="w-5 h-5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        DARURAT: (
            <svg className="w-5 h-5 text-rose-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        PATUNGAN: (
            <svg className="w-5 h-5 text-rose-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        IURAN: (
            <svg className="w-5 h-5 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
        ),
    };

    const defaultIconWhite = (
        <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    );

    const theme = cardTheme[pocket.type] || cardTheme.KAS;
    const hasBank = paymentConfig?.bankName && paymentConfig?.accountNumber;

    return (
        <div className="space-y-6">
            {/* ── Breadcrumb & Back button ── */}
            <button 
                onClick={() => router.push('/pockets')}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition cursor-pointer"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Kantong
            </button>

            {/* ── Header Title ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                        <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{pocket.name}</h1>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            pocket.type === 'KAS' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                            pocket.type === 'ARISAN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                            {pocket.type === 'PATUNGAN' ? 'Darurat / Sosial' : pocket.type}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 font-semibold">{pocket.description || 'Tidak ada deskripsi untuk kantong ini.'}</p>
                </div>
            </div>

            {/* ── Grid Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ── Kiri: Wallet Display & Routing VA (4 Cols) ── */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="relative group pt-6 select-none max-w-sm mx-auto lg:mx-0">
                        {/* Peeking Cash & Card inside the wallet */}
                        <div className="absolute top-0 left-6 right-6 h-7 flex justify-between items-end overflow-hidden pointer-events-none z-0">
                            {/* Credit Card Corner */}
                            <div className="w-12 h-10 bg-slate-900 rounded-lg rotate-12 translate-y-3 transform shadow-sm border border-slate-700/50 flex items-center justify-center group-hover:translate-y-1 transition duration-300">
                                <div className="w-2.5 h-1.5 bg-amber-400 rounded-sm -translate-x-1.5 -translate-y-1" />
                            </div>
                            {/* Rp 100.000 Bill Corner */}
                            <div className="w-16 h-12 bg-rose-500/95 rounded-lg -rotate-12 translate-y-3.5 transform shadow-sm border border-rose-600/30 flex items-start justify-between p-1 group-hover:translate-y-1 transition duration-300">
                                <span className="text-[5px] text-rose-100 font-extrabold font-mono leading-none">Rp</span>
                                <div className="w-3 h-3 rounded-full bg-rose-400 opacity-60" />
                            </div>
                            {/* Rp 50.000 Bill Corner */}
                            <div className="w-14 h-12 bg-sky-500/95 rounded-lg -rotate-6 translate-y-4 transform shadow-sm border border-sky-600/30 flex items-start justify-between p-1 group-hover:translate-y-1.5 transition duration-300">
                                <span className="text-[5px] text-sky-100 font-extrabold font-mono leading-none">Rp</span>
                                <div className="w-2 h-2 rounded-full bg-sky-400 opacity-60" />
                            </div>
                        </div>

                        {/* Wallet Body */}
                        <div 
                            style={pocket.type === 'KAS' ? {
                                backgroundImage: 'linear-gradient(to bottom, var(--community-primary, #0F3A4B), color-mix(in srgb, var(--community-primary, #0F3A4B) 60%, #000))'
                            } : undefined}
                            className={`bg-gradient-to-b ${pocket.type === 'KAS' ? '' : theme.bg} rounded-2xl p-6 shadow-lg flex flex-col gap-4 relative z-10 border border-slate-950/20 group-hover:shadow-xl group-hover:brightness-105 transition duration-200 overflow-hidden`}
                        >
                            {/* Stitched Line border inside */}
                            <div className="absolute inset-1.5 border border-dashed border-white/20 rounded-xl pointer-events-none" />

                            {/* Metal Snap Button / Pocket Clasp */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-b from-amber-300 to-amber-500 rounded-full border border-amber-600 shadow-md flex items-center justify-center z-20">
                                <div className="w-1.5 h-1.5 bg-amber-200 rounded-full" />
                            </div>

                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-2 relative z-10">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                                        {typeIconWhite[pocket.type] ?? defaultIconWhite}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-serif text-base font-bold ${theme.text} leading-tight truncate`}>{pocket.name}</h3>
                                        <p className={`text-[10px] ${theme.textMuted} font-semibold mt-0.5 uppercase tracking-wide truncate`}>{pocket.description || pocket.type}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Balance */}
                            <div className="relative z-10 my-2">
                                <span className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-wider`}>Available Balance</span>
                                <p className={`font-serif text-2xl sm:text-3xl font-black ${theme.accent} tracking-tight mt-0.5`}>{idr(pocket.balance)}</p>
                            </div>

                            {/* Whitelabel Virtual Account */}
                            <div className="relative z-10 bg-black/15 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] text-white/80 space-y-0.5">
                                <p className="font-bold text-white/40 uppercase tracking-widest text-[7.5px]">Virtual Account Nobu (Whitelabel)</p>
                                <p className="font-mono font-bold tracking-wider text-xs text-white">{getPocketVA(pocket)}</p>
                                <p className="truncate text-white/50 text-[8.5px] font-semibold">{getPocketVAName(communityName, pocket.name)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Routing VA Detail Box */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Mekanisme Whitelabel Auto-Routing</span>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-mono text-sm font-black text-slate-800 tracking-wider">{getPocketVA(pocket)}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{getPocketVAName(communityName, pocket.name)}</p>
                            </div>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-100 uppercase tracking-wider">Nobu Route</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            Dana yang ditransfer ke Virtual Account ini diproses otomatis menggunakan Snap API gateway Nobu untuk langsung masuk ke saldo digital pocket <strong>{pocket.name}</strong> tanpa potongan platform Kyklos.
                        </p>
                    </div>
                </div>

                {/* ── Kanan: Form Transaksi & Ledger (7 Cols) ── */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Action Form Card */}
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                        
                        {/* Tab header */}
                        <div className="flex border-b border-gray-100 pb-1">
                            <button
                                onClick={() => { setActiveTab('deposit'); setTxForm({ amount: '', notes: '' }); }}
                                className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                                    activeTab === 'deposit' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Deposit Dana
                            </button>
                            {role === 'admin' && (
                                <>
                                    <button
                                        onClick={() => { setActiveTab('expense'); setTxForm({ amount: '', notes: '' }); }}
                                        className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                                            activeTab === 'expense' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        Catat Pengeluaran
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('disburse'); setTxForm({ amount: String(pocket.balance), notes: '' }); }}
                                        className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                                            activeTab === 'disburse' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        Tarik Dana
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Form Content */}
                        <form onSubmit={handleTransactionSubmit} className="space-y-4">
                            {activeTab === 'deposit' && (
                                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
                                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Tujuan Transfer Virtual Account (Whitelabel Nobu):</p>
                                    <p className="font-mono font-bold text-slate-800 text-sm tracking-wider">{getPocketVA(pocket)}</p>
                                    <p className="font-semibold text-slate-700 text-[10px]">{getPocketVAName(communityName, pocket.name)}</p>
                                </div>
                            )}

                            {activeTab === 'disburse' && (
                                <>
                                    {!hasBank ? (
                                        <div className="space-y-3 text-center py-2">
                                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mx-auto text-rose-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-800 text-xs">Rekening Bank Belum Diatur</h4>
                                                <p className="text-[10px] text-gray-500 px-4 leading-relaxed">
                                                    Harap atur rekening bank komunitas terlebih dahulu di pengaturan untuk melakukan penarikan dana.
                                                </p>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => router.push('/settings')} 
                                                className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-xs hover:brightness-95 transition cursor-pointer"
                                            >
                                                Atur Rekening Sekarang
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                                            <p className="font-bold text-slate-700">Tujuan Transfer Bank Komunitas:</p>
                                            <p className="font-semibold text-slate-800">{paymentConfig.bankName} - {paymentConfig.accountNumber}</p>
                                            <p className="font-medium text-slate-600">A/N {paymentConfig.accountHolder}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Inputs */}
                            {((activeTab !== 'disburse') || hasBank) && (
                                <>
                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Nominal Rupiah</label>
                                        <input
                                            type="number" required value={txForm.amount}
                                            onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                                            placeholder="Masukkan Nominal"
                                            className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary font-mono text-slate-800 font-bold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Catatan / Deskripsi</label>
                                        <input
                                            type="text" value={txForm.notes}
                                            onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
                                            placeholder="Masukkan catatan transaksi"
                                            className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={submittingTx}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-95 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submittingTx ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Memproses...</span>
                                            </>
                                        ) : (
                                            activeTab === 'deposit' ? 'Catat Deposit Masuk' :
                                            activeTab === 'expense' ? 'Catat Pengeluaran' : 'Ajukan Tarik Dana'
                                        )}
                                    </button>
                                </>
                            )}
                        </form>
                    </div>

                    {/* Ledger / Riwayat Transaksi */}
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col">
                        <h4 className="font-serif text-sm font-bold text-slate-800 tracking-tight pb-3 border-b border-gray-100 flex-shrink-0">Riwayat Catatan Kas</h4>
                        
                        <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto pr-1">
                            {loadingTxns ? (
                                <div className="py-10 text-center text-xs text-gray-400 font-medium animate-pulse">Memuat riwayat transaksi...</div>
                            ) : pocketTxns.length === 0 ? (
                                <div className="py-12 text-center text-xs text-gray-400 font-medium">Belum ada riwayat transaksi pada kantong ini.</div>
                            ) : (
                                pocketTxns.map((tx) => {
                                    const isIn = tx.direction === 'in';
                                    return (
                                        <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                                                    {isIn ? (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l7-7m-7 7l-7-7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate">{tx.note || 'Pencatatan Tanpa Keterangan'}</p>
                                                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                                        Oleh {tx.createdBy?.name || 'Sistem'} • {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-xs font-extrabold ${isIn ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                    {isIn ? '+' : '-'} {idr(Number(tx.amount))}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
