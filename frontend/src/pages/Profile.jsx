import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Profile = () => {
    const { user, login, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        password: ''
    });

    const handleBack = () => {
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'worker') navigate('/worker');
        else navigate('/citizen');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !user.token) {
            alert('Authentication error: No session found. Please login again.');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                login(data);
                alert('Profile updated successfully!');
                setIsEditing(false);
            } else {
                console.error('Update failed:', data);
                alert(`Failed to update profile: ${data.message || res.statusText} (${res.status})`);
            }
        } catch (error) {
            console.error('Network/Server Error:', error);
            alert('Error updating profile: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-mesh pb-20">
            {/* Premium Header */}
            <div className="sticky top-0 z-50 px-6 py-6 font-sans">
                <div className="max-w-xl mx-auto glass-card rounded-[32px] px-8 py-5 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-500 rounded-xl transition-all shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 tracking-tighter uppercase leading-none">USER <span className="text-emerald-500">PROFILE</span></h1>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Manage your personal details</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 font-sans">
                <div className="glass-card rounded-[48px] shadow-2xl overflow-hidden border border-white/50 animate-fade-in relative">
                    {/* Decorative Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="p-12 flex flex-col items-center border-b border-gray-100/50 relative z-10">
                        <div className="relative group">
                            <div className="w-28 h-28 bg-linear-to-br from-indigo-600 to-indigo-800 rounded-[40px] flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl shadow-indigo-200 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                                {user?.name?.[0]}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-white rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{user?.name}</h2>
                        <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mt-4 border border-indigo-100 italic">
                            {user?.role.toUpperCase()}
                        </span>
                    </div>

                    <div className="p-12">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        className={`w-full px-8 py-5 rounded-2xl font-bold tracking-tight transition-all duration-300 ${isEditing
                                            ? 'bg-white border-2 border-indigo-100 shadow-inner'
                                            : 'bg-gray-50/50 border border-transparent text-gray-500'
                                            }`}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            disabled={true}
                                            className="w-full px-8 py-5 bg-gray-50/50 rounded-2xl border border-transparent text-gray-400 font-bold tracking-tight cursor-not-allowed italic"
                                            value={formData.email}
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase tracking-widest">LOCKED</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            disabled={!isEditing}
                                            className={`w-full px-8 py-5 rounded-2xl font-bold tracking-tight transition-all duration-300 ${isEditing
                                                ? 'bg-white border-2 border-indigo-100 shadow-inner'
                                                : 'bg-gray-50/50 border border-transparent text-gray-500'
                                                }`}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Change Password (Optional)</label>
                                        <input
                                            type="password"
                                            disabled={!isEditing}
                                            className={`w-full px-8 py-5 rounded-2xl font-bold tracking-tight transition-all duration-300 ${isEditing
                                                ? 'bg-white border-2 border-indigo-100 shadow-inner'
                                                : 'bg-gray-50/50 border border-transparent text-gray-500 italic'
                                                }`}
                                            placeholder={isEditing ? "New Password" : "••••••••"}
                                            value={formData.password || ''}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 flex flex-col gap-4">
                                {isEditing ? (
                                    <>
                                        <button
                                            type="submit"
                                            className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all duration-300 active:scale-95"
                                        >
                                            Update Profile
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="w-full py-5 bg-white text-gray-400 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] border border-gray-100 hover:bg-gray-50 transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all duration-300 active:scale-95 group"
                                        >
                                            Edit Profile <span className="ml-2 group-hover:rotate-12 transition-transform inline-block">✏️</span>
                                        </button>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={logout}
                                                className="py-5 bg-red-50 text-red-600 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all duration-500 flex items-center justify-center gap-2 group/out"
                                            >
                                                LOGOUT <span className="group-hover/out:translate-x-1 transition-transform">🚪</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                className="py-5 bg-gray-50 text-gray-400 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-50 hover:text-emerald-500 transition-all duration-500 border border-transparent hover:border-emerald-100"
                                            >
                                                Go Back
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
