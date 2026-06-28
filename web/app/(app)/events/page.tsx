'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CommunityContext } from '../layout';

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

export default function EventsPage() {
    const router = useRouter();
    const { role } = useContext(CommunityContext);
    const isAdmin = role === 'admin';
    const [communityId, setCommunityId] = useState('');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newEventForm, setNewEventForm] = useState({
        title: '', description: '', date: '', location: '', isOnline: false, imageUrl: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
            const list = await api.get<any[]>('/communities');
            const c = list.find(x => x.slug === activeSlug) || list[0];
            if (!c) { router.push('/login'); return; }
            setCommunityId(c.id);
            const fetchedEvents = await api.get<Event[]>(`/communities/${c.id}/events`);
            setEvents(fetchedEvents || []);
        } catch (err) {
            console.error('Failed to load events', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const res = await api.upload<{ url: string }>(file, 'events');
            setNewEventForm(prev => ({ ...prev, imageUrl: res.url }));
        } catch (err: any) {
            alert(err.message || 'Gagal mengupload gambar');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/communities/${communityId}/events`, {
                title: newEventForm.title,
                description: newEventForm.description,
                date: newEventForm.date || new Date().toISOString(),
                location: newEventForm.location,
                isOnline: newEventForm.isOnline,
                imageUrl: newEventForm.imageUrl
            });
            setShowNewEventModal(false);
            setNewEventForm({ title: '', description: '', date: '', location: '', isOnline: false, imageUrl: '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal membuat event');
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Agenda Komunitas</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">Temukan dan kelola pertemuan, kopdar, serta acara komunitas.</p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setShowNewEventModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer"
                    >
                        Buat Acara Baru
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {loading && <div className="col-span-full py-8 text-center text-xs text-gray-400">Memuat agenda...</div>}
                
                {!loading && events.length === 0 && (
                    <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                        Belum ada event di komunitas ini.
                    </div>
                )}

                {events.map(ev => (
                    <div
                        key={ev.id}
                        onClick={() => router.push(`/events/${ev.id}`)}
                        className="bg-white rounded-2xl border border-gray-200/80 p-0 shadow-sm overflow-hidden flex flex-col h-full cursor-pointer hover:border-primary hover:shadow-md transition duration-200 group"
                    >
                        <div className="h-32 bg-slate-100 w-full relative">
                            {ev.imageUrl || ev.bannerUrl ? (
                                <img src={ev.imageUrl || ev.bannerUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-sky-100 to-indigo-50 flex items-center justify-center text-slate-300">
                                    <svg className="w-10 h-10 group-hover:scale-110 transition duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            )}
                            {ev.isOnline && (
                                <div className="absolute top-3 left-3 bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">ONLINE</div>
                            )}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-serif text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition">{ev.title}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 mb-2 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                {new Date(ev.eventDate || ev.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="line-clamp-1">{ev.location}</span>
                            </p>
                            <p className="text-[11px] text-slate-600 line-clamp-2 flex-1">{ev.description}</p>
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <span className="text-[10px] font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Lihat Detail
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showNewEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <form onSubmit={handleCreateEvent} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="font-serif text-lg font-bold">Buat Acara Baru</h3>
                        <input
                            type="text" required value={newEventForm.title}
                            onChange={e => setNewEventForm({ ...newEventForm, title: e.target.value })}
                            placeholder="Judul acara (contoh: Kopdar Rutin)"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <textarea
                            required value={newEventForm.description}
                            onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })}
                            placeholder="Deskripsi acara"
                            rows={3}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        {/* Banner Event Image Upload */}
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Banner Event</label>
                            {newEventForm.imageUrl ? (
                                <div className="relative h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                    <img src={newEventForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        type="button" 
                                        onClick={() => setNewEventForm(prev => ({ ...prev, imageUrl: '' }))}
                                        className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white p-1 rounded-lg hover:bg-slate-900 transition cursor-pointer"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition">
                                    <div className="flex flex-col items-center gap-1 text-slate-400">
                                        {uploadingImage ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span className="text-[10px] font-bold text-slate-500">Mengupload...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                <span className="text-[10px] font-bold">Pilih Gambar / Banner</span>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleUploadImage}
                                        disabled={uploadingImage}
                                    />
                                </label>
                            )}
                        </div>

                        <input 
                            type="datetime-local" required value={newEventForm.date}
                            onChange={e => setNewEventForm({ ...newEventForm, date: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <input 
                            type="text" required value={newEventForm.location}
                            onChange={e => setNewEventForm({ ...newEventForm, location: e.target.value })}
                            placeholder="Lokasi (contoh: Cafe Seketika, Semarang)"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input 
                                type="checkbox" checked={newEventForm.isOnline}
                                onChange={e => setNewEventForm({ ...newEventForm, isOnline: e.target.checked })}
                                className="w-4 h-4 rounded text-primary focus:ring-primary"
                            />
                            Acara Online?
                        </label>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowNewEventModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-sm">Batal</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm">Buat</button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
}


