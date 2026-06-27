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

// Data dummy awal sebagai fallback jika backend offline
const DEFAULT_MOCK_DATA = {
    user: {
        id: 'user_1',
        email: 'bendahara@kyklos.org',
        name: 'Bendahara'
    },
    communities: [
        {
            id: 'comm_1',
            name: 'Bendahara',
            slug: 'Bendahara',
            themeColor: '#4F46E5',
            logoUrl: null,
            _count: { memberships: 5 }
        }
    ],
    pockets: [
        { id: 'pocket_1', communityId: 'comm_1', name: 'Kas Umum', type: 'treasury', balance: 15000000, status: 'safe' },
        { id: 'pocket_2', communityId: 'comm_1', name: 'Arisan Bulanan', type: 'arisan', balance: 20200000, status: 'active' },
        { id: 'pocket_3', communityId: 'comm_1', name: 'Dana Darurat', type: 'dues', balance: 10000000, status: 'locked' }
    ],
    transactions: [
        { id: 'tx_1', pocketId: 'pocket_1', amount: 250000, direction: 'out', note: 'Pembelian Kopi & Snack di Aruna', category: 'pengeluaran_manual', createdAt: new Date(Date.now() - 3600000).toISOString(), member: { name: 'Pak RT (Bendahara)' } },
        { id: 'tx_2', pocketId: 'pocket_1', amount: 1000000, direction: 'in', note: 'Iuran Bulanan Warga', category: 'pemasukan_manual', createdAt: new Date(Date.now() - 86400000).toISOString(), member: { name: 'Bu Linda' } }
    ],
    contributions: [
        { id: 'contr_1', amount: 100000, status: 'unpaid', member: { id: 'user_2', name: 'Bu Linda', email: 'linda@mail.com' }, schedule: { title: 'Iuran Bulanan RT' } },
        { id: 'contr_2', amount: 100000, status: 'paid', member: { id: 'user_3', name: 'Pak Budi', email: 'budi@mail.com' }, schedule: { title: 'Iuran Bulanan RT' } }
    ],
    pendingVerifications: [
        { id: 'pv_1', member: { name: 'Budi Wijaya', avatar: 'BW', color: 'bg-slate-800' }, date: 'Oct 24, 2023', amount: 500000, pocket: 'Kas Umum', pocketId: 'pocket_1' },
        { id: 'pv_2', member: { name: 'Siti Aminah', avatar: 'SA', color: 'bg-blue-400' }, date: 'Oct 23, 2023', amount: 1000000, pocket: 'Arisan Bulanan', pocketId: 'pocket_2' },
        { id: 'pv_3', member: { name: 'Dian R.', avatar: 'DR', color: 'bg-gray-400' }, date: 'Oct 22, 2023', amount: 250000, pocket: 'Kas Umum', pocketId: 'pocket_1' }
    ],
    members: [
        { userId: 'user_1', role: 'admin', user: { id: 'user_1', name: 'Pak RT (Bendahara)' } },
        { userId: 'user_2', role: 'member', user: { id: 'user_2', name: 'Bu Linda' } },
        { userId: 'user_3', role: 'member', user: { id: 'user_3', name: 'Pak Budi' } }
    ]
};

// Mengambil state dummy saat ini dari localStorage
function getMockState() {
    if (typeof window === 'undefined') return DEFAULT_MOCK_DATA;
    const stored = localStorage.getItem('kyklos_mock_state');
    if (!stored) {
        localStorage.setItem('kyklos_mock_state', JSON.stringify(DEFAULT_MOCK_DATA));
        return DEFAULT_MOCK_DATA;
    }
    return JSON.parse(stored);
}

// Menyimpan pembaruan state dummy ke localStorage
function saveMockState(state: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('kyklos_mock_state', JSON.stringify(state));
}

// Handler request palsu untuk simulasi API
async function mockReq<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    if (!token && (path === '/auth/me' || path.startsWith('/communities') || path.startsWith('/pockets') || path.startsWith('/verifications'))) {
        throw new Error('Unauthorized');
    }

    const state = getMockState();
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(init.body as string) : {};

    // Efek delay jaringan agar interaksi visual loading terasa nyata
    await new Promise(resolve => setTimeout(resolve, 300));

    if (method === 'POST') {
        if (path === '/auth/login' || path === '/auth/register') {
            setToken('dummy_token');
            return {
                accessToken: 'dummy_token',
                user: state.user
            } as unknown as T;
        }

        // Pencatatan transaksi baru
        const pocketMatch = path.match(/^\/pockets\/([^/]+)\/transactions$/);
        if (pocketMatch) {
            const pocketId = pocketMatch[1];
            const newTx = {
                id: `tx_${Date.now()}`,
                pocketId,
                amount: body.amount.toString(),
                direction: body.direction,
                note: body.note,
                category: body.category || '',
                createdAt: new Date().toISOString(),
                member: { name: state.user.name }
            };

            // Mutasi saldo kantong secara lokal
            state.pockets = state.pockets.map((p: any) => {
                if (p.id === pocketId) {
                    const balance = parseInt(p.balance, 10) || 0;
                    const change = body.amount;
                    const newBalance = body.direction === 'in' ? balance + change : balance - change;
                    return { ...p, balance: newBalance };
                }
                return p;
            });

            state.transactions.unshift(newTx);
            saveMockState(state);
            return newTx as unknown as T;
        }

        // Endpoint verifikasi kontribusi warga oleh admin
        const verifyMatch = path.match(/^\/verifications\/([^/]+)\/verify$/);
        if (verifyMatch) {
            const verificationId = verifyMatch[1];
            
            // Temukan item verifikasi dan hapus
            const item = state.pendingVerifications.find((v: any) => v.id === verificationId);
            if (item) {
                state.pendingVerifications = state.pendingVerifications.filter((v: any) => v.id !== verificationId);
                
                // Tambahkan dana ke kantong terkait secara lokal
                const p = state.pockets.find((pocket: any) => pocket.id === item.pocketId);
                if (p) {
                    p.balance = (parseInt(p.balance, 10) || 0) + item.amount;
                }
                
                // Tambahkan ke riwayat transaksi
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
    }

    if (method === 'GET') {
        if (path === '/auth/me') {
            return state.user as unknown as T;
        }

        if (path === '/communities') {
            return state.communities as unknown as T;
        }

        // List kantong per komunitas
        const pocketsMatch = path.match(/^\/communities\/([^/]+)\/pockets$/);
        if (pocketsMatch) {
            return state.pockets as unknown as T;
        }

        // List anggota komunitas
        const membersMatch = path.match(/^\/communities\/([^/]+)\/members$/);
        if (membersMatch) {
            return state.members as unknown as T;
        }

        // Konfigurasi sistem pembayaran
        const payConfigMatch = path.match(/^\/communities\/([^/]+)\/payment-config$/);
        if (payConfigMatch) {
            return { method: 'manual_transfer' } as unknown as T;
        }

        // Dasbor utama komunitas
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

        // Riwayat transaksi per kantong
        const txMatch = path.match(/^\/pockets\/([^/]+)\/transactions$/);
        if (txMatch) {
            const pocketId = txMatch[1];
            const filtered = state.transactions.filter((t: any) => t.pocketId === pocketId);
            return filtered as unknown as T;
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
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message ?? `HTTP ${res.status}`);
        }
        return res.json();
    } catch (error: any) {
        // Jika server database/API offline (fetch failed), otomatis beralih ke local mock data
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
};
