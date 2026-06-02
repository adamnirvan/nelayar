import { motion, Variants } from 'framer-motion';

export default function QuoteSection() {
    const line1 = "Insting saja tak lagi cukup melawan";
    const line2 = "anomali cuaca.";

    // Variants untuk Mesin Tik
    const typeWriterContainer: Variants = {
        hidden: { opacity: 1 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.04, delayChildren: 0.3 },
        },
    };

    const typeWriterChar: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.01 } },
    };

    // Variants untuk List Kanan
    const listContainerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 1.5 }, 
        },
    };

    const listItemVariants: Variants = {
        hidden: { opacity: 0, y: 40 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
    };

    // FUNGSI BANTUAN (THE FIX): 
    // Membungkus setiap KATA dalam inline-block, lalu memecahnya jadi huruf.
    // Ini mencegah browser memotong teks di tengah-tengah kata seperti "lag i".
    const renderTypewriterText = (text: string, colorClass: string) => {
        return text.split(" ").map((word, wordIndex) => (
            // mr-[0.25em] menggantikan spasi kosong
            <span key={`word-${wordIndex}`} className={`inline-block mr-[0.25em] ${colorClass}`}>
                {word.split("").map((char, charIndex) => (
                    <motion.span key={`char-${charIndex}`} variants={typeWriterChar} className="inline-block">
                        {char}
                    </motion.span>
                ))}
            </span>
        ));
    };

    return (
        <section className="relative w-full overflow-hidden bg-[#FAFAFA] py-24 md:py-32 lg:py-40">
            <div className="mx-auto max-w-7xl px-8 md:px-20 lg:px-32">
                
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
                    
                    {/* KOLOM KIRI: Kutipan & Ikan */}
                    <div className="relative">
                        
                        {/* 1. Tanda Kutip (Memakai Text Font Asli, bukan SVG) */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            viewport={{ once: false, amount: 0.4 }}
                            // MENGGUNAKAN NEGATIVE MARGIN (-mb) UNTUK MENARIK TEKS KE ATAS
                            className="-mb-4 md:-mb-8 lg:-mb-12"
                        >
                            <span className="text-7xl md:text-8xl lg:text-9xl font-black text-[#1e293b] leading-none tracking-tighter">
                                “
                            </span>
                        </motion.div>

                        {/* 2. Teks Headline (Ukuran diperkecil dan Anti-Patah) */}
                        <motion.h2 
                            variants={typeWriterContainer}
                            initial="hidden"
                            whileInView="show"
                            // REVISI: once: false
                            viewport={{ once: false, amount: 0.4 }}
                            className="text-3xl font-bold leading-[1.3] tracking-tight md:text-4xl lg:text-5xl"
                        >
                            {/* Panggil fungsi bantuan untuk baris pertama (Hitam Gelap) */}
                            {renderTypewriterText(line1, "text-[#1e293b]")}
                            
                            <br className="hidden md:block" />
                            <span className="inline-block mt-1 md:mt-0" />
                            
                            {/* Panggil fungsi bantuan untuk baris kedua (Kuning/Amber) */}
                            {renderTypewriterText(line2, "text-amber-400")}
                        </motion.h2>

                        {/* Dekorasi Ikan (Pastikan file fishDecor.jpg ada di folder public) */}
                        <motion.img 
                            src="/fishDecor.png" 
                            alt="Fish Decoration" 
                            animate={{ y: [0, -15, 0], rotate: [0, 2, -2, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-24 -left-10 w-48 opacity-90 md:-bottom-32 md:-left-16 md:w-64 mix-blend-multiply pointer-events-none"
                        />
                    </div>

                    {/* KOLOM KANAN: Penjelasan & List */}
                    <motion.div 
                        variants={listContainerVariants}
                        initial="hidden"
                        whileInView="show"
                        // REVISI: once: false
                        viewport={{ once: false, amount: 0.4 }}
                        className="flex flex-col justify-center pt-4 lg:pt-0"
                    >
                        <motion.p variants={listItemVariants} className="mb-10 text-base font-medium leading-relaxed text-slate-700 md:text-lg">
                            Rute migrasi ikan terus berpindah akibat perubahan suhu laut ekstrem. Melaut tanpa data kini hanyalah tebakan spekulatif yang menguras biaya bahan bakar dan membahayakan nyawa kru Anda.
                        </motion.p>

                        <div className="flex flex-col space-y-8">
                            <motion.div variants={listItemVariants} className="flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0 text-amber-400">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m13 14-2 3h4l-2 3"/></svg>
                                </div>
                                <p className="text-base font-medium leading-relaxed text-slate-800 md:text-lg">
                                    Ketidakpastian cuaca menyebabkan 40% pembatalan pelayaran mendadak.
                                </p>
                            </motion.div>

                            <motion.div variants={listItemVariants} className="flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0 text-amber-400">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="4" y1="9" x2="14" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
                                </div>
                                <p className="text-base font-medium leading-relaxed text-slate-800 md:text-lg">
                                    Efisiensi bahan bakar menurun drastis karena pencarian lokasi yang acak.
                                </p>
                            </motion.div>

                            <motion.div variants={listItemVariants} className="flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0 text-amber-400">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                                </div>
                                <p className="text-base font-medium leading-relaxed text-slate-800 md:text-lg">
                                    Data historis tradisional tidak lagi relevan dengan dinamika laut saat ini.
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}