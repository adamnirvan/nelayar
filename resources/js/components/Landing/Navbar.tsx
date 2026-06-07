import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { url } = usePage();
    const isHomePage = url === '/';

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
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 md:px-12 lg:px-20 transition-all duration-300 ${
                isScrolled 
                    ? 'bg-white/95 backdrop-blur-lg border-b border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-3 md:py-4' 
                    : 'bg-white/10 backdrop-blur-md border-b border-white/20' 
            }`}
        >
            {/* LOGO */}
            <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                    <img 
                        src="/icon-white.svg" 
                        alt="Nelayar Logo" 
                        className={`h-7 md:h-8 w-auto object-contain transition-all duration-300 ${
                            isScrolled ? 'brightness-0 opacity-80' : ''
                        }`}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <span className={`hidden text-2xl font-extrabold tracking-wide transition-colors duration-300 ${
                        isScrolled ? 'text-slate-800' : 'text-white'
                    }`}>
                        Nelayar
                    </span>
                </Link>
            </div>

            {/* MENU TENGAH */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
                <Link 
                    href="/#demo" 
                    onClick={(e) => handleScroll(e, 'demo')} 
                    className={`font-medium transition-colors duration-300 ${
                        isScrolled ? 'text-slate-600 hover:text-amber-500' : 'text-white/90 hover:text-amber-400'
                    }`}
                >Demo</Link>
                <Link 
                    href="/#fitur" 
                    onClick={(e) => handleScroll(e, 'fitur')} 
                    className={`font-medium transition-colors duration-300 ${
                        isScrolled ? 'text-slate-600 hover:text-amber-500' : 'text-white/90 hover:text-amber-400'
                    }`}>Fitur</Link>
                <Link 
                    href="/#tentang-kami" 
                    onClick={(e) => handleScroll(e, 'tentang-kami')} 
                    className={`font-medium transition-colors duration-300 ${
                        isScrolled ? 'text-slate-600 hover:text-amber-500' : 'text-white/90 hover:text-amber-400'
                    }`}>Tentang Kami</Link>
            </div>

            {/* TOMBOL LOGIN & REGISTER */}
            <div className="flex items-center space-x-2 md:space-x-4">
                <Link 
                    href="/login"
                    className={`px-4 py-1.5 md:px-6 md:py-2.5 rounded-full border font-bold text-xs md:text-sm transition-all duration-300 ${
                        isScrolled
                            ? 'border-amber-400 text-amber-500 hover:bg-amber-400 hover:text-white'
                            : 'border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-white'
                    }`}
                >
                    Login
                </Link>
                <Link 
                    href="/register"
                    className="px-4 py-1.5 md:px-6 md:py-2.5 rounded-full bg-amber-400 font-bold text-white text-xs md:text-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:bg-amber-500 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                >
                    Register
                </Link>
            </div>
        </motion.nav>
    );
}