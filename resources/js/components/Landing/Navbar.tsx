import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function Navbar() {
    // Fungsi untuk smooth scroll manual (alternatif yang lebih aman untuk React)
    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, targetId: string) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            // KUNCI GLASSMORPHISM: fixed, z-50, backdrop-blur, dan background semi-transparan
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20 bg-white/10 backdrop-blur-md border-b border-white/20"
        >
            {/* 1. LOGO KIRI */}
            <div className="flex items-center">
                <Link href="/">
                    {/* Asumsi kamu punya file logo.png atau logo.svg di folder public */}
                    <img 
                        src="/icon-white.svg" // Ganti dengan nama file logomu yang sebenarnya
                        alt="Nelayar Logo" 
                        className="h-8 md:h-8 w-auto object-contain"
                        // Fallback teks jika gambar belum ada
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

            {/* 2. MENU TENGAH (Navigasi Scroll) */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
                <a 
                    href="#demo" 
                    onClick={(e) => handleScroll(e, 'demo')}
                    className="text-white/90 font-medium hover:text-amber-400 transition-colors duration-300"
                >
                    Demo
                </a>
                <a 
                    href="#fitur" 
                    onClick={(e) => handleScroll(e, 'fitur')}
                    className="text-white/90 font-medium hover:text-amber-400 transition-colors duration-300"
                >
                    Fitur
                </a>
                <a 
                    href="#tentang-kami" 
                    onClick={(e) => handleScroll(e, 'tentang-kami')}
                    className="text-white/90 font-medium hover:text-amber-400 transition-colors duration-300"
                >
                    Tentang Kami
                </a>
            </div>

            {/* 3. TOMBOL KANAN (Login & Register) */}
            <div className="flex items-center space-x-3 md:space-x-4">
                <Link 
                    href="/login"
                    // Outline Kuning sesuai screenshot
                    className="px-5 py-2 md:px-6 md:py-2.5 rounded-full border border-amber-400 text-amber-400 font-semibold text-sm transition-all duration-300 hover:bg-amber-400 hover:text-white"
                >
                    Login
                </Link>
                <Link 
                    href="/register"
                    // Outline Putih / Glassy solid sesuai screenshot
                    className="px-5 py-2 md:px-6 md:py-2.5 rounded-full border border-white/50 bg-white/10 backdrop-blur-sm text-white font-semibold text-sm transition-all duration-300 hover:bg-white hover:text-slate-900"
                >
                    Register
                </Link>
            </div>
        </motion.nav>
    );
}