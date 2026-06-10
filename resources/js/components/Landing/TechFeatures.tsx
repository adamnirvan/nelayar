import { useState } from 'react';
import { motion } from 'framer-motion';

const features = [
    { category: "Analitik Spasial", title: "Pemetaan ZPPI Cerdas", desc: "Lacak titik koordinat kumpul ikan paling potensial secara presisi melalui integrasi data oseanografi satelit. Hemat bahan bakar pelayaran, maksimalkan hasil.", image: "/tech-1.webp" },
    { category: "Prediksi & Keamanan", title: "Prakiraan Cuaca", desc: "Pantau pergerakan arah angin, tinggi gelombang, dan arus laut secara real-time. Rencanakan jadwal melaut yang jauh lebih aman dengan tingkat akurasi tinggi.", image: "/tech-2.webp" },
    { category: "Keandalan Operasional", title: "Navigasi Mode Offline", desc: "Tetap terhubung dengan peta ZPPI dan rute pelayaran Anda meski berada jauh di tengah samudra tanpa koneksi internet. Navigasi tetap berjalan tanpa interupsi.", image: "/tech-3.webp" }
];

export default function TechFeatures() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section className="relative w-full bg-[#FAFAFA] py-16 md:py-24 lg:py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-20">
                
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, amount: 0.5 }} className="text-center mb-12 md:mb-16 lg:mb-24">
                    <h2 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 md:mb-6">
                        Teknologi Kelautan Kami
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed px-2">
                        Inovasi Yang Menggabungkan Kecerdasan Buatan Dengan Data Satelit Global Untuk Masa Depan Perikanan Berkelanjutan.
                    </p>
                </motion.div>

                <div className="flex flex-col lg:flex-row w-full h-[600px] md:h-[700px] lg:h-[550px] gap-3 md:gap-4 lg:gap-6">
                    {features.map((item, index) => {
                        const isActive = activeIndex === index;

                        return (
                            <div
                                key={index}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => setActiveIndex(index)} // REVISI: Tambahkan onClick agar HP bisa mentrigger card
                                className={`group relative cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between p-5 md:p-8 lg:p-10
                                    ${isActive ? 'lg:flex-[3] flex-[3] shadow-2xl' : 'lg:flex-[1] flex-[1] shadow-md'}
                                    border border-white/30 bg-slate-900/10
                                `}
                            >
                                <img src={item.image} alt={item.title} className={`absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-[10s] ease-out ${isActive ? 'scale-100' : 'scale-110'}`} />
                                <div className={`absolute inset-0 z-0 transition-all duration-700 ${isActive ? 'bg-gradient-to-b from-black/10 via-black/10 to-black/10 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-md'}`} />

                                <div className="relative z-10">
                                    <h3 className={`text-lg md:text-2xl lg:text-3xl font-bold tracking-tight whitespace-nowrap transition-colors duration-500 ${isActive ? 'text-white' : 'text-white/60'}`}>
                                        {item.category}
                                    </h3>
                                </div>

                                <div className="relative z-10 flex flex-col justify-end">
                                    <h4 className={`text-base md:text-xl lg:text-2xl font-bold mb-1 md:mb-2 whitespace-nowrap transition-colors duration-500 ${isActive ? 'text-black/70' : 'text-white'}`}>
                                        {item.title}
                                    </h4>
                                    
                                    <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isActive ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {/* REVISI: w-[85vw] untuk memastikan teks memanjang sesuai layar HP */}
                                        <p className="w-[85vw] sm:w-[280px] md:w-[320px] lg:w-[380px] text-xs sm:text-sm md:text-base lg:text-lg text-black/60 leading-relaxed pt-1 md:pt-2">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}