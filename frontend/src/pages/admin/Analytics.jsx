import { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import AuthContext from '../../context/AuthContext';

const AdminAnalytics = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/pickup-requests/stats/dashboard', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        const socket = io('http://localhost:5000');

        socket.on('requestUpdate', () => {
            fetchStats();
        });

        socket.on('complaintUpdate', () => {
            fetchStats();
        });

        socket.on('analyticsUpdate', () => {
            fetchStats();
        });

        socket.on('newProblem', () => {
            fetchStats();
        });

        socket.on('problemUpdate', () => {
            fetchStats();
        });

        return () => {
            socket.off('requestUpdate');
            socket.off('complaintUpdate');
            socket.off('analyticsUpdate');
            socket.off('newProblem');
            socket.off('problemUpdate');
            socket.disconnect();
        };
    }, [user.token]);

    if (loading) return (
        <div className="p-20 text-center">
            <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="font-black text-gray-400 italic uppercase tracking-widest text-xs animate-pulse">Loading Analytics...</p>
        </div>
    );

    const chartBars = [
        { label: 'Mon', val: 12 },
        { label: 'Tue', val: 19 },
        { label: 'Wed', val: 15 },
        { label: 'Thu', val: 22 },
        { label: 'Fri', val: 30 },
        { label: 'Sat', val: 25 },
        { label: 'Sun', val: 10 },
    ];

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">Analytics & Reports</h2>
                    <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase tracking-widest">Area-wise Performance Analysis</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Performance Visualizer */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[48px] shadow-2xl shadow-gray-200/50 border border-gray-100 group">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Pickup Trends</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Pickups this week</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                            <span className="w-3 h-3 rounded-full bg-indigo-100"></span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between h-64 gap-4 px-2">
                        {chartBars.map((bar, i) => (
                            <div key={i} className="flex flex-col items-center gap-4 flex-1 group/bar">
                                <div className="w-full relative flex flex-col items-center justify-end h-full">
                                    <div
                                        className="w-full max-w-[32px] bg-linear-to-t from-indigo-700 to-indigo-500 rounded-xl transition-all duration-1000 ease-out group-hover/bar:from-emerald-500 group-hover/bar:to-emerald-400 group-hover/bar:scale-x-110 shadow-lg shadow-indigo-100 group-hover/bar:shadow-emerald-100 relative overflow-hidden"
                                        style={{ height: `${(bar.val / 30) * 100}%` }}
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-white/10 to-transparent"></div>
                                    </div>
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-md mb-2">
                                        {bar.val} Requests
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover/bar:text-indigo-600 transition">{bar.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tactical KPI Stack */}
                <div className="space-y-8">
                    <div className="bg-linear-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] shadow-xl shadow-indigo-200 text-white group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                        <p className="text-[10px] font-black text-indigo-100/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse"></span>
                            Pending Requests
                        </p>
                        <h4 className="text-4xl font-black italic tracking-tighter">{stats?.pendingRequests || 0}</h4>
                        <div className="mt-6 flex justify-between items-center bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                            <span className="text-[9px] font-black border-r border-white/20 pr-4">STATUS</span>
                            <span className="text-[9px] font-black text-emerald-300">NORMAL</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100 group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Completed Today</p>
                        <h4 className="text-4xl font-black text-gray-900 italic tracking-tighter">{stats?.completedToday || 0}</h4>
                        <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">Total Pickups Completed</p>
                    </div>
                </div>
            </div>

            {/* Strategic Area Intelligence */}
            <div className="bg-linear-to-br from-indigo-950 via-indigo-900 to-gray-950 rounded-[56px] p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
                {/* Visual accents */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex flex-wrap justify-between items-center mb-12 relative z-10">
                    <div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase grayscale hover:grayscale-0 transition duration-700">Area Performance</h3>
                        <p className="text-[10px] text-indigo-400 font-bold mt-2 uppercase tracking-[0.3em]">System Report</p>
                    </div>
                    <button className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 backdrop-blur-xl group flex items-center gap-3">
                        <svg className="w-4 h-4 text-indigo-400 group-hover:scale-125 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Data (CSV)
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 relative z-10">
                    {stats?.areaStats?.map((area, i) => (
                        <div key={i} className="group p-6 bg-white/5 hover:bg-white/10 rounded-[32px] border border-white/5 transition-all duration-500 flex flex-wrap items-center gap-8">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition border border-white/10">
                                📍
                            </div>
                            <div className="w-48">
                                <span className="text-sm font-black text-white group-hover:text-indigo-400 transition cursor-default uppercase tracking-tight truncate block">{area.areaInfo?.[0]?.name || 'UNKNOWN AREA'}</span>
                                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">Area Name</p>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <div className="flex justify-between mb-3 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                    <span>Request Share</span>
                                    <span>{Math.round((area.total / (stats.totalRequests || 1)) * 100)}%</span>
                                </div>
                                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-linear-to-r from-indigo-600 via-indigo-400 to-emerald-400 rounded-full transition-all duration-[1.5s] ease-in-out group-hover:shadow-[0_0_12px_rgba(129,140,248,0.5)]"
                                        style={{ width: `${(area.total / (stats.totalRequests || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 text-right px-4">
                                <div>
                                    <span className="text-2xl font-black text-white">{area.total}</span>
                                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1 font-mono">TOTAL</p>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div>
                                    <span className={`text-2xl font-black ${area.pending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{area.pending}</span>
                                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1 font-mono">PENDING</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!stats?.areaStats || stats.areaStats.length === 0) && (
                        <div className="py-20 text-center opacity-30 border-2 border-dashed border-white/10 rounded-[40px]">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">No data available for these areas</p>
                        </div>
                    )}
                </div>

                <div className="mt-12 flex justify-center opacity-20 hover:opacity-100 transition duration-1000">
                    <p className="text-[9px] font-mono tracking-[1.5em] uppercase">--- End of Report ---</p>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
