import { Head, Link } from '@inertiajs/react';

const sections = [
    {
        title: '1. Informasi yang Kami Kumpulkan',
        content: (
            <>
                <p>
                    Saat Anda membuat akun Nelayar, kami mengumpulkan nama,
                    alamat email, dan kata sandi. Kami juga dapat memproses
                    informasi tim, undangan, serta data yang Anda berikan saat
                    menggunakan fitur aplikasi.
                </p>
                <p>
                    Nelayar dapat memproses data teknis seperti alamat IP,
                    informasi perangkat, log keamanan, cookie, dan penyimpanan
                    lokal untuk menjaga keamanan serta menyediakan fitur web
                    dan PWA. Jika Anda memberikan izin lokasi pada perangkat,
                    lokasi tersebut dapat digunakan untuk fitur peta dan
                    navigasi yang Anda minta.
                </p>
            </>
        ),
    },
    {
        title: '2. Cara Kami Menggunakan Data',
        content: (
            <p>
                Data digunakan untuk membuat dan mengamankan akun, menyediakan peta, data cuaca, 
                prakiraan zona potensi penangkapan ikan, harga ikan, mengirimkan notifikasi
                layanan, mencegah penyalahgunaan, dan meningkatkan kualitas
                Nelayar. Kami tidak menggunakan data untuk tujuan yang tidak
                berkaitan tanpa memberikan informasi yang sesuai.
            </p>
        ),
    },
    {
        title: '3. Dasar Pemrosesan',
        content: (
            <p>
                Kami memproses data berdasarkan persetujuan Anda, kebutuhan
                untuk menyediakan layanan atau memenuhi perjanjian dengan
                Anda, kewajiban hukum, kepentingan vital, kepentingan umum,
                atau kepentingan sah yang tetap mempertimbangkan hak Anda.
                Persetujuan lokasi dapat ditolak atau dicabut melalui pengaturan
                perangkat atau browser.
            </p>
        ),
    },
    {
        title: '4. Penyedia Layanan dan Transfer Data',
        content: (
            <p>
                Kami dapat menggunakan penyedia hosting, database, email,
                autentikasi, analitik, dan penyedia data cuaca atau perikanan
                untuk menjalankan Nelayar. Penyedia tersebut hanya boleh
                memproses data sesuai kebutuhan layanan dan kewajiban mereka.
                Jika data diproses di luar Indonesia, kami akan menerapkan
                perlindungan dan dasar transfer yang diwajibkan oleh peraturan
                yang berlaku.
            </p>
        ),
    },
    {
        title: '5. Penyimpanan dan Keamanan',
        content: (
            <p>
                Kami menyimpan data selama diperlukan untuk tujuan yang
                dijelaskan dalam kebijakan ini, untuk memenuhi kewajiban hukum,
                menyelesaikan sengketa, dan menegakkan perjanjian. Kami
                menerapkan langkah teknis dan organisasi yang wajar untuk
                mencegah akses, perubahan, pengungkapan, kehilangan, atau
                pemrosesan yang tidak sah.
            </p>
        ),
    },
    {
        title: '6. Hak Anda',
        content: (
            <p>
                Sesuai peraturan yang berlaku, Anda dapat meminta informasi,
                akses dan salinan data, perbaikan, penghapusan atau pemusnahan,
                pembatasan atau penghentian pemrosesan, penarikan persetujuan,
                serta mengajukan keberatan terhadap pemrosesan tertentu.
                Permintaan dapat diajukan melalui kontak resmi Nelayar.
            </p>
        ),
    },
    {
        title: '7. Penghapusan Akun dan Data',
        content: (
            <p>
                Anda dapat meminta penghapusan akun dan data pribadi dengan
                menghubungi kami. Kami akan meninjau permintaan tersebut dan
                menghapus atau menganonimkan data apabila tidak ada kewajiban
                hukum, kebutuhan keamanan, atau sengketa yang mengharuskan
                penyimpanannya.
            </p>
        ),
    },
    {
        title: '8. Insiden Keamanan',
        content: (
            <p>
                Jika terjadi kegagalan pelindungan data pribadi yang wajib
                diberitahukan, kami akan mengambil langkah pemulihan dan
                menyampaikan pemberitahuan kepada pihak yang relevan sesuai
                jangka waktu dan ketentuan hukum yang berlaku.
            </p>
        ),
    },
    {
        title: '9. Perubahan Kebijakan',
        content: (
            <p>
                Kami dapat memperbarui kebijakan ini ketika layanan atau
                peraturan berubah. Perubahan penting akan diberitahukan melalui
                Nelayar atau cara lain yang sesuai. Tanggal pembaruan terakhir
                ditampilkan di bagian atas halaman ini.
            </p>
        ),
    },
    {
        title: '10. Kontak',
        content: (
            <p>
                Untuk pertanyaan, permintaan hak, atau laporan terkait privasi,
                hubungi Tim Nelayar melalui alamat resmi yang tersedia pada
                kanal kontak Nelayar. Saat mengajukan permintaan, sertakan
                informasi yang membantu kami memverifikasi identitas Anda.
            </p>
        ),
    },
];

export default function Privacy() {
    return (
        <>
            <Head title="Kebijakan Privasi" />

            <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 md:px-10">
                        <Link href="/" className="text-2xl font-black tracking-tight">
                            Nelayar
                        </Link>
                        <Link
                            href="/"
                            className="text-sm font-semibold text-slate-600 transition hover:text-amber-500"
                        >
                            Kembali ke Beranda
                        </Link>
                    </div>
                </header>

                <main className="px-6 py-12 md:px-10 md:py-20">
                    <article className="mx-auto max-w-4xl rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-slate-200/80 md:px-14 md:py-14">
                        <div className="border-b border-slate-200 pb-8">
                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                                Nelayar
                            </p>
                            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                                Kebijakan Privasi
                            </h1>
                            <p className="mt-4 text-sm text-slate-500">
                                Terakhir diperbarui: 27 Juli 2026
                            </p>
                            <p className="mt-6 max-w-3xl leading-7 text-slate-600">
                                Kebijakan ini menjelaskan bagaimana Nelayar
                                mengumpulkan, menggunakan, menyimpan, dan
                                melindungi data pribadi Anda saat menggunakan
                                layanan kami.
                            </p>
                        </div>

                        <div className="divide-y divide-slate-200">
                            {sections.map((section) => (
                                <section key={section.title} className="space-y-3 py-8 first:pt-10 last:pb-2">
                                    <h2 className="text-xl font-bold md:text-2xl">{section.title}</h2>
                                    <div className="space-y-4 leading-7 text-slate-600">{section.content}</div>
                                </section>
                            ))}
                        </div>
                    </article>
                </main>
            </div>
        </>
    );
}
