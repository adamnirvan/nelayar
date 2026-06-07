import { Workbox } from 'workbox-window';

/**
 * Mendaftarkan service worker untuk dukungan offline.
 *
 * SW disalin ke root web (`/sw.js`) oleh scripts/pwa-postbuild.mjs agar
 * cakupannya `/` dan bisa melayani halaman Inertia saat nelayan kehilangan
 * sinyal di laut. Hanya aktif di build produksi —
 * di dev, `devOptions.enabled = false` sehingga `/sw.js` tidak ada dan
 * registrasi dilewati agar tidak membayangi Vite HMR / `artisan serve`.
 */
export function registerServiceWorker(): void {
    if (!import.meta.env.PROD) {
        return;
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    const wb = new Workbox('/sw.js', { scope: '/' });

    // `autoUpdate` membuat SW baru langsung mengambil alih; muat ulang sekali
    // agar pengguna memakai aset terbaru begitu kembali online.
    wb.addEventListener('controlling', () => window.location.reload());

    wb.register().catch((error) => {
        console.error('Pendaftaran service worker gagal:', error);
    });
}
