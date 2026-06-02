import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function VideoShowcase() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // 1. Y-Axis Parallax: Perbesar rentangnya agar pergerakan lebih cepat dan terasa
    const yParallax = useTransform(scrollYProgress, [0, 1], ["250px", "-250px"]);
    
    // 2. Trik Scale Parallax: Mulai dari 90%, membesar ke 100% di tengah, mengecil lagi ke 95% di atas
    const scaleParallax = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.95]);

    return (
        <section 
            ref={containerRef} 
            className="relative w-full bg-[#F3F3F6] py-32 md:py-48 flex justify-center items-center overflow-hidden"
        >
            <motion.div 
                style={{ 
                    y: yParallax,
                    scale: scaleParallax // Masukkan transform scale ke dalam style
                }}
                // Sedikit mempertajam shadow agar efek 3D saat scale membesar lebih terasa
                className="relative w-full max-w-5xl mx-6 md:mx-12 aspect-video rounded-[2rem] border-[12px] border-white shadow-[0_30px_60px_rgba(0,0,0,0.08)] overflow-hidden bg-gradient-to-br from-[#bce6e6] to-[#e4e7fb]"
            >
                <video
                    src="/demo-nelayar.mp4" 
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />

                <div className="absolute bottom-6 left-6 z-10">
                    <div className="px-6 py-2.5 bg-amber-400 text-white font-bold rounded-xl shadow-lg text-sm md:text-base tracking-wide">
                        Demo Platform Nelayar
                    </div>
                </div>

            </motion.div>
        </section>
    );
}