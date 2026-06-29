'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { idr } from '@/lib/format';
import { CommunityContext } from '../layout';

export default function ArisanPage() {
    const router = useRouter();
    const [arisanPocket, setArisanPocket] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [setoran, setSetoran] = useState<any[]>([]);
    const [communityMembers, setCommunityMembers] = useState<any[]>([]);

    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [editingIuran, setEditingIuran] = useState(false);
    const [iuranInput, setIuranInput] = useState('');
    const [newMemberId, setNewMemberId] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // action loading guards — mencegah double-submit & blank saat refresh
    const [submittingPayout, setSubmittingPayout] = useState(false);
    const [addingMember, setAddingMember] = useState(false);
    const [addingAll, setAddingAll] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [savingIuran, setSavingIuran] = useState(false);

    const { role } = useContext(CommunityContext);
    const isAdmin = role === 'admin';

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
            const list = await api.get<any[]>('/communities');
            const c = list.find(x => x.slug === activeSlug) || list[0];
            if (!c) { router.push('/login'); return; }

            const pockets = await api.get<any[]>(`/communities/${c.id}/pockets`);
            const arisan = pockets.find(p => p.type?.toUpperCase() === 'ARISAN');
            if (arisan) {
                setArisanPocket(arisan);
                const [parts, per, stor, mems] = await Promise.all([
                    api.get<any[]>(`/pockets/${arisan.id}/arisan/participants`),
                    api.get<any[]>(`/pockets/${arisan.id}/arisan/periods`),
                    api.get<any[]>(`/pockets/${arisan.id}/arisan/setoran`),
                    api.get<any[]>(`/communities/${c.id}/members`),
                ]);
                setParticipants(parts || []);
                setPeriods(per || []);
                setSetoran(stor || []);
                setCommunityMembers(mems || []);
            }
        } catch (err) {
            console.error('Failed to load arisan data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleExecutePayout = async () => {
        if (submittingPayout) return;
        setSubmittingPayout(true);
        try {
            await api.post(`/pockets/${arisanPocket.id}/arisan/draw`, {});
            setShowPayoutModal(false);
            setSuccessMessage('Undian berhasil! Pemenang putaran ini telah ditentukan.');
            setTimeout(() => setSuccessMessage(null), 5000);
            loadData(true);
        } catch (err: any) {
            alert(err.message || 'Gagal melakukan undian arisan');
        } finally {
            setSubmittingPayout(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberId.trim() || !arisanPocket || addingMember) return;
        setAddingMember(true);
        try {
            await api.post(`/pockets/${arisanPocket.id}/arisan/participants`, { memberId: newMemberId });
            setNewMemberId('');
            loadData(true);
        } catch (err: any) {
            alert(err.message || 'Gagal menambahkan anggota ke arisan');
        } finally {
            setAddingMember(false);
        }
    };

    const handleAddAllMembers = async () => {
        if (!arisanPocket || addingAll) return;
        const belum = communityMembers.filter(cm => !participants.some(p => p.memberId === cm.id));
        if (belum.length === 0) return;
        setAddingAll(true);
        try {
            await Promise.all(belum.map(cm =>
                api.post(`/pockets/${arisanPocket.id}/arisan/participants`, { memberId: cm.id })
            ));
            loadData(true);
        } catch (err: any) {
            alert(err.message || 'Gagal menambahkan semua anggota');
        } finally {
            setAddingAll(false);
        }
    };

    const handleTagihSemua = () => {
        const belumSetor = participants.filter(p => !setoran.some(s => s.participantId === p.id));
        if (belumSetor.length === 0) {
            setSuccessMessage('Semua peserta sudah setor putaran ini! 🎉');
        } else {
            setSuccessMessage(`Pengingat setoran dikirim ke ${belumSetor.length} peserta yang belum setor.`);
        }
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const handleRemoveParticipant = async (participantId: string) => {
        if (!arisanPocket || removingId) return;
        if (!confirm('Hapus peserta ini dari arisan?')) return;
        setRemovingId(participantId);
        try {
            await api.delete(`/pockets/${arisanPocket.id}/arisan/participants/${participantId}`);
            loadData(true);
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus peserta');
        } finally {
            setRemovingId(null);
        }
    };

    const handleSaveIuran = async () => {
        const val = Number(iuranInput);
        if (!val || val <= 0 || savingIuran) return;
        setSavingIuran(true);
        try {
            await api.patch(`/pockets/${arisanPocket.id}`, { contributionAmount: val });
            setArisanPocket((prev: any) => ({ ...prev, contributionAmount: val }));
            setEditingIuran(false);
            setSuccessMessage('Iuran per putaran berhasil diperbarui.');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan iuran');
        } finally {
            setSavingIuran(false);
        }
    };

    const openSetoranTab = (p: any) => {
        const amount = arisanPocket.contributionAmount || 100000;
        const params = new URLSearchParams({
            type: 'arisan',
            id: arisanPocket.id,
            pocketId: arisanPocket.id,
            amount: String(amount),
            title: encodeURIComponent(arisanPocket.name),
            participantId: p.id,
            memberId: p.memberId,
            memberName: encodeURIComponent(p.member?.name || ''),
            contributionAmount: String(amount),
            bank: 'BCA',
            account: '9876543210',
            holder: encodeURIComponent(arisanPocket.name),
        });
        window.open(`/pay?${params.toString()}`, '_blank', 'width=480,height=700,noopener');
    };

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'kyklos_payment_done') loadData();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--community-primary, #0B1E26)' }} />
                <span className="text-sm font-bold text-slate-400 animate-pulse tracking-wide">Memuat data arisan...</span>
            </div>
        );
    }

    if (!arisanPocket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Belum Ada Kantong Arisan</h2>
                <p className="text-sm text-gray-500 max-w-sm">Komunitas ini belum memiliki kantong bertipe ARISAN. Silakan buat kantong Arisan terlebih dahulu.</p>
                <button onClick={() => router.push('/pockets')} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer">Ke Menu Kantong</button>
            </div>
        );
    }

    const selesaiCount = periods.filter(p => p.status === 'done').length;
    const putaranKe = selesaiCount + 1;
    const targetPool = arisanPocket.targetAmount || (participants.length * (arisanPocket.contributionAmount || 100000));
    const totalTerkumpul = Number(arisanPocket.balance) || 0;
    const progressPercent = targetPool > 0 ? Math.min(100, Math.round((totalTerkumpul / targetPool) * 100)) : 0;
    const latestWinner = periods.filter(p => p.status === 'done').pop();
    const pemenangIds = periods.filter(p => p.status === 'done').map(p => p.winner?.name);
    const berikutnya = participants.find(p => !pemenangIds.includes(p.member?.name));

    return (
        <div className="space-y-6 relative">
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 bg-[#0B1E26] text-white px-6 py-3.5 rounded-xl shadow-lg border border-teal-500/30 flex items-center gap-3">
                    <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                    <span className="text-xs font-semibold">{successMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Arisan: {arisanPocket.name}</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">Putaran ke-{putaranKe} dari {participants.length || '?'} peserta • Fase Pengumpulan</p>
                </div>
                {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setShowManageModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer">
                            Kelola Peserta
                        </button>
                        <button
                            onClick={handleTagihSemua}
                            className="relative flex items-center gap-1.5 px-3.5 py-2 border border-sky-200 bg-sky-50 text-sky-700 rounded-xl text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
                        >
                            Tagihkan Semua
                            {(() => {
                                const n = participants.filter(p => !setoran.some(s => s.participantId === p.id)).length;
                                return n > 0 ? (
                                    <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                        {n}
                                    </span>
                                ) : null;
                            })()}
                        </button>
                        <button onClick={() => setShowPayoutModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 transition shadow-sm cursor-pointer">
                            Lakukan Undian
                        </button>
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6">
                    <div className="flex items-start justify-between">
                        <h2 className="font-serif text-lg font-bold text-slate-800">Progres Pengumpulan</h2>
                        <span className="text-[10px] font-bold bg-sky-50 text-sky-600 px-2.5 py-0.5 rounded-md border border-sky-100">Aktif</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1 border-r border-gray-100 pr-6">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Terkumpul</p>
                            <p className="font-serif text-3xl font-extrabold text-slate-800">{idr(totalTerkumpul)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Putaran</p>
                            <p className="font-serif text-2xl font-bold text-slate-600">{idr(targetPool)}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-gray-400">
                            <span>{progressPercent}% terkumpul</span>
                            <span>{setoran.length}/{participants.length} sudah setor</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Iuran per Orang per Putaran</p>
                            {editingIuran ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-400 font-semibold">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        autoFocus
                                        value={iuranInput}
                                        onChange={e => setIuranInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveIuran(); if (e.key === 'Escape') setEditingIuran(false); }}
                                        className="w-32 border border-primary rounded-lg px-2 py-1 text-sm font-mono focus:outline-none text-slate-800"
                                    />
                                    <button onClick={handleSaveIuran} disabled={savingIuran} className="text-[10px] font-bold text-primary hover:underline cursor-pointer disabled:opacity-50 flex items-center gap-1">
                                        {savingIuran && <div className="w-2.5 h-2.5 border border-primary/30 border-t-primary rounded-full animate-spin" />}
                                        {savingIuran ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                    <button onClick={() => setEditingIuran(false)} disabled={savingIuran} className="text-[10px] font-bold text-gray-400 hover:underline cursor-pointer disabled:opacity-40">Batal</button>
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-slate-800 mt-0.5">
                                    {arisanPocket.contributionAmount
                                        ? `Rp ${Number(arisanPocket.contributionAmount).toLocaleString('id-ID')}`
                                        : <span className="text-gray-400 font-normal">Belum diset</span>}
                                </p>
                            )}
                        </div>
                        {isAdmin && !editingIuran && (
                            <button
                                onClick={() => { setIuranInput(String(arisanPocket.contributionAmount || '')); setEditingIuran(true); }}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-primary transition cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Ubah
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-primary rounded-2xl p-5 text-white space-y-3">
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Pemenang Putaran Lalu
                        </p>
                        {latestWinner ? (
                            <div>
                                <p className="font-serif text-lg font-black">{latestWinner.winner?.name}</p>
                                <p className="text-[10px] text-white/60">{new Date(latestWinner.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-white/60">Belum ada undian sebelumnya</p>
                        )}
                    </div>
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-2 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Antrian Berikutnya</p>
                        {berikutnya ? (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center flex-shrink-0">
                                    {berikutnya.member?.name?.[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{berikutnya.member?.name}</p>
                                    <p className="text-[10px] text-gray-400">Belum pernah menang</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Semua peserta sudah menang!</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Setoran Putaran Ini */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/20">
                    <h3 className="font-serif text-base font-bold text-slate-800">Status Setoran Putaran Ini</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">{setoran.length} dari {participants.length} peserta sudah menyetor</p>
                </div>
                <div className="divide-y divide-gray-50">
                    {participants.length === 0 ? (
                        <div className="px-6 py-10 text-center text-xs text-gray-400">Belum ada peserta arisan.</div>
                    ) : participants.map(p => {
                        const sudahSetor = setoran.some(s => s.participantId === p.id);
                        const idx = periods.filter(per => per.status === 'done').findIndex(per => per.winner?.name === p.member?.name);
                        const sudahMenang = idx !== -1;
                        return (
                            <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                                        {p.member?.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{p.member?.name}</p>
                                        {sudahMenang && <p className="text-[10px] text-amber-500 font-semibold">✓ Sudah menang putaran ke-{idx + 1}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                        sudahSetor ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                                    }`}>
                                        {sudahSetor ? 'SUDAH SETOR' : 'BELUM SETOR'}
                                    </span>
                                    {!sudahSetor && (
                                        <button
                                            onClick={() => openSetoranTab(p)}
                                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold hover:brightness-90 transition cursor-pointer"
                                        >
                                            Setor →
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Riwayat Undian */}
            {periods.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/20">
                        <h3 className="font-serif text-base font-bold text-slate-800">Riwayat Undian</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-3">Putaran</th>
                                    <th className="px-6 py-3">Pemenang</th>
                                    <th className="px-6 py-3 text-right">Tanggal Undian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {periods.filter(p => p.status === 'done').map((p, i) => (
                                    <tr key={p.id} className="hover:bg-gray-50/30">
                                        <td className="px-6 py-3.5 text-xs font-bold text-slate-800">Putaran {i + 1}</td>
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black text-[9px] flex items-center justify-center">
                                                    {p.winner?.name?.[0]}
                                                </div>
                                                <span className="text-xs font-bold text-slate-800">{p.winner?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-xs text-gray-400 text-right">
                                            {new Date(p.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Undian */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
                        <div className="space-y-2">
                            <h3 className="font-serif text-xl font-bold text-slate-800">Konfirmasi Lakukan Undian</h3>
                            <p className="text-xs text-gray-500">Sistem akan mengundi secara acak pemenang dari {participants.length} peserta. Saldo arisan akan dicairkan kepada pemenang terpilih.</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 font-semibold">
                            ⚠ Tindakan ini tidak dapat dibatalkan setelah dieksekusi.
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowPayoutModal(false)} disabled={submittingPayout} className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40">Batal</button>
                            <button onClick={handleExecutePayout} disabled={submittingPayout} className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5">
                                {submittingPayout && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {submittingPayout ? 'Mengundi...' : 'Undi & Cairkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Kelola Peserta */}
            {showManageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="font-serif text-lg font-bold text-slate-800">Kelola Peserta Arisan</h3>
                            <button onClick={() => setShowManageModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddMember} className="flex gap-2">
                            <select value={newMemberId} onChange={e => setNewMemberId(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary">
                                <option value="">-- Pilih Anggota --</option>
                                {communityMembers.filter(cm => !participants.some(p => p.memberId === cm.id)).map(cm => (
                                    <option key={cm.id} value={cm.id}>{cm.user?.name || cm.name}</option>
                                ))}
                            </select>
                            <button type="submit" disabled={addingMember} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-90 transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                                {addingMember && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {addingMember ? '...' : 'Tambah'}
                            </button>
                        </form>
                        {communityMembers.filter(cm => !participants.some(p => p.memberId === cm.id)).length > 0 && (
                            <button
                                type="button"
                                onClick={handleAddAllMembers}
                                disabled={addingAll}
                                className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:border-primary hover:text-primary transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {addingAll && <div className="w-3 h-3 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />}
                                {addingAll ? 'Menambahkan...' : `+ Tambah Semua Anggota (${communityMembers.filter(cm => !participants.some(p => p.memberId === cm.id)).length} orang)`}
                            </button>
                        )}
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {participants.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-6">Belum ada peserta. Tambahkan anggota di atas.</p>
                            ) : participants.map(m => {
                                const sudahSetor = setoran.some(s => s.participantId === m.id);
                                return (
                                    <div key={m.id} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{m.member?.name || m.memberId}</p>
                                            <p className={`text-[9px] font-semibold mt-0.5 ${sudahSetor ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                {sudahSetor ? '✓ Sudah setor putaran ini' : 'Belum setor'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveParticipant(m.id)}
                                            disabled={removingId !== null}
                                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                            title="Hapus dari arisan"
                                        >
                                            {removingId === m.id
                                                ? <div className="w-3.5 h-3.5 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                                                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            }
                                        </button>
                                    </div>
                                );
                            })}
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
