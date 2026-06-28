'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Community {
    id: string;
    name: string;
    slug: string;
    themeColor: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const [slug, setSlug] = useState('keluarga-cemara');
    const [communityId, setCommunityId] = useState('');
    const [activeTab, setActiveTab] = useState<'profile' | 'bank' | 'theme'>('profile');

    // States untuk Form Edit Profile
    const [profileForm, setProfileForm] = useState({
        username: 'unimus70bringin799708',
        name: 'unimus70bringin',
        email: 'unimus70bringin@gmail.com',
        phone: 'Not added',
        bio: ''
    });

    // States untuk Form Bank Account
    const [bankForm, setBankForm] = useState({
        method: 'manual_transfer',
        bankName: '', 
        accountNumber: '', 
        accountHolder: '',
        gatewayProvider: 'midtrans', 
        serverKey: '', 
        clientKey: '',
    });

    // States untuk Tema
    const [selectedThemeColor, setSelectedThemeColor] = useState('#0F3A4B');

    // States untuk Status Transaksi
    const [savedProfile, setSavedProfile] = useState(false);
    const [savedBank, setSavedBank] = useState(false);
    const [savedTheme, setSavedTheme] = useState(false);
    const [loading, setLoading] = useState(false);

    // Ambil active slug dari localStorage
    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    // Load Data Awal
    useEffect(() => {
        // Load Profile
        const storedProfile = localStorage.getItem('kyklos_user_profile');
        if (storedProfile) {
            try { setProfileForm(JSON.parse(storedProfile)); } catch {}
        }

        // Load Bank & Theme Config
        api.get<any[]>('/communities').then(list => {
            const c = list.find(x => x.slug === slug) || list[0];
            if (!c) return;
            setCommunityId(c.id);
            setSelectedThemeColor(c.themeColor);
            
            // Set Form Profile fallback if empty
            if (!storedProfile) {
                setProfileForm(f => ({
                    ...f,
                    username: `${c.name.toLowerCase().replace(/\s+/g, '')}799758`,
                    name: c.name,
                    email: `${c.name.toLowerCase()}@gmail.com`
                }));
            }

            return api.get<any>(`/communities/${c.id}/payment-config`);
        }).then(cfg => {
            if (!cfg) return;
            setBankForm(f => ({
                ...f,
                method: cfg.method ?? 'manual_transfer',
                bankName: cfg.bankName ?? '',
                accountNumber: cfg.accountNumber ?? '',
                accountHolder: cfg.accountHolder ?? '',
                gatewayProvider: cfg.gatewayProvider ?? 'midtrans',
            }));
        }).catch(() => router.push('/login'));
    }, [slug, router]);

    // Simpan Profile
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/auth/profile', { name: profileForm.name });
            localStorage.setItem('kyklos_user_profile', JSON.stringify(profileForm));
            // Sinkronisasi data ke navbar utama
            const event = new Event('storage');
            window.dispatchEvent(event);
            
            setSavedProfile(true);
            setTimeout(() => setSavedProfile(false), 3000);
        } catch (err) {
            console.error('Gagal menyimpan profile:', err);
        } finally {
            setLoading(false);
        }
    };

    // Simpan Bank Account
    const handleSaveBank = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/communities/${communityId}/payment-config`, bankForm);
            setSavedBank(true);
            setTimeout(() => setSavedBank(false), 3000);
        } catch (err) {
            console.error('Gagal menyimpan konfigurasi pembayaran:', err);
        } finally {
            setLoading(false);
        }
    };

    // Simpan Tema (Theme Color)
    const handleSaveTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Update warna primer di tingkat DOM CSS Variables secara langsung
            document.documentElement.style.setProperty('--community-primary', selectedThemeColor);
            
            // Update warna di API backend komunitas
            await api.patch(`/communities/${communityId}`, { themeColor: selectedThemeColor });
            
            // Trigger event storage untuk memicu pembaruan sidebar layout
            const event = new Event('storage');
            window.dispatchEvent(event);

            setSavedTheme(true);
            setTimeout(() => setSavedTheme(false), 3000);
        } catch (err) {
            console.error('Gagal menyimpan tema:', err);
        } finally {
            setLoading(false);
        }
    };

    const THEME_OPTIONS = [
        { name: 'Teal (Default)', color: '#0F3A4B' },
        { name: 'Sky Blue', color: '#0284C7' },
        { name: 'Orange', color: '#ff6b00' },
        { name: 'Indigo', color: '#4F46E5' },
        { name: 'Emerald', color: '#059669' },
        { name: 'Red', color: '#DC2626' },
        { name: 'Purple', color: '#7C3AED' }
    ];

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header Settings */}
            <div className="space-y-1 select-none">
                <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Settings</h1>
                <p className="text-xs sm:text-sm text-gray-400 font-semibold">Manage your profile, payment gateways, and design aesthetics.</p>
            </div>

            {/* Grid Konten Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                
                {/* Tampilan Tab untuk Layar Seluler & Tablet (lg:hidden) */}
                <div className="lg:hidden flex overflow-x-auto gap-2 border-b border-slate-200 pb-3 select-none scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-200 whitespace-nowrap cursor-pointer focus:outline-none ${
                            activeTab === 'profile'
                                ? 'bg-orange-50 text-primary'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Edit Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('bank')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-200 whitespace-nowrap cursor-pointer focus:outline-none ${
                            activeTab === 'bank'
                                ? 'bg-orange-50 text-primary'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Bank Account
                    </button>
                    <button
                        onClick={() => setActiveTab('theme')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-200 whitespace-nowrap cursor-pointer focus:outline-none ${
                            activeTab === 'theme'
                                ? 'bg-orange-50 text-primary'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Tema
                    </button>
                </div>

                {/* Kolom Kiri: Sidebar Settings untuk Layar Desktop (lg:flex) */}
                <aside className="hidden lg:flex lg:col-span-4 flex-col space-y-6 select-none">
                    {/* Kelompok Account */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Account</h3>
                        <div className="flex flex-col gap-1.5">
                            {/* Tombol Edit Profile */}
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 text-left cursor-pointer focus:outline-none w-full ${
                                    activeTab === 'profile'
                                        ? 'text-primary'
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <svg className={`w-4.5 h-4.5 ${activeTab === 'profile' ? 'text-primary' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span>Edit Profile</span>
                            </button>

                            {/* Tombol Bank Account */}
                            <button
                                onClick={() => setActiveTab('bank')}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 text-left cursor-pointer focus:outline-none w-full ${
                                    activeTab === 'bank'
                                        ? 'text-primary'
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <svg className={`w-4.5 h-4.5 ${activeTab === 'bank' ? 'text-primary' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <span>Bank Account</span>
                            </button>
                        </div>
                    </div>

                    {/* Kelompok General */}
                    <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase">General</h3>
                        <div className="flex flex-col gap-1.5">
                            {/* Tombol Tema (Theme) */}
                            <button
                                onClick={() => setActiveTab('theme')}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 text-left cursor-pointer focus:outline-none w-full ${
                                    activeTab === 'theme'
                                        ? 'text-primary'
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <svg className={`w-4.5 h-4.5 ${activeTab === 'theme' ? 'text-primary' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                                <span>Tema</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Kolom Kanan: Detail Formulir (Details Panel) */}
                <main className="lg:col-span-8">
                    
                    {/* TAB: Edit Profile */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6 animate-fade-in text-left">
                            <div className="border-b border-gray-100 pb-3 select-none">
                                <h2 className="font-serif text-lg font-bold text-slate-800 tracking-tight">Edit Profile</h2>
                                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Ubah avatar, username, nama lengkap, dan data diri Anda.</p>
                            </div>

                            {/* Avatar Circle */}
                            <div className="flex flex-col items-center justify-center py-2 select-none">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold font-sans select-none">
                                        {profileForm.name ? profileForm.name[0].toUpperCase() : 'U'}
                                    </div>
                                    <button type="button" className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50 cursor-pointer transition">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Fields */}
                            <div className="space-y-5">
                                {/* Username */}
                                <div className="relative border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white">
                                    <label className="bg-white px-1 absolute -top-2 left-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.username}
                                        onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
                                        className="w-full text-sm font-semibold text-slate-900 focus:outline-none bg-transparent"
                                    />
                                </div>

                                {/* Name */}
                                <div className="relative border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white">
                                    <label className="bg-white px-1 absolute -top-2 left-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Name</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.name}
                                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                        className="w-full text-sm font-semibold text-slate-900 focus:outline-none bg-transparent"
                                    />
                                </div>

                                {/* Email (Disabled) */}
                                <div className="relative border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5">
                                    <label className="bg-white px-1 absolute -top-2 left-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                    <input 
                                        type="email" 
                                        disabled
                                        value={profileForm.email}
                                        className="w-full text-sm font-semibold text-slate-400 focus:outline-none bg-transparent cursor-not-allowed"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="relative border border-slate-300 rounded-xl px-3.5 py-2.5 flex items-center justify-between bg-white">
                                    <label className="bg-white px-1 absolute -top-2 left-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.phone}
                                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        className="w-full text-sm font-semibold text-slate-900 focus:outline-none bg-transparent"
                                    />
                                    {profileForm.phone === 'Not added' && (
                                        <button type="button" onClick={() => alert('Fitur verifikasi telepon sedang dikembangkan.')} className="text-xs font-bold text-primary hover:underline cursor-pointer select-none">
                                            Verify
                                        </button>
                                    )}
                                </div>

                                {/* Bio */}
                                <div className="space-y-1">
                                    <div className="relative border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white">
                                        <label className="bg-white px-1 absolute -top-2 left-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bio</label>
                                        <textarea 
                                            value={profileForm.bio}
                                            onChange={e => {
                                                if (e.target.value.length <= 250) {
                                                    setProfileForm({ ...profileForm, bio: e.target.value });
                                                }
                                            }}
                                            rows={3}
                                            placeholder="Tell people about yourself"
                                            className="w-full text-sm font-semibold text-slate-900 focus:outline-none bg-transparent resize-none placeholder:text-slate-400 placeholder:font-normal"
                                        />
                                    </div>
                                    <p className="text-[10px] text-right text-gray-400 font-semibold select-none">
                                        {profileForm.bio.length}/250 characters
                                    </p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`w-28 py-2.5 bg-[#CBD5E1] hover:bg-[#b8c5d6] text-slate-700 font-bold rounded-xl text-xs transition duration-200 cursor-pointer select-none text-center disabled:opacity-60 ${
                                        savedProfile ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                                    }`}
                                >
                                    {savedProfile ? 'Saved' : 'Save'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB: Bank Account */}
                    {activeTab === 'bank' && (
                        <form onSubmit={handleSaveBank} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6 animate-fade-in text-left">
                            <div className="border-b border-gray-100 pb-3 select-none">
                                <h2 className="font-serif text-lg font-bold text-slate-800 tracking-tight">Bank Account Settings</h2>
                                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Atur detail rekening bank untuk menerima pembayaran iuran warga.</p>
                            </div>

                            {/* Metode Select */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider select-none">Metode Pembayaran</label>
                                <select 
                                    value={bankForm.method} 
                                    onChange={e => setBankForm(f => ({ ...f, method: e.target.value }))}
                                    className="w-full border border-slate-300 bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-900 placeholder:text-slate-500 transition"
                                >
                                    <option value="manual_transfer">Transfer Manual (Bank lokal)</option>
                                    <option value="gateway">Payment Gateway Otomatis (Midtrans)</option>
                                </select>
                            </div>

                            {/* Manual Transfer Form */}
                            {bankForm.method === 'manual_transfer' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider select-none">Nama Bank</label>
                                            <input 
                                                type="text"
                                                value={bankForm.bankName} 
                                                onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))}
                                                placeholder="contoh: BCA, Bank Mandiri, BNI" 
                                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary text-slate-900 placeholder:text-slate-500" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider select-none">Nomor Rekening</label>
                                            <input 
                                                type="text"
                                                value={bankForm.accountNumber} 
                                                onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))}
                                                placeholder="contoh: 8012345678"
                                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary text-slate-900 placeholder:text-slate-500" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider select-none">Atas Nama Pemilik Rekening</label>
                                        <input 
                                            type="text"
                                            value={bankForm.accountHolder} 
                                            onChange={e => setBankForm(f => ({ ...f, accountHolder: e.target.value }))}
                                            placeholder="Nama sesuai di buku tabungan bank"
                                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary text-slate-900 placeholder:text-slate-500" 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Gateway Form */}
                            {bankForm.method === 'gateway' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800 select-none">
                                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <p className="text-xs font-medium leading-normal">
                                            <strong>Pemberitahuan Uji Coba:</strong> Gunakan API Sandbox Key dari dashboard developer Midtrans (dashboard.sandbox.midtrans.com) — dilarang keras menggunakan Production Key.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider select-none">Server Key (Sandbox)</label>
                                        <input 
                                            type="password" 
                                            value={bankForm.serverKey} 
                                            onChange={e => setBankForm(f => ({ ...f, serverKey: e.target.value }))}
                                            placeholder="SB-Mid-server-xxxx" 
                                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-primary text-slate-900 placeholder:text-slate-500" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider select-none">Client Key (Sandbox)</label>
                                        <input 
                                            type="text"
                                            value={bankForm.clientKey} 
                                            onChange={e => setBankForm(f => ({ ...f, clientKey: e.target.value }))}
                                            placeholder="SB-Mid-client-xxxx" 
                                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-primary text-slate-900 placeholder:text-slate-500" 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`w-full py-3 bg-primary hover:brightness-90 hover:shadow-md text-white rounded-xl text-xs font-bold shadow-sm transition duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center select-none ${
                                        savedBank ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                                    }`}
                                >
                                    {savedBank ? (
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Berhasil Disimpan
                                        </span>
                                    ) : loading ? (
                                        'Menyimpan Perubahan...'
                                    ) : (
                                        'Simpan Konfigurasi Rekening'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* TAB: Tema (Theme Color) */}
                    {activeTab === 'theme' && (
                        <form onSubmit={handleSaveTheme} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6 animate-fade-in text-left">
                            <div className="border-b border-gray-100 pb-3 select-none">
                                <h2 className="font-serif text-lg font-bold text-slate-800 tracking-tight">Kustomisasi Tema Komunitas</h2>
                                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Pilih warna dasar tema utama untuk merepresentasikan identitas komunitas Anda.</p>
                            </div>

                            {/* Color Swatch Options */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                                {THEME_OPTIONS.map((theme) => {
                                    const isSelected = selectedThemeColor === theme.color;
                                    return (
                                        <button
                                            key={theme.color}
                                            type="button"
                                            onClick={() => setSelectedThemeColor(theme.color)}
                                            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 text-left focus:outline-none cursor-pointer ${
                                                isSelected 
                                                    ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/10' 
                                                    : 'border-slate-200 hover:border-slate-350 bg-white'
                                            }`}
                                        >
                                            <div 
                                                className="w-5 h-5 rounded-full shadow-inner border border-black/5 flex-shrink-0"
                                                style={{ backgroundColor: theme.color }}
                                            />
                                            <span className="text-xs font-bold text-slate-800 truncate">{theme.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`w-full py-3 bg-primary hover:brightness-90 hover:shadow-md text-white rounded-xl text-xs font-bold shadow-sm transition duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center select-none ${
                                        savedTheme ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                                    }`}
                                    style={{ backgroundColor: savedTheme ? undefined : selectedThemeColor }}
                                >
                                    {savedTheme ? (
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Tema Berhasil Diperbarui
                                        </span>
                                    ) : loading ? (
                                        'Memproses Perubahan...'
                                    ) : (
                                        'Simpan & Terapkan Tema'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </main>
            </div>
        </div>
    );
}



