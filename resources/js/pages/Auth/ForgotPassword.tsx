import { Link, Head } from '@inertiajs/react';
import axios from 'axios';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [sent, setSent] = useState(false);

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrors({});
        setProcessing(true);

        try {
            await axios.post('/api/auth/forgot-password', { email });
            setSent(true);
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
            <Head title="Lupa Kata Sandi" />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            `}</style>

            <div 
                className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans text-gray-900 sm:p-8"
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                {/* Padding vertikal (py) dikurangi agar kartu lebih padat */}
                <div className="w-full max-w-md rounded-3xl bg-white px-8 py-10 shadow-xl shadow-gray-200/50 ring-1 ring-gray-100 sm:px-10 sm:py-10">
                    
                    {/* Margin bottom dikurangi dari mb-8 menjadi mb-6 */}
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            Lupa Kata Sandi?
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-gray-500">
                            Jangan khawatir. Masukkan email Anda di bawah ini dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
                        </p>
                    </div>

                    {sent ? (
                        <div className="rounded-2xl border border-green-100 bg-green-50 p-5 text-center text-sm font-medium text-green-700">
                            Tautan reset kata sandi telah dikirim. <br/> Silakan periksa kotak masuk email Anda.
                        </div>
                    ) : (
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
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="nama@email.com"
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 [&:autofill]:shadow-[inset_0_0_0px_1000px_#f9fafb] [&:autofill]:[-webkit-text-fill-color:#111827]"
                                        required
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className={`
                                    group mt-2 flex w-full items-center justify-center rounded-xl py-3.5
                                    text-sm font-bold text-white shadow-md
                                    bg-gradient-to-r from-amber-400 to-orange-500
                                    transition-all duration-300 hover:scale-[1.02]
                                    hover:shadow-[0_0_20px] hover:shadow-amber-500/60
                                    disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none
                                `}
                            >
                                Kirim Tautan Reset <span aria-hidden className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                            </button>
                        </form>
                    )}

                    {/* Margin top sedikit dirapatkan dari mt-8 menjadi mt-6 */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Ingat kata sandi?{' '}
                        <Link href="/login" className="font-bold text-amber-500 transition hover:text-amber-600 hover:underline">
                            Kembali ke Login
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}