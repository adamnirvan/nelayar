import { motion, Variants } from 'framer-motion';
import { Link } from '@inertiajs/react';

export default function CTASection() {
    const headline = "Siap Berlayar dengan Kepastian?";

    const typeWriterContainer: Variants = {
        hidden: { opacity: 1 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.3 },
        },
    };

    const typeWriterChar: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.01 } },
    };

    const fadeUpVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { 
            opacity: 1, 
            y: 0, 
            transition: { type: 'spring', stiffness: 60, damping: 15, delay: 1.5 } 
        },
    };

    const iconVariants: Variants = {
        hidden: { opacity: 0, scale: 0.5, rotate: -135 },
        show: { 
            opacity: 1, 
            scale: 1, 
            rotate: 0, 
            transition: { type: 'spring', stiffness: 80, damping: 12 } 
        },
    };

    const renderTypewriterText = (text: string) => {
        return text.split(" ").map((word, wordIndex) => (
            <span key={`word-${wordIndex}`} className="inline-block mr-[0.25em]">
                {word.split("").map((char, charIndex) => (
                    <motion.span key={`char-${charIndex}`} variants={typeWriterChar} className="inline-block">
                        {char}
                    </motion.span>
                ))}
            </span>
        ));
    };

    return (
        // REVISI: Background diubah menjadi bg-[#F3F3F6]
        <section className="relative w-full bg-[#F3F3F6] py-32 md:py-48 flex justify-center items-center overflow-hidden">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-400/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.4 }} 
                className="relative z-10 mx-auto max-w-4xl px-6 text-center flex flex-col items-center"
            >
                {/* REVISI: IKON KOMPAS DENGAN LINGKARAN VEKTOR */}
                {/* Lingkaran diletakkan di dalam SVG agar terlihat sebagai kesatuan ikon yang rapi */}
                <motion.div variants={iconVariants} className="mb-8 text-slate-900">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                </motion.div>

                <motion.h2 
                    variants={typeWriterContainer}
                    className="mb-8 text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight"
                >
                    {renderTypewriterText(headline)}
                </motion.h2>

                <motion.p 
                    variants={fadeUpVariants}
                    className="mb-12 max-w-[42rem] mx-auto text-lg md:text-xl font-medium leading-relaxed text-slate-600"
                >
                    Bergabunglah dengan era baru navigasi maritim. Tinggalkan pelayaran spekulatif, kurangi risiko cuaca ekstrem, dan optimalkan biaya operasional kapal Anda.
                </motion.p>

                <motion.div variants={fadeUpVariants}>
                    <Link
                        href="/register"
                        className="group relative inline-flex items-center justify-center rounded-full bg-[#FACC15] px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#EAB308] hover:scale-105 hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] active:scale-95"
                    >
                        Bergabung Sekarang
                        <span aria-hidden className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                            →
                        </span>
                    </Link>
                </motion.div>

            </motion.div>
        </section>
    );
}