'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { idr } from '@/lib/format';

interface Transaction {
    id: string;
    ref: string;
    date: string;
    rawDate: string;
    note: string;
    memberName: string;
    pocket: string;
    pocketType: string;
    direction: 'in' | 'out';
    status: string;
    amount: number;
}

const PAGE_SIZE = 10;

function SkeletonRow() {
    return (
        <tr className="border-b border-gray-50">
            {[1, 2, 3, 4, 5].map(i => (
                <td key={i} className="px-6 py-4">
                    <div className="h-3 bg-slate-100 rounded-full animate-pulse" style={{ width: `${[60, 80, 50, 40, 55][i - 1]}%` }} />
                    {i <= 2 && <div className="h-2.5 bg-slate-50 rounded-full animate-pulse mt-1.5" style={{ width: `${[40, 60][i - 1]}%` }} />}
                </td>
            ))}
        </tr>
    );
}

const directionBadge = (dir: string) =>
    dir === 'in'
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        : 'bg-rose-50 text-rose-600 border border-rose-100';

const pocketTypeBadge: Record<string, string> = {
    KAS: 'bg-sky-50 text-sky-700',
    ARISAN: 'bg-indigo-50 text-indigo-700',
    PATUNGAN: 'bg-amber-50 text-amber-700',
    IURAN: 'bg-violet-50 text-violet-700',
};

export default function LedgerPage() {
    const router = useRouter();
    const [communityId, setCommunityId] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dirFilter, setDirFilter] = useState<'all' | 'in' | 'out'>('all');
    const [pocketFilter, setPocketFilter] = useState('all');
    const [pockets, setPockets] = useState<string[]>([]);

    // Summary stats
    const totalInflow = transactions.filter(t => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
    const totalOutflow = transactions.filter(t => t.direction === 'out').reduce((s, t) => s + t.amount, 0);

    const fetchCommunity = useCallback(async () => {
        const list = await api.get<any[]>('/communities');
        const slug = localStorage.getItem('kyklos_active_community_slug') || '';
        const c = list.find(x => x.slug === slug) || list[0];
        if (!c) { router.push('/login'); return null; }
        setCommunityId(c.id);
        const ps = await api.get<any[]>(`/communities/${c.id}/pockets`);
        setPockets(['all', ...(ps || []).map((p: any) => p.name)]);
        return c.id;
    }, [router]);

    const fetchPage = useCallback(async (cId: string, p: number) => {
        setLoading(true);
        try {
            const res = await api.get<any>(`/communities/${cId}/transactions?page=${p}&limit=${PAGE_SIZE}`);
            const rows: Transaction[] = (res.data || []).map((t: any) => ({
                id: t.id,
                ref: t.id.substring(0, 8).toUpperCase(),
                date: new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                rawDate: t.createdAt,
                note: t.note || (t.direction === 'in' ? 'Pemasukan' : 'Pengeluaran'),
                memberName: t.member?.name || t.createdBy?.name || 'Sistem',
                pocket: t.pocket?.name || '—',
                pocketType: t.pocket?.type || 'KAS',
                direction: t.direction,
                status: t.status || 'confirmed',
                amount: Number(t.amount),
            }));
            setTransactions(rows);
            setTotal(res.total || 0);
            setTotalPages(res.totalPages || 1);
            setPage(p);
        } catch (err) {
            console.error('Failed to load ledger', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCommunity().then(cId => {
            if (cId) fetchPage(cId, 1);
        });
    }, []);

    const goToPage = (p: number) => {
        if (communityId) fetchPage(communityId, p);
    };

    const filtered = transactions.filter(t => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || t.note.toLowerCase().includes(q) || t.memberName.toLowerCase().includes(q) || t.ref.toLowerCase().includes(q) || t.pocket.toLowerCase().includes(q);
        const matchDir = dirFilter === 'all' || t.direction === dirFilter;
        const matchPocket = pocketFilter === 'all' || t.pocket === pocketFilter;
        return matchSearch && matchDir && matchPocket;
    });

    const netFlow = totalInflow - totalOutflow;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Buku Besar Transaksi</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                        Rekap lengkap seluruh arus keluar-masuk dana komunitas.
                        {!loading && <span className="ml-1 text-slate-500 font-bold">{total} transaksi total</span>}
                    </p>
                </div>
                <button
                    onClick={() => communityId && fetchPage(communityId, 1)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition cursor-pointer shadow-sm self-start"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Inflow */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Total Pemasukan (loaded)</span>
                    {loading ? (
                        <div className="h-7 w-32 bg-slate-100 rounded-full animate-pulse" />
                    ) : (
                        <p className="font-serif text-2xl font-black text-emerald-600 tracking-tight">{idr(totalInflow)}</p>
                    )}
                </div>
                {/* Outflow */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Total Pengeluaran (loaded)</span>
                    {loading ? (
                        <div className="h-7 w-32 bg-slate-100 rounded-full animate-pulse" />
                    ) : (
                        <p className="font-serif text-2xl font-black text-rose-500 tracking-tight">{idr(totalOutflow)}</p>
                    )}
                </div>
                {/* Net */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Net Flow (loaded)</span>
                    {loading ? (
                        <div className="h-7 w-32 bg-slate-100 rounded-full animate-pulse" />
                    ) : (
                        <p className={`font-serif text-2xl font-black tracking-tight ${netFlow >= 0 ? 'text-slate-800' : 'text-rose-500'}`}>{netFlow >= 0 ? '+' : ''}{idr(netFlow)}</p>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Cari catatan, anggota, REF..."
                        className="w-full border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-primary text-slate-700 bg-white"
                    />
                </div>
                <select
                    value={dirFilter}
                    onChange={e => setDirFilter(e.target.value as any)}
                    className="border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary text-slate-700 bg-white cursor-pointer"
                >
                    <option value="all">Semua Arah</option>
                    <option value="in">Pemasukan</option>
                    <option value="out">Pengeluaran</option>
                </select>
                <select
                    value={pocketFilter}
                    onChange={e => setPocketFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary text-slate-700 bg-white cursor-pointer"
                >
                    {pockets.map(p => (
                        <option key={p} value={p}>{p === 'all' ? 'Semua Kantong' : p}</option>
                    ))}
                </select>
                {(searchQuery || dirFilter !== 'all' || pocketFilter !== 'all') && (
                    <button
                        onClick={() => { setSearchQuery(''); setDirFilter('all'); setPocketFilter('all'); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition cursor-pointer"
                    >
                        Reset Filter
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Tanggal & REF</th>
                                <th className="px-6 py-4">Catatan / Anggota</th>
                                <th className="px-6 py-4">Kantong</th>
                                <th className="px-6 py-4">Arah</th>
                                <th className="px-6 py-4 text-right">Nominal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-14 text-center">
                                        <div className="space-y-2">
                                            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium">Tidak ada transaksi yang cocok.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/40 transition duration-100 group">
                                    <td className="px-6 py-3.5">
                                        <p className="text-xs font-bold text-slate-800 leading-tight">{t.date}</p>
                                        <p className="text-[10px] text-gray-400 font-mono font-medium mt-0.5">{t.ref}</p>
                                    </td>
                                    <td className="px-6 py-3.5 max-w-[220px]">
                                        <p className="text-xs font-bold text-slate-800 leading-tight truncate">{t.note}</p>
                                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">{t.memberName}</p>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{t.pocket}</span>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider self-start ${pocketTypeBadge[t.pocketType] || 'bg-slate-50 text-slate-500'}`}>
                                                {t.pocketType}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${directionBadge(t.direction)}`}>
                                            {t.direction === 'in' ? (
                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                            ) : (
                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                            )}
                                            {t.direction === 'in' ? 'Masuk' : 'Keluar'}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-3.5 text-xs font-extrabold text-right ${t.direction === 'in' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {t.direction === 'in' ? '+' : '-'}{idr(t.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Load More Footer */}
                {total > 0 && (
                    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <button
                            onClick={() => goToPage(page - 1)}
                            disabled={page <= 1 || loading}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        >← Sebelumnya</button>
                        <span className="text-[10px] text-gray-400">
                            Hal. {page} / {totalPages} · {total} transaksi
                        </span>
                        <button
                            onClick={() => goToPage(page + 1)}
                            disabled={page >= totalPages || loading}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        >Berikutnya →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
