import { useForm, Link } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <div style={{ padding: '40px', maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            <h2 style={{ color: 'black', textAlign: 'center', marginBottom: '20px' }}>Masuk untuk Debugging</h2>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ color: 'black', fontWeight: 'bold' }}>Email</label><br />
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        style={{ color: 'black', backgroundColor: '#f3f4f6', border: '1px solid #9ca3af', padding: '10px', width: '100%', borderRadius: '6px' }}
                    />
                    {errors.email && <p style={{ color: 'red', marginTop: '5px' }}>{errors.email}</p>}
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
                    {errors.password && <p style={{ color: 'red', marginTop: '5px' }}>{errors.password}</p>}
                </div>

                <button type="submit" disabled={processing} style={{ padding: '12px', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold', border: 'none', marginTop: '10px' }}>
                    {processing ? 'Loading...' : 'Login'}
                </button>
            </form>
            <p style={{ marginTop: '20px', color: 'black', textAlign: 'center' }}>
                Belum punya akun? <Link href="/register" style={{ color: '#2563eb', fontWeight: 'bold' }}>Register</Link>
            </p>
        </div>
    );
}