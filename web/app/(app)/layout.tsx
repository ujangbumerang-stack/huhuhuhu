'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export const CommunityContext = React.createContext<{ role: string; communityId: string }>({ role: 'member', communityId: '' });
import Link from 'next/link';
import { api } from '@/lib/api';
import { getMe, logout } from '@/lib/auth';

interface Community {
    id: string;
    name: string;
    slug: string;
    themeColor: string;
    logoUrl?: string;
}

function CommunityLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [slug, setSlug] = useState('keluarga-cemara');
    const [community, setCommunity] = useState<Community | null>(null);
    const [userRole, setUserRole] = useState<string>('member');
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [showUserPopover, setShowUserPopover] = useState(false);
    const [unpaidCount, setUnpaidCount] = useState(0);
    const [loadingPath, setLoadingPath] = useState<string | null>(null);
    const [profileForm, setProfileForm] = useState<{
        username: string;
        name: string;
        email: string;
        phone: string;
        bio: string;
        avatarUrl?: string;
    }>({
        username: 'unimus70bringin799708',
        name: 'unimus70bringin',
        email: 'unimus70bringin@gmail.com',
        phone: 'Not added',
        bio: ''
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const storedProfile = localStorage.getItem('kyklos_user_profile');
            if (storedProfile) {
                try {
                    setProfileForm(JSON.parse(storedProfile));
                } catch {}
            }
            api.get<any[]>('/communities').then(list => {
                const c = list.find(x => x.slug === slug) || list[0];
                if (c) {
                    setCommunity(c);
                    document.documentElement.style.setProperty('--community-primary', c.themeColor);
                }
            }).catch(() => {});
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [slug]);

    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    useEffect(() => {
        // Ambil data me/auth untuk sidebar profile
        getMe().then(u => {
            if (u) {
                setUser(u);
                // Inisialisasi profile form jika belum ada di localStorage
                const storedProfile = localStorage.getItem('kyklos_user_profile');
                if (storedProfile) {
                    try {
                        setProfileForm(JSON.parse(storedProfile));
                    } catch {}
                } else {
                    setProfileForm({
                        username: `${u.name.toLowerCase().replace(/\s+/g, '')}799708`,
                        name: u.name,
                        email: u.email,
                        phone: 'Not added',
                        bio: ''
                    });
                }
            }
        });

        // Ambil data komunitas berdasarkan slug
        api.get<any[]>('/communities').then(list => {
            const c = list.find(x => x.slug === slug) || list[0];
            if (!c) {
                router.push('/login');
                return;
            }
            setCommunity(c);
            if (c.memberships && c.memberships.length > 0) {
                setUserRole(c.memberships[0].role);
            }
            document.documentElement.style.setProperty('--community-primary', c.themeColor);

            api.get<any[]>(`/communities/${c.id}/contributions/mine`).then(mine => {
                setUnpaidCount((mine || []).filter((x: any) => x.status === 'unpaid' || x.status === 'pending').length);
            }).catch(() => {});
        }).catch(() => router.push('/login'));
    }, [slug, router]);

    useEffect(() => {
        if (!community) return;
        api.get<any[]>(`/communities/${community.id}/contributions/mine`).then(mine => {
            setUnpaidCount((mine || []).filter((x: any) => x.status === 'unpaid' || x.status === 'pending').length);
        }).catch(() => {});
    }, [pathname, community]);

    useEffect(() => {
        setLoadingPath(null);
    }, [pathname]);

    function handleLogout() {
        logout();
        router.push('/login');
    }

    if (!community) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] text-gray-400 text-sm">
                Memuat komunitas...
            </div>
        );
    }

    const nav = [
        { 
            href: '/dashboard', 
            label: 'Beranda',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
            )
        },
        { 
            href: '/pockets', 
            label: 'Kantong Dana',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
            )
        },
        { 
            href: '/ledger', 
            label: 'Buku Kas',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        { 
            href: '/arisan', 
            label: 'Arisan', 
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                </svg>
            )
        },
        { 
            href: '/members', 
            label: 'Anggota',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        { 
            href: '/contributions', 
            label: 'Tagihan',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )
        },
        { 
            href: '/events', 
            label: 'Agenda',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        { 
            href: '/forum', 
            label: 'Forum', 
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            {/* Top Navbar Utama (Sesuai dengan tangkapan layar) */}
            <header className="hidden md:flex h-14 bg-white border-b border-gray-200/70 items-center justify-between px-6 flex-shrink-0 select-none">
                {/* Kiri: Kyklos Logo */}
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    {community.logoUrl ? (
                        <img 
                            src={community.logoUrl} 
                            alt={community.name}
                            className="w-8.5 h-8.5 rounded-lg object-cover border border-slate-100 shadow-sm"
                        />
                    ) : (
                        <div 
                            className="w-8.5 h-8.5 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-inner"
                            style={{ backgroundColor: community.themeColor || '#0B1E26' }}
                        >
                            {community.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="font-serif font-black text-xl text-primary tracking-tight leading-none">{community.name}</span>
                </Link>

                {/* Kanan: Profil User dengan Popover */}
                <div className="relative">
                    <button 
                        onClick={() => setShowUserPopover(!showUserPopover)} 
                        className="flex items-center gap-3 cursor-pointer focus:outline-none select-none"
                    >
                        {profileForm.avatarUrl ? (
                            <img
                                src={profileForm.avatarUrl}
                                alt={profileForm.name}
                                className="w-8 h-8 rounded-full object-cover border border-orange-100 shadow-sm hover:scale-105 active:scale-95 transition select-none"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary hover:scale-105 active:scale-95 transition flex items-center justify-center text-white text-xs font-bold border border-orange-100 shadow-sm select-none">
                                {profileForm.name ? profileForm.name[0].toUpperCase() : 'U'}
                            </div>
                        )}
                    </button>
                    {showUserPopover && (
                        <>
                            <div className="fixed inset-0 z-20" onClick={() => setShowUserPopover(false)} />
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 z-30 animate-scale-up text-left space-y-3">
                                {/* Header: Profil */}
                                <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100">
                                    {profileForm.avatarUrl ? (
                                        <img
                                            src={profileForm.avatarUrl}
                                            alt={profileForm.name}
                                            className="w-9 h-9 rounded-full object-cover border border-orange-100 shadow-sm select-none"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold border border-orange-100 shadow-sm select-none">
                                            {profileForm.name ? profileForm.name[0].toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-slate-900 truncate">
                                            {profileForm.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                                            @{profileForm.username}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Menu Items */}
                                <div className="flex flex-col gap-0.5">
                                    {userRole === 'admin' && (
                                        <Link 
                                            href="/settings" 
                                            onClick={() => setShowUserPopover(false)}
                                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer"
                                        >
                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>Pengaturan</span>
                                        </Link>
                                    )}
                                    
                                    <button 
                                        onClick={() => {
                                            setShowUserPopover(false);
                                            handleLogout();
                                        }}
                                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition text-left cursor-pointer w-full"
                                    >
                                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Keluar</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Container Bawah (Sidebar + Content) */}
            <div className="flex-1 flex min-h-0">
                {/* Sidebar Kiri - Hanya Muncul di Layar Desktop (md ke atas) */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200/80 h-[calc(100vh-56px)] sticky top-[56px] flex-shrink-0">
                    {/* Logo Brand / Header (Kyklos Community) */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <span className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${userRole === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                            {userRole === 'admin' ? 'Admin' : 'Member'}
                        </span>
                    </div>

                    {/* Menu Navigasi Sidebar */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {nav.map(n => {
                            const isCurrent = pathname === n.href;
                            const isLoading = loadingPath === n.href;
                            return (
                                <Link
                                    key={n.href}
                                    href={n.href}
                                    onClick={(e) => {
                                        if (!isCurrent) setLoadingPath(n.href);
                                    }}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                        isCurrent
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-base flex items-center justify-center">
                                        {isLoading ? (
                                            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : n.icon}
                                    </span>
                                    <span className="flex-1">{n.label}</span>
                                    {n.href === '/contributions' && unpaidCount > 0 && (
                                        <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                            {unpaidCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Navigation */}
                    <div className="px-3 py-4 border-t border-gray-100 space-y-1">
                        {/* Settings Button */}
                        {userRole === 'admin' && (
                            <Link 
                                href="/settings" 
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                    pathname === '/settings'
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Pengaturan</span>
                            </Link>
                        )}
                        {/* Help Button */}
                        <a href="#help" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Help</span>
                        </a>
                        {/* Logout Button */}
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all text-left cursor-pointer">
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Konten Utama */}
                <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-56px)] overflow-y-auto bg-[#F8FAFC]">
                    {/* Header Seluler (md-hidden) - Menampilkan navigasi tab atas seperti sebelumnya */}
                    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm md:hidden flex-shrink-0">
                        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                {community.logoUrl ? (
                                    <img 
                                        src={community.logoUrl} 
                                        alt={community.name}
                                        className="w-7.5 h-7.5 rounded-lg object-cover border border-slate-100 shadow-sm flex-shrink-0"
                                    />
                                ) : (
                                    <div 
                                        className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-inner flex-shrink-0"
                                        style={{ backgroundColor: community.themeColor || '#0B1E26' }}
                                    >
                                        {community.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <span className="font-serif font-black text-slate-900 text-[13px] block tracking-tight truncate leading-none">{community.name}</span>
                                    <span className={`inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${userRole === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                        {userRole === 'admin' ? 'Admin' : 'Member'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowUserPopover(!showUserPopover)} 
                                        className="focus:outline-none cursor-pointer select-none"
                                        title="Menu Pengguna"
                                    >
                                        {profileForm.avatarUrl ? (
                                            <img
                                                src={profileForm.avatarUrl}
                                                alt={profileForm.name}
                                                className="w-8.5 h-8.5 rounded-full object-cover border-2 border-white shadow-md hover:scale-105 active:scale-95 transition select-none"
                                            />
                                        ) : (
                                            <div className="w-8.5 h-8.5 rounded-full bg-primary hover:scale-105 active:scale-95 transition flex items-center justify-center text-white text-[11px] font-black border-2 border-white shadow-md select-none">
                                                {profileForm.name ? profileForm.name[0].toUpperCase() : 'U'}
                                            </div>
                                        )}
                                    </button>
                                    {showUserPopover && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setShowUserPopover(false)} />
                                            <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-3.5 z-30 animate-scale-up text-left space-y-3">
                                                {/* Header: Profil */}
                                                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                                                    {profileForm.avatarUrl ? (
                                                        <img
                                                            src={profileForm.avatarUrl}
                                                            alt={profileForm.name}
                                                            className="w-8 h-8 rounded-full object-cover border border-orange-100 shadow-sm select-none"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black border border-orange-100 shadow-sm select-none">
                                                            {profileForm.name ? profileForm.name[0].toUpperCase() : 'U'}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-[11px] font-black text-slate-900 truncate leading-none">
                                                            {profileForm.name}
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 font-bold truncate mt-1">
                                                            @{profileForm.username}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Menu Items */}
                                                <div className="flex flex-col gap-0.5">
                                                    {userRole === 'admin' && (
                                                        <Link 
                                                            href="/settings" 
                                                            onClick={() => setShowUserPopover(false)}
                                                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer"
                                                        >
                                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            <span>Pengaturan</span>
                                                        </Link>
                                                    )}
                                                    <button 
                                                        onClick={() => {
                                                            setShowUserPopover(false);
                                                            handleLogout();
                                                        }}
                                                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition text-left cursor-pointer w-full"
                                                    >
                                                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        <span>Keluar</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Tab Menu Horizontal di Seluler */}
                        <div className="max-w-lg mx-auto px-4 flex gap-2 overflow-x-auto pb-3 pt-0.5 scrollbar-hide">
                            {nav.map(n => {
                                const isCurrent = pathname === n.href;
                                const isLoading = loadingPath === n.href;
                                return (
                                    <Link
                                        key={n.href}
                                        href={n.href}
                                        onClick={(e) => {
                                            if (!isCurrent) setLoadingPath(n.href);
                                        }}
                                        style={{
                                            backgroundColor: isCurrent ? `${community.themeColor}12` : undefined,
                                            color: isCurrent ? community.themeColor : undefined
                                        }}
                                        className={`whitespace-nowrap px-4 py-1.5 flex items-center gap-1.5 text-[10px] font-bold rounded-full transition-all ${
                                            isCurrent
                                                ? 'shadow-sm'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                        }`}
                                    >
                                        {isLoading && (
                                            <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {n.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </header>

                    {/* Area Konten Utama Halaman (Layout Responsive) */}
                    <main className="flex-1">
                        <div className="max-w-lg mx-auto px-4 py-4 md:max-w-full md:px-8 md:py-6">
                            <CommunityContext.Provider value={{ role: userRole, communityId: community?.id || '' }}>
                                {children}
                            </CommunityContext.Provider>
                        </div>
                    </main>
                </div>
            </div>


        </div>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] text-slate-400 text-xs font-semibold">Memuat dasbor...</div>}>
            <CommunityLayoutContent>{children}</CommunityLayoutContent>
        </Suspense>
    );
}



