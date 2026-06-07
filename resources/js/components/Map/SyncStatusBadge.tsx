import { useSyncStatus } from '@/hooks/use-sync-status';

function relativeTime(ts: number): string {
    const minutes = Math.floor((Date.now() - ts) / 60000);

    if (minutes < 1) {
        return 'baru saja';
    }

    if (minutes < 60) {
        return `${minutes} mnt lalu`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} jam lalu`;
    }

    return `${Math.floor(hours / 24)} hr lalu`;
}

/**
 * Indikator status sinkronisasi data offline. Memberi tahu nelayan apakah data
 * perjalanan (zona, cuaca, basemap, graf rute) sudah tersimpan untuk dipakai
 * tanpa sinyal di laut. Sumber status: lib/offline/sync.ts.
 */
export default function SyncStatusBadge() {
    const { phase, done, total, lastSyncAt } = useSyncStatus();

    if (phase === 'syncing') {
        return (
            <span className="glass-panel flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                <svg
                    className="h-3.5 w-3.5 animate-spin text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                    />
                </svg>
                Menyiapkan offline… {done}/{total}
            </span>
        );
    }

    if (phase === 'done' && lastSyncAt) {
        return (
            <span className="glass-panel flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Siap offline
                <span className="font-normal text-gray-500">
                    · {relativeTime(lastSyncAt)}
                </span>
            </span>
        );
    }

    // idle tanpa riwayat, atau error (tidak ada tanggal tersimpan).
    return (
        <span className="glass-panel flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            Belum tersimpan offline
        </span>
    );
}
