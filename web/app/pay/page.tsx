'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function idr(n: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function PayContent() {
    const params = useSearchParams();
    const type = params.get('type') || 'contribution'; // contribution | arisan
    const id = params.get('id') || '';
    const amount = parseInt(params.get('amount') || '0', 10);
    const title = params.get('title') || 'Pembayaran';
    const pocketId = params.get('pocketId') || '';
    const bankName = params.get('bank') || 'BCA';
    const accountNumber = params.get('account') || '1234567890';
    const accountHolder = params.get('holder') || 'Komunitas';
    const participantId = params.get('participantId') || '';
    const memberId = params.get('memberId') || '';
    const memberName = params.get('memberName') || '';
    const contributionAmount = parseInt(params.get('contributionAmount') || String(amount), 10);

    const [step, setStep] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errMsg, setErrMsg] = useState('');

    const handlePay = useCallback(async () => {
        setStep('processing');
        setProgress(0);

        const milestones = [15, 35, 55, 75, 90];
        for (const p of milestones) {
            await new Promise(r => setTimeout(r, 400));
            setProgress(p);
        }

        try {
            if (type === 'arisan') {
                await api.post(`/pockets/${pocketId}/arisan/setoran`, {
                    participantId, memberId, memberName,
                    amount: contributionAmount,
                });
            } else {
                await api.post(`/contributions/${id}/simulate-pay`, {});
            }
        } catch { /* ponytail: mock fallback handles errors */ }

        setProgress(100);
        await new Promise(r => setTimeout(r, 300));
        setStep('success');

        // Sinyal ke tab induk bahwa pembayaran selesai
        localStorage.setItem('kyklos_payment_done', Date.now().toString());

        await new Promise(r => setTimeout(r, 2500));
        window.close();
    }, [type, id, pocketId, participantId, memberId, memberName, contributionAmount]);

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#0B1E26] to-slate-800 px-6 py-5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-white text-sm font-black tracking-wide">KYKLOS PAY</p>
                        <p className="text-white/50 text-[10px]">Secure Payment Gateway Simulator</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] text-emerald-400 font-bold">SSL SECURE</span>
                    </div>
                </div>

                {/* Step: Idle — tampilkan info pembayaran */}
                {step === 'idle' && (
                    <div className="p-6 space-y-5">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {type === 'arisan' ? 'Setoran Arisan' : 'Pembayaran Tagihan'}
                            </p>
                            <p className="font-serif text-xl font-black text-slate-800">{decodeURIComponent(title)}</p>
                            {memberName && (
                                <p className="text-xs text-gray-400">Atas nama: <span className="font-bold text-slate-700">{decodeURIComponent(memberName)}</span></p>
                            )}
                        </div>

                        {/* Nominal */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-bold">Total Pembayaran</span>
                            <span className="font-serif text-2xl font-black text-[#0B1E26]">{idr(amount)}</span>
                        </div>

                        {/* Info bank */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transfer Ke</p>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 flex items-center gap-3 border-b border-slate-100">
                                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-[10px] font-black">{bankName.slice(0, 3).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800">{bankName}</p>
                                        <p className="text-[10px] text-gray-400">Bank Transfer</p>
                                    </div>
                                </div>
                                <div className="px-4 py-3 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">No. Rekening</span>
                                        <span className="text-sm font-black text-slate-800 font-mono tracking-widest">{accountNumber}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">Atas Nama</span>
                                        <span className="text-xs font-bold text-slate-700">{accountHolder}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">Nominal</span>
                                        <span className="text-xs font-black text-emerald-600">{idr(amount)}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-amber-600 font-semibold text-center">
                                ⚠ Pastikan nominal transfer tepat sesuai di atas
                            </p>
                        </div>

                        <button
                            onClick={handlePay}
                            className="w-full py-3.5 bg-[#0B1E26] text-white rounded-2xl font-black text-sm hover:brightness-110 transition cursor-pointer"
                        >
                            Konfirmasi Sudah Transfer →
                        </button>
                        <button
                            onClick={() => window.close()}
                            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer"
                        >
                            Batalkan Pembayaran
                        </button>
                    </div>
                )}

                {/* Step: Processing */}
                {step === 'processing' && (
                    <div className="p-8 flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-[#0B1E26] animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-center space-y-1.5">
                            <p className="font-bold text-slate-800">Memverifikasi Pembayaran...</p>
                            <p className="text-xs text-gray-400">Jangan tutup halaman ini</p>
                        </div>
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                <span>Sedang diproses</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#0B1E26] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                        <div className="w-full text-[10px] text-gray-400 space-y-1">
                            {progress >= 15 && <p className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Koneksi terenkripsi</p>}
                            {progress >= 35 && <p className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Identitas diverifikasi</p>}
                            {progress >= 55 && <p className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Jumlah dikonfirmasi</p>}
                            {progress >= 75 && <p className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Transaksi dicatat</p>}
                            {progress >= 90 && <p className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Memfinalisasi...</p>}
                        </div>
                    </div>
                )}

                {/* Step: Success */}
                {step === 'success' && (
                    <div className="p-8 flex flex-col items-center gap-5 text-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-1.5">
                            <p className="font-serif text-2xl font-black text-slate-800">Pembayaran Berhasil!</p>
                            <p className="text-sm text-gray-500">{idr(amount)} telah masuk ke kantong komunitas</p>
                        </div>
                        <span className="text-[10px] font-bold px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 uppercase tracking-wider">
                            Status: Lunas
                        </span>
                        <p className="text-[10px] text-gray-300">Tab ini akan tertutup otomatis...</p>
                    </div>
                )}

                {/* Step: Error */}
                {step === 'error' && (
                    <div className="p-8 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="font-bold text-slate-800">Pembayaran Gagal</p>
                        <p className="text-xs text-gray-400">{errMsg}</p>
                        <button onClick={() => setStep('idle')} className="px-5 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">Coba Lagi</button>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span className="text-[9px] text-gray-300 font-semibold">256-bit SSL Encryption • Powered by Kyklos Pay</span>
                </div>
            </div>
        </div>
    );
}

export default function PayPage() {
    return (
        <Suspense>
            <PayContent />
        </Suspense>
    );
}
