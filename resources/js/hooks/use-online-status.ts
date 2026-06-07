import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void): () => void {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);

    return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
    };
}

function getSnapshot(): boolean {
    return navigator.onLine;
}

// Saat SSR tidak ada jaringan klien; anggap online agar render awal konsisten.
function getServerSnapshot(): boolean {
    return true;
}

/**
 * `true` saat browser online, `false` saat offline. Dipakai komponen peta untuk
 * beralih antara API langsung dan pembacaan IndexedDB ketika nelayan di laut.
 */
export function useOnlineStatus(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
