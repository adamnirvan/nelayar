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
                            <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                                Nelayar
                            </span>
                        </div>
                        
                        <h3 className="text-base md:text-lg font-bold text-slate-800">
                            Solusi Nelayan Dalam Satu Layar
                        </h3>
                        
                        <div className="flex items-start gap-2.5 md:gap-3 mt-1 md:mt-2">
                            <div className="mt-0.5 md:mt-1 flex-shrink-0 text-amber-400">
                                <svg width="18" height="18" className="md:w-[20px] md:h-[20px]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                            </div>
                            <p className="text-xs md:text-sm font-medium text-slate-600 leading-relaxed">
                                Ketintang, Surabaya, Jawa Timur, Indonesia, 60231
                            </p>
                        </div>
                    </div>

                    {/* KANAN: Social Media (VERSI FILLED) */}
                    <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-0">
                        {/* LinkedIn Filled */}
                        <a href="#" className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full bg-amber-400 text-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:bg-amber-500 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:scale-95">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                        </a>
                        {/* Facebook Filled */}
                        <a href="#" className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full bg-amber-400 text-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:bg-amber-500 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:scale-95">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        {/* Twitter/X Filled */}
                        <a href="#" className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full bg-amber-400 text-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:bg-amber-500 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:scale-95">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                            </svg>
                        </a>
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