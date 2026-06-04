import { useRef } from 'react';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { Link } from '@inertiajs/react';

export default function HeroSection() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const textY = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
    const waveBackY = useTransform(scrollYProgress, [0, 1], ["160px", "-5px"]);
    const waveFrontY = useTransform(scrollYProgress, [0, 1], ["180px", "0px"]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } },
    };

    return (
        <section ref={ref} className="relative flex h-screen w-full items-center overflow-hidden px-6 sm:px-12 md:px-20 lg:px-32">
            <motion.div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url(/hero_background.jpg)',
                    backgroundPosition: 'center top',
                    backgroundSize: 'cover',
                    y: backgroundY,
                }}
            >
                <div className="absolute inset-0 bg-[#0a3240]/30" />
            </motion.div>

            <motion.div style={{ y: textY }} variants={containerVariants} initial="hidden" animate="show" className="relative z-10 w-full max-w-3xl">
                {/* REVISI: Ukuran teks disesuaikan untuk layar HP */}
                <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.15] tracking-tight text-white drop-shadow-lg">
                    Mulai Berlayar <br />
                    <span className="text-amber-400">Dengan Nelayar</span>
                </motion.h1>

                <motion.p variants={itemVariants} className="mt-4 md:mt-6 max-w-xl text-sm sm:text-base md:text-lg font-medium leading-relaxed text-white/90 drop-shadow-md">
                    Optimalkan tangkapan dan navigasi dengan data satelit global dan metrik oseanik. Tinggalkan insting, gunakan akurasi.
                </motion.p>

                <motion.div variants={itemVariants} className="mt-8 md:mt-10">
                    <Link
                        href="/register"
                        className="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-3 md:px-8 md:py-3.5 text-sm md:text-base font-bold text-white shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        Bergabung Sekarang
                        <span aria-hidden className="ml-2 transition-transform duration-300 group-hover:-translate-y-[2px] group-hover:translate-x-1"></span>
                    </Link>
                </motion.div>
            </motion.div>

            <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
                <motion.div style={{ y: waveBackY }} className="absolute bottom-0 w-full overflow-hidden">
                    <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, ease: "linear", duration: 15 }} className="flex w-[200%]">
                        {/* REVISI OMBAK 1: Tinggi (h-[...]) disusutkan ekstrem di mobile agar kelandaian rasionya sama persis dengan desktop */}
                        <svg viewBox="0 0 1440 320" className="block w-1/2 flex-shrink-0 h-[55px] md:h-[140px] lg:h-[220px]" preserveAspectRatio="none">
                            <path fill="#EBF7FF" fillOpacity="0.4" d="M0,160 C160,80 320,240 480,160 C640,80 800,240 960,160 C1120,80 1280,240 1440,160 L1440,320 L0,320 Z"></path>
                        </svg>
                        <svg viewBox="0 0 1440 320" className="block w-1/2 flex-shrink-0 h-[55px] md:h-[140px] lg:h-[220px]" preserveAspectRatio="none">
                            <path fill="#EBF7FF" fillOpacity="0.4" d="M0,160 C160,80 320,240 480,160 C640,80 800,240 960,160 C1120,80 1280,240 1440,160 L1440,320 L0,320 Z"></path>
                        </svg>
                    </motion.div>
                    <div className="absolute top-[99%] left-0 right-0 h-[50vh] bg-[#EBF7FF]/40" />
                </motion.div>

                <motion.div style={{ y: waveFrontY }} className="absolute bottom-0 w-full overflow-hidden">
                    <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, ease: "linear", duration: 8 }} className="flex w-[200%]">
                        {/* REVISI OMBAK 2: Dibuat landai di mobile */}
                        <svg viewBox="0 0 1440 320" className="block w-1/2 flex-shrink-0 h-[35px] md:h-[100px] lg:h-[160px]" preserveAspectRatio="none">
                            <path fill="#F3F3F6" d="M0,160 C120,220 240,220 360,160 C480,100 600,100 720,160 C840,220 960,220 1080,160 C1200,100 1320,100 1440,160 L1440,320 L0,320 Z"></path>
                        </svg>
                        <svg viewBox="0 0 1440 320" className="block w-1/2 flex-shrink-0 h-[35px] md:h-[100px] lg:h-[160px]" preserveAspectRatio="none">
                            <path fill="#F3F3F6" d="M0,160 C120,220 240,220 360,160 C480,100 600,100 720,160 C840,220 960,220 1080,160 C1200,100 1320,100 1440,160 L1440,320 L0,320 Z"></path>
                        </svg>
                    </motion.div>
                    <div className="absolute top-[99%] left-0 right-0 h-[50vh] bg-[#F3F3F6]" />
                </motion.div>
            </div>
        </section>
    );
}