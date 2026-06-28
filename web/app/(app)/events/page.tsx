'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    isOnline: boolean;
    bannerUrl?: string;
}

export default function EventsPage() {
    const router = useRouter();
    const [slug, setSlug] = useState('keluarga-cemara');
    const [communityId, setCommunityId] = useState('');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [newEventForm, setNewEventForm] = useState({
        title: '', description: '', date: '', location: '', isOnline: false
    });

    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const list = await api.get<any[]>('/communities');
            const c = list.find(x => x.slug === slug) || list[0];
            if (!c) {
                router.push('/login');
                return;
            }
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
    }, [slug, router]);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/communities/${communityId}/events`, {
                title: newEventForm.title,
                description: newEventForm.description,
                date: newEventForm.date || new Date().toISOString(),
                location: newEventForm.location,
                isOnline: newEventForm.isOnline
            });
            setShowNewEventModal(false);
            setNewEventForm({ title: '', description: '', date: '', location: '', isOnline: false });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal membuat event');
        }
    };

    const handleRsvp = async (id: string, status: string) => {
        try {
            await api.post(`/events/${id}/rsvp`, { status });
            alert('RSVP berhasil disimpan.');
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan RSVP');
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Community Events</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">Discover and manage community gatherings, meetups, and events.</p>
                </div>

                <button 
                    onClick={() => setShowNewEventModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer"
                >
                    Create New Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {loading && <div className="col-span-full py-8 text-center text-xs text-gray-400">Loading events...</div>}
                
                {!loading && events.length === 0 && (
                    <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                        Belum ada event di komunitas ini.
                    </div>
                )}

                {events.map(ev => (
                    <div key={ev.id} className="bg-white rounded-2xl border border-gray-200/80 p-0 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="h-32 bg-slate-100 w-full relative">
                            {ev.bannerUrl ? (
                                <img src={ev.bannerUrl} alt={ev.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-sky-100 to-indigo-50 flex items-center justify-center text-slate-300">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            )}
                            {ev.isOnline && (
                                <div className="absolute top-3 left-3 bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">ONLINE</div>
                            )}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-serif text-lg font-bold text-slate-800 line-clamp-1">{ev.title}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 mb-3 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                {new Date(ev.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="line-clamp-1">{ev.location}</span>
                            </p>
                            <p className="text-[11px] text-slate-600 line-clamp-2 flex-1">{ev.description}</p>
                            
                            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                <button 
                                    onClick={() => handleRsvp(ev.id, 'going')}
                                    className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition"
                                >
                                    Going
                                </button>
                                <button 
                                    onClick={() => handleRsvp(ev.id, 'maybe')}
                                    className="flex-1 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition"
                                >
                                    Maybe
                                </button>
                                <button 
                                    onClick={() => handleRsvp(ev.id, 'not_going')}
                                    className="flex-1 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition"
                                >
                                    Not Going
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showNewEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <form onSubmit={handleCreateEvent} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="font-serif text-lg font-bold">Create New Event</h3>
                        <input 
                            type="text" required value={newEventForm.title}
                            onChange={e => setNewEventForm({ ...newEventForm, title: e.target.value })}
                            placeholder="Event Title (e.g. Kopdar Rutin)"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <textarea 
                            required value={newEventForm.description}
                            onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })}
                            placeholder="Description"
                            rows={3}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <input 
                            type="datetime-local" required value={newEventForm.date}
                            onChange={e => setNewEventForm({ ...newEventForm, date: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <input 
                            type="text" required value={newEventForm.location}
                            onChange={e => setNewEventForm({ ...newEventForm, location: e.target.value })}
                            placeholder="Location (e.g. Cafe A, Jakarta)"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input 
                                type="checkbox" checked={newEventForm.isOnline}
                                onChange={e => setNewEventForm({ ...newEventForm, isOnline: e.target.checked })}
                                className="w-4 h-4 rounded text-primary focus:ring-primary"
                            />
                            Is Online Event?
                        </label>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowNewEventModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm">Create</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}


