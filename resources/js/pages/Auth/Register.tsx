import { useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'nelayan' as 'nelayan' | 'pembeli',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/register');
    }

    return (
        <form onSubmit={submit}>
            <div>
                <label htmlFor="name">Nama</label>
                <input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    autoComplete="name"
                />
                {errors.name && <p>{errors.name}</p>}
            </div>

            <div>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                    autoComplete="email"
                />
                {errors.email && <p>{errors.email}</p>}
            </div>

            <div>
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                    autoComplete="new-password"
                />
                {errors.password && <p>{errors.password}</p>}
            </div>

            <div>
                <label htmlFor="role">Peran</label>
                <select
                    id="role"
                    value={data.role}
                    onChange={(e) => setData('role', e.target.value as 'nelayan' | 'pembeli')}
                >
                    <option value="nelayan">Nelayan</option>
                    <option value="pembeli">Pembeli</option>
                </select>
                {errors.role && <p>{errors.role}</p>}
            </div>

            <button type="submit" disabled={processing}>
                Daftar
            </button>
        </form>
    );
}
