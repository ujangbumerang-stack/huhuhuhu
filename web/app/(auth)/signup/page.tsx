'use client';

// Mengimpor React hooks, Next.js routing, dan modul autentikasi
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, loginWithGoogle } from '@/lib/auth';
import { api } from '@/lib/api';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';

export default function HalamanDaftar() {
    const pengarahRute = useRouter();

    // Status formulir daftar dengan penamaan bahasa Indonesia
    const [formulirDaftar, setFormulirDaftar] = useState({ namaLengkap: '', email: '', kataSandi: '' });
    const [pesanKesalahan, setPesanKesalahan] = useState<string>('');
    const [sedangMemuat, setSedangMemuat] = useState<boolean>(false);

    // Status visual tambahan untuk kata sandi dan Google register
    const [tampilkanKataSandi, setTampilkanKataSandi] = useState<boolean>(false);
    const [pesanGoogle, setPesanGoogle] = useState<string>('');

    // Menangani aksi pendaftaran menggunakan nama, email, dan kata sandi
    async function menanganiDaftar(peristiwa: React.FormEvent) {
        peristiwa.preventDefault();
        
        // Validasi minimal panjang kata sandi
        if (formulirDaftar.kataSandi.length < 8) {
            setPesanKesalahan('Kata sandi harus minimal 8 karakter.');
            return;
        }

        setSedangMemuat(true);
        setPesanKesalahan('');

        try {
            await register(formulirDaftar.email, formulirDaftar.kataSandi, formulirDaftar.namaLengkap);
            pengarahRute.push('/dashboard');
        } catch (kesalahan: any) {
            setPesanKesalahan(kesalahan.message || 'Gagal mendaftar. Silakan coba menggunakan alamat email lain.');
        } finally {
            setSedangMemuat(false);
        }
    }

    // Menangani pendaftaran menggunakan akun Google
    async function menanganiDaftarGoogle() {
        setSedangMemuat(true);
        setPesanKesalahan('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            
            await loginWithGoogle(idToken);
            
            const daftarKomunitas = await api.get<any[]>('/communities');
            if (daftarKomunitas && daftarKomunitas.length > 0) {
                localStorage.setItem('kyklos_active_community_slug', daftarKomunitas[0].slug);
            }
            pengarahRute.push('/dashboard');
        } catch (error: any) {
            setPesanKesalahan(error.message || 'Gagal mendaftar dengan Google.');
        } finally {
            setSedangMemuat(false);
        }
    }

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 relative overflow-hidden select-none"
            style={{
                backgroundImage: `linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            }}
        >
            <div className="w-full max-w-[420px] z-10 my-8">
                {/* Kotak Putih Utama / Kartu Daftar */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border border-slate-100 p-8 space-y-6 relative">
                    
                    {/* Tombol Kembali ke Halaman Utama */}
                    <Link 
                        href="/" 
                        title="Kembali ke Halaman Utama"
                        className="absolute left-4 top-4 sm:left-6 sm:top-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition border border-slate-150 text-slate-500 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>

                    {/* Header Kartu */}
                    <div className="text-center space-y-2">
                        <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-[#0F3A4B] hover:opacity-90 transition">
                            Kyklos
                        </Link>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Daftar Akun Baru
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Mulai perjalanan finansial komunitas Anda.
                        </p>
                    </div>

                    {/* Menampilkan pesan kesalahan jika pendaftaran gagal */}
                    {pesanKesalahan && (
                        <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium leading-relaxed">
                            ⚠️ {pesanKesalahan}
                        </div>
                    )}

                    {/* Menampilkan pesan simulasi Google Register */}
                    {pesanGoogle && (
                        <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-medium leading-relaxed">
                            💡 {pesanGoogle}
                        </div>
                    )}

                    {/* Tombol Daftar dengan Google */}
                    <button 
                        type="button"
                        onClick={menanganiDaftarGoogle}
                        className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition active:scale-[0.99] cursor-pointer"
                    >
                        {/* Logo Google G */}
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                        </svg>
                        <span>Daftar dengan Google</span>
                    </button>

                    {/* Pembatas Teks ATAU */}
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex-1 h-[1px] bg-slate-100"></div>
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest">ATAU</span>
                        <div className="flex-1 h-[1px] bg-slate-100"></div>
                    </div>

                    {/* Formulir Pendaftaran */}
                    <form onSubmit={menanganiDaftar} className="space-y-4">
                        {/* Input Nama Lengkap */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Nama Lengkap
                            </label>
                            <div className="relative">
                                {/* Icon Pengguna di Kiri */}
                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Masukkan nama lengkap Anda"
                                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3A4B]/20 focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500 transition"
                                    value={formulirDaftar.namaLengkap} 
                                    onChange={e => setFormulirDaftar(f => ({ ...f, namaLengkap: e.target.value }))} 
                                />
                            </div>
                        </div>

                        {/* Input Alamat Email */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Alamat Email
                            </label>
                            <div className="relative">
                                {/* Icon Surat di Kiri */}
                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="contoh@email.com"
                                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3A4B]/20 focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500 transition"
                                    value={formulirDaftar.email} 
                                    onChange={e => setFormulirDaftar(f => ({ ...f, email: e.target.value }))} 
                                />
                            </div>
                        </div>

                        {/* Input Kata Sandi */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                {/* Icon Gembok di Kiri */}
                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input 
                                    type={tampilkanKataSandi ? 'text' : 'password'} 
                                    required 
                                    placeholder="Buat kata sandi"
                                    className="w-full border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3A4B]/20 focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500 transition"
                                    value={formulirDaftar.kataSandi} 
                                    onChange={e => setFormulirDaftar(f => ({ ...f, kataSandi: e.target.value }))} 
                                />
                                {/* Icon Mata di Kanan untuk Tampilkan/Sembunyikan Kata Sandi */}
                                <button
                                    type="button"
                                    onClick={() => setTampilkanKataSandi(sebelumnya => !sebelumnya)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                                >
                                    {tampilkanKataSandi ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 012.201-3.238m3.537-3.536A10.025 10.025 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-2.246 3.224m-3.272-3.271A3 3 0 0012 9.75M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium pl-1">
                                Minimal 8 karakter.
                            </p>
                        </div>

                        {/* Tombol Daftar */}
                        <button 
                            type="submit" 
                            disabled={sedangMemuat}
                            className="w-full bg-[#0F3A4B] text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#0F3A4B]/10 hover:bg-[#0c2e3c] transition active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-4"
                        >
                            {sedangMemuat ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Memuat...</span>
                                </>
                            ) : (
                                <span>Daftar</span>
                            )}
                        </button>
                    </form>

                    {/* Bagian Bawah: Sudah punya akun */}
                    <p className="text-center text-xs sm:text-sm text-slate-500 border-t border-slate-100 pt-4">
                        Sudah punya akun? <Link href="/login" className="text-[#0F3A4B] font-bold hover:underline">Masuk</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
