import { Link, router, Head } from '@inertiajs/react';
import axios from 'axios';
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import AppLogoIcon from '@/components/app-logo-icon';
import { setToken } from '@/lib/auth';

export default function Register() {
    const [data, setData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrors({});
        setProcessing(true);

        try {
            const response = await axios.post('/api/auth/register', data);
            setToken(response.data.token);
            router.visit('/map');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 422) {
                setErrors(err.response.data.errors ?? {});
            } else {
                setErrors({ email: 'Terjadi kesalahan. Silakan coba lagi.' });
            }
        } finally {
            setProcessing(false);
        }
    }

    return (
        <>
            <Head title="Buat Akun Baru" />
            {/* Inject Font Outfit (Pastikan juga sudah ada di app.blade.php jika ingin global) */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            `}</style>

            <div 
                className="flex min-h-screen w-full bg-white font-sans text-gray-900" 
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                {/* Panel Kiri - Gambar Lebar (65% layar) */}
                <div
                    className="relative hidden w-full flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[65%]"
                    style={{
                        backgroundImage: 'url(/vessel_1.jpg)', // Path gambar HD-mu
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Gradient Overlay: Terang di atas, sedikit gelap di bawah untuk teks */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a3240]/90 via-[#0a3240]/20 to-transparent" />

                    <div className="relative z-10 flex items-center gap-2">
                        <Link href="/">
                            <AppLogoIcon className="h-9 w-auto drop-shadow-md" />
                        </Link>
                    </div>

                    <div className="relative z-10 mt-auto mb-10 space-y-5">
                        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white drop-shadow-lg">
                            Pemetaan Cerdas <br /> Perairan Nusantara
                        </h1>
                        <p className="max-w-lg text-base text-white/90 drop-shadow-md">
                            Berlayar lebih cerdas. Lacak dan prediksi zona tangkapan ikan terbaik dengan analitik spasial terkini.
                        </p>
                    </div>

                    <div className="relative z-10 flex gap-14 text-white">
                        <div>
                            <p className="text-4xl font-bold drop-shadow-md">Real-time</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/70">
                                Data Cuaca
                            </p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold drop-shadow-md">10 Hari</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/70">
                                Forecast ZPPI
                            </p>
                        </div>
                        
                    </div>
                </div>

                {/* Panel Kanan - Form Seukuran HP (35% layar) */}
                <div className="flex w-full items-center justify-center px-8 py-12 lg:w-[35%]">
                    {/* Pembungkus form dibuat seukuran handphone (max-w-sm) tanpa card/border */}
                    <div className="w-full max-w-sm">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                                Buat Akun Baru
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Lengkapi data untuk memulai perjalanan Anda.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                    Nama Lengkap
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                                        placeholder="Masukkan nama lengkap"
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827] transition-colors duration-200"
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                                <InputError message={errors.name} />
                            </div>

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
                                        placeholder="contoh@email.com"
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827] transition-colors duration-200"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Kata Sandi
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData((d) => ({ ...d, password: e.target.value }))}
                                        placeholder="Minimal 8 karakter"
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827] transition-colors duration-200"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                    Konfirmasi Kata Sandi
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData((d) => ({ ...d, password_confirmation: e.target.value }))}
                                        placeholder="Ulangi kata sandi"
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827] transition-colors duration-200"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((p) => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <button
                            type="submit"
                            disabled={processing}
                            className={`
                                mt-4 flex w-full items-center justify-center py-3.5
                                text-sm font-bold text-white rounded-xl shadow-md
                                bg-amber-400
                                transition-all duration-300 hover:scale-[1.02] 
                                hover:shadow-[0_0_10px] hover:shadow-amber-500/60
                                disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none
                                `}>
                                    Daftar
                                    </button>
                        </form>

                        <p className="mt-8 text-center text-sm text-gray-500">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="font-bold text-amber-400 transition hover:text-amber-500 hover:underline">
                                Login di sini
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}