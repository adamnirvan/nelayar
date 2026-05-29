import { useForm, Link } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '', 
        role: 'nelayan' as 'nelayan' | 'pembeli',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/register');
    }

    return (
        <div style={{ padding: '40px', maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            {/* --- ALAT X-RAY DEBUGGING --- */}
            {Object.keys(errors).length > 0 && (
                <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', padding: '10px', marginBottom: '20px', borderRadius: '6px' }}>
                    <h4 style={{ color: '#b91c1c', margin: '0 0 5px 0', fontWeight: 'bold' }}>Sistem Menolak Datamu! Alasan:</h4>
                    <pre style={{ color: '#7f1d1d', fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(errors, null, 2)}
                    </pre>
                </div>
            )}
            {/* ---------------------------- */}
            
            <h2 style={{ color: 'black', textAlign: 'center', marginBottom: '20px' }}>Register untuk Debugging</h2>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ color: 'black', fontWeight: 'bold' }}>Nama</label><br />
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        style={{ color: 'black', backgroundColor: '#f3f4f6', border: '1px solid #9ca3af', padding: '10px', width: '100%', borderRadius: '6px' }}
                    />
                </div>

                <div>
                    <label style={{ color: 'black', fontWeight: 'bold' }}>Email</label><br />
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        style={{ color: 'black', backgroundColor: '#f3f4f6', border: '1px solid #9ca3af', padding: '10px', width: '100%', borderRadius: '6px' }}
                    />
                </div>

                <div>
                    <label style={{ color: 'black', fontWeight: 'bold' }}>Password</label><br />
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        required
                        style={{ color: 'black', backgroundColor: '#f3f4f6', border: '1px solid #9ca3af', padding: '10px', width: '100%', borderRadius: '6px' }}
                    />
                </div>

                <div>
                    <label style={{ color: 'black', fontWeight: 'bold' }}>Konfirmasi Password</label><br />
                    <input
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                        style={{ color: 'black', backgroundColor: '#f3f4f6', border: '1px solid #9ca3af', padding: '10px', width: '100%', borderRadius: '6px' }}
                    />
                </div>

                <div>
                    <label style={{ color: 'black', fontWeight: 'bold' }}>Role</label><br />
                    <select
                        value={data.role}
                        onChange={(e) => setData('role', e.target.value as 'nelayan' | 'pembeli')}
                        style={{ color: 'black', backgroundColor: '#f3f4f6', border: '1px solid #9ca3af', padding: '10px', width: '100%', borderRadius: '6px' }}
                    >
                        <option value="nelayan">Nelayan</option>
                        <option value="pembeli">Pembeli</option>
                    </select>
                </div>

                <button type="submit" disabled={processing} style={{ padding: '12px', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold', border: 'none', marginTop: '10px' }}>
                    {processing ? 'Loading...' : 'Register'}
                </button>
            </form>
            <p style={{ marginTop: '20px', color: 'black', textAlign: 'center' }}>
                Sudah punya akun? <Link href="/login" style={{ color: '#2563eb', fontWeight: 'bold' }}>Login</Link>
            </p>
        </div>
    );
}