import { useState } from 'react';
import { motion } from 'framer-motion';

// Aku sudah menambahkan properti 'image' untuk persiapan file gambarmu nanti
const features = [
    {
        category: "Analitik Spasial",
        title: "Pemetaan ZPPI Cerdas",
        desc: "Lacak titik koordinat kumpul ikan paling potensial secara presisi melalui integrasi data oseanografi satelit. Hemat bahan bakar pelayaran, maksimalkan hasil.",
        image: "/tech-1.jpg" // Placeholder gambar 1
    },
    {
        category: "Prediksi & Keamanan",
        title: "Prakiraan Cuaca",
        desc: "Pantau pergerakan arah angin, tinggi gelombang, dan arus laut secara real-time. Rencanakan jadwal melaut yang jauh lebih aman dengan tingkat akurasi tinggi.",
        image: "/tech-2.jpg" // Placeholder gambar 2
    },
    {
        category: "Keandalan Operasional",
        title: "Navigasi Mode Offline",
        desc: "Tetap terhubung dengan peta ZPPI dan rute pelayaran Anda meski berada jauh di tengah samudra tanpa koneksi internet. Navigasi tetap berjalan tanpa interupsi.",
        image: "/tech-3.jpg" // Placeholder gambar 3
    }
];

export default function TechFeatures() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section className="relative w-full bg-[#FAFAFA] py-24 md:py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
                
                {/* HEADER SECTION */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true, amount: 0.5 }}
                    className="text-center mb-16 md:mb-24"
                >
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
                        Teknologi Kelautan Kami
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
                        Inovasi Yang Menggabungkan Kecerdasan Buatan Dengan Data Satelit Global Untuk Masa Depan Perikanan Berkelanjutan.
                    </p>
                </motion.div>

                {/* ACCORDION HOVER CARDS (GITHUB + GLASSMORPHISM) */}
                <div className="flex flex-col lg:flex-row w-full h-[800px] lg:h-[550px] gap-4 lg:gap-6">
                    {features.map((item, index) => {
                        const isActive = activeIndex === index;

                        return (
                            <div
                                key={index}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={`group relative cursor-pointer overflow-hidden rounded-[2.5rem] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between p-8 md:p-10
                                    ${isActive ? 'lg:flex-[3] flex-[3] shadow-2xl' : 'lg:flex-[1] flex-[1] shadow-md'}
                                    border border-white/30 bg-slate-900/10
                                `}
                            >
                                {/* LAYER 1: GAMBAR PREVIEW */}
                                {/* Akan sedikit membesar (scale-110) saat tidak aktif, dan normal saat dihover */}
                                <img 
                                    src={item.image} 
                                    alt={item.title}
                                    className={`absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-[10s] ease-out
                                        ${isActive ? 'scale-100' : 'scale-110'}
                                    `}
                                />

                                {/* LAYER 2: GLASSMORPHISM & OVERLAY GRADIENT */}
                                {/* Overlay gelap di atas & bawah agar teks putih selalu terbaca, tengahnya sedikit transparan */}
                                <div 
                                    className={`absolute inset-0 z-0 transition-all duration-700
                                        ${isActive 
                                            ? 'bg-gradient-to-b from-black/70 via-black/30 to-black/90 backdrop-blur-sm' 
                                            : 'bg-black/60 backdrop-blur-md' // Lebih blur dan gelap saat tidak aktif
                                        }
                                    `} 
                                />

                                {/* KONTEN ATAS (Judul Kategori) */}
                                <div className="relative z-10">
                                    <h3 
                                        className={`text-2xl lg:text-3xl font-bold tracking-tight whitespace-nowrap transition-colors duration-500
                                            ${isActive ? 'text-white' : 'text-white/60'}
                                        `}
                                    >
                                        {item.category}
                                    </h3>
                                </div>

                                {/* KONTEN BAWAH (Sub-judul & Deskripsi Anti-Patah) */}
                                <div className="relative z-10 flex flex-col justify-end">
                                    <h4 
                                        className={`text-xl lg:text-2xl font-bold mb-2 whitespace-nowrap transition-colors duration-500
                                            ${isActive ? 'text-amber-400' : 'text-white'}
                                        `}
                                    >
                                        {item.title}
                                    </h4>
                                    
                                    {/* THE FIX: Mengunci animasi patah-patah */}
                                    <div 
                                        className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                                            ${isActive ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}
                                        `}
                                    >
                                        {/* Kuncinya ada di w-[320px] lg:w-[380px]. 
                                            Lebar teks dikunci paksa, jadi dia tidak pernah menyusun ulang kata-katanya.
                                            Dia hanya disembunyikan oleh 'overflow-hidden' induknya! 
                                        */}
                                        <p className="w-[280px] md:w-[320px] lg:w-[380px] text-base lg:text-lg text-white/90 leading-relaxed pt-2">
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