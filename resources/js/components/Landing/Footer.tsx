import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer 
            className="w-full bg-[#F3F3F6] pt-10 pb-6 md:pt-24 md:pb-8 border-t border-slate-300/50"
            style={{ fontFamily: "'Outfit', sans-serif" }}
        >
            <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
                
                {/* BAGIAN ATAS: Info & Socials */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10">
                    {/* KIRI: Logo & Detail */}
                    <div className="flex flex-col space-y-2 md:space-y-4 max-w-md">
                        <div className="flex items-center">
                            <img src="/icon-white.svg" alt="Nelayar Logo" className="w-10 h-10 md:w-30 md:h-12 mr-3 brightness-0" />
                        </div>
                        
                        <h3 className="text-base md:text-lg font-bold text-slate-800">
                            Solusi Nelayan Dalam Satu Layar
                        </h3>
                    </div>
                </div>

                <hr className="my-6 md:my-10 border-slate-300" />

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