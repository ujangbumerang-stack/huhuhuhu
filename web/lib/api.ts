const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('kyklos_token');
}

export function setToken(t: string) {
    localStorage.setItem('kyklos_token', t);
}

export function clearToken() {
    localStorage.removeItem('kyklos_token');
}

const DEFAULT_MOCK_DATA = {
    user: {
        id: 'user_1',
        email: 'bendahara@kyklos.org',
        name: 'Bendahara'
    },
    communities: [
        {
            id: 'comm_1',
            name: 'Keluarga Cemara',
            slug: 'keluarga-cemara',
            themeColor: '#0F3A4B',
            logoUrl: null,
            _count: { memberships: 5 }
        }
    ],
    pockets: [
        { id: 'pocket_1', communityId: 'comm_1', name: 'Kas Umum', type: 'KAS', description: 'Kas utama komunitas', balance: 15000000, status: 'safe' },
        { id: 'pocket_2', communityId: 'comm_1', name: 'Arisan Bulanan', type: 'ARISAN', description: 'Arisan rutin bulanan', balance: 20200000, status: 'active', targetAmount: 25000000 },
        { id: 'pocket_3', communityId: 'comm_1', name: 'Dana Darurat', type: 'DARURAT', description: 'Dana sosial & darurat', balance: 10000000, status: 'locked' }
    ],
    transactions: [
        { id: 'tx_1',  pocketId: 'pocket_1', amount: 250000,  direction: 'out', note: 'Pembelian Kopi & Snack di Aruna',        createdAt: new Date(Date.now() -  1 * 3600000).toISOString(),   createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_2',  pocketId: 'pocket_1', amount: 1000000, direction: 'in',  note: 'Iuran Bulanan Warga',                    createdAt: new Date(Date.now() -  2 * 3600000).toISOString(),   createdBy: { name: 'Bu Linda' } },
        { id: 'tx_3',  pocketId: 'pocket_1', amount: 500000,  direction: 'out', note: 'Biaya Cetak Undangan Pertemuan',         createdAt: new Date(Date.now() -  1 * 86400000).toISOString(),  createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_4',  pocketId: 'pocket_1', amount: 750000,  direction: 'in',  note: 'Donasi Warga Baru (Pak Eko)',            createdAt: new Date(Date.now() -  2 * 86400000).toISOString(),  createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_5',  pocketId: 'pocket_1', amount: 300000,  direction: 'out', note: 'Listrik Pos Ronda',                      createdAt: new Date(Date.now() -  3 * 86400000).toISOString(),  createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_6',  pocketId: 'pocket_1', amount: 200000,  direction: 'out', note: 'Kebersihan Lingkungan',                  createdAt: new Date(Date.now() -  5 * 86400000).toISOString(),  createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_7',  pocketId: 'pocket_1', amount: 2000000, direction: 'in',  note: 'Iuran Warga — Batch Oktober',            createdAt: new Date(Date.now() -  7 * 86400000).toISOString(),  createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_8',  pocketId: 'pocket_1', amount: 150000,  direction: 'out', note: 'Fotokopi Surat Edaran',                  createdAt: new Date(Date.now() -  9 * 86400000).toISOString(),  createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_9',  pocketId: 'pocket_1', amount: 450000,  direction: 'out', note: 'Konsumsi Rapat Warga Bulanan',           createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),  createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_10', pocketId: 'pocket_1', amount: 1500000, direction: 'in',  note: 'Iuran Warga — Batch September',          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),  createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_11', pocketId: 'pocket_1', amount: 800000,  direction: 'out', note: 'Perbaikan Lampu Jalan Gang Mawar',       createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),  createdBy: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_12', pocketId: 'pocket_1', amount: 600000,  direction: 'in',  note: 'Penerimaan Sumbangan Acara 17 Agustus', createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),  createdBy: { name: 'Bu Linda' } },
        { id: 'tx_13', pocketId: 'pocket_2', amount: 100000,  direction: 'in',  note: 'Setoran Arisan — Bu Linda',              createdAt: new Date(Date.now() -  1 * 86400000).toISOString(),  createdBy: { name: 'Bu Linda' } },
        { id: 'tx_14', pocketId: 'pocket_2', amount: 100000,  direction: 'in',  note: 'Setoran Arisan — Pak Budi',              createdAt: new Date(Date.now() -  2 * 86400000).toISOString(),  createdBy: { name: 'Pak Budi' } },
    ],
    contributions: [
        { id: 'contr_1',  amount: 100000, status: 'pending',        member: { id: 'user_2', name: 'Bu Linda',         email: 'linda@mail.com'  }, schedule: { id: 'due_1', title: 'Iuran Bulanan RT' } },
        { id: 'contr_2',  amount: 100000, status: 'paid',           member: { id: 'user_3', name: 'Pak Budi',         email: 'budi@mail.com'   }, schedule: { id: 'due_1', title: 'Iuran Bulanan RT' } },
        { id: 'contr_3',  amount: 100000, status: 'pending_verify', member: { id: 'user_2', name: 'Bu Linda',         email: 'linda@mail.com'  }, schedule: { id: 'due_1', title: 'Iuran Keamanan'   } },
        { id: 'contr_4',  amount: 50000,  status: 'unpaid',         member: { id: 'user_3', name: 'Pak Budi',         email: 'budi@mail.com'   }, schedule: { id: 'due_2', title: 'Iuran Kebersihan' } },
        { id: 'contr_5',  amount: 100000, status: 'paid',           member: { id: 'user_2', name: 'Bu Linda',         email: 'linda@mail.com'  }, schedule: { id: 'due_1', title: 'Iuran Bulanan RT' } },
        { id: 'contr_6',  amount: 100000, status: 'unpaid',         member: { id: 'user_3', name: 'Pak Budi',         email: 'budi@mail.com'   }, schedule: { id: 'due_1', title: 'Iuran Bulanan RT' } },
        { id: 'contr_7',  amount: 50000,  status: 'paid',           member: { id: 'user_2', name: 'Bu Linda',         email: 'linda@mail.com'  }, schedule: { id: 'due_2', title: 'Iuran Kebersihan' } },
        { id: 'contr_8',  amount: 100000, status: 'pending',        member: { id: 'user_3', name: 'Pak Budi',         email: 'budi@mail.com'   }, schedule: { id: 'due_1', title: 'Iuran Bulanan RT' } },
        { id: 'contr_9',  amount: 100000, status: 'paid',           member: { id: 'user_2', name: 'Bu Linda',         email: 'linda@mail.com'  }, schedule: { id: 'due_1', title: 'Iuran Keamanan'   } },
        { id: 'contr_10', amount: 50000,  status: 'unpaid',         member: { id: 'user_3', name: 'Pak Budi',         email: 'budi@mail.com'   }, schedule: { id: 'due_2', title: 'Iuran Kebersihan' } },
        { id: 'contr_11', amount: 100000, status: 'pending_verify', member: { id: 'user_2', name: 'Bu Linda',         email: 'linda@mail.com'  }, schedule: { id: 'due_1', title: 'Iuran Bulanan RT' } },
        { id: 'contr_12', amount: 100000, status: 'paid',           member: { id: 'user_3', name: 'Pak Budi',         email: 'budi@mail.com'   }, schedule: { id: 'due_1', title: 'Iuran Bulanan RT' } },
    ],
    dues: [
        { id: 'due_1', title: 'Iuran Bulanan RT', amount: 100000, dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), frequency: 'monthly', isMandatory: true }
    ],
    pendingVerifications: [
        { id: 'pv_1', member: { name: 'Budi Wijaya', avatar: 'BW', color: 'bg-slate-800' }, date: 'Oct 24, 2023', amount: 500000, pocket: 'Kas Umum', pocketId: 'pocket_1' },
        { id: 'pv_2', member: { name: 'Siti Aminah', avatar: 'SA', color: 'bg-blue-400' }, date: 'Oct 23, 2023', amount: 1000000, pocket: 'Arisan Bulanan', pocketId: 'pocket_2' },
        { id: 'pv_3', member: { name: 'Dian R.', avatar: 'DR', color: 'bg-gray-400' }, date: 'Oct 22, 2023', amount: 250000, pocket: 'Kas Umum', pocketId: 'pocket_1' }
    ],
    members: [
        { id: 'mem_1', userId: 'user_1', role: 'admin', status: 'active', createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), user: { id: 'user_1', name: 'Pak RT (Bendahara)', email: 'bendahara@kyklos.org' } },
        { id: 'mem_2', userId: 'user_2', role: 'member', status: 'active', createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), user: { id: 'user_2', name: 'Bu Linda', email: 'linda@mail.com' } },
        { id: 'mem_3', userId: 'user_3', role: 'member', status: 'active', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), user: { id: 'user_3', name: 'Pak Budi', email: 'budi@mail.com' } }
    ],
    arisan: {
        pocket_2: {
            participants: [
                { id: 'ap_1', memberId: 'mem_2', member: { name: 'Bu Linda' }, createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
                { id: 'ap_2', memberId: 'mem_3', member: { name: 'Pak Budi' }, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() }
            ],
            periods: [
                { id: 'period_1', status: 'done', endDate: new Date(Date.now() - 30 * 86400000).toISOString(), winner: { name: 'Bu Linda' } }
            ],
            setoran: [] as { participantId: string; memberId: string; memberName: string; amount: number; paidAt: string }[]
        }
    },
    events: [
        { id: 'ev_1', communityId: 'comm_1', title: 'Rapat Warga Bulanan', description: 'Rapat rutin membahas agenda komunitas bulan ini.', date: new Date(Date.now() + 7 * 86400000).toISOString(), location: 'Balai RW 05, Jakarta', isOnline: false, bannerUrl: null }
    ],
    forum: [
        { id: 'th_1', communityId: 'comm_1', title: 'Usulan Perbaikan Jalan Gang Mawar', content: 'Jalan di gang mawar sudah mulai rusak, perlu segera diperbaiki sebelum musim hujan tiba.', upvotes: 4, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), author: { name: 'Pak Budi' }, _count: { comments: 3 } }
    ],
    wallet: {
        balance: 500000,
        topups: [] as any[],
        withdrawals: [] as any[]
    },
    paymentConfig: {
        method: 'manual_transfer',
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountHolder: 'RT 05 Komunitas'
    }
};

const POCKET_TYPE_MAP: Record<string, string> = { treasury: 'KAS', arisan: 'ARISAN', dues: 'DARURAT' };

function getMockState() {
    if (typeof window === 'undefined') return DEFAULT_MOCK_DATA;
    const stored = localStorage.getItem('kyklos_mock_state');
    if (!stored) {
        localStorage.setItem('kyklos_mock_state', JSON.stringify(DEFAULT_MOCK_DATA));
        return DEFAULT_MOCK_DATA;
    }
    const parsed = JSON.parse(stored);

    // Migrate old pocket types (lowercase → uppercase enum)
    if (parsed.pockets) {
        parsed.pockets = parsed.pockets.map((p: any) => ({
            ...p,
            type: POCKET_TYPE_MAP[p.type] ?? p.type.toUpperCase()
        }));
    }

    // Migrate old members missing id/status/email fields
    if (parsed.members) {
        parsed.members = parsed.members.map((m: any, i: number) => ({
            id: m.id ?? `mem_${i + 1}`,
            status: m.status ?? 'active',
            createdAt: m.createdAt ?? new Date().toISOString(),
            ...m,
            user: {
                email: m.user?.email ?? `member${i + 1}@kyklos.org`,
                ...m.user,
            }
        }));
    }

    // Migrate batch arisan entries back to flat structure (batch experiment reverted)
    if (parsed.arisan) {
        for (const key of Object.keys(parsed.arisan)) {
            const entry = parsed.arisan[key];
            if (entry && entry.batches) {
                const active = entry.batches.find((b: any) => b.id === entry.activeBatchId) ?? entry.batches[0] ?? {};
                parsed.arisan[key] = {
                    participants: active.participants ?? [],
                    periods: active.periods ?? [],
                    setoran: active.setoran ?? [],
                };
            }
        }
    }

    // Merge — seed transactions/contributions tetap ada meski localStorage punya data lama
    const mergeById = (stored: any[], seed: any[]) => {
        const ids = new Set((stored || []).map((x: any) => x.id));
        return [...(stored || []), ...seed.filter((x: any) => !ids.has(x.id))];
    };

    return {
        ...DEFAULT_MOCK_DATA,
        ...parsed,
        wallet: { ...DEFAULT_MOCK_DATA.wallet, ...parsed.wallet },
        arisan: { ...DEFAULT_MOCK_DATA.arisan, ...(parsed.arisan ?? {}) },
        transactions: mergeById(parsed.transactions, DEFAULT_MOCK_DATA.transactions),
        contributions: mergeById(parsed.contributions, DEFAULT_MOCK_DATA.contributions),
    };
}

function saveMockState(state: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('kyklos_mock_state', JSON.stringify(state));
}


async function mockReq<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    if (!token && (path === '/auth/me' || path.startsWith('/communities') || path.startsWith('/pockets') || path.startsWith('/verifications'))) {
        throw new Error('Unauthorized');
    }

    const state = getMockState();
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(init.body as string) : {};

    await new Promise(resolve => setTimeout(resolve, 300));

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (method === 'DELETE') {
        // DELETE /pockets/{id}
        const deletePocket = path.match(/^\/pockets\/([^/]+)$/);
        if (deletePocket) {
            const id = deletePocket[1];
            state.pockets = state.pockets.filter((p: any) => p.id !== id);
            saveMockState(state);
            return { success: true } as unknown as T;
        }

        // DELETE /communities/{id}/members/{membershipId}
        const deleteMember = path.match(/^\/communities\/([^/]+)\/members\/([^/]+)$/);
        if (deleteMember) {
            const membershipId = deleteMember[2];
            state.members = state.members.filter((m: any) => m.id !== membershipId);
            saveMockState(state);
            return { success: true } as unknown as T;
        }

        // DELETE /pockets/{id}/arisan/participants/{participantId}
        const deleteArisanPart = path.match(/^\/pockets\/([^/]+)\/arisan\/participants\/([^/]+)$/);
        if (deleteArisanPart) {
            const key = deleteArisanPart[1] as keyof typeof state.arisan;
            if (state.arisan[key]) {
                state.arisan[key].participants = state.arisan[key].participants.filter((p: any) => p.id !== deleteArisanPart[2]);
                saveMockState(state);
            }
            return { success: true } as unknown as T;
        }

        // DELETE /events/{id}
        const deleteEvent = path.match(/^\/events\/([^/]+)$/);
        if (deleteEvent) {
            state.events = state.events.filter((e: any) => e.id !== deleteEvent[1]);
            saveMockState(state);
            return { success: true } as unknown as T;
        }
    }

    // ── PATCH / PUT ──────────────────────────────────────────────────────────
    if (method === 'PATCH' || method === 'PUT') {
        // PATCH /auth/profile
        if (path === '/auth/profile') {
            if (body.name) state.user.name = body.name;
            saveMockState(state);
            return state.user as unknown as T;
        }

        // PATCH /communities/{id}  (theme color etc)
        const patchCommunity = path.match(/^\/communities\/([^/]+)$/);
        if (patchCommunity) {
            state.communities = state.communities.map((c: any) =>
                c.id === patchCommunity[1] ? { ...c, ...body } : c
            );
            saveMockState(state);
            return { success: true } as unknown as T;
        }

        // PUT /communities/{id}/payment-config
        const putPayConfig = path.match(/^\/communities\/([^/]+)\/payment-config$/);
        if (putPayConfig) {
            state.paymentConfig = { ...state.paymentConfig, ...body };
            saveMockState(state);
            return { success: true } as unknown as T;
        }

        // PATCH /pockets/{id}
        const patchPocket = path.match(/^\/pockets\/([^/]+)$/);
        if (patchPocket) {
            state.pockets = state.pockets.map((p: any) =>
                p.id === patchPocket[1] ? { ...p, ...body } : p
            );
            saveMockState(state);
            const updated = state.pockets.find((p: any) => p.id === patchPocket[1]);
            return updated as unknown as T;
        }
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (method === 'POST') {
        // Auth
        if (path === '/auth/login' || path === '/auth/register' || path === '/auth/google') {
            setToken('dummy_token');
            return { accessToken: 'dummy_token', user: state.user } as unknown as T;
        }

        // POST /communities/{id}/pockets
        const createPocket = path.match(/^\/communities\/([^/]+)\/pockets$/);
        if (createPocket) {
            const newPocket = {
                id: `pocket_${Date.now()}`,
                communityId: createPocket[1],
                name: body.name,
                type: body.type || 'KAS',
                description: body.description || '',
                balance: 0,
                status: 'active',
                targetAmount: body.targetAmount || 0
            };
            state.pockets.push(newPocket);
            saveMockState(state);
            return newPocket as unknown as T;
        }

        // POST /pockets/{id}/transactions
        const pocketTx = path.match(/^\/pockets\/([^/]+)\/transactions$/);
        if (pocketTx) {
            const pocketId = pocketTx[1];
            const direction = body.direction ?? body.type ?? 'in';
            const newTx = {
                id: `tx_${Date.now()}`,
                pocketId,
                amount: body.amount.toString(),
                direction,
                note: body.note || body.description || '',
                category: body.category || '',
                createdAt: new Date().toISOString(),
                member: { name: state.user.name }
            };
            state.pockets = state.pockets.map((p: any) => {
                if (p.id !== pocketId) return p;
                const balance = parseInt(p.balance, 10) || 0;
                const change = body.amount;
                return { ...p, balance: direction === 'in' ? balance + change : balance - change };
            });
            state.transactions.unshift(newTx);
            saveMockState(state);
            return newTx as unknown as T;
        }

        // POST /pockets/{id}/withdraw (disburse)
        const withdrawPocket = path.match(/^\/pockets\/([^/]+)\/withdraw$/);
        if (withdrawPocket) {
            const pocketId = withdrawPocket[1];
            state.pockets = state.pockets.map((p: any) =>
                p.id === pocketId ? { ...p, balance: 0 } : p
            );
            saveMockState(state);
            return { success: true } as unknown as T;
        }

        // POST /pockets/{id}/arisan/draw
        const arisanDraw = path.match(/^\/pockets\/([^/]+)\/arisan\/draw$/);
        if (arisanDraw) {
            const pocketId = arisanDraw[1];
            const key = pocketId as keyof typeof state.arisan;
            if (!state.arisan[key]) state.arisan[key] = { participants: [], periods: [], setoran: [] };
            const participants = state.arisan[key].participants;
            if (participants.length === 0) throw new Error('Tidak ada peserta arisan');
            const winner = participants[Math.floor(Math.random() * participants.length)];
            state.arisan[key].periods.push({
                id: `period_${Date.now()}`,
                status: 'done',
                endDate: new Date().toISOString(),
                winner: { name: winner.member?.name || 'Unknown' },
                totalSetoran: (state.arisan[key].setoran || []).length
            });
            state.arisan[key].setoran = [];
            saveMockState(state);
            return { success: true, winner } as unknown as T;
        }

        // POST /pockets/{id}/arisan/setoran  (member bayar setoran putaran ini)
        const arisanSetoran = path.match(/^\/pockets\/([^/]+)\/arisan\/setoran$/);
        if (arisanSetoran) {
            const key = arisanSetoran[1] as keyof typeof state.arisan;
            if (!state.arisan[key]) state.arisan[key] = { participants: [], periods: [], setoran: [] };
            if (!state.arisan[key].setoran) state.arisan[key].setoran = [];
            const alreadyPaid = state.arisan[key].setoran.some((s: any) => s.participantId === body.participantId);
            if (!alreadyPaid) {
                state.arisan[key].setoran.push({
                    participantId: body.participantId,
                    memberId: body.memberId,
                    memberName: body.memberName,
                    amount: body.amount,
                    paidAt: new Date().toISOString(),
                });
                const pocket = state.pockets.find((p: any) => p.id === arisanSetoran[1]);
                if (pocket) pocket.balance = (parseInt(pocket.balance, 10) || 0) + body.amount;
                saveMockState(state);
            }
            return { success: true } as unknown as T;
        }

        // POST /pockets/{id}/arisan/participants
        const arisanAddMember = path.match(/^\/pockets\/([^/]+)\/arisan\/participants$/);
        if (arisanAddMember) {
            const pocketId = arisanAddMember[1];
            const key = pocketId as keyof typeof state.arisan;
            if (!state.arisan[key]) state.arisan[key] = { participants: [], periods: [], setoran: [] };
            const alreadyIn = state.arisan[key].participants.some((p: any) => p.memberId === body.memberId);
            if (alreadyIn) return state.arisan[key].participants.find((p: any) => p.memberId === body.memberId) as unknown as T;
            const member = state.members.find((m: any) => m.id === body.memberId);
            const newParticipant = {
                id: `ap_${Date.now()}`,
                memberId: body.memberId,
                member: { name: member?.user?.name || member?.user?.name || 'Unknown' },
                createdAt: new Date().toISOString()
            };
            state.arisan[key].participants.push(newParticipant);
            saveMockState(state);
            return newParticipant as unknown as T;
        }

        // POST /verifications/{id}/verify
        const verifyMatch = path.match(/^\/verifications\/([^/]+)\/verify$/);
        if (verifyMatch) {
            const verificationId = verifyMatch[1];
            const item = state.pendingVerifications.find((v: any) => v.id === verificationId);
            if (item) {
                state.pendingVerifications = state.pendingVerifications.filter((v: any) => v.id !== verificationId);
                const p = state.pockets.find((pocket: any) => pocket.id === item.pocketId);
                if (p) p.balance = (parseInt(p.balance, 10) || 0) + item.amount;
                state.transactions.unshift({
                    id: `tx_${Date.now()}`,
                    pocketId: item.pocketId,
                    amount: item.amount.toString(),
                    direction: 'in',
                    note: `Verifikasi iuran: ${item.member.name}`,
                    category: 'iuran_warga',
                    createdAt: new Date().toISOString(),
                    member: { name: item.member.name }
                });
                saveMockState(state);
            }
            return { success: true } as unknown as T;
        }

        // POST /communities/{id}/dues
        const createDues = path.match(/^\/communities\/([^/]+)\/dues$/);
        if (createDues) {
            const newDue = {
                id: `due_${Date.now()}`,
                communityId: createDues[1],
                title: body.title,
                amount: body.amount,
                dueDate: body.dueDate || new Date().toISOString(),
                frequency: body.frequency || 'monthly',
                isMandatory: body.isMandatory ?? true
            };
            state.dues.push(newDue);
            saveMockState(state);
            return newDue as unknown as T;
        }

        // POST /dues/{id}/generate
        const generateDues = path.match(/^\/dues\/([^/]+)\/generate$/);
        if (generateDues) {
            const dueId = generateDues[1];
            const due = state.dues.find((d: any) => d.id === dueId);
            if (due) {
                state.members.forEach((m: any) => {
                    if (!state.contributions.some((c: any) => c.schedule?.id === dueId && c.member?.id === m.userId)) {
                        state.contributions.push({
                            id: `contr_${Date.now()}_${m.id}`,
                            amount: due.amount,
                            status: 'pending',
                            member: { id: m.userId, name: m.user.name, email: m.user.email },
                            schedule: { id: dueId, title: due.title }
                        });
                    }
                });
                saveMockState(state);
            }
            return { success: true } as unknown as T;
        }

        // POST /contributions/{id}/simulate-pay  (langsung masuk pocket)
        const simPay = path.match(/^\/contributions\/([^/]+)\/simulate-pay$/);
        if (simPay) {
            const id = simPay[1];
            const contrib = state.contributions.find((c: any) => c.id === id);
            if (contrib) {
                const due = state.dues.find((d: any) => d.id === contrib.schedule?.id);
                if (due && (due as any).pocketId) {
                    const pocketId = (due as any).pocketId;
                    state.pockets = state.pockets.map((p: any) =>
                        p.id === pocketId ? { ...p, balance: (parseInt(p.balance, 10) || 0) + contrib.amount } : p
                    );
                    state.transactions.unshift({
                        id: `tx_${Date.now()}`,
                        pocketId,
                        amount: contrib.amount.toString(),
                        direction: 'in',
                        note: `Iuran: ${contrib.schedule?.title}`,
                        category: 'dues',
                        createdAt: new Date().toISOString(),
                        member: { name: contrib.member?.name || state.user.name }
                    });
                }
                state.contributions = state.contributions.map((c: any) =>
                    c.id === id ? { ...c, status: 'paid' } : c
                );
                saveMockState(state);
            }
            return { success: true } as unknown as T;
        }

        // POST /contributions/{id}/report  (member lapor bayar)
        const reportContrib = path.match(/^\/contributions\/([^/]+)\/report$/);
        if (reportContrib) {
            const id = reportContrib[1];
            state.contributions = state.contributions.map((c: any) =>
                c.id === id ? { ...c, status: 'pending_verify', proofUrl: body.proofUrl || '' } : c
            );
            saveMockState(state);
            return { success: true } as unknown as T;
        }

        // POST /contributions/{id}/verify
        const verifyContrib = path.match(/^\/contributions\/([^/]+)\/verify$/);
        if (verifyContrib) {
            const id = verifyContrib[1];
            state.contributions = state.contributions.map((c: any) =>
                c.id === id ? { ...c, status: 'verified' } : c
            );
            saveMockState(state);
            return { success: true } as unknown as T;
        }

        // POST /communities/{id}/members (invite)
        const inviteMember = path.match(/^\/communities\/([^/]+)\/members$/);
        if (inviteMember) {
            const existing = state.members.find((m: any) => m.user.email === body.email);
            if (existing) throw new Error('Anggota dengan email ini sudah terdaftar di komunitas.');
            const newMember = {
                id: `mem_${Date.now()}`,
                userId: `user_${Date.now()}`,
                role: body.role || 'member',
                status: 'active',
                createdAt: new Date().toISOString(),
                user: { id: `user_${Date.now()}`, name: body.email.split('@')[0], email: body.email }
            };
            state.members.push(newMember);
            saveMockState(state);
            return newMember as unknown as T;
        }

        // POST /communities/{id}/events
        const createEvent = path.match(/^\/communities\/([^/]+)\/events$/);
        if (createEvent) {
            const newEvent = {
                id: `ev_${Date.now()}`,
                communityId: createEvent[1],
                title: body.title,
                description: body.description,
                date: body.date || new Date().toISOString(),
                location: body.location,
                isOnline: body.isOnline ?? false,
                bannerUrl: null
            };
            state.events.push(newEvent);
            saveMockState(state);
            return newEvent as unknown as T;
        }

        // POST /events/{id}/rsvp
        const rsvpEvent = path.match(/^\/events\/([^/]+)\/rsvp$/);
        if (rsvpEvent) {
            return { success: true, status: body.status } as unknown as T;
        }

        // POST /communities/{id}/forum
        const createThread = path.match(/^\/communities\/([^/]+)\/forum$/);
        if (createThread) {
            const newThread = {
                id: `th_${Date.now()}`,
                communityId: createThread[1],
                title: body.title,
                content: body.content,
                upvotes: 0,
                createdAt: new Date().toISOString(),
                author: { name: state.user.name },
                _count: { comments: 0 }
            };
            state.forum.unshift(newThread);
            saveMockState(state);
            return newThread as unknown as T;
        }

        // POST /forum/{id}/upvote
        const upvoteThread = path.match(/^\/forum\/([^/]+)\/upvote$/);
        if (upvoteThread) {
            const id = upvoteThread[1];
            state.forum = state.forum.map((t: any) =>
                t.id === id ? { ...t, upvotes: (t.upvotes || 0) + 1 } : t
            );
            saveMockState(state);
            return { success: true } as unknown as T;
        }

        // POST /wallet/topup
        if (path === '/wallet/topup') {
            const newTopup = {
                id: `tu_${Date.now()}`,
                amount: body.amount,
                status: 'success',
                createdAt: new Date().toISOString()
            };
            state.wallet.balance = (state.wallet.balance || 0) + body.amount;
            state.wallet.topups = [newTopup, ...(state.wallet.topups || [])];
            saveMockState(state);
            return newTopup as unknown as T;
        }

        // POST /wallet/withdraw
        if (path === '/wallet/withdraw') {
            if ((state.wallet.balance || 0) < body.amount) throw new Error('Saldo tidak mencukupi');
            const newWd = {
                id: `wdw_${Date.now()}`,
                amount: body.amount,
                status: 'pending',
                bankName: body.bankName,
                accountNumber: body.accountNumber,
                createdAt: new Date().toISOString()
            };
            state.wallet.balance = (state.wallet.balance || 0) - body.amount;
            state.wallet.withdrawals = [newWd, ...(state.wallet.withdrawals || [])];
            saveMockState(state);
            return newWd as unknown as T;
        }
    }

    // ── GET ──────────────────────────────────────────────────────────────────
    if (method === 'GET') {
        if (path === '/auth/me') return state.user as unknown as T;
        if (path === '/communities') return state.communities as unknown as T;

        // GET /wallet/balance
        if (path === '/wallet/balance') return { balance: state.wallet.balance || 0 } as unknown as T;
        if (path === '/wallet/topups') return (state.wallet.topups || []) as unknown as T;
        if (path === '/wallet/withdrawals') return (state.wallet.withdrawals || []) as unknown as T;

        // GET /communities/{id}/pockets
        const pocketsMatch = path.match(/^\/communities\/([^/]+)\/pockets$/);
        if (pocketsMatch) return state.pockets as unknown as T;

        // GET /communities/{id}/members
        const membersMatch = path.match(/^\/communities\/([^/]+)\/members$/);
        if (membersMatch) return state.members as unknown as T;

        // GET /communities/{id}/payment-config
        const payConfigMatch = path.match(/^\/communities\/([^/]+)\/payment-config$/);
        if (payConfigMatch) return state.paymentConfig as unknown as T;

        // GET /communities/{id}/dashboard
        const dbMatch = path.match(/^\/communities\/([^/]+)\/dashboard$/);
        if (dbMatch) {
            const totalBalance = state.pockets
                .reduce((sum: number, p: any) => sum + (parseInt(p.balance, 10) || 0), 0)
                .toString();
            return {
                totalBalance,
                pockets: state.pockets.map((p: any) => ({ ...p, balance: p.balance.toString() })),
                recentTransactions: state.transactions.slice(0, 10),
                contributions: state.contributions,
                pendingVerifications: state.pendingVerifications || [],
                members: state.members
            } as unknown as T;
        }

        // GET /communities/{id}/dues
        const duesMatch = path.match(/^\/communities\/([^/]+)\/dues$/);
        if (duesMatch) return state.dues as unknown as T;

        // GET /communities/{id}/contributions
        const contribsMatch = path.match(/^\/communities\/([^/]+)\/contributions$/);
        if (contribsMatch) return state.contributions as unknown as T;

        // GET /communities/{id}/contributions/mine
        const myContribsMatch = path.match(/^\/communities\/([^/]+)\/contributions\/mine$/);
        if (myContribsMatch) return state.contributions.filter((c: any) => c.member?.id === state.user.id) as unknown as T;

        // GET /events/{id}
        const eventByIdMatch = path.match(/^\/events\/([^/]+)$/);
        if (eventByIdMatch) {
            const ev = state.events.find((e: any) => e.id === eventByIdMatch[1]);
            if (!ev) throw new Error('Event tidak ditemukan');
            return ev as unknown as T;
        }

        // GET /communities/{id}/events
        const eventsMatch = path.match(/^\/communities\/([^/]+)\/events$/);
        if (eventsMatch) return state.events as unknown as T;

        // GET /communities/{id}/forum
        const forumMatch = path.match(/^\/communities\/([^/]+)\/forum$/);
        if (forumMatch) return state.forum as unknown as T;

        // GET /communities/{id}/transactions?page=N&limit=N  (buku besar)
        const communityTxMatch = path.match(/^\/communities\/([^/]+)\/transactions/);
        if (communityTxMatch) {
            const urlObj = new URL(path, 'http://x');
            const pageNum = Math.max(1, Number(urlObj.searchParams.get('page') || '1'));
            const limitNum = Math.max(1, Number(urlObj.searchParams.get('limit') || '25'));
            const communityPocketIds = (state.pockets || []).map((p: any) => p.id);
            const all = (state.transactions || [])
                .filter((t: any) => communityPocketIds.includes(t.pocketId))
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const pockets: any[] = state.pockets || [];
            const data = all.slice((pageNum - 1) * limitNum, pageNum * limitNum).map((t: any) => {
                const pocket = pockets.find((p: any) => p.id === t.pocketId);
                return { ...t, pocket: pocket ? { name: pocket.name, type: pocket.type } : null };
            });
            return { data, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / limitNum)) } as unknown as T;
        }

        // GET /pockets/{id}/transactions
        const txMatch = path.match(/^\/pockets\/([^/]+)\/transactions$/);
        if (txMatch) {
            const pocketId = txMatch[1];
            return state.transactions.filter((t: any) => t.pocketId === pocketId) as unknown as T;
        }

        // GET /pockets/{id}/arisan/participants
        const arisanParts = path.match(/^\/pockets\/([^/]+)\/arisan\/participants$/);
        if (arisanParts) {
            const key = arisanParts[1] as keyof typeof state.arisan;
            return (state.arisan[key]?.participants || []) as unknown as T;
        }

        // GET /pockets/{id}/arisan/periods
        const arisanPeriods = path.match(/^\/pockets\/([^/]+)\/arisan\/periods$/);
        if (arisanPeriods) {
            const key = arisanPeriods[1] as keyof typeof state.arisan;
            return (state.arisan[key]?.periods || []) as unknown as T;
        }

        // GET /pockets/{id}/arisan/setoran
        const arisanSetoranGet = path.match(/^\/pockets\/([^/]+)\/arisan\/setoran$/);
        if (arisanSetoranGet) {
            const key = arisanSetoranGet[1] as keyof typeof state.arisan;
            return (state.arisan[key]?.setoran || []) as unknown as T;
        }
    }

    throw new Error(`Mock endpoint not implemented: ${method} ${path}`);
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    try {
        const res = await fetch(`${BASE}${path}`, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(init.headers ?? {}),
            },
        });
        if (res.status >= 500 || res.status === 404) {
            console.warn(`[Kyklos API Bridge] Backend ${res.status} untuk ${path}. Menggunakan data dummy lokal.`);
            return mockReq<T>(path, init);
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message ?? `HTTP ${res.status}`);
        }
        return res.json();
    } catch (error: any) {
        if (error instanceof TypeError) {
            console.warn(`[Kyklos API Bridge] Gagal terhubung ke server API (${BASE}). Menggunakan data dummy lokal.`);
            return mockReq<T>(path, init);
        }
        throw error;
    }
}

export const api = {
    get: <T>(path: string) => req<T>(path),
    post: <T>(path: string, body: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) => req<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) => req<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(path: string) => req<T>(path, { method: 'DELETE' }),
    upload: <T>(file: File, folder?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) {
            formData.append('folder', folder);
        }
        const token = getToken();
        return fetch(`${BASE}/upload`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        }).then(async res => {
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message ?? `HTTP ${res.status}`);
            }
            return res.json() as Promise<T>;
        }).catch(err => {
            console.warn('[Kyklos API Bridge] File upload failed or server offline. Simulating local file upload.', err);
            return new Promise<{ url: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({ url: reader.result as string });
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read file locally'));
                };
                reader.readAsDataURL(file);
            }) as unknown as Promise<T>;
        });
    }
};
