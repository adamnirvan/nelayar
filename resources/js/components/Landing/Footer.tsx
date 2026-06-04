import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer 
            // PERUBAHAN: pt-16 dikecilkan jadi pt-10, pb-8 jadi pb-6 di mobile
            className="w-full bg-[#F3F3F6] pt-10 pb-6 md:pt-24 md:pb-8 border-t border-slate-300/50"
            style={{ fontFamily: "'Outfit', sans-serif" }}
        >
            <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
                
                {/* BAGIAN ATAS: Info & Socials */}
                {/* PERUBAHAN: gap-10 dikecilkan jadi gap-6 di mobile */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10">
                    
                    {/* KIRI: Logo & Detail */}
                    {/* PERUBAHAN: Jarak antar teks dirapatkan dari space-y-4 menjadi space-y-2 */}
                    <div className="flex flex-col space-y-2 md:space-y-4 max-w-md">
                        <div className="flex items-center">
                            {/* PERUBAHAN: text-3xl jadi text-2xl di mobile */}
                            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                                Nelayar
                            </span>
                        </div>
                        
                        {/* PERUBAHAN: text-lg jadi text-base di mobile */}
                        <h3 className="text-base md:text-lg font-bold text-slate-800">
                            Solusi Nelayan Dalam Satu Layar
                        </h3>
                        
                        <div className="flex items-start gap-2.5 md:gap-3 mt-1 md:mt-2">
                            <div className="mt-0.5 md:mt-1 flex-shrink-0 text-amber-400">
                                <svg width="18" height="18" className="md:w-[20px] md:h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            {/* PERUBAHAN: text-sm jadi text-xs di mobile agar muat 1-2 baris saja */}
                            <p className="text-xs md:text-sm font-medium text-slate-600 leading-relaxed">
                                Ketintang, Surabaya, Jawa Timur, Indonesia, 60231
                            </p>
                        </div>
                    </div>

                    {/* KANAN: Social Media */}
                    {/* PERUBAHAN: Margin top ditambahkan agar tidak terlalu nempel dengan alamat di mobile */}
                    <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-0">
                        {/* LinkedIn */}
                        {/* PERUBAHAN: Ukuran tombol h-10 w-10 dikecilkan jadi h-9 w-9, icon disusutkan */}
                        <a href="#" className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm transition-transform duration-300 hover:scale-110 hover:bg-amber-500 active:scale-95">
                            <svg width="16" height="16" className="md:w-[20px] md:h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                        </a>
                        {/* Facebook */}
                        <a href="#" className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm transition-transform duration-300 hover:scale-110 hover:bg-amber-500 active:scale-95">
                            <svg width="16" height="16" className="md:w-[20px] md:h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        </a>
                        {/* Twitter / X */}
                        <a href="#" className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm transition-transform duration-300 hover:scale-110 hover:bg-amber-500 active:scale-95">
                            <svg width="16" height="16" className="md:w-[20px] md:h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                        </a>
                    </div>
                </div>

                {/* GARIS PEMBATAS */}
                {/* PERUBAHAN: my-8 dikecilkan jadi my-6 di mobile */}
                <hr className="my-6 md:my-10 border-slate-300" />

                {/* BAGIAN BAWAH: Copyright & Links */}
                {/* PERUBAHAN: items-center diganti items-start di mobile agar rata kiri rapi, ukuran font text-xs */}
                <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 text-xs md:text-sm font-medium text-slate-500">
                    <p>© 2026 Nelayar. All Rights Reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-slate-800 transition-colors underline decoration-slate-300 underline-offset-4">
                            Privacy Policy
                        </Link>
                    </div>
                </div>

            </div>
        </footer>
    );
}