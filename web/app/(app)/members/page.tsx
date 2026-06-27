'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// Tipe data anggota
interface ResidentMember {
    id: string;
    name: string;
    email: string;
    avatar: string;
    isInitialAvatar?: boolean;
    avatarColor?: string;
    unit: string;
    role: string;
    status: 'Active' | 'Inactive';
    compliance: number; // 0 - 100
}

const DEFAULT_MEMBERS: ResidentMember[] = [
    {
        id: "member_1",
        name: "Budi Santoso",
        email: "budi.s@example.com",
        avatar: "/budi_santoso.jpg",
        unit: "Tower A, 14-B",
        role: "Chairman",
        status: "Active",
        compliance: 100
    },
    {
        id: "member_2",
        name: "Siti Rahmawati",
        email: "siti.r@example.com",
        avatar: "/siti_rahmawati.jpg",
        unit: "Tower B, 08-F",
        role: "Treasurer",
        status: "Active",
        compliance: 100
    },
    {
        id: "member_3",
        name: "Arief Wijaya",
        email: "arief.w@example.com",
        avatar: "A",
        isInitialAvatar: true,
        avatarColor: "bg-[#E0F2FE] text-[#0284C7]",
        unit: "Tower A, 22-C",
        role: "Resident",
        status: "Inactive",
        compliance: 50
    },
    {
        id: "member_4",
        name: "Kevin Pratama",
        email: "kevin.p@example.com",
        avatar: "/kevin_pratama.jpg",
        unit: "Tower C, 05-A",
        role: "Resident",
        status: "Active",
        compliance: 15
    }
];

export default function MembersPage() {
    const [slug, setSlug] = useState('keluarga-cemara');
    const router = useRouter();
    const [members, setMembers] = useState<ResidentMember[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | 'Committee' | 'Arrears'>('All');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Form Anggota Baru
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        unit: '',
        role: 'Resident',
        status: 'Active' as 'Active' | 'Inactive',
        compliance: 100
    });

    // Ambil active slug dari localStorage
    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    // Ambil data anggota (Gunakan localStorage agar persisten)
    useEffect(() => {
        const stored = localStorage.getItem(`kyklos_members_${slug}`);
        if (stored) {
            try {
                setMembers(JSON.parse(stored));
            } catch {
                setMembers(DEFAULT_MEMBERS);
            }
        } else {
            setMembers(DEFAULT_MEMBERS);
        }
    }, [slug]);

    const saveMembers = (newMembers: ResidentMember[]) => {
        setMembers(newMembers);
        localStorage.setItem(`kyklos_members_${slug}`, JSON.stringify(newMembers));
    };

    // Tambah anggota baru
    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;

        const colors = [
            "bg-blue-100 text-blue-700",
            "bg-rose-100 text-rose-700",
            "bg-emerald-100 text-emerald-700",
            "bg-purple-100 text-purple-700",
            "bg-amber-100 text-amber-700"
        ];

        const newMember: ResidentMember = {
            id: `member_${Date.now()}`,
            name: inviteForm.name,
            email: inviteForm.email,
            avatar: inviteForm.name[0].toUpperCase(),
            isInitialAvatar: true,
            avatarColor: colors[Math.floor(Math.random() * colors.length)],
            unit: inviteForm.unit || "Tower A, 01-A",
            role: inviteForm.role,
            status: inviteForm.status,
            compliance: inviteForm.compliance
        };

        const updated = [...members, newMember];
        saveMembers(updated);
        setShowInviteModal(false);
        setInviteForm({
            name: '',
            email: '',
            unit: '',
            role: 'Resident',
            status: 'Active',
            compliance: 100
        });
    };

    // Hapus anggota
    const handleDeleteMember = (id: string) => {
        const updated = members.filter(m => m.id !== id);
        saveMembers(updated);
        setActiveMenuId(null);
    };

    // Filter Anggota berdasarkan pilihan
    const filteredMembers = members.filter(m => {
        // Filter Search Query
        const matchesSearch = 
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.unit.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Filter Category Tab
        if (activeFilter === 'Committee') {
            return m.role === 'Chairman' || m.role === 'Treasurer';
        }
        if (activeFilter === 'Arrears') {
            return m.compliance < 100;
        }
        return true;
    });

    // Metrik Kalkulasi
    const totalMembersDisplay = 138 + members.length; // Base 138 + custom members
    const committeeCount = members.filter(m => m.role === 'Chairman' || m.role === 'Treasurer').length + 6; // Base 6 + custom
    
    // Rata-rata kepatuhan iuran
    const averageCompliance = members.length > 0
        ? Math.round(members.reduce((sum, m) => sum + m.compliance, 0) / members.length)
        : 94;

    return (
        <div className="space-y-6 relative">
            {/* Header Members Directory */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">
                        Members Directory
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                        Manage community residents, roles, and dues compliance.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer select-none">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0F3A4B] text-white rounded-xl text-xs font-bold hover:bg-[#0c2e3c] transition shadow-sm cursor-pointer select-none"
                    >
                        {/* User Plus Icon */}
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Invite Member
                    </button>
                </div>
            </div>

            {/* Metrik Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Members */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Members</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                        <p className="font-serif text-3xl font-extrabold text-slate-800 tracking-tight">{totalMembersDisplay}</p>
                        <span className="text-[11px] font-semibold text-emerald-600">+3 this month</span>
                    </div>
                </div>

                {/* Active Roles */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Roles</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                        <p className="font-serif text-3xl font-extrabold text-slate-800 tracking-tight">{committeeCount}</p>
                        <span className="text-[11px] font-semibold text-gray-400">Committees</span>
                    </div>
                </div>

                {/* Dues Compliance */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dues Compliance</span>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div className="space-y-2 mt-4">
                        <p className="font-serif text-3xl font-extrabold text-slate-800 tracking-tight">{averageCompliance}%</p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0F3A4B] rounded-full" style={{ width: `${averageCompliance}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pencarian dan Filter Kategori */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pt-2">
                {/* Search Bar */}
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
                        placeholder="Search members by name or unit..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] bg-white text-slate-900 placeholder:text-slate-500 transition"
                    />
                </div>

                {/* Tab Filter Category */}
                <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200/60 w-fit select-none">
                    <button 
                        onClick={() => setActiveFilter('All')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            activeFilter === 'All'
                                ? 'bg-[#E0F2FE]/50 text-[#0284C7]'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        All Residents
                    </button>
                    <button 
                        onClick={() => setActiveFilter('Committee')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            activeFilter === 'Committee'
                                ? 'bg-[#E0F2FE]/50 text-[#0284C7]'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Committee
                    </button>
                    <button 
                        onClick={() => setActiveFilter('Arrears')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            activeFilter === 'Arrears'
                                ? 'bg-[#E0F2FE]/50 text-[#0284C7]'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        In Arrears
                    </button>
                </div>
            </div>

            {/* Tabel Utama Members */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                                <th className="px-6 py-4">Resident</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Dues Compliance</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-xs text-gray-400 font-medium">
                                        Tidak ada anggota yang cocok dengan filter pencarian.
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((m) => {
                                    const isActive = m.status === 'Active';
                                    const is100 = m.compliance === 100;
                                    const isLow = m.compliance <= 20;

                                    // Warna progress bar kepatuhan
                                    const progressColor = is100
                                        ? 'bg-[#0F3A4B]'
                                        : isLow
                                            ? 'bg-rose-500'
                                            : 'bg-[#ff6b00]';

                                    return (
                                        <tr key={m.id} className="hover:bg-gray-50/30 transition duration-150 relative">
                                            {/* Resident */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {m.isInitialAvatar ? (
                                                        <div className={`w-9 h-9 rounded-full ${m.avatarColor} font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-inner`}>
                                                            {m.avatar}
                                                        </div>
                                                    ) : (
                                                        <img 
                                                            src={m.avatar} 
                                                            alt={m.name}
                                                            className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-inner flex-shrink-0 bg-slate-50"
                                                        />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 leading-tight">{m.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{m.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Unit */}
                                            <td className="px-6 py-3.5 text-xs font-semibold text-slate-600">
                                                {m.unit}
                                            </td>

                                            {/* Role */}
                                            <td className="px-6 py-3.5 text-xs font-semibold">
                                                {m.role === 'Chairman' || m.role === 'Treasurer' ? (
                                                    <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold text-[#0284C7] bg-[#E0F2FE]/40 border border-[#E0F2FE] rounded">
                                                        {m.role}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-medium">{m.role}</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                    isActive
                                                        ? 'bg-sky-50 text-sky-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                    {m.status}
                                                </span>
                                            </td>

                                            {/* Dues Compliance progress */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2 max-w-[150px]">
                                                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                        <div className={`h-full ${progressColor}`} style={{ width: `${m.compliance}%` }}></div>
                                                    </div>
                                                    <span className={`text-[10px] font-extrabold ${isLow ? 'text-rose-500' : 'text-slate-800'}`}>
                                                        {m.compliance}%
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-3.5 text-center relative">
                                                <button 
                                                    onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
                                                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer select-none"
                                                >
                                                    {/* Vertical Three-dot Menu */}
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                    </svg>
                                                </button>

                                                {/* Dropdown Menu Aksi */}
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
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/10">
                    <p className="text-[10px] text-gray-400 font-semibold select-none">
                        Showing 1 to {filteredMembers.length} of {totalMembersDisplay} entries
                    </p>
                    <div className="flex gap-1.5 select-none self-end sm:self-auto">
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:bg-slate-50 transition cursor-pointer">
                            &lt;
                        </button>
                        <button className="w-7 h-7 rounded-lg bg-[#0F3A4B] text-white flex items-center justify-center text-xs font-bold">
                            1
                        </button>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:bg-slate-50 transition cursor-pointer">
                            2
                        </button>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:bg-slate-50 transition cursor-pointer">
                            3
                        </button>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:bg-slate-50 transition cursor-pointer">
                            &gt;
                        </button>
                    </div>
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

                        {/* Nama */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Lengkap</label>
                            <input 
                                type="text"
                                required
                                value={inviteForm.name}
                                onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                                placeholder="contoh: Kevin Pratama"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Alamat Email</label>
                            <input 
                                type="email"
                                required
                                value={inviteForm.email}
                                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                placeholder="contoh: kevin.p@example.com"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                            />
                        </div>

                        {/* Unit */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Unit / Rumah</label>
                            <input 
                                type="text"
                                value={inviteForm.unit}
                                onChange={e => setInviteForm({ ...inviteForm, unit: e.target.value })}
                                placeholder="contoh: Tower C, 05-A"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                            />
                        </div>

                        {/* Role & Status Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Peran (Role)</label>
                                <select
                                    value={inviteForm.role}
                                    onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                                >
                                    <option value="Resident">Resident</option>
                                    <option value="Chairman">Chairman</option>
                                    <option value="Treasurer">Treasurer</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Status Keaktifan</label>
                                <select
                                    value={inviteForm.status}
                                    onChange={e => setInviteForm({ ...inviteForm, status: e.target.value as 'Active' | 'Inactive' })}
                                    className="w-full border border-slate-300 bg-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Kepatuhan Dues */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Persentase Kepatuhan Iuran ({inviteForm.compliance}%)</label>
                            <input 
                                type="range"
                                min="0"
                                max="100"
                                value={inviteForm.compliance}
                                onChange={e => setInviteForm({ ...inviteForm, compliance: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0F3A4B]"
                            />
                        </div>

                        {/* Button Actions */}
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
                                className="flex-1 py-2.5 bg-[#0F3A4B] text-white rounded-xl text-xs font-bold hover:bg-[#0c2e3c] transition shadow-sm cursor-pointer select-none"
                            >
                                Kirim Undangan
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
