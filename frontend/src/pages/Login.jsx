import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'worker') navigate('/worker');
            else navigate('/citizen');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const useDemoLogin = (email) => {
            console.warn('Backend unavailable, using demo login fallback');
            const demoAccounts = JSON.parse(localStorage.getItem('demoAccounts') || '[]');
            const savedAccount = demoAccounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());
            let role = savedAccount ? savedAccount.role : 'citizen';
            if (!savedAccount) {
                if (email.toLowerCase().includes('admin')) role = 'admin';
                else if (email.toLowerCase().includes('worker') || email.toLowerCase().includes('collector')) role = 'worker';
            }
            const demoUser = {
                _id: 'demo-' + Date.now(),
                name: (savedAccount ? savedAccount.name : role.charAt(0).toUpperCase() + role.slice(1)) + ' User',
                email: email || 'demo@example.com',
                role: role,
                token: 'demo-token'
            };
            login(demoUser);
            if (role === 'admin') navigate('/admin');
            else if (role === 'worker') navigate('/worker');
            else navigate('/citizen');
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                login(data);
                if (data.role === 'admin') navigate('/admin');
                else if (data.role === 'worker') navigate('/worker');
                else navigate('/citizen');
            } else {
                if (res.status === 401 || res.status === 400 || res.status === 403) {
                    const msg = await res.text();
                    // Try to parse JSON if message is JSON
                    try {
                        const jsonMsg = JSON.parse(msg);
                        setError(jsonMsg.message || msg);
                    } catch (e) {
                        setError(msg || 'Invalid credentials');
                    }
                } else {
                    setError('Server error: ' + res.status);
                }
            }
        } catch (err) {
            console.warn('Network error or timeout, attempting demo fallback:', err);
            useDemoLogin(formData.email);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

            <div className="w-full max-w-[440px] relative z-10 transition-all duration-500 animate-float">
                <div className="glass-card rounded-[48px] overflow-hidden shadow-2xl backdrop-blur-2xl">
                    <div className="p-10 sm:p-14">
                        <div className="text-center mb-12">
                            <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl shadow-emerald-200 mx-auto mb-8 animate-float">🍃</div>
                            <h1 className="text-4xl font-black text-emerald-600 tracking-tighter leading-none">LOGIN</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3">Worker & Citizen Login</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-black flex items-center gap-3 animate-pulse">
                                <span className="text-lg">⚠️</span> {error.toUpperCase()}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email ID</label>
                                <input
                                    type="text"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-8 py-5 bg-white/50 border border-transparent rounded-[24px] focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-900 shadow-sm"
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-8 py-5 bg-white/50 border border-transparent rounded-[24px] focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-900 shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-linear-to-r from-emerald-500 to-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-100 hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative"
                            >
                                <span className="relative z-10">{loading ? 'Logging in...' : 'LOGIN NOW'}</span>
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                            </button>
                        </form>
                    </div>

                    <div className="bg-gray-50/50 p-8 text-center border-t border-gray-100/50 backdrop-blur-md">
                        <p className="text-gray-400 font-bold text-xs">
                            NEW USER?{' '}
                            <Link to="/register" className="text-emerald-600 font-black hover:underline tracking-tighter ml-1">REGISTER NOW</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
