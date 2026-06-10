import { useSyncExternalStore } from 'react';

import {
    getSyncStatus,
    getSyncStatusServerSnapshot,
    subscribeSyncStatus,
} from '@/lib/offline/sync';
import type { SyncStatus } from '@/lib/offline/sync';

/**
 * Status sinkronisasi data offline (lihat lib/offline/sync.ts). Dipakai indikator
 * di peta agar nelayan tahu apakah data perjalanan sudah tersimpan sebelum melaut.
 */
export function useSyncStatus(): SyncStatus {
    return useSyncExternalStore(
        subscribeSyncStatus,
        getSyncStatus,
        getSyncStatusServerSnapshot,
    );
}
