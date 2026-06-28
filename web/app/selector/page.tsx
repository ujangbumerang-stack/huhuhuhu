'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Community {
    id: string;
    name: string;
    slug: string;
    themeColor: string;
    description?: string;
    memberships?: Array<{ role: string }>;
}

export default function SelectorPage() {
    const router = useRouter();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState({
        name: '',
        slug: '',
        description: '',
        themeColor: '#0F3A4B',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleNameChange = (val: string) => {
        const cleanSlug = val
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        setForm({ ...form, name: val, slug: cleanSlug });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.slug.trim()) return;
        setSubmitting(true);
        try {
            const newCommunity = await api.post<any>('/communities', form);
            // Refresh communities list
            const list = await api.get<Community[]>('/communities');
            setCommunities(list || []);
            setShowCreateModal(false);
            setForm({ name: '', slug: '', description: '', themeColor: '#0F3A4B' });
        } catch (err: any) {
            alert(err.message || 'Gagal membuat komunitas.');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        // Hapus active slug lama agar tidak ada residu
        localStorage.removeItem('kyklos_active_community_slug');

        api.get<Community[]>('/communities')
            .then(list => {
                setCommunities(list || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setErrorMsg('Gagal memuat daftar komunitas.');
                setLoading(false);
            });
    }, []);

    const handleSelect = (slug: string) => {
        localStorage.setItem('kyklos_active_community_slug', slug);
        router.push('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-[#0F3A4B]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-semibold text-slate-500">Memuat komunitas...</span>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12 relative overflow-hidden"
            style={{
                backgroundImage: `linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            }}
        >
            <div className="w-full max-w-4xl z-10 space-y-10">
                <div className="text-center space-y-3">
                    <h1 className="font-serif text-3xl md:text-4xl font-black text-[#0F3A4B] tracking-tight">
                        Pilih Komunitas
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 max-w-lg mx-auto">
                        Pilih komunitas yang ingin Anda masuki, atau buat komunitas baru untuk memulai pengelolaan finansial transparan Anda.
                    </p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold p-4 rounded-xl text-center">
                        {errorMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {communities.map(c => {
                        const role = c.memberships?.[0]?.role || 'member';
                        return (
                        <div 
                            key={c.id} 
                            onClick={() => handleSelect(c.slug)}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between space-y-6 group h-full"
                        >
                            <div className="flex items-start justify-between">
                                <div 
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl shadow-inner group-hover:scale-105 transition-transform"
                                    style={{ backgroundColor: c.themeColor || '#0B1E26' }}
                                >
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${role === 'admin' ? 'bg-[#0F3A4B]/10 text-[#0F3A4B]' : 'bg-slate-100 text-slate-500'}`}>
                                    {role === 'admin' ? 'Admin' : 'Member'}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-xl text-slate-800 tracking-tight leading-tight group-hover:text-[#0F3A4B] transition-colors">{c.name}</h3>
                                <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                    {c.description || 'Komunitas terkelola dengan sistem transparansi Kyklos.'}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0F3A4B]">
                                <span>Masuk ke Dasbor</span>
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </div>
                    )})}
                    
                    <div 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:bg-slate-100 hover:border-[#0F3A4B]/50 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 text-center min-h-[220px] group"
                    >
                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-200 group-hover:text-[#0F3A4B] group-hover:border-[#0F3A4B]/30 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-700 group-hover:text-[#0F3A4B] transition-colors">Buat Komunitas Baru</h3>
                            <p className="text-xs text-slate-400 mt-1.5 max-w-[200px]">Mulai komunitas Anda dan atur keanggotaan sekarang.</p>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('kyklos_token');
                            router.push('/login');
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                    >
                        Bukan Anda? Keluar dari akun.
                    </button>
                </div>
            </div>

            {/* ── Modal: Buat Komunitas Baru ── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-left">
                        <div className="flex items-center justify-between">
                            <h3 className="font-serif text-lg font-bold text-slate-800">Buat Komunitas Baru</h3>
                            <button 
                                onClick={() => setShowCreateModal(false)} 
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Komunitas</label>
                                <input
                                    type="text" required
                                    value={form.name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    placeholder="Contoh: Keluarga Cemara, RT 02 RW 03"
                                    className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary text-slate-800 font-semibold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">URL Slug Komunitas</label>
                                <div className="flex items-center gap-1.5 border border-slate-300 rounded-xl px-3.5 py-3 bg-slate-50 text-slate-500 text-sm">
                                    <span className="select-none text-xs font-semibold">kyklos.app/</span>
                                    <input
                                        type="text" required
                                        value={form.slug}
                                        onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        placeholder="slug-komunitas"
                                        className="flex-1 bg-transparent focus:outline-none text-slate-800 font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi Singkat</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Tulis tujuan atau deskripsi singkat komunitas Anda..."
                                    className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary text-slate-800 min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warna Tema Branding</label>
                                <div className="flex items-center gap-3 border border-slate-300 rounded-xl px-3.5 py-2.5">
                                    <input
                                        type="color"
                                        value={form.themeColor}
                                        onChange={e => setForm({ ...form, themeColor: e.target.value })}
                                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0"
                                    />
                                    <span className="text-xs font-mono font-bold text-slate-700 uppercase">{form.themeColor}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)} 
                                    className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-slate-600 hover:bg-gray-200 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-95 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Membuat...' : 'Buat Komunitas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
