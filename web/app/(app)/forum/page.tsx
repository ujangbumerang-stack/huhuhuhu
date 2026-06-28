'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Thread {
    id: string;
    title: string;
    content: string;
    upvotes: number;
    createdAt: string;
    author: { name: string; avatarUrl?: string };
    _count?: { comments: number };
}

export default function ForumPage() {
    const router = useRouter();
    const [slug, setSlug] = useState('keluarga-cemara');
    const [communityId, setCommunityId] = useState('');
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);

    const [showNewThreadModal, setShowNewThreadModal] = useState(false);
    const [newThreadForm, setNewThreadForm] = useState({ title: '', content: '' });

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

            const fetchedThreads = await api.get<Thread[]>(`/communities/${c.id}/forum`);
            setThreads(fetchedThreads || []);
        } catch (err) {
            console.error('Failed to load forum', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [slug, router]);

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/communities/${communityId}/forum`, {
                title: newThreadForm.title,
                content: newThreadForm.content,
            });
            setShowNewThreadModal(false);
            setNewThreadForm({ title: '', content: '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal membuat diskusi baru');
        }
    };

    const handleUpvote = async (id: string) => {
        try {
            await api.post(`/forum/${id}/upvote`, {});
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal memberi upvote');
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Community Forum</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">Discuss ideas, ask questions, and connect with other members.</p>
                </div>

                <button 
                    onClick={() => setShowNewThreadModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer"
                >
                    Start Discussion
                </button>
            </div>

            <div className="space-y-4 pt-2">
                {loading && <div className="py-8 text-center text-xs text-gray-400">Loading threads...</div>}
                
                {!loading && threads.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-sm">
                        Belum ada diskusi di komunitas ini. Jadilah yang pertama!
                    </div>
                )}

                {threads.map(thread => (
                    <div key={thread.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex gap-4 transition hover:border-slate-300">
                        <div className="flex flex-col items-center gap-1 text-slate-500">
                            <button 
                                onClick={() => handleUpvote(thread.id)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <span className="text-xs font-bold">{thread.upvotes}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-serif text-lg font-bold text-slate-800 mb-1">{thread.title}</h3>
                            <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5 font-medium">
                                Posted by 
                                <span className="font-bold text-slate-700">{thread.author?.name || 'Unknown'}</span> 
                                • {new Date(thread.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{thread.content}</p>
                            <div className="mt-4 flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 hover:text-slate-600 cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    {thread._count?.comments || 0} Comments
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showNewThreadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <form onSubmit={handleCreateThread} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h3 className="font-serif text-lg font-bold">Start a New Discussion</h3>
                        <input 
                            type="text" required value={newThreadForm.title}
                            onChange={e => setNewThreadForm({ ...newThreadForm, title: e.target.value })}
                            placeholder="Discussion Title"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <textarea 
                            required value={newThreadForm.content}
                            onChange={e => setNewThreadForm({ ...newThreadForm, content: e.target.value })}
                            placeholder="What's on your mind?"
                            rows={5}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm resize-none"
                        />
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowNewThreadModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm">Post Discussion</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}


