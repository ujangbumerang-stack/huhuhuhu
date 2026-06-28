"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CommunityContext } from '../../../layout';

interface Pocket {
    id: string;
    name: string;
    type: string;
    description: string;
    balance: number;
    status: string;
    vaNumber?: string;
    vaName?: string;
    contributionAmount?: number;
}

export default function PocketSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const pocketId = params.id as string;
    const { role } = useContext(CommunityContext);

    const [pocket, setPocket] = useState<Pocket | null>(null);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({ name: '', description: '', vaNumber: '', vaName: '', contributionAmount: '' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (role && role !== 'admin') {
            router.replace(`/pockets/${pocketId}`);
            return;
        }
        api.get<Pocket>(`/pockets/${pocketId}`).then(p => {
            if (!p) { router.push('/pockets'); return; }
            setPocket(p);
            setForm({ name: p.name, description: p.description || '', vaNumber: p.vaNumber || '', vaName: p.vaName || '', contributionAmount: p.contributionAmount ? String(p.contributionAmount) : '' });
        }).catch(() => router.push('/pockets'))
          .finally(() => setLoading(false));
    }, [pocketId, role]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        setSaved(false);
        try {
            await api.patch(`/pockets/${pocketId}`, {
                name: form.name,
                description: form.description,
                vaNumber: form.vaNumber || null,
                vaName: form.vaName || null,
                ...(pocket?.type === 'ARISAN' && { contributionAmount: form.contributionAmount ? Number(form.contributionAmount) : null }),
            });
            setSaved(true);
            const updated = await api.get<Pocket>(`/pockets/${pocketId}`);
            if (updated) setPocket(updated);
            setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan pengaturan.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm !== pocket?.name) return;
        setDeleting(true);
        try {
            await api.delete(`/pockets/${pocketId}`);
            router.push('/pockets');
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus kantong.');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-primary rounded-full" />
            </div>
        );
    }

    if (!pocket) return null;

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-12">
            {/* Back */}
            <button
                onClick={() => router.push(`/pockets/${pocketId}`)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition cursor-pointer"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke {pocket.name}
            </button>

            {/* Header */}
            <div>
                <h1 className="font-serif text-2xl font-black text-slate-800 tracking-tight">Pengaturan Kantong</h1>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">{pocket.name} · {pocket.type}</p>
            </div>

            {/* Edit Form */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Informasi Kantong</p>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Nama Kantong</label>
                        <input
                            type="text" required
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="Masukkan nama kantong"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary text-slate-800 font-semibold"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Deskripsi</label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Deskripsi kegunaan kantong ini"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary text-slate-800 resize-none"
                        />
                    </div>

                    {pocket.type === 'ARISAN' && (
                        <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Iuran per Orang per Putaran (Rp)</label>
                            <input
                                type="number"
                                min="0"
                                value={form.contributionAmount}
                                onChange={e => setForm({ ...form, contributionAmount: e.target.value })}
                                placeholder="Contoh: 100000"
                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary text-slate-800 font-mono"
                            />
                            <p className="text-[9px] text-slate-400">Total pool = iuran × jumlah peserta.</p>
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 space-y-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auto-Routing Virtual Account (Nobu)</p>

                        <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kustom Nomor VA</label>
                            <input
                                type="text"
                                value={form.vaNumber}
                                onChange={e => setForm({ ...form, vaNumber: e.target.value })}
                                placeholder="Contoh: 8802-5031-2099"
                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary text-slate-800 font-mono"
                            />
                            <p className="text-[9px] text-slate-400">Kosongkan untuk nomor routing otomatis.</p>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kustom Nama VA</label>
                            <input
                                type="text"
                                value={form.vaName}
                                onChange={e => setForm({ ...form, vaName: e.target.value })}
                                placeholder="Contoh: KYK*KOMUNITAS*KANTONG"
                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary text-slate-800"
                            />
                            <p className="text-[9px] text-slate-400">Kosongkan untuk nama default KYK*KOMUNITAS*KANTONG.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-95 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Menyimpan...</span></>
                        ) : saved ? (
                            <><span>✓</span><span>Tersimpan!</span></>
                        ) : 'Simpan Pengaturan'}
                    </button>
                </form>
            </div>

            {/* Zona Berbahaya */}
            <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/40">
                    <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Zona Berbahaya</p>
                </div>

                {deleteStep === 'idle' ? (
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-slate-800">Hapus Kantong Ini</p>
                            <p className="text-xs text-slate-500 mt-0.5">Semua data transaksi akan hilang permanen dan tidak dapat dikembalikan.</p>
                        </div>
                        <button
                            onClick={() => setDeleteStep('confirm')}
                            className="flex-shrink-0 px-4 py-2 border border-rose-300 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition cursor-pointer"
                        >
                            Hapus Kantong...
                        </button>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-200">
                            <svg className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="text-xs font-black text-rose-700">Tindakan ini tidak bisa dibatalkan.</p>
                                <p className="text-xs text-rose-600 mt-0.5">Seluruh riwayat transaksi kantong <strong>{pocket.name}</strong> akan dihapus selamanya.</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Ketik <span className="text-rose-600 font-black">{pocket.name}</span> untuk konfirmasi:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirm}
                                onChange={e => setDeleteConfirm(e.target.value)}
                                placeholder={pocket.name}
                                className="w-full border border-slate-200 focus:border-rose-400 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none font-semibold"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteStep('idle'); setDeleteConfirm(''); }}
                                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteConfirm !== pocket.name || deleting}
                                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                                {deleting
                                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : 'Hapus Selamanya'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
