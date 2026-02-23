import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../../context/AuthContext';

const WorkerDashboard = () => {
    const { user, updateUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ totalCompleted: 0, thisWeek: 0 });
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState(user.availabilityStatus === 'online');

    useEffect(() => {
        const syncStatus = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const profile = await res.json();
                    setAvailability(profile.availabilityStatus === 'online');
                    updateUser({ availabilityStatus: profile.availabilityStatus });
                }
            } catch (error) {
                console.error('Error syncing profile:', error);
            }
        };

        syncStatus();
        fetchWorkerData();

        const socket = io('http://localhost:5000');
        if (user?._id) {
            socket.emit('joinPresence', user._id, user.role);
        }

        socket.on('newAssignment', (newAssignment) => {
            setTasks(prevTasks => {
                if (prevTasks.some(t => t._id === newAssignment._id)) {
                    return prevTasks;
                }
                return [newAssignment, ...prevTasks];
            });
        });

        socket.on('requestUpdate', (updatedRequest) => {
            setTasks(prevTasks => {
                // Only update if it's assigned to this worker
                if (updatedRequest.assignedWorker?._id === user._id || updatedRequest.assignedWorker === user._id) {
                    const index = prevTasks.findIndex(t => t._id === updatedRequest._id);
                    if (index !== -1) {
                        const newTasks = [...prevTasks];
                        // If it's completed or cancelled, we might want to remove it from current tasks list
                        if (updatedRequest.status === 'Completed' || updatedRequest.status === 'Cancelled') {
                            return prevTasks.filter(t => t._id !== updatedRequest._id);
                        }
                        newTasks[index] = updatedRequest;
                        return newTasks;
                    } else if (updatedRequest.status !== 'Completed' && updatedRequest.status !== 'Cancelled') {
                        // If it's not in the list but should be (e.g. newly assigned)
                        return [updatedRequest, ...prevTasks];
                    }
                } else {
                    // If it was in the list but now assigned to someone else (unlikely but safe)
                    return prevTasks.filter(t => t._id !== updatedRequest._id);
                }
                return prevTasks;
            });
        });

        return () => {
            socket.off('newAssignment');
            socket.off('requestUpdate');
            socket.disconnect();
        };
    }, [user._id]);

    const fetchWorkerData = async () => {
        try {
            const [tasksRes, historyRes] = await Promise.all([
                fetch('http://localhost:5000/api/workers/my-tasks', {
                    headers: { Authorization: `Bearer ${user.token}` }
                }),
                fetch('http://localhost:5000/api/workers/work-history', {
                    headers: { Authorization: `Bearer ${user.token}` }
                })
            ]);

            const tasksData = await tasksRes.json();
            const historyData = await historyRes.json();

            setTasks(tasksData);
            setStats(historyData.stats);
        } catch (error) {
            console.error('Error fetching worker data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/pickup-requests/${taskId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchWorkerData();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const toggleAvailability = async () => {
        const nextStatus = availability ? 'offline' : 'online';
        try {
            const res = await fetch('http://localhost:5000/api/workers/availability', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ availabilityStatus: nextStatus })
            });

            if (res.ok) {
                setAvailability(!availability);
                updateUser({ availabilityStatus: nextStatus });
            }
        } catch (error) {
            console.error('Error toggling availabilityStatus:', error);
        }
    };

    const getNextStatus = (currentStatus) => {
        const flow = {
            'Assigned': 'Accepted',
            'Accepted': 'OnTheWay',
            'OnTheWay': 'PickedUp',
            'PickedUp': 'Completed'
        };
        return flow[currentStatus];
    };

    const getStatusTheme = (status) => {
        switch (status) {
            case 'Assigned': return 'from-blue-600 to-blue-700 shadow-blue-100';
            case 'Accepted': return 'from-indigo-600 to-indigo-700 shadow-indigo-100';
            case 'OnTheWay': return 'from-amber-500 to-amber-600 shadow-amber-100';
            case 'PickedUp': return 'from-emerald-600 to-emerald-700 shadow-emerald-100';
            default: return 'from-gray-600 to-gray-700 shadow-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-700">
            {/* Tactical Header */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div onClick={() => navigate('/worker/profile')} className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-105 transition-transform duration-500">
                                {user.name?.[0] || 'U'}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${availability ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 leading-none tracking-tighter group-hover:text-indigo-600 transition">{user.name}</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                <span className="opacity-50">Worker ID: </span>
                                {user._id?.slice(-4).toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/worker/notifications')}
                            className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition relative"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <button onClick={logout} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-6 mt-8">
                {/* Tactical Status Card */}
                <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 p-8 mb-10 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>

                    <div className="flex items-center justify-between mb-8 relative">
                        <div>
                            <h2 className="text-sm font-black text-gray-900 uppercase italic tracking-tighter">Duty Status</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage your availability for work</p>
                        </div>
                        <button
                            onClick={toggleAvailability}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 border-2 ${availability
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50 hover:bg-emerald-600 hover:text-white'
                                : 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-50 hover:bg-red-600 hover:text-white'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full animate-pulse ${availability ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {availability ? 'AVAILABLE' : 'OFF DUTY'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 relative">
                        <div onClick={() => navigate('/worker/history')} className="p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-indigo-100 hover:bg-white cursor-pointer transition duration-500 group/stat">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Total Completed</span>
                                <span className="text-xl group-hover/stat:scale-125 transition duration-500">🏆</span>
                            </div>
                            <h3 className="text-4xl font-black text-gray-900 italic tracking-tighter leading-none">{stats.totalCompleted}</h3>
                            <div className="mt-4 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Lifetime Work</span>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-transparent group-hover:bg-white transition duration-500">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pending Tasks</span>
                                <span className="text-xl group-hover:scale-125 transition duration-500">📡</span>
                            </div>
                            <h3 className="text-4xl font-black text-blue-600 italic tracking-tighter leading-none">{tasks.length}</h3>
                            <div className="mt-4 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Current Queue</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8 px-2">
                    <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">My Tasks</h2>
                    <div className="flex gap-1.5 items-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Status</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-30">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                        <p className="font-black text-gray-900 uppercase tracking-[0.3em] text-[10px] italic animate-pulse">Syncing Tactical Grid...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-white rounded-[48px] p-20 text-center shadow-2xl shadow-gray-200/50 border border-gray-100 group">
                        <div className="w-24 h-24 bg-gray-50 rounded-full mx-auto mb-8 flex items-center justify-center text-5xl group-hover:scale-110 group-hover:rotate-12 transition duration-700">🏠</div>
                        <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">No tasks assigned</h3>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-4">Standby for new pickups in your area</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {tasks.map((task, idx) => (
                            <div
                                key={task._id}
                                onClick={() => navigate(`/worker/task/${task._id}`)}
                                className="bg-white rounded-[48px] shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100 cursor-pointer group active:scale-[0.98] transition-all duration-300 relative"
                            >
                                <div className="p-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-20 h-20 bg-linear-to-br from-indigo-50 to-white rounded-3xl border-2 border-indigo-100 shadow-sm flex items-center justify-center text-4xl group-hover:scale-110 group-hover:-rotate-3 transition duration-500">
                                                {task.garbageType === 'Wet' ? '🍎' : '📦'}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">{task.garbageType} WASTE</h3>
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                    {task.area?.name} SECTOR
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <span className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500 ${task.status === 'Assigned' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                task.status === 'OnTheWay' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {task.status}
                                            </span>
                                            <p className="text-[8px] font-mono font-black text-gray-300 tracking-widest">ID_{task._id.slice(-6).toUpperCase()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/80 rounded-[32px] p-6 border border-gray-100 group-hover:bg-white group-hover:border-indigo-100 transition duration-500 relative mb-10">
                                        <div className="space-y-5">
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition duration-500">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Target Origin</p>
                                                    <p className="text-sm text-gray-900 font-bold leading-relaxed tracking-tight">{task.location?.address}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition duration-500">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Requester Info</p>
                                                    <p className="text-xs font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-2">
                                                        {task.user?.name}
                                                        <a href={`tel:${task.user?.phone}`} onClick={(e) => e.stopPropagation()} className="text-indigo-600 font-mono text-[10px] ml-2 opacity-80 hover:opacity-100 hover:underline flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md transition-all">
                                                            <span>📞</span> {task.user?.phone || 'N/A'}
                                                        </a>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateStatus(task._id, getNextStatus(task.status));
                                            }}
                                            className={`w-full py-6 rounded-[28px] text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all duration-500 active:scale-95 bg-linear-to-r ${getStatusTheme(task.status)} group-hover:scale-[1.02] transform`}
                                        >
                                            Next Stage: {getNextStatus(task.status)}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <div className="mt-20 flex flex-col items-center gap-4 opacity-20 hover:opacity-100 transition duration-1000">
                <p className="text-[8px] font-mono tracking-[2em] uppercase text-gray-400">--- End of Feed ---</p>
                <div className="flex gap-2">
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                </div>
            </div>
        </div>
    );
};

export default WorkerDashboard;
