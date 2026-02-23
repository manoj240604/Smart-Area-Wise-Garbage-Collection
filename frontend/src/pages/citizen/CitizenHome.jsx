import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const CitizenHome = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pending: 0, completed: 0 });

    useEffect(() => {
        if (user?.token) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/pickup-requests/my-requests', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                const pending = data.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length;
                const completed = data.filter(r => r.status === 'Completed').length;
                setStats({ pending, completed });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const quickActions = [
        {
            title: 'Book Pickup',
            description: 'Request garbage collection',
            icon: '🗓️',
            color: 'from-emerald-400 to-teal-500',
            bg: 'bg-emerald-50',
            path: '/citizen/schedule-pickup'
        },
        {
            title: 'My Requests',
            description: `${stats.pending} pending tasks`,
            icon: '📋',
            color: 'from-indigo-400 to-blue-500',
            bg: 'bg-indigo-50',
            path: '/citizen/my-requests'
        },
        {
            title: 'Notifications',
            description: 'Recent updates',
            icon: '🔔',
            color: 'from-amber-400 to-orange-500',
            bg: 'bg-amber-50',
            path: '/citizen/notifications'
        },
        {
            title: 'My Profile',
            description: 'View account details',
            icon: '👤',
            color: 'from-indigo-400 to-purple-500',
            bg: 'bg-purple-50',
            path: '/citizen/profile'
        }
    ];

    return (
        <div className="min-h-screen bg-mesh pb-20">
            {/* Premium Header */}
            <div className="sticky top-0 z-50 px-6 py-6 font-sans">
                <div className="max-w-6xl mx-auto glass-card rounded-[32px] px-8 py-5 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-100 animate-pulse">🍃</div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">CITIZEN <span className="text-emerald-500">HOME</span></h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Your Personal Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div onClick={() => navigate('/citizen/profile')} className="text-right hidden sm:block cursor-pointer group">
                            <p className="text-sm font-black text-gray-900 leading-none group-hover:text-emerald-500 transition">{user?.name?.toUpperCase()}</p>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Citizen Member</p>
                        </div>
                        <button
                            onClick={logout}
                            className="w-12 h-12 bg-white/50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all duration-300 border border-gray-100 hover:border-red-100 shadow-sm group"
                        >
                            <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8 font-sans">
                {/* Welcome & Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="md:col-span-2 relative overflow-hidden glass-card rounded-[48px] p-10 flex flex-col justify-center">
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black text-gray-900 mb-4 leading-tight tracking-tight">Let's keep our <br />city clean and <span className="text-emerald-500 underline decoration-indigo-200">Green.</span></h2>
                            <p className="text-gray-500 font-medium max-w-sm leading-relaxed mb-8">Report problems or book a garbage pickup easily from your phone.</p>
                            <button onClick={() => navigate('/citizen/schedule-pickup')} className="px-8 py-4 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition active:scale-95 flex items-center gap-3 w-fit text-sm">
                                Book a Pickup <span>→</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-card rounded-[40px] p-8 border-l-8 border-l-amber-400 group hover:translate-x-2 transition-transform shadow-lg shadow-amber-50">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Active Requests</p>
                            <div className="flex items-end gap-3">
                                <h3 className="text-5xl font-black text-gray-900 tracking-tighter">{stats.pending}</h3>
                                <div className="mb-2 px-3 py-1 bg-amber-100 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">Pending</div>
                            </div>
                        </div>
                        <div className="glass-card rounded-[40px] p-8 border-l-8 border-l-emerald-400 group hover:translate-x-2 transition-transform shadow-lg shadow-emerald-50">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Impact</p>
                            <div className="flex items-end gap-3">
                                <h3 className="text-5xl font-black text-gray-900 tracking-tighter">HIGH</h3>
                                <div className="mb-2 px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">Active Citizen</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-10 px-2">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.4em] italic">Quick Actions</h2>
                    <div className="h-px flex-1 mx-8 bg-linear-to-r from-transparent via-gray-200 to-transparent"></div>
                </div>

                {/* Quick Actions Interactive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {quickActions.map((action, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(action.path)}
                            className="group relative bg-white/40 hover:bg-white backdrop-blur-xl rounded-[48px] p-1 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-white/20 transform hover:-translate-y-4 overflow-hidden"
                        >
                            <div className="bg-white rounded-[44px] p-10 h-full flex flex-col">
                                <div className={`w-14 h-14 bg-linear-to-br ${action.color} rounded-[22px] flex items-center justify-center text-3xl mb-10 group-hover:scale-110 group-hover:rotate-6 transition duration-500 shadow-xl shadow-gray-100`}>
                                    {action.icon}
                                </div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tighter leading-none mb-3">{action.title}</h3>
                                <p className="text-xs text-gray-400 font-bold leading-relaxed mb-8">{action.description}</p>

                                <div className="mt-auto flex items-center gap-2">
                                    <div className="h-1 w-8 bg-gray-100 rounded-full group-hover:w-full group-hover:bg-emerald-500 transition-all duration-500"></div>
                                    <span className="opacity-0 group-hover:opacity-100 text-emerald-500 font-black transition-opacity duration-500 text-xs tracking-tighter uppercase whitespace-nowrap">ENTER</span>
                                </div>
                            </div>

                            {/* Decorative background circle */}
                            <div className={`absolute -bottom-10 -right-10 w-24 h-24 ${action.bg} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000`}></div>
                        </div>
                    ))}
                </div>

                {/* Visual Feedback Footer */}
                <div className="mt-20 glass-card rounded-[40px] p-12 bg-indigo-600 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-mesh opacity-10"></div>
                    <div className="relative z-10 text-center md:text-left mb-10 md:mb-0">
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase italic">Want to report something?</h3>
                        <p className="text-indigo-100 font-bold text-sm max-w-sm">Seen garbage dumping in your area? Report it now so our team can clean it up.</p>
                    </div>
                    <button
                        onClick={() => navigate('/citizen/report-problem')}
                        className="relative z-10 px-10 py-5 bg-white text-indigo-600 font-black uppercase tracking-widest rounded-[24px] shadow-xl hover:shadow-white/20 transition-all active:scale-95 text-sm"
                    >
                        Report Problem 🚨
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CitizenHome;
