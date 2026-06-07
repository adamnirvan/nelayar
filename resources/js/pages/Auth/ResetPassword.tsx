import { Link, router, Head } from '@inertiajs/react';
import axios from 'axios';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';

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
        <>
            <Head title="Reset Kata Sandi" />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            `}</style>

            <div 
                className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans text-gray-900 sm:p-8"
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                {/* Floating Card Centered (Sama persis dengan ForgotPassword) */}
                <div className="w-full max-w-md rounded-3xl bg-white px-8 py-10 shadow-xl shadow-gray-200/50 ring-1 ring-gray-100 sm:px-10 sm:py-10">
                    
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            Reset Kata Sandi
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-gray-500">
                            Silahkan buat kata sandi baru untuk akun Anda. Pastikan kata sandi kuat dan mudah diingat.
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
                                    className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827]"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData((d) => ({ ...d, password: e.target.value }))}
                                    placeholder="Minimal 8 karakter"
                                    className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827]"
                                    required
                                    autoComplete="new-password"
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

                        <div className="space-y-2">
                            <label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                Konfirmasi Kata Sandi
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="password_confirmation"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => setData((d) => ({ ...d, password_confirmation: e.target.value }))}
                                    placeholder="Ulangi kata sandi baru"
                                    className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827]"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((p) => !p)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                                    tabIndex={-1}
                                    aria-label={showConfirm ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'}
                                >
                                    {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`
                                group mt-2 flex w-full items-center justify-center rounded-xl py-3.5
                                text-sm font-bold text-white shadow-md
                                bg-amber-400
                                transition-all duration-300 hover:scale-[1.02]
                                hover:shadow-[0_0_20px] hover:shadow-amber-500/60
                                disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none
                            `}
                        >
                            Reset<span aria-hidden className="ml-2 transition-transform duration-300 group-hover:translate-x-1"></span>
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        <Link href="/login" className="font-bold text-amber-400 hover:underline">
                            Kembali ke Login
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}