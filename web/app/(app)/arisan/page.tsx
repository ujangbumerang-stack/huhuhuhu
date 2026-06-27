'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Tipe data untuk status Arisan
interface ArisanMember {
    id: string;
    name: string;
    avatar: string;
    color: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    date: string;
    amount: number;
}

interface ArisanWinner {
    name: string;
    avatar: string;
    cycle: number;
    payout: number;
    date: string;
}

interface ArisanTimelineItem {
    cycle: number;
    recipient: string;
    status: 'done' | 'current' | 'future';
    badge?: string;
}

interface ArisanState {
    cycle: number;
    phase: string;
    totalAccumulated: number;
    targetPool: number;
    previousWinner: ArisanWinner;
    timeline: ArisanTimelineItem[];
    ledger: ArisanMember[];
}

const DEFAULT_STATE: ArisanState = {
    cycle: 4,
    phase: "Collection Phase",
    totalAccumulated: 8500,
    targetPool: 10000,
    previousWinner: {
        name: "Marcus Thorne",
        avatar: "/marcus_thorne_portrait.jpg",
        cycle: 3,
        payout: 10000,
        date: "Oct 12, 2023"
    },
    timeline: [
        { cycle: 3, recipient: "Marcus Thorne", status: "done" },
        { cycle: 4, recipient: "Elena Rodriguez", status: "current", badge: "Pending Collection" },
        { cycle: 5, recipient: "David Kim", status: "future" }
    ],
    ledger: [
        { id: "1", name: "James Smith", avatar: "JS", color: "bg-slate-100 text-slate-700", status: "Paid", date: "Oct 15, 09:41 AM", amount: 1000 },
        { id: "2", name: "Anna Wong", avatar: "AW", color: "bg-[#7c2d12] text-white", status: "Paid", date: "Oct 15, 11:20 AM", amount: 1000 },
        { id: "3", name: "Marcus Thorne", avatar: "MT", color: "bg-[#0B3A4B] text-white", status: "Pending", date: "--", amount: 1000 },
        { id: "4", name: "Elena Rodriguez", avatar: "ER", color: "bg-sky-100 text-sky-700", status: "Paid", date: "Oct 16, 08:15 AM", amount: 1000 },
        { id: "5", name: "Peter Lynch", avatar: "PL", color: "bg-rose-100 text-rose-700", status: "Overdue", date: "Due Oct 15", amount: 1000 },
        { id: "6", name: "David Kim", avatar: "DK", color: "bg-emerald-100 text-emerald-700", status: "Paid", date: "Oct 16, 02:30 PM", amount: 1000 },
        { id: "7", name: "Siti Aminah", avatar: "SA", color: "bg-amber-100 text-amber-700", status: "Paid", date: "Oct 16, 04:12 PM", amount: 1000 },
        { id: "8", name: "Budi Wijaya", avatar: "BW", color: "bg-indigo-100 text-indigo-700", status: "Paid", date: "Oct 17, 09:10 AM", amount: 1000 },
        { id: "9", name: "Diana R.", avatar: "DR", color: "bg-purple-100 text-purple-700", status: "Paid", date: "Oct 17, 11:00 AM", amount: 1000 },
        { id: "10", name: "Clara Tan", avatar: "CT", color: "bg-teal-100 text-teal-700", status: "Paid", date: "Oct 17, 03:45 PM", amount: 1000 }
    ]
};

export default function ArisanPage() {
    const [slug, setSlug] = useState('keluarga-cemara');
    const router = useRouter();
    const [state, setState] = useState<ArisanState | null>(null);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Ambil active slug dari localStorage
    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    // Load state from localStorage or fallback to default
    useEffect(() => {
        const stored = localStorage.getItem(`kyklos_arisan_${slug}`);
        if (stored) {
            try {
                setState(JSON.parse(stored));
            } catch {
                setState(DEFAULT_STATE);
            }
        } else {
            setState(DEFAULT_STATE);
        }
    }, [slug]);

    // Save state to localStorage
    const saveState = (newState: ArisanState) => {
        setState(newState);
        localStorage.setItem(`kyklos_arisan_${slug}`, JSON.stringify(newState));
    };

    if (!state) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm">
                Memuat data arisan...
            </div>
        );
    }

    // Toggle status pembayaran member (Paid/Pending/Overdue) secara interaktif
    const handleToggleStatus = (memberId: string) => {
        const updatedLedger = state.ledger.map(m => {
            if (m.id === memberId) {
                let nextStatus: 'Paid' | 'Pending' | 'Overdue' = 'Paid';
                let nextDate = '';
                if (m.status === 'Paid') {
                    nextStatus = 'Pending';
                    nextDate = '--';
                } else if (m.status === 'Pending') {
                    nextStatus = 'Overdue';
                    nextDate = 'Due Oct 15';
                } else {
                    nextStatus = 'Paid';
                    const now = new Date();
                    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                    nextDate = now.toLocaleDateString('en-US', options);
                }
                return { ...m, status: nextStatus, date: nextDate };
            }
            return m;
        });

        // Hitung akumulasi uang baru
        const paidCount = updatedLedger.filter(m => m.status === 'Paid').length;
        const newAccumulated = paidCount * 1000;

        saveState({
            ...state,
            ledger: updatedLedger,
            totalAccumulated: newAccumulated
        });
    };

    // Eksekusi Payout (Undian arisan & pencairan dana putaran saat ini)
    const handleExecutePayout = () => {
        const currentRecipient = state.timeline.find(t => t.status === 'current')?.recipient || "Elena Rodriguez";
        
        // Pindahkan penerima saat ini menjadi pemenang sebelumnya
        const nextWinner: ArisanWinner = {
            name: currentRecipient,
            avatar: "/marcus_thorne_portrait.jpg", // default portrait
            cycle: state.cycle,
            payout: state.targetPool,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        const nextCycle = state.cycle + 1;

        // Tentukan pemenang putaran berikutnya
        const availableParticipants = state.ledger.filter(m => m.name !== currentRecipient && m.name !== state.previousWinner.name);
        const nextRecipient = availableParticipants.length > 0 
            ? availableParticipants[Math.floor(Math.random() * availableParticipants.length)].name
            : "David Kim";

        const newTimeline: ArisanTimelineItem[] = [
            { cycle: state.cycle, recipient: currentRecipient, status: 'done' },
            { cycle: nextCycle, recipient: nextRecipient, status: 'current', badge: "Pending Collection" },
            { cycle: nextCycle + 1, recipient: "Clara Tan", status: 'future' }
        ];

        // Reset semua status pembayaran ledger ke Pending untuk putaran baru
        const resetLedger = state.ledger.map(m => ({
            ...m,
            status: m.name === nextRecipient ? 'Pending' as const : 'Paid' as const, // penerima default pending, lainnya paid untuk kemudahan demo
            date: m.name === nextRecipient ? '--' : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        }));

        const paidCount = resetLedger.filter(m => m.status === 'Paid').length;

        saveState({
            cycle: nextCycle,
            phase: "Collection Phase",
            totalAccumulated: paidCount * 1000,
            targetPool: state.targetPool,
            previousWinner: nextWinner,
            timeline: newTimeline,
            ledger: resetLedger
        });

        setShowPayoutModal(false);
        setSuccessMessage(`Berhasil mencairkan dana Arisan putaran ke-${state.cycle} sebesar $10,000.00 kepada ${currentRecipient}!`);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Tambah anggota arisan baru
    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        const avatars = ["JS", "AW", "MT", "ER", "PL", "DK", "SA", "BW", "DR", "CT"];
        const colors = [
            "bg-blue-100 text-blue-700",
            "bg-rose-100 text-rose-700",
            "bg-emerald-100 text-emerald-700",
            "bg-purple-100 text-purple-700",
            "bg-amber-100 text-amber-700"
        ];

        const newMember: ArisanMember = {
            id: `m_${Date.now()}`,
            name: newMemberName,
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
            color: colors[Math.floor(Math.random() * colors.length)],
            status: 'Pending',
            date: '--',
            amount: 1000
        };

        const updatedLedger = [...state.ledger, newMember];
        const newTarget = updatedLedger.length * 1000;

        saveState({
            ...state,
            targetPool: newTarget,
            ledger: updatedLedger
        });

        setNewMemberName('');
    };

    // Hapus anggota arisan
    const handleRemoveMember = (id: string) => {
        const updatedLedger = state.ledger.filter(m => m.id !== id);
        const newTarget = updatedLedger.length * 1000;
        const paidCount = updatedLedger.filter(m => m.status === 'Paid').length;

        saveState({
            ...state,
            targetPool: newTarget,
            totalAccumulated: paidCount * 1000,
            ledger: updatedLedger
        });
    };

    const paidCount = state.ledger.filter(m => m.status === 'Paid').length;
    const progressPercent = Math.min(100, Math.round((state.totalAccumulated / state.targetPool) * 100));
    const remainingAmount = state.targetPool - state.totalAccumulated;

    return (
        <div className="space-y-6 relative">
            {/* Toast Success Notif */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 bg-[#0B1E26] text-white px-6 py-3.5 rounded-xl shadow-lg border border-teal-500/30 flex items-center gap-3 animate-fade-in-up">
                    <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" />
                    </svg>
                    <span className="text-xs font-semibold">{successMessage}</span>
                </div>
            )}

            {/* Header Arisan (Sesuai Screenshot) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">
                        Arisan Rotation: Alpha Cohort
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">
                        Cycle {state.cycle} of {state.ledger.length} • {state.phase}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowManageModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer select-none"
                    >
                        Manage Members
                    </button>
                    <button 
                        onClick={() => setShowPayoutModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0F3A4B] text-white rounded-xl text-xs font-bold hover:bg-[#0c2e3c] transition shadow-sm cursor-pointer select-none"
                    >
                        Execute Payout
                    </button>
                </div>
            </div>

            {/* Grid Atas: Pool Progress & Previous Winner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Pool Progress Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between space-y-6">
                    <div className="flex items-start justify-between">
                        <h2 className="font-serif text-lg font-bold text-slate-800 tracking-tight">Current Pool Progress</h2>
                        <span className="text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7] px-2.5 py-0.5 rounded-md">
                            {state.phase}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5 border-r border-gray-100 pr-6">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Accumulated</p>
                            <p className="font-serif text-4xl font-extrabold text-slate-850 tracking-tight">
                                ${state.totalAccumulated.toLocaleString('en-US')}.00
                            </p>
                        </div>
                        <div className="space-y-1.5 pl-0 sm:pl-6">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Pool</p>
                            <p className="font-serif text-3xl font-bold text-slate-750 tracking-tight">
                                ${state.targetPool.toLocaleString('en-US')}.00
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#0F3A4B] rounded-full transition-all duration-500" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-gray-400">
                            <span>{progressPercent}% Collected</span>
                            <span>${remainingAmount.toLocaleString('en-US')} Remaining</span>
                        </div>
                    </div>
                </div>

                {/* Previous Cycle Winner Card */}
                <div className="bg-[#0B1E26] rounded-2xl p-6 shadow-sm flex flex-col justify-between text-white space-y-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {/* Trophy Icon */}
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
                        </svg>
                        PREVIOUS CYCLE WINNER
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <img 
                            src={state.previousWinner.avatar} 
                            alt={state.previousWinner.name}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-white/20 shadow-inner flex-shrink-0 bg-slate-700"
                        />
                        <div className="min-w-0">
                            <h4 className="font-serif text-lg font-bold text-white tracking-tight leading-tight">
                                {state.previousWinner.name}
                            </h4>
                            <p className="text-[11px] text-teal-300 font-semibold mt-0.5">
                                Cycle {state.previousWinner.cycle} • Disbursed
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 flex items-end justify-between">
                        <div className="space-y-0.5">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Payout Amount</p>
                            <p className="font-serif text-2xl font-bold text-white tracking-tight">
                                ${state.previousWinner.payout.toLocaleString('en-US')}.00
                            </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                            {state.previousWinner.date}
                        </span>
                    </div>
                </div>
            </div>

            {/* Grid Bawah: Rotation Timeline & Current Round Ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Rotation Timeline (Sesuai Screenshot) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 text-slate-800 font-serif text-base font-bold pb-2 border-b border-gray-100">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Rotation Timeline
                    </div>

                    <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 ml-3 py-1">
                        {state.timeline.map((item, idx) => {
                            const isDone = item.status === 'done';
                            const isCurrent = item.status === 'current';

                            return (
                                <div key={idx} className="relative">
                                    {/* Timeline Marker Circle */}
                                    <span className={`absolute -left-[35px] top-0 w-6 h-6 rounded-full flex items-center justify-center border shadow-sm ${
                                        isDone 
                                            ? 'bg-slate-50 border-slate-200 text-slate-400' 
                                            : isCurrent 
                                                ? 'bg-[#0B3A4B] border-[#0B3A4B] text-white' 
                                                : 'bg-white border-slate-200 text-slate-400'
                                    }`}>
                                        {isDone ? (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : isCurrent ? (
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                                            </svg>
                                        ) : (
                                            <span className="text-[10px] font-bold">05</span>
                                        )}
                                    </span>

                                    <div className="space-y-0.5">
                                        <h5 className={`text-xs font-bold ${isCurrent ? 'text-slate-800' : 'text-slate-400'}`}>
                                            Cycle {item.cycle} {isCurrent && '(Current)'}
                                        </h5>
                                        <p className={`text-xs font-medium ${isCurrent ? 'text-slate-700 font-bold' : 'text-slate-400'}`}>
                                            {item.recipient}
                                        </p>
                                        {item.badge && (
                                            <span className="inline-block mt-1 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded px-1.5 py-0.5 shadow-sm">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Current Round Ledger (Sesuai Screenshot) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                        <h3 className="font-serif text-base font-bold text-slate-800 tracking-tight">Current Round Ledger</h3>
                        <span className="text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7] px-2.5 py-0.5 rounded">
                            {paidCount}/{state.ledger.length} Paid
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                                    <th className="px-6 py-3">Member</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {state.ledger.slice(0, 5).map((m) => {
                                    const isPaid = m.status === 'Paid';
                                    const isPending = m.status === 'Pending';
                                    const isOverdue = m.status === 'Overdue';

                                    return (
                                        <tr 
                                            key={m.id} 
                                            onClick={() => handleToggleStatus(m.id)}
                                            className="hover:bg-gray-50/30 transition duration-150 cursor-pointer select-none group"
                                            title="Click to toggle member payment status"
                                        >
                                            {/* Member */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full ${m.color} font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-inner`}>
                                                        {m.avatar}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#0284C7] transition">
                                                        {m.name}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Status Badge */}
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded ${
                                                    isPaid 
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                        : isPending 
                                                            ? 'bg-[#E0F2FE]/50 text-[#0284C7] border border-[#E0F2FE]/80' 
                                                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                    <span className={`w-1 h-1 rounded-full ${isPaid ? 'bg-emerald-500' : isPending ? 'bg-[#0284C7]' : 'bg-rose-500'}`}></span>
                                                    {m.status}
                                                </span>
                                            </td>
                                            {/* Date */}
                                            <td className="px-6 py-3.5 text-xs text-gray-400 font-medium">
                                                {m.date}
                                            </td>
                                            {/* Amount */}
                                            <td className={`px-6 py-3.5 text-xs font-extrabold text-right ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                                                ${m.amount.toLocaleString('en-US')}.00
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL: Execute Payout */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 p-6 shadow-2xl space-y-6 animate-scale-up">
                        <div className="space-y-2">
                            <h3 className="font-serif text-xl font-bold text-slate-800 tracking-tight">Confirm Payout Execution</h3>
                            <p className="text-xs text-gray-500">
                                Ini akan membagikan total saldo arisan putaran ke-{state.cycle} kepada penerima terpilih dan menyetel ulang status pembayaran untuk siklus berikutnya.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">Penerima Putaran {state.cycle}</span>
                                <span className="font-bold text-slate-800">
                                    {state.timeline.find(t => t.status === 'current')?.recipient || "Elena Rodriguez"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">Jumlah Pencairan</span>
                                <span className="font-bold text-emerald-600">${state.targetPool.toLocaleString('en-US')}.00</span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-gray-150 pt-3">
                                <span className="text-gray-400 font-medium">Koleksi Terkumpul ({progressPercent}%)</span>
                                <span className="font-bold text-slate-700">${state.totalAccumulated.toLocaleString('en-US')}.00</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowPayoutModal(false)}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer select-none"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleExecutePayout}
                                className="flex-1 py-2 bg-[#0F3A4B] text-white rounded-lg text-xs font-bold hover:bg-[#0c2e3c] transition shadow-sm cursor-pointer select-none"
                            >
                                Konfirmasi Payout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Manage Members */}
            {showManageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-100 p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col justify-between">
                        <div className="space-y-4 overflow-y-auto pr-1">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <h3 className="font-serif text-lg font-bold text-slate-800 tracking-tight">Kelola Anggota Arisan</h3>
                                <button 
                                    onClick={() => setShowManageModal(false)}
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer select-none"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Form Tambah Anggota */}
                            <form onSubmit={handleAddMember} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    placeholder="Nama anggota baru..."
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#0F3A4B] text-slate-900 placeholder:text-slate-500"
                                />
                                <button 
                                    type="submit"
                                    className="px-4 py-1.5 bg-[#0F3A4B] text-white text-xs font-bold rounded-xl hover:bg-[#0c2e3c] transition cursor-pointer select-none"
                                >
                                    Tambah
                                </button>
                            </form>

                            {/* Daftar Anggota */}
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                                {state.ledger.map(m => (
                                    <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-full ${m.color} font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-inner`}>
                                                {m.avatar}
                                            </div>
                                            <span className="text-xs font-bold text-slate-800">{m.name}</span>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleRemoveMember(m.id)}
                                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer select-none"
                                            title="Hapus Anggota"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 text-right">
                            <button 
                                onClick={() => setShowManageModal(false)}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer select-none"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
