import { Link, router, Head } from '@inertiajs/react';
import axios from 'axios';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import AppLogoIcon from '@/components/app-logo-icon';
import { setToken } from '@/lib/auth';

export default function Login() {
    const [data, setData] = useState({ email: '', password: '', remember: false });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrors({});
        setProcessing(true);

        try {
            const response = await axios.post('/api/auth/login', data);
            setToken(response.data.token);
            router.visit('/map');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 422) {
                setErrors(err.response.data.errors ?? {});
            } else {
                setErrors({ email: 'Terjadi kesalahan. Silakan coba lagi.' });
                console.error('Login error:', err);
            }
        } finally {
            setProcessing(false);
        }
    }

    return (
        <>
            <Head title="Masuk ke Akun" />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            `}</style>

            <div 
                className="flex min-h-screen w-full bg-white font-sans text-gray-900" 
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                {/* Panel Kiri - Form Seukuran HP (35% layar) */}
                <div className="flex w-full items-center justify-center px-8 py-12 lg:w-[35%]">
                    <div className="w-full max-w-sm">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                                Selamat Datang Kembali
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Silakan masuk ke akun Anda untuk melanjutkan akses dashboard navigasi.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Alamat Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                                        placeholder="nama@email.com"
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827] transition-colors duration-200"
                                        required
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        Kata Sandi
                                    </label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-semibold text-amber-400 transition hover:text-amber-500 hover:underline"
                                    >
                                        Lupa kata sandi?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData((d) => ({ ...d, password: e.target.value }))}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827] transition-colors duration-200"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 pt-1">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData((d) => ({ ...d, remember: e.target.checked }))}
                                        className="peer size-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white transition-all checked:border-amber-500 checked:bg-amber-500 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:ring-offset-1"
                                    />
                                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-gray-600">Ingat saya di perangkat ini</span>
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className={`
                                    mt-4 flex w-full items-center justify-center rounded-xl py-3.5
                                    text-sm font-bold text-white shadow-md
                                    bg-amber-400
                                    transition-all duration-300 hover:scale-[1.02] 
                                    hover:shadow-[0_0_20px] hover:shadow-amber-500/60
                                    disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none
                                `}
                            >
                                Masuk <span aria-hidden className="ml-2 transition-transform duration-300 hover:translate-x-1"></span>
                            </button>
                        </form>

                        <p className="mt-8 text-center text-sm text-gray-500">
                            Belum punya akun?{' '}
                            <Link
                                href="/register"
                                className="font-bold text-amber-400 transition hover:text-amber-500 hover:underline"
                            >
                                Daftar Sekarang
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Panel Kanan - Gambar Lebar (65% layar) */}
                <div
                    className="relative hidden w-full flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[65%]"
                    style={{
                        backgroundImage: 'url(/vessel_2.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a3240]/90 via-[#0a3240]/20 to-transparent" />

                    {/* Logo & Konten disejajarkan ke kanan (mirrored) */}
                    <div className="relative z-10 flex justify-end gap-2">
                        <Link href="/">
                            <AppLogoIcon className="h-9 w-auto drop-shadow-md" />
                        </Link>
                    </div>

                    <div className="relative z-10 mt-auto mb-10 flex flex-col items-end space-y-5 text-right">
                        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white drop-shadow-lg">
                            Pemetaan Cerdas <br /> Perairan Nusantara
                        </h1>
                        <p className="max-w-lg text-base text-white/90 drop-shadow-md">
                            Berlayar lebih cerdas. Lacak dan prediksi zona tangkapan ikan terbaik dengan analitik spasial terkini.
                        </p>
                    </div>

                    <div className="relative z-10 flex justify-end gap-14 text-right text-white">
                        <div>
                            <p className="text-4xl font-bold drop-shadow-md">10 Hari</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/70">
                                Forecast ZPPI
                            </p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold drop-shadow-md">Real-time</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/70">
                                Data Cuaca
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}