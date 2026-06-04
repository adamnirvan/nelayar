import { motion, Variants } from 'framer-motion';

export default function QuoteSection() {
    const line1 = "Insting saja tak lagi cukup melawan";
    const line2 = "anomali cuaca.";

    const typeWriterContainer: Variants = {
        hidden: { opacity: 1 },
        show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.3 } },
    };

    const typeWriterChar: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.01 } },
    };

    const listContainerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 1.5 } },
    };

    const listItemVariants: Variants = {
        hidden: { opacity: 0, y: 40 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
    };

    const renderTypewriterText = (text: string, colorClass: string) => {
        return text.split(" ").map((word, wordIndex) => (
            <span key={`word-${wordIndex}`} className={`inline-block mr-[0.25em] ${colorClass}`}>
                {word.split("").map((char, charIndex) => (
                    <motion.span key={`char-${charIndex}`} variants={typeWriterChar} className="inline-block">{char}</motion.span>
                ))}
            </span>
        ));
    };

    return (
        <section className="relative w-full overflow-hidden bg-[#FAFAFA] py-16 md:py-24 lg:py-40">
            <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-32">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
                    
                    <div className="relative">
                        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} viewport={{ once: false, amount: 0.4 }} className="-mb-4 md:-mb-8 lg:-mb-12">
                            <span className="text-6xl md:text-8xl lg:text-9xl font-black text-[#1e293b] leading-none tracking-tighter">“</span>
                        </motion.div>

                        <motion.h2 variants={typeWriterContainer} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.4 }} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.3] tracking-tight">
                            {renderTypewriterText(line1, "text-[#1e293b]")}
                            <br className="hidden sm:block" />
                            <span className="inline-block mt-1 sm:mt-0" />
                            {renderTypewriterText(line2, "text-amber-400")}
                        </motion.h2>

                        <motion.img 
                            src="/fishDecor.png" alt="Fish Decoration" 
                            animate={{ y: [0, -15, 0], rotate: [0, 2, -2, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-16 -left-4 w-32 md:-bottom-24 md:-left-10 lg:-bottom-32 lg:-left-16 md:w-48 lg:w-64 opacity-90 mix-blend-multiply pointer-events-none"
                        />
                    </div>

                    <motion.div variants={listContainerVariants} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.4 }} className="flex flex-col justify-center pt-8 lg:pt-0">
                        <motion.p variants={listItemVariants} className="mb-8 md:mb-10 text-sm sm:text-base md:text-lg font-medium leading-relaxed text-slate-700">
                            Rute migrasi ikan terus berpindah akibat perubahan suhu laut ekstrem. Melaut tanpa data kini hanyalah tebakan spekulatif yang menguras biaya bahan bakar dan membahayakan nyawa kru Anda.
                        </motion.p>

                        <div className="flex flex-col space-y-6 md:space-y-8">
                            <motion.div variants={listItemVariants} className="flex items-start gap-3 md:gap-4">
                                <div className="mt-1 flex-shrink-0 text-amber-400">
                                    <svg width="24" height="24" className="md:w-7 md:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m13 14-2 3h4l-2 3"/></svg>
                                </div>
                                <p className="text-sm sm:text-base md:text-lg font-medium leading-relaxed text-slate-800">Ketidakpastian cuaca menyebabkan 40% pembatalan pelayaran mendadak.</p>
                            </motion.div>

                            <motion.div variants={listItemVariants} className="flex items-start gap-3 md:gap-4">
                                <div className="mt-1 flex-shrink-0 text-amber-400">
                                    <svg width="24" height="24" className="md:w-7 md:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="4" y1="9" x2="14" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
                                </div>
                                <p className="text-sm sm:text-base md:text-lg font-medium leading-relaxed text-slate-800">Efisiensi bahan bakar menurun drastis karena pencarian lokasi yang acak.</p>
                            </motion.div>

                            <motion.div variants={listItemVariants} className="flex items-start gap-3 md:gap-4">
                                <div className="mt-1 flex-shrink-0 text-amber-400">
                                    <svg width="24" height="24" className="md:w-7 md:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                                </div>
                                <p className="text-sm sm:text-base md:text-lg font-medium leading-relaxed text-slate-800">Data historis tradisional tidak lagi relevan dengan dinamika laut saat ini.</p>
                            </motion.div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}