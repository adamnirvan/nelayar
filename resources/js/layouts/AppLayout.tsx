import { Link, router } from '@inertiajs/react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
                <button type="button" onClick={() => router.post('/logout')}>
                    Logout
                </button>
            </nav>
            <main>{children}</main>
        </div>
    );
}
