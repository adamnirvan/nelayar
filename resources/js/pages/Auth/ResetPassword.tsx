import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import AppLogoIcon from '@/components/app-logo-icon';

export default function ResetPassword() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') ?? '';
    const emailParam = params.get('email') ?? '';

    const [data, setData] = useState({
        email: emailParam,
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrors({});
        setProcessing(true);

        try {
            await axios.post('/api/auth/reset-password', { ...data, token });
            router.visit('/login', {
                data: { reset: '1' },
            });
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 422) {
                const raw = err.response.data.errors ?? {};
                setErrors(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, (v as string[])[0]])));
            } else {
                setErrors({ email: 'Terjadi kesalahan. Silakan coba lagi.' });
            }
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="grid h-screen lg:grid-cols-2">
            {/* Left panel — form */}
            <div className="flex items-center justify-center bg-gray-50 p-8">
                <div className="w-full max-w-sm">
                    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
                        <div className="mb-7">
                            <h2 className="text-2xl font-bold text-gray-900">Reset Kata Sandi</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Masukkan kata sandi baru untuk akun Anda.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Alamat Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                                        placeholder="nama@email.com"
                                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Kata Sandi Baru
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData((d) => ({ ...d, password: e.target.value }))}
                                        placeholder="Minimal 8 karakter"
                                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                    Konfirmasi Kata Sandi
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password_confirmation"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData((d) => ({ ...d, password_confirmation: e.target.value }))
                                        }
                                        placeholder="Ulangi kata sandi baru"
                                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((p) => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        tabIndex={-1}
                                        aria-label={showConfirm ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'}
                                    >
                                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
                            >
                                Reset Kata Sandi <span aria-hidden>→</span>
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-500">
                            <Link href="/login" className="font-bold text-gray-900 hover:underline">
                                Kembali ke Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right panel — image */}
            <div
                className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
                style={{
                    backgroundImage: 'url(/vessel_2.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-[#0a3240]/60" />

                <div className="relative z-10 flex justify-end">
                    <Link href="/" className="flex items-center gap-2">
                        <AppLogoIcon className="h-7 w-auto" />
                    </Link>
                </div>

                <div className="relative z-10 space-y-4 text-right">
                    <h1 className="text-5xl font-bold leading-tight">
                        Navigasi Masa Depan Perikanan Nasional
                    </h1>
                    <p className="ml-auto max-w-sm text-sm text-white/75">
                        Memberdayakan nelayan Indonesia dengan presisi data satelit dan kecerdasan oseanik kelas dunia.
                    </p>
                </div>

                <div className="relative z-10 flex justify-end gap-10">
                    <div className="text-right">
                        <p className="text-2xl font-bold">98%</p>
                        <p className="text-[11px] font-medium uppercase tracking-widest text-white/60">
                            Akurasi Deteksi
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">Real-time</p>
                        <p className="text-[11px] font-medium uppercase tracking-widest text-white/60">
                            Data Cuaca
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
