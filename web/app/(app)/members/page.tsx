'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CommunityContext } from '../layout';

interface MemberUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

interface Membership {
    id: string;
    communityId: string;
    userId: string;
    role: string;
    status: string;
    createdAt: string;
    user: MemberUser;
    compliance?: number;
}

export default function MembersPage() {
    const router = useRouter();
    const [members, setMembers] = useState<Membership[]>([]);
    const [communityId, setCommunityId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | 'Committee'>('All');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const { role: currentUserRole } = useContext(CommunityContext);

    const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });

    const loadMembers = async () => {
        setLoading(true);
        try {
            const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
            const list = await api.get<any[]>('/communities');
            const c = list.find(x => x.slug === activeSlug) || list[0];
            if (!c) { router.push('/login'); return; }
            setCommunityId(c.id);
            const res = await api.get<Membership[]>(`/communities/${c.id}/members`);
            if (res) setMembers(res);
        } catch (err) {
            console.error('Failed to load members', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, []);

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!inviteForm.email.trim()) return;

        try {
            await api.post(`/communities/${communityId}/members`, {
                email: inviteForm.email,
                role: inviteForm.role
            });
            setShowInviteModal(false);
            setInviteForm({ email: '', role: 'member' });
            loadMembers();
        } catch (err: any) {
            setErrorMsg(err.message || 'Gagal menambahkan anggota. Pastikan pengguna sudah terdaftar.');
        }
    };

    const handleDeleteMember = async (membershipId: string) => {
        try {
            await api.delete(`/communities/${communityId}/members/${membershipId}`);
            setActiveMenuId(null);
            loadMembers();
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus anggota');
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = 
            m.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        if (activeFilter === 'Committee') {
            return m.role === 'admin';
        }
        return m.status === 'active'; // hide inactive by default
    });

    return (
        <div className="space-y-6 relative">
            {/* Header Members Directory */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">
                        Direktori Anggota
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                        Kelola anggota komunitas, peran, dan kepatuhan iuran.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {currentUserRole === 'admin' && (
                        <button 
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer select-none"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Undang Anggota
                        </button>
                    )}
                </div>
            </div>

            {/* Pencarian dan Filter Kategori */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pt-2">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Cari anggota berdasarkan nama atau email..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary bg-white text-slate-900 placeholder:text-slate-500 transition"
                    />
                </div>

                <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200/60 w-fit select-none">
                    <button 
                        onClick={() => setActiveFilter('All')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            activeFilter === 'All' ? 'bg-[#E0F2FE]/50 text-[#0284C7]' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Semua Anggota
                    </button>
                    <button
                        onClick={() => setActiveFilter('Committee')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            activeFilter === 'Committee' ? 'bg-[#E0F2FE]/50 text-[#0284C7]' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Pengurus (Admin)
                    </button>
                </div>
            </div>

            {/* Tabel Utama Members */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                                <th className="px-6 py-4">Anggota</th>
                                <th className="px-6 py-4">Peran</th>
                                <th className="px-6 py-4">Status</th>
                                {currentUserRole === 'admin' && <th className="px-6 py-4 text-center">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-10 text-center text-xs text-gray-400">Memuat...</td></tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-gray-400 font-medium">
                                        Tidak ada anggota yang cocok dengan filter pencarian.
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((m) => {
                                    const isActive = m.status === 'active';
                                    const roleStr = m.role === 'admin' ? 'Admin / Pengurus' : 'Anggota';

                                    return (
                                        <tr key={m.id} className="hover:bg-gray-50/30 transition duration-150 relative">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {m.user.avatarUrl ? (
                                                        <img
                                                            src={m.user.avatarUrl}
                                                            alt={m.user.name}
                                                            className="w-9 h-9 rounded-full object-cover shadow-inner flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className={`w-9 h-9 rounded-full bg-slate-200 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-inner`}>
                                                            {m.user.name?.[0]?.toUpperCase() ?? 'U'}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 leading-tight">{m.user.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{m.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-xs font-semibold">
                                                {m.role === 'admin' ? (
                                                    <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold text-[#0284C7] bg-[#E0F2FE]/40 border border-[#E0F2FE] rounded">
                                                        {roleStr}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-medium">{roleStr}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                    isActive ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                    {m.status}
                                                </span>
                                            </td>
                                            {currentUserRole === 'admin' && (
                                                <td className="px-6 py-3.5 text-center relative">
                                                    <button 
                                                        onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
                                                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer select-none"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                        </svg>
                                                    </button>
                                                    {activeMenuId === m.id && (
                                                        <div className="absolute right-12 top-2 z-10 bg-white border border-gray-150 rounded-xl shadow-lg p-1.5 w-24 text-left animate-scale-up">
                                                            <button 
                                                                onClick={() => handleDeleteMember(m.id)}
                                                                className="w-full text-left px-2.5 py-1.5 hover:bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer select-none"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: Invite Member */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <form 
                        onSubmit={handleInviteSubmit}
                        className="bg-white rounded-2xl max-w-md w-full border border-gray-100 p-6 shadow-2xl space-y-5 animate-scale-up"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <h3 className="font-serif text-lg font-bold text-slate-800 tracking-tight">Undang Anggota Baru</h3>
                            <button 
                                type="button"
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer select-none"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {errorMsg && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium">
                                {errorMsg}
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Email Pengguna Kyklos</label>
                            <input 
                                type="email"
                                required
                                value={inviteForm.email}
                                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                placeholder="contoh: warga@example.com"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary text-slate-900 placeholder:text-slate-500"
                            />
                            <p className="text-[10px] text-gray-500 pt-1">Pengguna harus sudah mendaftar di aplikasi Kyklos.</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Peran (Role)</label>
                            <select
                                value={inviteForm.role}
                                onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                                className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary text-slate-900 placeholder:text-slate-500"
                            >
                                <option value="member">Anggota Biasa</option>
                                <option value="admin">Pengurus / Admin</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={() => setShowInviteModal(false)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer select-none"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer select-none"
                            >
                                Tambahkan Anggota
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}


