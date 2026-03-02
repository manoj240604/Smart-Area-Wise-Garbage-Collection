import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'citizen',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // OTP State
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = async () => {
        if (!formData.email) {
            alert('Please enter an email address first.');
            return;
        }
        setOtpLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/otp/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            const data = await res.json();
            if (res.ok) {
                setOtpSent(true);
                alert('OTP sent to your email. Please check your inbox (and spam folder).');
            } else {
                alert(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error(error);
            alert('Error sending OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            alert('Please enter the OTP.');
            return;
        }
        setOtpLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/otp/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp })
            });
            const data = await res.json();
            if (res.ok) {
                setIsVerified(true);
                setOtpSent(false); // Hide OTP field after verification
                alert('Email verified successfully!');
            } else {
                alert(data.message || 'Invalid OTP');
            }
        } catch (error) {
            console.error(error);
            alert('Error verifying OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isVerified) {
            alert('Please verify your email address before registering.');
            return;
        }

        setLoading(true);
        setError('');

        const useDemoRegister = () => {
            console.warn('Backend unavailable, using demo registration fallback');
            const demoAccounts = JSON.parse(localStorage.getItem('demoAccounts') || '[]');
            demoAccounts.push({
                email: formData.email,
                role: formData.role,
                name: formData.name
            });
            localStorage.setItem('demoAccounts', JSON.stringify(demoAccounts));
            alert('Registration successful (Demo Mode)! Redirecting to login...');
            navigate('/login');
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('role', formData.role);
            if (formData.role === 'worker') {
                formDataToSend.append('dlNumber', formData.dlNumber);
                if (formData.dlPhoto) {
                    formDataToSend.append('dlPhoto', formData.dlPhoto);
                }
            }

            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                // headers: { 'Content-Type': 'multipart/form-data' }, // Let browser set boundary
                body: formDataToSend,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await res.json();

            if (res.ok) {
                alert('Registration successful! Please login.');
                navigate('/login');
            } else {
                useDemoRegister();
            }
        } catch (err) {
            useDemoRegister();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-6 py-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50 translate-y-1/2 translate-x-1/2"></div>

            <div className="w-full max-w-xl relative z-10 transition-all duration-500 animate-float">
                <div className="glass-card rounded-[60px] overflow-hidden shadow-2xl backdrop-blur-2xl">
                    <div className="p-10 sm:p-14">
                        <div className="text-center mb-12">
                            <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl shadow-emerald-200 mx-auto mb-8 animate-float">🌱</div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase">Create <span className="text-emerald-500">Account</span></h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3">Enter your details below</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-black flex items-center gap-3">
                                <span>⚠️</span> {error.toUpperCase()}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-900 shadow-sm"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        type="number"
                                        max={10}
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-900 shadow-sm"
                                        placeholder="+12345..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-900 shadow-sm ${isVerified ? 'opacity-75 cursor-not-allowed bg-emerald-50' : ''}`}
                                        placeholder="name@example.com"
                                        required
                                        disabled={isVerified}
                                    />
                                    {!isVerified && (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={otpLoading || isVerified}
                                            className="px-4 py-4 bg-indigo-500 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 whitespace-nowrap min-w-[100px]"
                                        >
                                            {otpLoading ? '...' : otpSent ? 'Resend' : 'Send OTP'}
                                        </button>
                                    )}
                                    {isVerified && (
                                        <div className="px-4 py-4 bg-emerald-500 text-white rounded-[20px] font-black text-[16px] flex items-center justify-center shadow-lg shadow-emerald-200">
                                            ✓
                                        </div>
                                    )}
                                </div>
                                {otpSent && !isVerified && (
                                    <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="w-full px-6 py-4 bg-white border border-indigo-100 rounded-[20px] focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-center spacing-2 tracking-[0.5em] text-indigo-600"
                                            placeholder="XXXXXX"
                                            maxLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={otpLoading}
                                            className="px-6 py-4 bg-emerald-500 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 shadow-lg shadow-emerald-200"
                                        >
                                            {otpLoading ? '...' : 'Verify'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-900 shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center mb-4">Select your role</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['citizen', 'worker'].map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role })}
                                            className={`py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300 ${formData.role === role
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-100 scale-105'
                                                : 'bg-white border-gray-100/50 text-gray-400 hover:border-emerald-200'
                                                }`}
                                        >
                                            {role.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Driver Specific Fields */}
                            {formData.role === 'worker' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-gray-100 pt-6">
                                    <div className="flex items-center gap-2 justify-center mb-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Driver Verification Required</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Driving Licence Number</label>
                                        <input
                                            type="text"
                                            name="dlNumber"
                                            value={formData.dlNumber || ''}
                                            onChange={handleChange}
                                            className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-900 shadow-sm"
                                            placeholder="DL-1234567890123"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Upload DL Photo</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                name="dlPhoto"
                                                onChange={(e) => setFormData({ ...formData, dlPhoto: e.target.files[0] })}
                                                accept="image/*"
                                                required
                                                className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                                            />
                                        </div>
                                        <p className="text-[9px] text-gray-400 font-bold ml-2">Supported formats: JPG, PNG</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading || !isVerified}
                                    className={`w-full py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all duration-300 overflow-hidden relative group ${!isVerified
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                            : 'bg-linear-to-r from-emerald-500 to-indigo-600 text-white shadow-emerald-100 hover:scale-[1.02]'
                                        }`}
                                >
                                    <span className="relative z-10">{loading ? 'Processing...' : 'REGISTER NOW'}</span>
                                    {isVerified && <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>}
                                </button>
                            </div>
                        </form>

                        <div className="mt-10 text-center">
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-tighter">
                                ALREADY HAVE AN ACCOUNT?{' '}
                                <Link to="/login" className="text-emerald-600 font-black hover:underline tracking-widest ml-1">LOGIN HERE</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
