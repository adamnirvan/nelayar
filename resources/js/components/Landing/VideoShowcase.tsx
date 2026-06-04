import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function VideoShowcase() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const yParallax = useTransform(scrollYProgress, [0, 1], ["200px", "-200px"]);
    const scaleParallax = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.98]);

    return (
        // REVISI: py-32 jadi py-16 di mobile agar jarak vertikal tidak memakan layar
        <section ref={containerRef} className="relative w-full bg-[#F3F3F6] py-16 md:py-32 lg:py-48 flex justify-center items-center overflow-hidden">
            <motion.div 
                style={{ y: yParallax, scale: scaleParallax }}
                // REVISI: Margin mx-6 jadi mx-4, border-[12px] dikecilkan jadi border-[6px] di mobile
                className="relative w-full max-w-5xl mx-4 sm:mx-8 md:mx-12 aspect-video rounded-2xl md:rounded-[2rem] border-[6px] md:border-[12px] border-white shadow-[0_15px_30px_rgba(0,0,0,0.08)] md:shadow-[0_30px_60px_rgba(0,0,0,0.08)] overflow-hidden bg-gradient-to-br from-[#bce6e6] to-[#e4e7fb]"
            >
                <video src="/demo-nelayar.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0" />

                <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 z-10">
                    <div className="px-4 py-1.5 md:px-6 md:py-2.5 bg-amber-400 text-white font-bold rounded-lg md:rounded-xl shadow-lg text-xs md:text-base tracking-wide">
                        Demo Platform Nelayar
                    </div>
                </div>
            </motion.div>
        </section>
    );
}