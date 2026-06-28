'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Pocket {
    id: string;
    name: string;
    type: 'KAS' | 'ARISAN' | 'DARURAT' | string;
    description: string;
    balance: number;
    status: string;
    targetAmount?: number;
}

export default function PocketsPage() {
    const router = useRouter();
    const [slug, setSlug] = useState<string>('keluarga-cemara');
    const [communityId, setCommunityId] = useState<string>('');
    const [pockets, setPockets] = useState<Pocket[]>([]);
    const [loading, setLoading] = useState(true);

    const [showNewPocketModal, setShowNewPocketModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState<{
        type: 'deposit' | 'expense' | 'disburse';
        pocketId?: string;
    } | null>(null);

    const [newPocketForm, setNewPocketForm] = useState({
        name: '',
        type: 'KAS',
        description: '',
    });

    const [txForm, setTxForm] = useState({
        amount: '',
        notes: ''
    });

    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    const loadPockets = () => {
        setLoading(true);
        api.get<any[]>('/communities').then(list => {
            const c = list.find(x => x.slug === slug) || list[0];
            if (!c) {
                router.push('/login');
                return;
            }
            setCommunityId(c.id);
            return api.get<Pocket[]>(`/communities/${c.id}/pockets`);
        }).then(res => {
            if (res) setPockets(res);
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load pockets', err);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadPockets();
    }, [slug, router]);

    const totalLiquidity = pockets.reduce((sum, p) => sum + Number(p.balance), 0);

    const handleCreatePocket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPocketForm.name.trim()) return;
        try {
            await api.post(`/communities/${communityId}/pockets`, newPocketForm);
            setShowNewPocketModal(false);
            setNewPocketForm({ name: '', type: 'KAS', description: '' });
            loadPockets();
        } catch (err: any) {
            alert(err.message || 'Gagal membuat kantong.');
        }
    };

    const handleTransactionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showTransactionModal?.pocketId) return;

        const amountNum = parseFloat(txForm.amount) || 0;
        if (amountNum <= 0 && showTransactionModal.type !== 'disburse') return;

        const pId = showTransactionModal.pocketId;
        const type = showTransactionModal.type;

        try {
            if (type === 'disburse') {
                await api.post(`/pockets/${pId}/withdraw`, {
                    amount: pockets.find(p => p.id === pId)?.balance || 0,
                    note: txForm.notes || 'Pencairan arisan/dana',
                    bankName: 'BCA', 
                    accountNumber: '000000', 
                    accountHolder: 'Penerima'
                });
                alert('Permintaan penarikan telah diajukan dan menunggu persetujuan.');
            } else {
                await api.post(`/pockets/${pId}/transactions`, {
                    amount: amountNum,
                    type: type === 'deposit' ? 'in' : 'out',
                    description: txForm.notes || 'Transaksi'
                });
            }
            setShowTransactionModal(null);
            setTxForm({ amount: '', notes: '' });
            loadPockets();
        } catch (err: any) {
            alert(err.message || 'Gagal memproses transaksi.');
        }
    };

    const handleDeletePocket = async (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus kantong kas ini?")) {
            try {
                await api.delete(`/pockets/${id}`);
                loadPockets();
            } catch (err: any) {
                alert(err.message || 'Gagal menghapus kantong kas.');
            }
        }
    };

    const usd = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Pockets</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">Manage and track your distributed funds.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowNewPocketModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer"
                    >
                        New Pocket
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between max-w-xs min-h-[120px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Liquidity</span>
                <div className="space-y-1 mt-4">
                    <p className="font-serif text-2xl font-black text-slate-800 tracking-tight">
                        {loading ? '...' : usd(totalLiquidity)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading pockets...</p>
                ) : pockets.map((p) => {
                    const isArisan = p.type === 'ARISAN';
                    return (
                        <div key={p.id} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between space-y-6 relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-serif text-lg font-bold text-slate-800">{p.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wide">{p.description || p.type}</p>
                                </div>
                                <button onClick={() => handleDeletePocket(p.id)} className="p-1 text-gray-400 hover:text-rose-600 transition cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available Balance</span>
                                <p className="font-serif text-2xl font-black text-primary tracking-tight">{usd(p.balance)}</p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button 
                                    onClick={() => setShowTransactionModal({ type: 'deposit', pocketId: p.id })}
                                    className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition cursor-pointer"
                                >Deposit</button>
                                <button 
                                    onClick={() => setShowTransactionModal({ type: 'expense', pocketId: p.id })}
                                    className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition bg-white cursor-pointer"
                                >Log Expense</button>
                                {isArisan && (
                                    <button 
                                        onClick={() => setShowTransactionModal({ type: 'disburse', pocketId: p.id })}
                                        className="w-full py-2 border border-[#0284C7] text-[#0284C7] rounded-xl text-xs font-bold hover:bg-sky-50 transition cursor-pointer"
                                    >Tarik (Disburse)</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showNewPocketModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <form onSubmit={handleCreatePocket} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="font-serif text-lg font-bold">Buat Kantong Kas Baru</h3>
                        <input 
                            type="text" required value={newPocketForm.name}
                            onChange={e => setNewPocketForm({ ...newPocketForm, name: e.target.value })}
                            placeholder="Nama Kantong"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <select
                            value={newPocketForm.type}
                            onChange={e => setNewPocketForm({ ...newPocketForm, type: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        >
                            <option value="KAS">Kas Umum</option>
                            <option value="ARISAN">Arisan</option>
                            <option value="DARURAT">Darurat / Sosial</option>
                        </select>
                        <input 
                            type="text" value={newPocketForm.description}
                            onChange={e => setNewPocketForm({ ...newPocketForm, description: e.target.value })}
                            placeholder="Deskripsi Singkat"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowNewPocketModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-sm">Batal</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm">Buat Kantong</button>
                        </div>
                    </form>
                </div>
            )}

            {showTransactionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <form onSubmit={handleTransactionSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="font-serif text-lg font-bold capitalize">{showTransactionModal.type} Dana</h3>
                        
                        {showTransactionModal.type !== 'disburse' && (
                            <input 
                                type="number" required value={txForm.amount}
                                onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                                placeholder="Jumlah Rupiah"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            />
                        )}
                        <input 
                            type="text" value={txForm.notes}
                            onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
                            placeholder="Catatan Transaksi"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowTransactionModal(null)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-sm">Batal</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm">Proses</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}


