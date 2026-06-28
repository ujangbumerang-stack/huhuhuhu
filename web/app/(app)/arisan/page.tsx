'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ArisanPage() {
    const [slug, setSlug] = useState('keluarga-cemara');
    const router = useRouter();
    const [communityId, setCommunityId] = useState('');
    const [arisanPocket, setArisanPocket] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [communityMembers, setCommunityMembers] = useState<any[]>([]);
    
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [newMemberId, setNewMemberId] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const list = await api.get<any[]>('/communities');
            const c = list.find(x => x.slug === slug) || list[0];
            if (!c) {
                router.push('/login');
                return;
            }
            setCommunityId(c.id);

            const pockets = await api.get<any[]>(`/communities/${c.id}/pockets`);
            const arisan = pockets.find(p => p.type === 'ARISAN');
            if (arisan) {
                setArisanPocket(arisan);
                const [parts, per, mems] = await Promise.all([
                    api.get<any[]>(`/pockets/${arisan.id}/arisan/participants`),
                    api.get<any[]>(`/pockets/${arisan.id}/arisan/periods`),
                    api.get<any[]>(`/communities/${c.id}/members`)
                ]);
                setParticipants(parts);
                setPeriods(per);
                setCommunityMembers(mems);
            }
        } catch (err) {
            console.error('Failed to load arisan data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [slug, router]);

    const handleExecutePayout = async () => {
        if (!arisanPocket) return;
        try {
            await api.post(`/pockets/${arisanPocket.id}/arisan/draw`, {});
            setShowPayoutModal(false);
            setSuccessMessage(`Berhasil mencairkan dana Arisan putaran ini!`);
            setTimeout(() => setSuccessMessage(null), 5000);
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal melakukan penarikan arisan');
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberId || !arisanPocket) return;

        try {
            await api.post(`/pockets/${arisanPocket.id}/arisan/participants`, { memberId: newMemberId });
            setNewMemberId('');
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal menambahkan anggota ke arisan');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm">Memuat data arisan...</div>;
    }

    if (!arisanPocket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Tidak Ada Kantong Arisan</h2>
                <p className="text-sm text-gray-500 max-w-sm">Komunitas ini belum memiliki kantong dengan tipe ARISAN. Silakan buat kantong Arisan terlebih dahulu di menu Pockets.</p>
                <button onClick={() => router.push('/pockets')} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">Ke Menu Pockets</button>
            </div>
        );
    }

    const currentCycle = periods.length > 0 ? periods.filter(p => p.status === 'done').length + 1 : 1;
    const targetPool = arisanPocket.targetAmount || 0;
    const totalAccumulated = arisanPocket.balance || 0;
    const progressPercent = targetPool > 0 ? Math.min(100, Math.round((totalAccumulated / targetPool) * 100)) : 100;
    const remainingAmount = Math.max(0, targetPool - totalAccumulated);
    const latestWinner = periods.filter(p => p.status === 'done').pop();
    
    return (
        <div className="space-y-6 relative">
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 bg-[#0B1E26] text-white px-6 py-3.5 rounded-xl shadow-lg border border-teal-500/30 flex items-center gap-3">
                    <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                    <span className="text-xs font-semibold">{successMessage}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">
                        Arisan: {arisanPocket.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                        Cycle {currentCycle} of {participants.length || 1} • Collection Phase
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowManageModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer"
                    >
                        Manage Members
                    </button>
                    <button 
                        onClick={() => setShowPayoutModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer"
                    >
                        Execute Draw / Payout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between space-y-6">
                    <div className="flex items-start justify-between">
                        <h2 className="font-serif text-lg font-bold text-slate-800 tracking-tight">Current Pool Progress</h2>
                        <span className="text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7] px-2.5 py-0.5 rounded-md">
                            Active
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5 border-r border-gray-100 pr-6">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Accumulated</p>
                            <p className="font-serif text-4xl font-extrabold text-slate-850 tracking-tight">
                                Rp {totalAccumulated.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="space-y-1.5 pl-0 sm:pl-6">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Pool</p>
                            <p className="font-serif text-3xl font-bold text-slate-750 tracking-tight">
                                Rp {targetPool.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-gray-400">
                            <span>{progressPercent}% Collected</span>
                            <span>Rp {remainingAmount.toLocaleString('id-ID')} Remaining</span>
                        </div>
                    </div>
                </div>

                <div className="bg-primary rounded-2xl p-6 shadow-sm flex flex-col justify-between text-white space-y-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-white/80 uppercase tracking-wider">
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" /></svg>
                        PREVIOUS CYCLE WINNER
                    </div>
                    {latestWinner ? (
                        <div className="flex items-center gap-4 py-2">
                            <div className="min-w-0">
                                <h4 className="font-serif text-lg font-bold text-white tracking-tight leading-tight">
                                    {latestWinner.winner?.name || 'Unknown'}
                                </h4>
                                <p className="text-[11px] text-white/80 font-semibold mt-0.5">Disbursed on {new Date(latestWinner.endDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2 text-sm text-white/70">Belum ada pemenang sebelumnya.</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-12 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                        <h3 className="font-serif text-base font-bold text-slate-800 tracking-tight">Arisan Participants</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                                    <th className="px-6 py-3">Member</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Joined Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {participants.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-10 text-center text-xs text-gray-400">Belum ada peserta.</td></tr>
                                ) : participants.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-gray-50/30 transition duration-150">
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-inner">
                                                    {m.member?.name?.[0] || 'U'}
                                                </div>
                                                <span className="text-xs font-bold text-slate-800">{m.member?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100`}>
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-xs text-gray-400 font-medium text-right">
                                            {new Date(m.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 p-6 shadow-2xl space-y-6">
                        <div className="space-y-2">
                            <h3 className="font-serif text-xl font-bold text-slate-800 tracking-tight">Confirm Payout Execution</h3>
                            <p className="text-xs text-gray-500">
                                Ini akan membagikan total saldo arisan putaran ini kepada penerima terpilih yang diundi secara acak.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowPayoutModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer">Batal</button>
                            <button onClick={handleExecutePayout} className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer">Undi & Payout</button>
                        </div>
                    </div>
                </div>
            )}

            {showManageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-100 p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col justify-between">
                        <div className="space-y-4 overflow-y-auto pr-1">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <h3 className="font-serif text-lg font-bold text-slate-800 tracking-tight">Kelola Anggota Arisan</h3>
                                <button onClick={() => setShowManageModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleAddMember} className="flex gap-2">
                                <select 
                                    value={newMemberId}
                                    onChange={(e) => setNewMemberId(e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-primary text-slate-900"
                                >
                                    <option value="">-- Pilih Anggota Komunitas --</option>
                                    {communityMembers.filter(cm => !participants.some(p => p.memberId === cm.id)).map(cm => (
                                        <option key={cm.id} value={cm.id}>{cm.user.name}</option>
                                    ))}
                                </select>
                                <button type="submit" className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-90 hover:shadow-md transition cursor-pointer">Tambah</button>
                            </form>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                                {participants.map(m => (
                                    <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-gray-100">
                                        <span className="text-xs font-bold text-slate-800">{m.member?.name || 'Unknown'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4 text-right">
                            <button onClick={() => setShowManageModal(false)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer">Selesai</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


