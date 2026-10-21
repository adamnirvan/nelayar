import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { url, props } = usePage();
    const isHomePage = url === '/';
    const isAuthenticated = Boolean(props.auth?.user);

    useEffect(() => {
        const handleScrollEvent = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScrollEvent);
        return () => window.removeEventListener('scroll', handleScrollEvent);
    }, []);

    const handleScroll = (e: React.MouseEvent, targetId: string) => {
        if (isHomePage) {
            e.preventDefault();
            const element = document.getElementById(targetId);
            if (element)
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-5 py-3 transition-all duration-300 md:px-12 lg:px-20 ${
                isScrolled
                    ? 'border-b border-slate-100 bg-white/95 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-lg md:py-4'
                    : 'border-b border-white/20 bg-white/10 backdrop-blur-md'
            }`}
        >
            {/* LOGO */}
            <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                    <img
                        src="/icon-white.svg"
                        alt="Nelayar Logo"
                        className={`h-7 w-auto object-contain transition-all duration-300 md:h-8 ${
                            isScrolled ? 'opacity-80 brightness-0' : ''
                        }`}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove(
                                'hidden',
                            );
                        }}
                    />
                    <span
                        className={`hidden text-2xl font-extrabold tracking-wide transition-colors duration-300 ${
                            isScrolled ? 'text-slate-800' : 'text-white'
                        }`}
                    >
                        Nelayar
                    </span>
                </Link>
            </div>

            {/* MENU TENGAH */}
            <div className="hidden items-center space-x-8 md:flex lg:space-x-12">
                <Link
                    href="/#demo"
                    onClick={(e) => handleScroll(e, 'demo')}
                    className={`font-medium transition-colors duration-300 ${
                        isScrolled
                            ? 'text-slate-600 hover:text-amber-500'
                            : 'text-white/90 hover:text-amber-400'
                    }`}
                >
                    Demo
                </Link>
                <Link
                    href="/#fitur"
                    onClick={(e) => handleScroll(e, 'fitur')}
                    className={`font-medium transition-colors duration-300 ${
                        isScrolled
                            ? 'text-slate-600 hover:text-amber-500'
                            : 'text-white/90 hover:text-amber-400'
                    }`}
                >
                    Fitur
                </Link>
                <Link
                    href="/#tentang-kami"
                    onClick={(e) => handleScroll(e, 'tentang-kami')}
                    className={`font-medium transition-colors duration-300 ${
                        isScrolled
                            ? 'text-slate-600 hover:text-amber-500'
                            : 'text-white/90 hover:text-amber-400'
                    }`}
                >
                    Tentang Kami
                </Link>
            </div>

            {/* TOMBOL LOGIN & REGISTER */}
            <div className="flex items-center space-x-2 md:space-x-4">
                <Link
                    href={isAuthenticated ? '/map' : '/login'}
                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-300 md:px-6 md:py-2.5 md:text-sm ${
                        isScrolled
                            ? 'border-amber-400 text-amber-500 hover:bg-amber-400 hover:text-white'
                            : 'border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-white'
                    }`}
                >
                    Login
                </Link>
                <Link
                    href={isAuthenticated ? '/map' : '/register'}
                    className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] md:px-6 md:py-2.5 md:text-sm"
                >
                    Register
                </Link>
            </div>
        </motion.nav>
    );
}
