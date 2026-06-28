'use client';
 
import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { idr } from '@/lib/format';
import { CommunityContext } from '../layout';

interface DashboardData {
    totalBalance: string;
    pockets: Array<{ id: string; name: string; type: string; balance: string; status?: string }>;
    recentTransactions: Array<{
        id: string;
        amount: string;
        direction: string;
        note?: string;
        createdAt: string;
        member?: { name: string };
    }>;
    members: Array<{ userId: string; role: string; user: { id: string; name: string } }>;
    pendingVerifications?: Array<{
        id: string;
        member: { name: string; avatar: string; color: string; avatarUrl?: string | null };
        date: string;
        amount: number;
        pocket: string;
        pocketId: string;
    }>;
}

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [communityId, setCommunityId] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const { role } = useContext(CommunityContext);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
            const list = await api.get<any[]>('/communities');
            const c = list.find(x => x.slug === activeSlug) || list[0];
            if (!c) { router.push('/login'); return; }
            setCommunityId(c.id);
            localStorage.setItem('kyklos_active_community_slug', c.slug);
            const d = await api.get<DashboardData>(`/communities/${c.id}/dashboard`);
            if (d) setData(d);
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
        // Refresh otomatis saat tab pembayaran selesai
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'kyklos_payment_done') loadDashboard();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Verifikasi pembayaran warga secara langsung
    const handleVerify = async (id: string) => {
        setVerifyingId(id);
        try {
            await api.post(`/contributions/${id}/verify`, {});
            loadDashboard();
        } catch (err) {
            console.error('Gagal melakukan verifikasi:', err);
        } finally {
            setVerifyingId(null);
        }
    };

    const renderChart = () => {
        const getMonthLabel = (offset: number) => {
            const d = new Date();
            d.setMonth(d.getMonth() - offset);
            return d.toLocaleDateString('id-ID', { month: 'short' });
        };
        const months = Array.from({ length: 6 }, (_, i) => getMonthLabel(5 - i));

        const now = new Date();
        const targetMonths = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return { year: d.getFullYear(), month: d.getMonth() };
        });

        const realInflow = [0, 0, 0, 0, 0, 0];
        const realOutflow = [0, 0, 0, 0, 0, 0];

        (data?.recentTransactions || []).forEach((t: any) => {
            const txDate = new Date(t.createdAt);
            const amt = Number(t.amount);
            const idx = targetMonths.findIndex(tm => tm.year === txDate.getFullYear() && tm.month === txDate.getMonth());
            if (idx !== -1) {
                if (t.direction === 'in') {
                    realInflow[idx] += amt;
                } else {
                    realOutflow[idx] += amt;
                }
            }
        });

        const baseInflow = [350000, 500000, 450000, 650000, 850000, 1100000];
        const baseOutflow = [120000, 200000, 150000, 300000, 450000, 250000];

        const inflowData = baseInflow.map((mockVal, idx) => {
            return realInflow[idx] > 0 ? realInflow[idx] : mockVal;
        });

        const outflowData = baseOutflow.map((mockVal, idx) => {
            return realOutflow[idx] > 0 ? realOutflow[idx] : mockVal;
        });

        const maxVal = Math.max(...inflowData, ...outflowData, 100000) * 1.15;
        const chartHeight = 110;
        const chartWidth = 320;

        const getY = (val: number) => {
            return chartHeight - (val / maxVal) * (chartHeight - 20) - 10;
        };

        const getX = (idx: number) => {
            return 25 + idx * ((chartWidth - 45) / 5);
        };

        const inflowPoints = inflowData.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');
        const outflowPoints = outflowData.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');

        const inflowAreaPoints = `25,${chartHeight} ${inflowPoints} ${getX(5)},${chartHeight}`;
        const outflowAreaPoints = `25,${chartHeight} ${outflowPoints} ${getX(5)},${chartHeight}`;

        return (
            <div className="relative w-full h-[120px] select-none">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--community-primary)" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="var(--community-primary)" stopOpacity="0.00" />
                        </linearGradient>
                        <linearGradient id="dangerGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FB7185" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#FB7185" stopOpacity="0.00" />
                        </linearGradient>
                    </defs>

                    <line x1="25" y1={getY(0)} x2={chartWidth - 20} y2={getY(0)} stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="25" y1={getY(maxVal / 2)} x2={chartWidth - 20} y2={getY(maxVal / 2)} stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="25" y1={getY(maxVal)} x2={chartWidth - 20} y2={getY(maxVal)} stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="3 3" />

                    <polygon points={inflowAreaPoints} fill="url(#primaryGrad)" />
                    <polygon points={outflowAreaPoints} fill="url(#dangerGrad)" />

                    <polyline points={inflowPoints} fill="none" stroke="var(--community-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={outflowPoints} fill="none" stroke="#FB7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {inflowData.map((val, idx) => (
                        <circle
                            key={`in-${idx}`}
                            cx={getX(idx)}
                            cy={getY(val)}
                            r={hoveredIdx === idx ? 5.5 : 3.5}
                            fill="#FFFFFF"
                            stroke="var(--community-primary)"
                            strokeWidth={hoveredIdx === idx ? 3.5 : 2.5}
                            className="transition-all duration-150 cursor-pointer"
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                        />
                    ))}

                    {months.map((m, idx) => (
                        <text
                            key={idx}
                            x={getX(idx)}
                            y={chartHeight + 12}
                            textAnchor="middle"
                            className="text-[9px] font-bold fill-slate-400 font-sans"
                        >
                            {m}
                        </text>
                    ))}
                </svg>

                {hoveredIdx !== null && (
                    <div 
                        className="absolute bg-slate-900/90 text-white text-[10px] font-bold p-2.5 rounded-xl shadow-xl pointer-events-none transition-all duration-100 z-10 border border-slate-800/80 backdrop-blur-md flex flex-col gap-1 w-32"
                        style={{
                            left: `calc(${(getX(hoveredIdx) / chartWidth) * 100}% + 8px)`,
                            top: `${getY(inflowData[hoveredIdx]) - 50}px`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wide border-b border-slate-800 pb-1 mb-1">
                            {months[hoveredIdx]}
                        </div>
                        <div className="flex items-center justify-between gap-1 text-emerald-400">
                            <span className="text-[8px] text-slate-400">Masuk:</span>
                            <span>{idr(inflowData[hoveredIdx])}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 text-rose-400">
                            <span className="text-[8px] text-slate-400">Keluar:</span>
                            <span>{idr(outflowData[hoveredIdx])}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] text-gray-500 text-sm">
                Memuat dasbor...
            </div>
        );
    }

    const getPocketIcon = (type: string) => {
        switch (type) {
            case 'treasury':
                return (
                    <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'arisan':
                return (
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Bagian Overview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Real-time snapshot of community health.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer select-none">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                </div>
            </div>

            {/* Grid Metrik Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Total Balance Card & Cashflow Area Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-2 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Total Community Balance
                            </div>
                            <p className="font-serif text-3xl font-extrabold text-slate-900 tracking-tight">
                                {idr(data.totalBalance)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 mt-6 text-xs font-semibold">
                            <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                +12% this month
                            </span>
                            <span className="text-gray-400">vs last month</span>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div className="md:col-span-3 relative flex flex-col justify-between min-h-[150px] border-l border-slate-100/80 pl-0 md:pl-6 pt-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tren Arus Kas (6 Bln)</span>
                            <div className="flex gap-2.5 text-[9px] font-bold">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--community-primary)' }}></span> Masuk
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <span className="w-2 h-2 rounded-full bg-rose-400"></span> Keluar
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center">
                            {renderChart()}
                        </div>
                    </div>
                </div>

                {/* Action Required Card - Admin Only */}
                {role === 'admin' && (
                    <div className="bg-primary rounded-2xl p-6 shadow-sm flex flex-col justify-between text-white">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-white/80 uppercase tracking-wider">
                                <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Action Required
                            </div>
                            <h3 className="font-serif text-2xl font-bold tracking-tight text-white leading-tight">
                                {data.pendingVerifications?.length ?? 0} Verifications Pending
                            </h3>
                            <p className="text-xs text-white/70 leading-relaxed">
                                Requires immediate attention before end of month.
                            </p>
                        </div>

                        <button 
                            onClick={() => {
                                const element = document.getElementById('pending-verifications');
                                if (element) element.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full mt-6 py-2.5 bg-white hover:bg-gray-50 text-primary font-bold rounded-xl text-xs transition duration-200 cursor-pointer text-center select-none"
                        >
                            Review Now
                        </button>
                    </div>
                )}
            </div>

            {/* Bagian Active Pockets */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Pockets</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.pockets.map(p => {
                        let fillBg = 'bg-primary';
                        let percentage = 90;
                        if (p.name === 'Arisan Bulanan') {
                            fillBg = 'bg-primary';
                            percentage = 100;
                        } else if (p.name === 'Social Fund') {
                            fillBg = 'bg-slate-500';
                            percentage = 64;
                        }

                        return (
                            <div key={p.id} 
                                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between space-y-4 min-h-[140px]"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center">
                                        {getPocketIcon(p.type)}
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        p.name === 'Arisan Bulanan' 
                                            ? 'bg-orange-50 text-primary' 
                                            : 'bg-sky-50 text-[#0284C7]'
                                    }`}>
                                        Active
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{p.name}</p>
                                    <p className="font-serif text-2xl font-black text-slate-800 tracking-tight">{idr(p.balance)}</p>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full ${fillBg} rounded-full`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bagian Pending Verifications - Admin Only */}
            {role === 'admin' && (
                <div id="pending-verifications" className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pending Verifications</h2>
                        <Link href="/ledger" className="text-xs font-bold text-[#0284C7] hover:text-[#0369a1]">
                            View All
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                                        <th className="px-6 py-4">Member</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Pocket</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(!data.pendingVerifications || data.pendingVerifications.length === 0) ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-xs text-gray-400 font-medium">
                                                Semua iuran terverifikasi! Tidak ada verifikasi tertunda.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.pendingVerifications.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/30 transition-all duration-200">
                                                {/* Kolom Member */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {item.member.avatarUrl ? (
                                                            <img
                                                                src={item.member.avatarUrl}
                                                                alt={item.member.name}
                                                                className="w-8 h-8 rounded-full object-cover shadow-inner flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className={`w-8 h-8 rounded-full ${item.member.color || 'bg-slate-800'} text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-inner select-none`}>
                                                                {item.member.avatar}
                                                            </div>
                                                        )}
                                                        <span className="text-xs font-bold text-slate-800">{item.member.name}</span>
                                                    </div>
                                                </td>
                                                {/* Kolom Date */}
                                                <td className="px-6 py-4 text-xs font-medium text-gray-400">
                                                    {item.date}
                                                </td>
                                                {/* Kolom Amount */}
                                                <td className="px-6 py-4 text-xs font-extrabold text-slate-800">
                                                    {idr(item.amount)}
                                                </td>
                                                {/* Kolom Pocket */}
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                        item.pocket === 'Arisan Bulanan'
                                                            ? 'bg-orange-50 text-primary'
                                                            : 'bg-[#E0F2FE]/50 text-[#0284C7]'
                                                    }`}>
                                                        {item.pocket}
                                                    </span>
                                                </td>
                                                {/* Kolom Aksi */}
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleVerify(item.id)}
                                                        disabled={verifyingId === item.id}
                                                        className="px-4 py-1.5 border border-[#0284C7]/20 rounded-lg text-xs font-semibold text-[#0284C7] hover:bg-sky-50/50 hover:border-[#0284C7]/50 transition duration-150 bg-white cursor-pointer select-none disabled:opacity-60"
                                                    >
                                                        {verifyingId === item.id ? '...' : 'Verify'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


