import { Head, Link } from '@inertiajs/react';
import {
    Anchor,
    BookOpen,
    Cloud,
    Compass,
    Facebook,
    Fish,
    Linkedin,
    Search,
    Twitter,
    User,
    Waves,
    Wind,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';

function useScrollY() {
    const [y, setY] = useState(0);
    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setY(window.scrollY));
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(raf);
        };
    }, []);

    return y;
}

function useReveal<T extends HTMLElement>() {
    const [node, setNode] = useState<T | null>(null);
    const [visible, setVisible] = useState(false);
    const setRef = useCallback((el: T | null) => setNode(el), []);
    useEffect(() => {
        if (!node) {
return;
}

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => e.isIntersecting && setVisible(true));
            },
            { threshold: 0.15 }
        );
        io.observe(node);

        return () => io.disconnect();
    }, [node]);

    return [setRef, visible] as const;
}

export default function Landing() {
    const scrollY = useScrollY();

    const [featuresRef, featuresVisible] = useReveal<HTMLDivElement>();
    const [quoteRef, quoteVisible] = useReveal<HTMLDivElement>();
    const [mapRef, mapVisible] = useReveal<HTMLDivElement>();

    return (
        <>
            <Head title="Mulai Berlayar Dengan Nelayar">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                @keyframes nelayar-wave {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes nelayar-float {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50%      { transform: translateY(-14px) rotate(-1.5deg); }
                }
                @keyframes nelayar-float-soft {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-10px); }
                }
                @keyframes nelayar-swim {
                    0%   { transform: translateX(-10vw); }
                    100% { transform: translateX(110vw); }
                }
                @keyframes nelayar-swim-back {
                    0%   { transform: translateX(110vw) scaleX(-1); }
                    100% { transform: translateX(-10vw)  scaleX(-1); }
                }
                @keyframes nelayar-fade-up {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .nelayar-wave-track {
                    animation: nelayar-wave 18s linear infinite;
                }
                .nelayar-float {
                    animation: nelayar-float 6s ease-in-out infinite;
                }
                .nelayar-float-soft {
                    animation: nelayar-float-soft 5s ease-in-out infinite;
                }
                .nelayar-fade {
                    opacity: 0;
                    transform: translateY(28px);
                }
                .nelayar-fade.is-visible {
                    animation: nelayar-fade-up 0.9s ease-out forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                    .nelayar-wave-track,
                    .nelayar-float,
                    .nelayar-float-soft {
                        animation: none !important;
                    }
                }
            `}</style>

            <div
                className="min-h-screen overflow-x-hidden bg-[#bfe6f3] text-slate-800"
                style={{ fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif' }}
            >
                {/* ===================== NAV ===================== */}
                <header
                    className={`fixed top-0 left-0 z-30 w-full transition-all duration-300 ${
                        scrollY > 40
                            ? 'border-b border-white/20 bg-white/15 py-2 shadow-[0_8px_32px_rgba(8,58,82,0.15)] backdrop-blur-xl backdrop-saturate-150'
                            : 'bg-transparent py-3'
                    }`}
                >
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center">
                            <AppLogoIcon className="h-7 w-auto" />
                        </Link>

                        <nav className="hidden items-center gap-8 text-sm font-medium text-white md:flex">
                            <a href="#demo" className="transition hover:text-amber-300">
                                Demo
                            </a>
                            <a href="#fitur" className="transition hover:text-amber-300">
                                Fitur
                            </a>
                            <a href="#tentang" className="transition hover:text-amber-300">
                                Tentang Kami
                            </a>
                        </nav>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="rounded-full border border-amber-200/60 bg-amber-300/80 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_4px_20px_rgba(252,211,77,0.35)] backdrop-blur-md transition hover:bg-amber-300"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-full border border-white/50 bg-white/15 px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-md transition hover:bg-white/25"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ===================== HERO ===================== */}
                <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#cdeff8] to-[#a4dcef] pb-40 pt-32 md:pb-56 md:pt-40">
                    {/* Background parallax clouds */}
                    <div
                        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
                        style={{ transform: `translate3d(0, ${scrollY * 0.15}px, 0)` }}
                    >
                        <div className="absolute left-[8%] top-24 h-20 w-44 rounded-full bg-white blur-2xl" />
                        <div className="absolute right-[18%] top-44 h-16 w-32 rounded-full bg-white blur-2xl" />
                        <div className="absolute left-[40%] top-8 h-14 w-28 rounded-full bg-white blur-2xl" />
                    </div>

                    {/* Boat anchored to the section's right edge so it bleeds into the viewport edge */}
                    <div
                        className="pointer-events-none absolute top-1/2 right-0 hidden h-[34rem] w-[60vw] max-w-[900px] -translate-y-1/2 md:block lg:w-[55vw]"
                        style={{ transform: `translate3d(0, calc(-50% + ${scrollY * -0.18}px), 0)` }}
                    >
                        <img
                            src="/animated_boat.png"
                            alt="Boat sailing among fish"
                            className="nelayar-float absolute inset-0 h-full w-full object-contain object-right"
                        />
                    </div>

                    <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
                        <div
                            className="space-y-8"
                            style={{ transform: `translate3d(0, ${scrollY * -0.08}px, 0)` }}
                        >
                            <h1 className="text-5xl font-black leading-tight text-slate-900 sm:text-6xl">
                                Mulai Berlayar
                                <br />
                                Dengan Nelayar
                            </h1>
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-300/85 px-7 py-3.5 text-sm font-bold text-slate-900 shadow-[0_10px_30px_rgba(252,211,77,0.4)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_14px_38px_rgba(252,211,77,0.55)]"
                            >
                                Bergabung Sekarang
                            </Link>
                        </div>

                        {/* Mobile-only boat — stacks under the headline */}
                        <div className="relative h-72 md:hidden">
                            <img
                                src="/animated_boat.png"
                                alt="Boat sailing among fish"
                                className="nelayar-float absolute inset-0 h-full w-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Animated wave divider */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 overflow-hidden md:h-32">
                        <svg
                            className="nelayar-wave-track absolute bottom-0 left-0 h-full w-[200%]"
                            viewBox="0 0 2880 200"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M0,80 C240,160 480,0 720,80 C960,160 1200,0 1440,80 C1680,160 1920,0 2160,80 C2400,160 2640,0 2880,80 L2880,200 L0,200 Z"
                                fill="#3aa8c7"
                                opacity="0.55"
                            />
                            <path
                                d="M0,120 C240,40 480,200 720,120 C960,40 1200,200 1440,120 C1680,40 1920,200 2160,120 C2400,40 2640,200 2880,120 L2880,200 L0,200 Z"
                                fill="#1f8cae"
                            />
                        </svg>
                    </div>
                </section>

                {/* ===================== OCEAN — MAP PREVIEW ===================== */}
                <section
                    id="demo"
                    className="relative overflow-hidden bg-gradient-to-b from-[#1f8cae] via-[#1980a3] to-[#13688a] pb-40 pt-20 text-white"
                >
                    {/* Decorative fish swimming */}
                    <Fish
                        className="pointer-events-none absolute left-0 top-44 h-6 w-6 text-slate-900/60"
                        style={{
                            animation: 'nelayar-swim 24s linear infinite',
                            animationDelay: '-4s',
                        }}
                    />
                    <Fish
                        className="pointer-events-none absolute left-0 top-72 h-5 w-5 text-slate-900/50"
                        style={{
                            animation: 'nelayar-swim 30s linear infinite',
                            animationDelay: '-10s',
                        }}
                    />
                    <Fish
                        className="pointer-events-none absolute left-0 bottom-32 h-7 w-7 text-slate-900/60"
                        style={{
                            animation: 'nelayar-swim-back 28s linear infinite',
                            animationDelay: '-8s',
                        }}
                    />

                    <div
                        ref={mapRef}
                        className={`nelayar-fade ${mapVisible ? 'is-visible' : ''} relative mx-auto max-w-6xl px-6`}
                        style={{ transform: `translate3d(0, ${Math.max(-scrollY * 0.05 + 40, -30)}px, 0)` }}
                    >
                        <div className="overflow-hidden rounded-3xl border border-white/30 bg-white/15 shadow-[0_20px_60px_rgba(8,58,82,0.35)] ring-1 ring-white/10 backdrop-blur-2xl backdrop-saturate-150">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center gap-3 border-b border-white/20 bg-white/10 px-5 py-3 backdrop-blur-lg">
                                <div className="flex overflow-hidden rounded-full border border-white/40 bg-white/10 text-xs font-semibold backdrop-blur">
                                    <span className="bg-white/90 px-3 py-1 text-slate-900">Processed</span>
                                    <span className="px-3 py-1 text-white/80">SST</span>
                                    <span className="px-3 py-1 text-white/80">Chl</span>
                                </div>
                                <div className="relative ml-auto flex-1 sm:max-w-md">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="search"
                                        placeholder="Cari wilayah"
                                        readOnly
                                        className="w-full rounded-full border border-white/40 bg-white/80 py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none backdrop-blur"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="rounded-full border border-amber-200/60 bg-amber-300/85 px-4 py-1.5 text-xs font-semibold text-slate-900 backdrop-blur transition hover:bg-amber-300"
                                >
                                    Cek Harga Ikan
                                </button>
                                <div className="grid size-8 place-items-center rounded-full border border-white/40 bg-white/70 text-slate-700 backdrop-blur">
                                    <User className="size-4" />
                                </div>
                            </div>

                            {/* Faux map */}
                            <div className="relative h-72 bg-[#dff0d4] sm:h-96">
                                {/* land masses */}
                                <div className="absolute left-0 top-0 h-3/4 w-1/4 rounded-br-[40%] bg-[#c5e0b1]" />
                                <div className="absolute bottom-0 left-0 h-1/2 w-1/3 rounded-tr-[60%] bg-[#cfe6bb]" />
                                <div className="absolute right-0 top-0 h-2/3 w-1/4 rounded-bl-[50%] bg-[#c5e0b1]" />
                                <div className="absolute right-4 bottom-2 h-1/3 w-1/5 rounded-tl-[40%] bg-[#cfe6bb]" />

                                {/* sea overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#b5e0eb]/40 to-[#86c9dc]/50" />

                                {/* ZPPI polygons */}
                                <svg
                                    className="absolute inset-0 h-full w-full"
                                    viewBox="0 0 600 300"
                                    preserveAspectRatio="none"
                                >
                                    <polygon
                                        points="200,60 280,40 310,110 240,140 180,110"
                                        fill="#a8e063"
                                        fillOpacity="0.55"
                                        stroke="#5da32d"
                                        strokeWidth="2"
                                    />
                                    <polygon
                                        points="320,140 380,130 360,200 290,190"
                                        fill="#e6e36a"
                                        fillOpacity="0.6"
                                        stroke="#a8a52d"
                                        strokeWidth="2"
                                    />
                                    <polygon
                                        points="260,150 320,160 310,210 250,210"
                                        fill="#cbd989"
                                        fillOpacity="0.55"
                                        stroke="#8b9c50"
                                        strokeWidth="2"
                                    />
                                </svg>

                                <span className="absolute right-4 top-3 text-[10px] font-medium text-slate-700/80">
                                    Leaflet · OpenStreetMap
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ===================== QUOTE + ISSUES ===================== */}
                    <div
                        ref={quoteRef}
                        className={`nelayar-fade ${quoteVisible ? 'is-visible' : ''} relative mx-auto mt-24 grid max-w-6xl grid-cols-1 gap-6 px-6 md:grid-cols-2`}
                    >
                        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_12px_40px_rgba(8,58,82,0.25)] ring-1 ring-white/5 backdrop-blur-xl backdrop-saturate-150">
                            <span className="text-5xl font-serif leading-none text-amber-300">“</span>
                            <p className="mt-2 text-base font-medium leading-relaxed text-white/95">
                                <span className="font-bold">
                                    Insting saja tak lagi cukup melawan anomali cuaca.
                                </span>{' '}
                                Rute ikan terus berpindah. Jangan jadikan pelayaran Anda sebuah tebakan
                                spekulatif yang mengorbankan bahan bakar dan keselamatan tanpa
                                kepastian tangkapan.
                            </p>
                        </div>

                        <ul className="space-y-3 rounded-3xl border border-white/20 bg-white/10 p-8 text-sm leading-relaxed text-white/90 shadow-[0_12px_40px_rgba(8,58,82,0.25)] ring-1 ring-white/5 backdrop-blur-xl backdrop-saturate-150">
                            <li className="flex gap-3">
                                <BookOpen className="mt-0.5 size-5 shrink-0 text-amber-300" />
                                <p>
                                    <span className="font-bold text-white">Disrupsi Ekologis: </span>
                                    Pemanasan perairan menggeser rute migrasi ikan pelagis, membuat
                                    insting tradisional tak lagi akurat.
                                </p>
                            </li>
                            <li className="flex gap-3">
                                <Cloud className="mt-0.5 size-5 shrink-0 text-amber-300" />
                                <p>
                                    <span className="font-bold text-white">Cuaca Ekstrem: </span>
                                    Anomali iklim memicu gelombang tinggi tak terprediksi yang
                                    mengancam keselamatan pelayaran.
                                </p>
                            </li>
                            <li className="flex gap-3">
                                <Anchor className="mt-0.5 size-5 shrink-0 text-amber-300" />
                                <p>
                                    <span className="font-bold text-white">Pemborosan BBM: </span>
                                    Pelayaran spekulatif tanpa koordinat pasti memaksa pencarian buta
                                    yang menguras solar sia-sia.
                                </p>
                            </li>
                        </ul>
                    </div>

                    {/* Extra swimming fish near bottom */}
                    <Fish
                        className="pointer-events-none absolute left-0 bottom-10 h-6 w-6 text-slate-900/50"
                        style={{
                            animation: 'nelayar-swim 32s linear infinite',
                            animationDelay: '-15s',
                        }}
                    />
                </section>

                {/* ===================== TECH FEATURES ===================== */}
                <section
                    id="fitur"
                    className="relative overflow-hidden bg-gradient-to-b from-[#13688a] to-[#0c4d6a] py-24 text-white"
                >
                    <div
                        ref={featuresRef}
                        className={`nelayar-fade ${featuresVisible ? 'is-visible' : ''} mx-auto max-w-6xl px-6`}
                    >
                        <div className="mb-16 flex flex-col items-center text-center">
                            <Compass className="mb-3 size-8 text-amber-300" />
                            <h2 className="text-3xl font-bold sm:text-4xl">Teknologi Kelautan Kami</h2>
                            <p className="mt-3 max-w-xl text-xs uppercase tracking-widest text-white/70">
                                Inovasi Yang Menggabungkan Kecerdasan Buatan Dengan Data Satelit Global
                                Untuk Masa Depan Perikanan Berkelanjutan.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    icon: <Fish className="size-7" />,
                                    title: 'Deteksi ZPPI',
                                    desc: 'Zona Potensi Penangkapan Ikan terdeteksi dari citra satelit SST & Chlorophyll.',
                                },
                                {
                                    icon: <Cloud className="size-7" />,
                                    title: 'Prakiraan 10 Hari',
                                    desc: 'Forecast pergerakan zona ikan untuk perencanaan trip yang efisien.',
                                },
                                {
                                    icon: <Wind className="size-7" />,
                                    title: 'Cuaca Real-time',
                                    desc: 'Data BMKG dan Open-Meteo, diperbarui setiap 60 menit otomatis.',
                                },
                                {
                                    icon: <Waves className="size-7" />,
                                    title: 'Harga Ikan KKP',
                                    desc: 'Pantau harga komoditas terkini dari pasar pelabuhan seluruh Indonesia.',
                                },
                            ].map((f, i) => (
                                <div
                                    key={f.title}
                                    className="group flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-8 shadow-[0_10px_30px_rgba(8,58,82,0.25)] ring-1 ring-white/5 backdrop-blur-xl backdrop-saturate-150 transition hover:-translate-y-1 hover:border-amber-200/40 hover:bg-white/15 hover:shadow-[0_18px_45px_rgba(8,58,82,0.4)]"
                                    style={{
                                        transform: featuresVisible
                                            ? 'translateY(0)'
                                            : 'translateY(20px)',
                                        opacity: featuresVisible ? 1 : 0,
                                        transition: `opacity 0.7s ease ${i * 0.12}s, transform 0.7s ease ${i * 0.12}s`,
                                    }}
                                >
                                    <span className="grid size-12 place-items-center rounded-xl border border-amber-200/30 bg-amber-300/15 text-amber-300 shadow-inner backdrop-blur transition group-hover:scale-110 group-hover:bg-amber-300/25">
                                        {f.icon}
                                    </span>
                                    <h3 className="text-lg font-semibold">{f.title}</h3>
                                    <p className="text-sm text-white/75">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===================== CTA — OCTOPUS ===================== */}
                <section
                    id="tentang"
                    className="relative overflow-hidden bg-gradient-to-b from-[#0c4d6a] to-[#083a52] py-28 text-white"
                >
                    <img
                        src="/octopus.png"
                        alt=""
                        aria-hidden
                        className="nelayar-float-soft pointer-events-none absolute right-4 top-10 h-40 select-none md:right-24 md:h-56"
                        style={{ transform: `translate3d(0, ${(scrollY - 1800) * -0.06}px, 0)` }}
                    />

                    <div className="relative mx-auto max-w-2xl rounded-3xl border border-white/20 bg-white/10 px-6 py-12 text-center shadow-[0_20px_60px_rgba(8,58,82,0.35)] ring-1 ring-white/5 backdrop-blur-2xl backdrop-saturate-150 sm:px-12">
                        <Compass className="mx-auto mb-4 size-7 text-amber-300" />
                        <h2 className="text-3xl font-bold sm:text-4xl">
                            Siap Berlayar dengan Kepastian?
                        </h2>
                        <p className="mt-4 text-sm text-white/80">
                            Bergabunglah dengan era baru navigasi maritim. Tinggalkan pelayaran
                            spekulatif. Kurangi risiko cuaca ekstrem, dan optimalkan biaya operasional
                            kapal Anda.
                        </p>
                        <Link
                            href="/register"
                            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#2EA3B5] px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#33b5c8]"
                        >
                            Bergabung Sekarang
                        </Link>
                    </div>

                    <img
                        src="/jellyfish.png"
                        alt=""
                        aria-hidden
                        className="nelayar-float pointer-events-none absolute bottom-4 left-6 h-32 select-none md:left-20 md:h-44"
                        style={{ transform: `translate3d(0, ${(scrollY - 2000) * -0.05}px, 0)` }}
                    />
                </section>

                {/* ===================== FOOTER ===================== */}
                <footer className="bg-[#062a3d] py-14 text-white">
                    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 md:grid-cols-3">
                        <div className="space-y-4">
                            <AppLogoIcon className="h-7 w-auto" />
                            <span className="inline-block rounded-full border border-white/30 px-4 py-1 text-xs font-semibold text-amber-300">
                                Contact Us
                            </span>
                            <ul className="space-y-1 text-xs text-white/70">
                                <li>Email: nelayar.com</li>
                                <li>Phone: 00000000000</li>
                                <li>Address: 1234 Surabaya</li>
                            </ul>
                        </div>

                        <div className="flex flex-col items-start gap-4 md:items-center md:justify-center">
                            <div className="flex items-center gap-3">
                                <a
                                    href="#"
                                    aria-label="LinkedIn"
                                    className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-amber-300 hover:text-slate-900"
                                >
                                    <Linkedin className="size-4" />
                                </a>
                                <a
                                    href="#"
                                    aria-label="Facebook"
                                    className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-amber-300 hover:text-slate-900"
                                >
                                    <Facebook className="size-4" />
                                </a>
                                <a
                                    href="#"
                                    aria-label="Twitter"
                                    className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-amber-300 hover:text-slate-900"
                                >
                                    <Twitter className="size-4" />
                                </a>
                            </div>
                        </div>

                        <div className="flex flex-col items-start gap-4 md:items-end">
                            <Link
                                href="/register"
                                className="rounded-full border border-white/30 bg-[#2EA3B5]/80 px-6 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(46,163,181,0.35)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#33b5c8]/90"
                            >
                                Bergabung Sekarang
                            </Link>
                        </div>
                    </div>

                    <div className="mx-auto mt-10 flex max-w-6xl flex-col items-start justify-between gap-2 border-t border-white/10 px-6 pt-6 text-xs text-white/60 sm:flex-row sm:items-center">
                        <span>© 2026 Nelayar. All Rights Reserved.</span>
                        <a href="#" className="hover:text-white">
                            Privacy Policy
                        </a>
                    </div>
                </footer>
            </div>
        </>
    );
}
