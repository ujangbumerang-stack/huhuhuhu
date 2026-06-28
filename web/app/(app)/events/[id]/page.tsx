"use client";

import { useEffect, useState, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CommunityContext } from '../../layout';

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    eventDate?: string;
    location: string;
    isOnline: boolean;
    bannerUrl?: string;
    imageUrl?: string;
}

export default function EventDetailPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;
    const { role } = useContext(CommunityContext);
    const isAdmin = role === 'admin';

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [deleteStep, setDeleteStep] = useState(false);

    useEffect(() => {
        api.get<Event>(`/events/${eventId}`)
            .then(ev => { if (ev) setEvent(ev); else router.push('/events'); })
            .catch(() => router.push('/events'))
            .finally(() => setLoading(false));
    }, [eventId]);

    const handleRsvp = async (status: string) => {
        try {
            await api.post(`/events/${eventId}/rsvp`, { status });
            alert(`RSVP "${status === 'going' ? 'Hadir' : status === 'maybe' ? 'Mungkin Hadir' : 'Tidak Hadir'}" berhasil disimpan.`);
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan RSVP');
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/events/${eventId}`);
            router.push('/events');
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus acara');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-primary rounded-full" />
            </div>
        );
    }

    if (!event) return null;

    const eventDate = new Date(event.eventDate || event.date);

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            {/* Back */}
            <button
                onClick={() => router.push('/events')}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition cursor-pointer"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Agenda
            </button>

            {/* Banner */}
            <div className="h-52 sm:h-64 bg-slate-100 rounded-2xl overflow-hidden relative">
                {event.imageUrl || event.bannerUrl ? (
                    <img src={event.imageUrl || event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-sky-100 to-indigo-50 flex items-center justify-center text-slate-300">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                {event.isOnline && (
                    <div className="absolute top-3 left-3 bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow">ONLINE</div>
                )}
            </div>

            {/* Title + badge */}
            <div className="space-y-2">
                <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    event.isOnline ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                    {event.isOnline ? 'Online' : 'Offline / Tatap Muka'}
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">{event.title}</h1>
            </div>

            {/* Info grid */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu & Tanggal</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                            {eventDate.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lokasi</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{event.location}</p>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Deskripsi Acara</p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{event.description || 'Tidak ada deskripsi lengkap.'}</p>
            </div>

            {/* RSVP */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest text-center">Konfirmasi Kehadiran</p>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => handleRsvp('going')}
                        className="py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                    >
                        Hadir
                    </button>
                    <button
                        onClick={() => handleRsvp('maybe')}
                        className="py-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-extrabold hover:bg-amber-100 transition cursor-pointer"
                    >
                        Mungkin
                    </button>
                    <button
                        onClick={() => handleRsvp('not_going')}
                        className="py-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-extrabold hover:bg-rose-100 transition cursor-pointer"
                    >
                        Tidak Hadir
                    </button>
                </div>
            </div>

            {/* Zona berbahaya — hanya admin */}
            {isAdmin && (
                <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-rose-100 bg-rose-50/40">
                        <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Zona Berbahaya</p>
                    </div>
                    {!deleteStep ? (
                        <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Hapus Acara Ini</p>
                                <p className="text-xs text-slate-500 mt-0.5">Acara akan dihapus permanen dari komunitas.</p>
                            </div>
                            <button
                                onClick={() => setDeleteStep(true)}
                                className="flex-shrink-0 px-4 py-2 border border-rose-300 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition cursor-pointer"
                            >
                                Hapus Acara...
                            </button>
                        </div>
                    ) : (
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-slate-700">
                                Yakin ingin menghapus acara <span className="font-black">{event.title}</span>? Tindakan ini tidak bisa dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteStep(false)}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {deleting
                                        ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : 'Ya, Hapus Selamanya'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
