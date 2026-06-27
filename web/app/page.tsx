'use client';
 
// Mengimpor React hooks dan komponen Next.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMe } from '@/lib/auth';
// Definisi tipe data untuk pengguna aktif
interface DataPengguna {
    name: string;
    email: string;
}

export default function HalamanUtama() {
    const [penggunaAktif, setPenggunaAktif] = useState<DataPengguna | null>(null);
    const [statusMemuat, setStatusMemuat] = useState<boolean>(true);
    const [apakahDisinkronisasi, setApakahDisinkronisasi] = useState<boolean>(true);


    // Memeriksa status login pengguna saat pertama kali dimuat
    useEffect(() => {
        getMe().then((pengguna) => {
            if (pengguna) {
                setPenggunaAktif(pengguna);
            }
            setStatusMemuat(false);
        }).catch(() => {
            setStatusMemuat(false);
        });
    }, []);

    // Memberikan efek animasi rotasi pada indikator sinkronisasi secara berkala
    useEffect(() => {
        const intervalSinkronisasi = setInterval(() => {
            setApakahDisinkronisasi(sebelumnya => !sebelumnya);
            setTimeout(() => {
                setApakahDisinkronisasi(sebelumnya => !sebelumnya);
            }, 1000);
        }, 5000);
        return () => clearInterval(intervalSinkronisasi);
    }, []);



    return (
        <div className="min-h-screen bg-white text-[#171717] font-sans selection:bg-[#0F3A4B]/10 selection:text-[#0F3A4B]">
            {/* Header / Navigasi Utama */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo Kiri */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-[#0F3A4B] hover:opacity-90 transition">
                            Kyklos
                        </Link>
                    </div>

                    {/* Menu Navigasi Tengah */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#fitur" className="text-sm font-medium text-gray-500 hover:text-[#0F3A4B] transition duration-200">
                            Features
                        </a>
                        <a href="#pratinjau" className="text-sm font-medium text-gray-500 hover:text-[#0F3A4B] transition duration-200">
                            Dashboard Preview
                        </a>
                        <a href="#tentang" className="text-sm font-medium text-gray-500 hover:text-[#0F3A4B] transition duration-200">
                            About Us
                        </a>
                    </nav>

                    {/* Tombol Aksi Kanan (Menampilkan opsi masuk dan buat komunitas) */}
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-semibold text-[#0F3A4B] hover:opacity-80 transition px-3 py-2">
                            Log In
                        </Link>
                        <Link href={penggunaAktif ? "/dashboard" : "/login"} className="text-sm font-medium bg-[#0F3A4B] text-white px-4 py-2 rounded-md hover:bg-[#0c2e3c] transition duration-200 shadow-sm">
                            Buat Komunitas
                        </Link>
                    </div>
                </div>
            </header>

            {/* Bagian Hero */}
            <section className="relative overflow-hidden pt-12 pb-24 md:py-32 bg-gradient-to-b from-white to-[#F4F6FA]/30">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    
                    {/* Hero Teks (Kolom Kiri) */}
                    <div className="lg:col-span-5 space-y-6 text-left">
                        {/* Badge Kategori */}
                        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EFF3F5] text-[#0F3A4B] border border-[#0F3A4B]/5 tracking-wide">
                            Enterprise Financial Tools
                        </span>

                        {/* Judul Utama */}
                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                            Kepercayaan lewat Transparansi
                        </h1>

                        {/* Deskripsi */}
                        <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg">
                            Platform manajemen finansial komunitas yang dirancang untuk otoritas dan stabilitas. 
                            Kelola Arisan, Acara, dan Transparansi Dana dengan keyakinan penuh.
                        </p>

                        {/* Tombol Aksi */}
                        <div className="flex flex-wrap gap-4 pt-2">
                            {penggunaAktif ? (
                                <Link href="/dashboard" className="bg-[#0F3A4B] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0c2e3c] transition duration-200 shadow-md flex items-center gap-2">
                                    Masuk ke Dashboard <span>→</span>
                                </Link>
                            ) : (
                                <Link href="/login" className="bg-[#0F3A4B] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0c2e3c] transition duration-200 shadow-md">
                                    Mulai Sekarang
                                </Link>
                            )}
                            <a href="#fitur" className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition duration-200">
                                Pelajari Lebih Lanjut
                            </a>
                        </div>
                    </div>

                    {/* iMac Monitor Mockup (Kolom Kanan) */}
                    <div className="lg:col-span-7 flex justify-center relative">
                        {/* Desain iMac dalam CSS murni */}
                        <div className="w-full max-w-[580px] flex flex-col items-center">
                            {/* Layar Utama */}
                            <div className="w-full bg-[#12131a] rounded-t-2xl p-3 border-[6px] border-[#0a0a0c] shadow-2xl relative">
                                <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-[#0a0d14] flex flex-col relative text-white select-none">
                                    
                                    {/* Isi Layar: Pratinjau Dashboard Gelap */}
                                    <div className="flex flex-1 overflow-hidden text-[10px]">
                                        {/* Layar Sidebar Kiri */}
                                        <div className="w-[45px] bg-[#0c0e17] border-r border-white/5 p-2 flex flex-col gap-2">
                                            <div className="w-5 h-5 rounded-md bg-[#0F3A4B] flex items-center justify-center font-bold text-[8px]">K</div>
                                            <div className="flex-1 space-y-2 mt-2">
                                                <div className="h-2.5 rounded bg-white/20 w-full"></div>
                                                <div className="h-2.5 rounded bg-white/10 w-4/5"></div>
                                                <div className="h-2.5 rounded bg-white/10 w-3/4"></div>
                                            </div>
                                        </div>

                                        {/* Layar Konten Utama */}
                                        <div className="flex-1 p-3 flex flex-col gap-3 overflow-hidden">
                                            {/* Bar Atas */}
                                            <div className="flex items-center justify-between">
                                                <div className="h-3 rounded bg-white/20 w-1/3"></div>
                                                <div className="w-4 h-4 rounded-full bg-white/20"></div>
                                            </div>

                                            {/* Area Grafik Origami 3D */}
                                            <div className="flex-1 bg-[#101422] rounded-lg border border-white/5 p-4 flex items-center justify-center relative overflow-hidden">
                                                {/* Grid Latar Belakang */}
                                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_14px]"></div>
                                                
                                                {/* Model Poligon 3D Origami */}
                                                <svg className="w-40 h-40 drop-shadow-[0_10px_15px_rgba(15,58,75,0.4)] relative z-10" viewBox="0 0 100 100">
                                                    <defs>
                                                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#1B4D60" />
                                                            <stop offset="100%" stopColor="#0B1A24" />
                                                        </linearGradient>
                                                        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#2E6B80" />
                                                            <stop offset="100%" stopColor="#102530" />
                                                        </linearGradient>
                                                        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#4A93A8" stopOpacity="0.8" />
                                                            <stop offset="100%" stopColor="#1B4D60" stopOpacity="0.8" />
                                                        </linearGradient>
                                                    </defs>
                                                    
                                                    {/* Sisi-sisi Origami 3D */}
                                                    <polygon points="50,15 25,50 50,60" fill="url(#grad1)" stroke="#ffffff0d" strokeWidth="0.5" />
                                                    <polygon points="50,15 75,50 50,60" fill="url(#grad2)" stroke="#ffffff0d" strokeWidth="0.5" />
                                                    <polygon points="25,50 50,60 20,80" fill="url(#grad2)" stroke="#ffffff0d" strokeWidth="0.5" />
                                                    <polygon points="75,50 50,60 80,80" fill="url(#grad1)" stroke="#ffffff0d" strokeWidth="0.5" />
                                                    <polygon points="50,60 20,80 50,85" fill="url(#grad3)" stroke="#ffffff0d" strokeWidth="0.5" />
                                                    <polygon points="50,60 80,80 50,85" fill="url(#grad2)" stroke="#ffffff0d" strokeWidth="0.5" />
                                                    
                                                    {/* Puncak Penutup atas */}
                                                    <polygon points="50,15 45,35 50,60" fill="url(#grad3)" stroke="#ffffff1a" strokeWidth="0.5" />
                                                    <polygon points="50,15 55,35 50,60" fill="url(#grad1)" stroke="#ffffff1a" strokeWidth="0.5" />
                                                </svg>
                                            </div>

                                            {/* Panel Ringkasan Bawah */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-[#0c0f1b] border border-white/5 rounded p-2 flex flex-col gap-1">
                                                    <div className="h-2 rounded bg-white/10 w-2/3"></div>
                                                    <div className="h-3 rounded bg-[#1B4D60]/40 w-1/2"></div>
                                                </div>
                                                <div className="bg-[#0c0f1b] border border-white/5 rounded p-2 flex flex-col gap-1">
                                                    <div className="h-2 rounded bg-white/10 w-1/2"></div>
                                                    <div className="h-3 rounded bg-white/20 w-3/4"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Bezel Bawah Perak iMac */}
                            <div className="w-full bg-[#E2E8F0] h-[34px] border-x-[6px] border-b-[6px] border-[#CBD5E1] rounded-b-2xl flex items-center justify-center relative shadow-lg">
                                {/* Sensor/Kamera Mini Hitam di Bezel Bawah */}
                                <div className="w-1.5 h-1.5 rounded-full bg-[#1e293b]"></div>
                            </div>

                            {/* Penyangga iMac Perak (Stand) */}
                            <div className="w-28 bg-gradient-to-b from-[#CBD5E1] to-[#94A3B8] h-[50px] relative clip-stand shadow-inner"></div>
                            {/* Kaki Penyangga Bawah */}
                            <div className="w-40 bg-[#94A3B8] h-[6px] rounded-full shadow-md"></div>
                        </div>

                        {/* Dekorasi Latar Belakang */}
                        <div className="absolute -z-10 w-72 h-72 bg-[#0F3A4B]/5 rounded-full blur-3xl -top-10 -right-10"></div>
                        <div className="absolute -z-10 w-72 h-72 bg-[#4A93A8]/5 rounded-full blur-3xl -bottom-10 -left-10"></div>
                    </div>

                </div>
            </section>
 


            {/* Bagian Fitur (Bento Grid Layout) */}
            <section id="fitur" className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-100">
                {/* Header Section */}
                <div className="text-center space-y-3 mb-16">
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                        Fitur Utama Platform
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        Dirancang khusus untuk kebutuhan manajemen kolektif dengan fokus pada akuntabilitas institusional.
                    </p>
                </div>

                {/* Grid Bento Asimetris */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Kartu 1: Manajemen Arisan Otomatis (Wider - col-span-2) */}
                    <div className="md:col-span-2 bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/80 rounded-2xl p-8 flex flex-col md:flex-row gap-6 justify-between hover:shadow-md transition duration-300">
                        <div className="flex-1 space-y-4">
                            {/* Icon Square */}
                            <div className="w-12 h-12 rounded-xl bg-[#0F3A4B] flex items-center justify-center text-white shadow-sm">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-serif text-xl font-bold text-gray-900">Manajemen Arisan Otomatis</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Sistem pengundian transparan, pelacakan pembayaran otomatis, dan laporan historis lengkap untuk setiap putaran arisan. Bebas dari manipulasi.
                                </p>
                            </div>
                        </div>
                        {/* Ilustrasi Grafik Arisan Ringkas di dalam kartu */}
                        <div className="w-full md:w-48 bg-white border border-gray-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm self-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Pemenang Arisan</span>
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center justify-between text-xs bg-gray-50 p-1.5 rounded">
                                    <span className="font-medium">1. Budi Santoso</span>
                                    <span className="text-green-600 font-bold">✓ Lunas</span>
                                </div>
                                <div className="flex items-center justify-between text-xs bg-gray-50 p-1.5 rounded">
                                    <span className="font-medium">2. Ani Wijaya</span>
                                    <span className="text-[#0F3A4B] font-semibold">🔄 Putaran 4</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kartu 2: Event Management (Standard - col-span-1) */}
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-8 flex flex-col justify-between hover:shadow-md transition duration-300">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-serif text-xl font-bold text-gray-900">Event Management</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Kelola acara komunitas, RSVP, dan pendanaan acara dalam satu tempat dengan sistem pembukuan terintegrasi.
                                </p>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                            <span>Mulai Event Baru</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Kartu 3: Transparency Forum (Standard - col-span-1) */}
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-8 flex flex-col justify-between hover:shadow-md transition duration-300">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-serif text-xl font-bold text-gray-900">Transparency Forum</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Diskusi terbuka dengan lampiran bukti transaksi. Keputusan komunitas didokumentasikan secara permanen.
                                </p>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-xs text-orange-600 font-semibold">
                            <span>Akses Diskusi Publik</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Kartu 4: Ledger Keuangan Real-time (Wider - col-span-2) */}
                    <div className="md:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-8 flex flex-col md:flex-row gap-6 justify-between hover:shadow-md transition duration-300 relative overflow-hidden">
                        <div className="flex-1 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-serif text-xl font-bold text-gray-900">Ledger Keuangan Real-time</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Buku besar digital yang mencatat setiap arus kas masuk dan keluar secara seketika. Dapat diakses oleh seluruh anggota berwenang untuk audit instan.
                                </p>
                            </div>
                        </div>

                        {/* Indikator Status "Live Sync" di Pojok Kanan Bawah */}
                        <div className="md:self-end flex items-center gap-2 bg-gray-50 border border-gray-150 px-3 py-1.5 rounded-full shadow-sm text-[11px] text-gray-500 font-medium">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <span>Live Sync Enabled</span>
                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-1000 ${apakahDisinkronisasi ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                            </svg>
                        </div>
                    </div>

                </div>
            </section>

            {/* Bagian Antarmuka Otoritatif */}
            <section id="pratinjau" className="bg-[#F4F6FA] py-24 border-t border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <div className="text-center space-y-3 mb-16">
                        <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                            Antarmuka Otoritatif
                        </h2>
                        <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            Desain elegan yang memprioritaskan keterbacaan data kompleks, memberikan rasa tenang dalam pengelolaan dana.
                        </p>
                    </div>

                    {/* Replika Desain Dashboard Sesuai Gambar */}
                    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden flex flex-col md:flex-row transition-all duration-300">
                        {/* Sidebar Dashboard Kiri */}
                        <aside className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-gray-100 p-5 flex flex-col justify-between flex-shrink-0">
                            <div className="space-y-6">
                                {/* Logo Komunitas */}
                                <div className="font-serif text-xl font-black text-[#0F3A4B] tracking-tight">
                                    Kyklos
                                </div>
                                {/* Menu Navigasi */}
                                <nav className="space-y-1">
                                    <div className="flex items-center gap-3 bg-[#0F3A4B] text-white px-3 py-2.5 rounded-xl text-xs font-semibold shadow-sm shadow-[#0F3A4B]/20">
                                        {/* Icon Dashboard */}
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                                        </svg>
                                        <span>Dashboard</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-400 px-3 py-2.5 rounded-xl text-xs font-medium">
                                        {/* Icon Wallet */}
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        <span>Pockets</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-400 px-3 py-2.5 rounded-xl text-xs font-medium">
                                        {/* Icon Ledger */}
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        <span>Ledger</span>
                                    </div>
                                </nav>
                            </div>

                            {/* Versi Info di Sidebar Bawah */}
                            <div className="text-[10px] text-gray-400 mt-6 pt-4 border-t border-gray-50 font-semibold">
                                Kyklos OS v1.0
                            </div>
                        </aside>

                        {/* Konten Dashboard Utama Kanan */}
                        <main className="flex-1 bg-gray-50/50 p-6 space-y-6">
                            {/* Bar Dashboard Atas */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-4">
                                <div className="space-y-1">
                                    <h3 className="font-serif text-lg font-bold text-gray-900">Tinjauan Komunitas</h3>
                                    <p className="text-xs text-gray-500">Data real-time per hari ini.</p>
                                </div>
                                <div>
                                    <button 
                                        type="button"
                                        className="bg-[#0F3A4B]/95 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-default select-none"
                                    >
                                        <span>Ekspor Laporan</span>
                                    </button>
                                </div>
                            </div>

                            {/* Ringkasan Kartu Angka Utama */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Total Dana */}
                                <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
                                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Dana Tersedia</span>
                                    <p className="font-serif text-2xl font-bold text-gray-900 mt-1">Rp 45.2M</p>
                                </div>
                                {/* Anggota Aktif */}
                                <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
                                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Anggota Aktif</span>
                                    <p className="font-serif text-2xl font-bold text-gray-900 mt-1">128</p>
                                </div>
                                {/* Arisan */}
                                <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
                                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Arisan Berlangsung</span>
                                    <p className="font-serif text-2xl font-bold text-gray-900 mt-1">3</p>
                                </div>
                            </div>

                            {/* Daftar Transaksi Terakhir */}
                            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaksi Terakhir</h4>
                                
                                <div className="divide-y divide-gray-100">
                                    {/* Baris Transaksi 1 */}
                                    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0 px-2 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {/* Icon Panah Bawah / Masuk */}
                                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                ↓
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">Iuran Bulanan - Budi S.</p>
                                                <p className="text-[10px] text-gray-400">12 Okt 2023</p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-emerald-600">+ Rp 500.000</span>
                                        </div>
                                    </div>

                                    {/* Baris Transaksi 2 */}
                                    <div className="flex items-center justify-between py-3 last:pb-0 px-2 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {/* Icon Panah Atas / Keluar */}
                                            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                                                ↑
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">Pencairan Arisan Putaran 3</p>
                                                <p className="text-[10px] text-gray-400">10 Okt 2023</p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-rose-600">- Rp 5.000.000</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </section>

            {/* Kaki Halaman (Footer) */}
            <footer id="tentang" className="bg-[#0F1E26] text-white py-16 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Kolom 1: Informasi Brand */}
                    <div className="md:col-span-6 space-y-4">
                        <span className="font-serif text-2xl font-bold tracking-tight text-white">
                            Kyklos
                        </span>
                        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm">
                            Platform manajemen finansial komunitas yang mengedepankan transparansi dan akuntabilitas struktural.
                        </p>
                    </div>

                    {/* Kolom 2: Tautan Produk */}
                    <div className="md:col-span-3 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">Produk</h4>
                        <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                            <li>
                                <a href="#pratinjau" className="hover:text-white transition">Dashboard</a>
                            </li>
                            <li>
                                <a href="#fitur" className="hover:text-white transition">Arisan Manager</a>
                            </li>
                            <li>
                                <a href="#fitur" className="hover:text-white transition">Ledger</a>
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 3: Tautan Perusahaan */}
                    <div className="md:col-span-3 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">Perusahaan</h4>
                        <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                            <li>
                                <a href="#tentang" className="hover:text-white transition">Tentang Kami</a>
                            </li>
                            <li>
                                <a href="#tentang" className="hover:text-white transition">Keamanan</a>
                            </li>
                            <li>
                                <a href="#tentang" className="hover:text-white transition">Kontak</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bar Hak Cipta Bawah */}
                <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-400">
                        &copy; 2026 Kyklos Enterprise Systems. Hak Cipta Dilindungi.
                    </p>
                    <div className="flex gap-6 text-xs text-gray-400">
                        <a href="#tentang" className="hover:text-white transition">Privacy Policy</a>
                        <a href="#tentang" className="hover:text-white transition">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
