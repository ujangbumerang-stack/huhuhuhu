'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { idr } from '@/lib/format';
import { CommunityContext } from '@/app/(app)/layout';

interface Due {
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    frequency?: string;
    period?: string;
    isMandatory: boolean;
}

interface Contribution {
    id: string;
    amount: number;
    status: 'pending' | 'paid' | 'verified' | string;
    proofUrl?: string;
    member: { id: string; name: string; email: string };
    schedule: { id: string; title: string };
}

export default function ContributionsPage() {
    const router = useRouter();
    const { role } = useContext(CommunityContext);
    const isAdmin = role === 'admin';
    const [communityId, setCommunityId] = useState('');
    const [dues, setDues] = useState<Due[]>([]);
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [pockets, setPockets] = useState<any[]>([]);
    const [paymentConfig, setPaymentConfig] = useState<{ bankName: string; accountNumber: string; accountHolder: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const [myContributions, setMyContributions] = useState<Contribution[]>([]);
    const [myPage, setMyPage] = useState(0);
    const [allPage, setAllPage] = useState(0);
    const PAGE_SIZE = 10;
    const [showNewDueModal, setShowNewDueModal] = useState(false);
    const [newDueForm, setNewDueForm] = useState({
        title: '', amount: '', dueDate: '', frequency: 'monthly', isMandatory: true, pocketId: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
            const list = await api.get<any[]>('/communities');
            const c = list.find(x => x.slug === activeSlug) || list[0];
            if (!c) { router.push('/login'); return; }
            setCommunityId(c.id);

            const [fetchedDues, fetchedContribs, fetchedMine, fetchedPockets, fetchedConfig] = await Promise.all([
                api.get<Due[]>(`/communities/${c.id}/dues`),
                api.get<Contribution[]>(`/communities/${c.id}/contributions`),
                api.get<Contribution[]>(`/communities/${c.id}/contributions/mine`),
                api.get<any[]>(`/communities/${c.id}/pockets`),
                api.get<any>(`/communities/${c.id}/payment-config`),
            ]);
            setDues(fetchedDues || []);
            setContributions(fetchedContribs || []);
            setMyContributions(fetchedMine || []);
            setPockets(fetchedPockets || []);
            setPaymentConfig(fetchedConfig || null);
            if (fetchedPockets && fetchedPockets.length > 0) {
                setNewDueForm(prev => ({ ...prev, pocketId: fetchedPockets[0].id }));
            }
        } catch (err) {
            console.error('Failed to load contributions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateDue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDueForm.pocketId) {
            alert('Pilih kantong tujuan terlebih dahulu');
            return;
        }
        try {
            await api.post(`/communities/${communityId}/dues`, {
                title: newDueForm.title,
                amount: parseFloat(newDueForm.amount),
                pocketId: newDueForm.pocketId,
                dueDate: newDueForm.dueDate || new Date().toISOString(),
                period: newDueForm.frequency,
            });
            setShowNewDueModal(false);
            setNewDueForm({ title: '', amount: '', dueDate: '', frequency: 'monthly', isMandatory: true, pocketId: pockets[0]?.id || '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal membuat tagihan iuran');
        }
    };

    const handleGenerate = async (id: string) => {
        try {
            await api.post(`/dues/${id}/generate`, {});
            alert('Tagihan berhasil dibuat untuk seluruh anggota aktif.');
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal men-generate tagihan');
        }
    };

    const openPayTab = (c: Contribution) => {
        const cfg = paymentConfig;
        const p = new URLSearchParams({
            type: 'contribution',
            id: c.id,
            amount: String(c.amount),
            title: c.schedule?.title || 'Tagihan',
            bank: cfg?.bankName || 'BCA',
            account: cfg?.accountNumber || '',
            holder: cfg?.accountHolder || '',
        });
        window.open(`/pay?${p.toString()}`, '_blank', 'width=480,height=700,noopener');
    };

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'kyklos_payment_done') loadData();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleVerify = async (id: string) => {
        try {
            await api.post(`/contributions/${id}/verify`, {});
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal memverifikasi pembayaran');
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Tagihan & Iuran</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">Kelola tagihan iuran, buat invoice, dan pantau status pembayaran.</p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setShowNewDueModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer"
                    >
                        Buat Tagihan Baru
                    </button>
                )}
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {dues.map(d => (
                        <div key={d.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4 relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-serif text-lg font-bold text-slate-800">{d.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{d.period ?? d.frequency}</p>
                                </div>
                            </div>
                            <div>
                                <p className="font-serif text-2xl font-black text-primary">{idr(d.amount)}</p>
                            </div>
                            <button
                                onClick={() => handleGenerate(d.id)}
                                className="w-full py-2 bg-sky-50 text-[#0284C7] rounded-xl text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
                            >
                                Generate Invoices for Members
                            </button>
                        </div>
                    ))}
                    {dues.length === 0 && !loading && (
                        <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                            Belum ada jenis iuran yang dibuat.
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/20">
                    <h3 className="font-serif text-base font-bold text-slate-800 tracking-tight">Tagihan Saya</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {loading ? (
                        <div className="px-6 py-12 flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-4 border-slate-100 rounded-full animate-spin" style={{ borderTopColor: 'var(--community-primary, #0B1E26)' }} />
                            <span className="text-xs font-bold text-slate-400 animate-pulse">Memuat tagihan...</span>
                        </div>
                    ) : myContributions.length === 0 ? (
                        <div className="px-6 py-8 text-center text-xs text-gray-400">Tidak ada tagihan untuk Anda saat ini.</div>
                    ) : myContributions.slice(myPage * PAGE_SIZE, (myPage + 1) * PAGE_SIZE).map(c => (
                        <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{c.schedule?.title}</p>
                                <p className="text-xs text-gray-400 font-medium">{idr(c.amount)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                    c.status === 'paid' || c.status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                                    c.status === 'pending_verify' ? 'bg-amber-50 text-amber-700' :
                                    'bg-rose-50 text-rose-600'
                                }`}>
                                    {c.status === 'pending_verify' ? 'MENUNGGU VERIFIKASI' : c.status.toUpperCase()}
                                </span>
                                {(c.status === 'pending' || c.status === 'unpaid') && (
                                    <button
                                        onClick={() => openPayTab(c)}
                                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold hover:brightness-90 transition cursor-pointer"
                                    >
                                        Bayar →
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {myContributions.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50">
                        <button onClick={() => setMyPage(p => Math.max(0, p - 1))} disabled={myPage === 0}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">← Sebelumnya</button>
                        <span className="text-[10px] text-gray-400">Hal. {myPage + 1} / {Math.max(1, Math.ceil(myContributions.length / PAGE_SIZE))}</span>
                        <button onClick={() => setMyPage(p => Math.min(Math.ceil(myContributions.length / PAGE_SIZE) - 1, p + 1))} disabled={(myPage + 1) * PAGE_SIZE >= myContributions.length}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">Berikutnya →</button>
                    </div>
                )}
            </div>

            {isAdmin && <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                    <h3 className="font-serif text-base font-bold text-slate-800 tracking-tight">Semua Tagihan Anggota</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                                <th className="px-6 py-4">Member</th>
                                <th className="px-6 py-4">Due Schedule</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs text-gray-400">Loading...</td></tr>
                            ) : contributions.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs text-gray-400 font-medium">Tidak ada data tagihan.</td></tr>
                            ) : contributions.slice(allPage * PAGE_SIZE, (allPage + 1) * PAGE_SIZE).map(c => (
                                <tr key={c.id} className="hover:bg-gray-50/30 transition duration-150">
                                    <td className="px-6 py-3.5">
                                        <p className="text-xs font-bold text-slate-800">{c.member?.name || 'Unknown'}</p>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <p className="text-xs text-slate-600 font-medium">{c.schedule?.title}</p>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <p className="text-xs font-extrabold text-slate-800">{idr(c.amount)}</p>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded ${
                                            c.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                                            c.status === 'pending_verify' ? 'bg-amber-50 text-amber-700' :
                                            c.status === 'unpaid' ? 'bg-rose-50 text-rose-600' :
                                            'bg-orange-50 text-orange-600'
                                        }`}>
                                            {c.status === 'pending_verify' ? 'PENDING VERIFY' : c.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        {isAdmin && c.status === 'pending_verify' && (
                                            <button
                                                onClick={() => handleVerify(c.id)}
                                                className="px-3 py-1.5 border border-[#0284C7]/20 rounded-lg text-[10px] font-semibold text-[#0284C7] hover:bg-sky-50 transition cursor-pointer"
                                            >
                                                Verify
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {contributions.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50">
                        <button onClick={() => setAllPage(p => Math.max(0, p - 1))} disabled={allPage === 0}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">← Sebelumnya</button>
                        <span className="text-[10px] text-gray-400">Hal. {allPage + 1} / {Math.max(1, Math.ceil(contributions.length / PAGE_SIZE))}</span>
                        <button onClick={() => setAllPage(p => Math.min(Math.ceil(contributions.length / PAGE_SIZE) - 1, p + 1))} disabled={(allPage + 1) * PAGE_SIZE >= contributions.length}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">Berikutnya →</button>
                    </div>
                )}
            </div>}

            {showNewDueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <form onSubmit={handleCreateDue} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="font-serif text-lg font-bold">Buat Tagihan Baru</h3>
                        <input 
                            type="text" required value={newDueForm.title}
                            onChange={e => setNewDueForm({ ...newDueForm, title: e.target.value })}
                            placeholder="Due Title (e.g. Uang Keamanan)"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <input 
                            type="number" required value={newDueForm.amount}
                            onChange={e => setNewDueForm({ ...newDueForm, amount: e.target.value })}
                            placeholder="Amount"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <select
                            value={newDueForm.frequency}
                            onChange={e => setNewDueForm({ ...newDueForm, frequency: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="one-time">One-Time</option>
                        </select>
                        <select
                            value={newDueForm.pocketId}
                            onChange={e => setNewDueForm({ ...newDueForm, pocketId: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            required
                        >
                            <option value="" disabled>Select Target Pocket</option>
                            {pockets.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Saldo: {idr(Number(p.balance))})</option>
                            ))}
                        </select>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowNewDueModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm">Create</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}


