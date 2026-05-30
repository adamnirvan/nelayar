import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { clearToken } from '@/lib/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    // Halaman peta memakai header mengambang sendiri, jadi nav teks ini disembunyikan.
    const { component } = usePage();
    const hideNav = component.startsWith('Map/');

    const handleLogout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } finally {
            clearToken();
            router.flushAll();
            router.visit('/login');
        }
    };

    if (hideNav) {
        return <>{children}</>;
    }

    return (
        <div>
            <nav>
                <Link href="/map">Peta</Link>
                {' | '}
                <Link href="/map/forecast">Prakiraan</Link>
                {' | '}
                <Link href="/weather">Cuaca</Link>
                {' | '}
                <Link href="/prices">Harga Ikan</Link>
                {' | '}
                <button type="button" onClick={handleLogout}>
                    Logout
                </button>
            </nav>
            <main>{children}</main>
        </div>
    );
}
