import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function Navbar() {
    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, targetId: string) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 md:px-12 lg:px-20 bg-white/10 backdrop-blur-md border-b border-white/20"
        >
            <div className="flex items-center">
                <Link href="/">
                    <img 
                        src="/icon-white.svg" 
                        alt="Nelayar Logo" 
                        className="h-7 md:h-8 w-auto object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <span className="hidden text-2xl font-extrabold text-white tracking-wide">
                        Nelayar
                    </span>
                </Link>
            </div>

            {/* Menu Tengah: Hanya muncul di md ke atas (Tablet/Desktop) */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
                <a href="#demo" onClick={(e) => handleScroll(e, 'demo')} className="text-white/90 font-medium hover:text-amber-400 transition-colors duration-300">Demo</a>
                <a href="#fitur" onClick={(e) => handleScroll(e, 'fitur')} className="text-white/90 font-medium hover:text-amber-400 transition-colors duration-300">Fitur</a>
                <a href="#tentang-kami" onClick={(e) => handleScroll(e, 'tentang-kami')} className="text-white/90 font-medium hover:text-amber-400 transition-colors duration-300">Tentang Kami</a>
            </div>

            {/* Tombol Kanan: Ukuran padding & font dikecilkan di mobile */}
            <div className="flex items-center space-x-2 md:space-x-4">
                <Link 
                    href="/login"
                    className="px-4 py-1.5 md:px-6 md:py-2.5 rounded-full border border-amber-400 text-amber-400 font-semibold text-xs md:text-sm transition-all duration-300 hover:bg-amber-400 hover:text-white"
                >
                    Login
                </Link>
                <Link 
                    href="/register"
                    className="px-4 py-1.5 md:px-6 md:py-2.5 rounded-full border border-white/50 bg-white/10 backdrop-blur-sm text-white font-semibold text-xs md:text-sm transition-all duration-300 hover:bg-white hover:text-slate-900"
                >
                    Register
                </Link>
            </div>
        </motion.nav>
    );
}