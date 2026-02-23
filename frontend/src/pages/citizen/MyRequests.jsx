import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../../context/AuthContext';

const MyRequests = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();

        const socket = io('http://localhost:5000');

        socket.on('requestUpdate', (updatedRequest) => {
            setRequests(prevRequests => {
                // Only update if it belongs to this user
                if (updatedRequest.user?._id === user._id || updatedRequest.user === user._id) {
                    const index = prevRequests.findIndex(r => r._id === updatedRequest._id);
                    if (index !== -1) {
                        const newRequests = [...prevRequests];
                        newRequests[index] = updatedRequest;
                        return newRequests;
                    } else {
                        // New request created for this user
                        return [updatedRequest, ...prevRequests];
                    }
                }
                return prevRequests;
            });
        });

        socket.on('complaintUpdate', () => {
            // Refresh to get updated complaint statuses
            fetchRequests();
        });

        socket.on('problemUpdate', () => {
            // Refresh to get updated problem-related pickups
            fetchRequests();
        });

        return () => {
            socket.off('requestUpdate');
            socket.off('complaintUpdate');
            socket.off('problemUpdate');
            socket.disconnect();
        };
    }, [user._id]);

    const fetchRequests = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/pickup-requests/my-requests', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setRequests(data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        if (activeTab === 'pending') {
            return req.status !== 'Completed' && req.status !== 'Cancelled';
        }
        return req.status === 'Completed' || req.status === 'Cancelled';
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Requested': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'Assigned': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
            case 'Accepted': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'OnTheWay': return 'text-blue-600 bg-blue-50 border-blue-100 animate-pulse';
            case 'PickedUp': return 'text-purple-600 bg-purple-50 border-purple-100';
            case 'Completed': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
            default: return 'text-gray-400 bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-mesh pb-20">
            {/* Premium Header */}
            <div className="sticky top-0 z-50 px-6 py-6">
                <div className="max-w-xl mx-auto glass-card rounded-[32px] px-8 py-5 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/citizen')}
                            className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-500 rounded-xl transition-all shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 tracking-tighter uppercase leading-none">MY <span className="text-emerald-500">REQUESTS</span></h1>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">View your past and active requests</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6">
                {/* Tabs */}
                <div className="glass-card p-2 rounded-[28px] flex gap-2 mb-8 shadow-lg">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[20px] transition-all duration-500 ${activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]' : 'text-gray-400 hover:text-indigo-600 hover:bg-white/50'}`}
                    >
                        Active <span className="ml-1 opacity-50">({requests.filter(req => req.status !== 'Completed' && req.status !== 'Cancelled').length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[20px] transition-all duration-500 ${activeTab === 'completed' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]' : 'text-gray-400 hover:text-indigo-600 hover:bg-white/50'}`}
                    >
                        Past Requests <span className="ml-1 opacity-50">({requests.filter(req => req.status === 'Completed' || req.status === 'Cancelled').length})</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="glass-card text-center py-20 rounded-[48px] shadow-xl border border-white/50 animate-fade-in px-8">
                        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-8 animate-float">📦</div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">No Requests</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 italic">You haven't made any garbage pickup requests yet.</p>
                        {activeTab === 'pending' && (
                            <button
                                onClick={() => navigate('/citizen/schedule-pickup')}
                                className="mt-10 px-10 py-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95"
                            >
                                Book a Pickup
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in">
                        {filteredRequests.map(req => (
                            <div
                                key={req._id}
                                onClick={() => navigate(`/citizen/track/${req._id}`)}
                                className="group glass-card rounded-[40px] shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border border-white/50"
                            >
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex gap-5">
                                            <div className="w-16 h-16 bg-white rounded-[24px] shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition duration-500">
                                                {req.garbageType === 'Wet' ? '🌿' : req.garbageType === 'Dry' ? '♻️' : '🗑️'}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">{req.garbageType}</h3>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">ID: #{req._id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${getStatusStyles(req.status)}`}>
                                            {req.status === 'OnTheWay' ? 'EN ROUTE' : req.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50/30 rounded-[32px] p-6 space-y-4 mb-8 border border-white/40">
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                                            <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">📍</div>
                                            <p className="truncate flex-1 tracking-tight">{req.location?.address || req.area?.name || 'LOCATION NOT SET'}</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                                            <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">🗓️</div>
                                            <p className="tracking-tight">{new Date(req.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {req.timeSlot.split('(')[0]}</p>
                                        </div>
                                    </div>

                                    {req.assignedWorker ? (
                                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                                                    {req.assignedWorker.name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Assigned Worker</p>
                                                    <p className="text-xs font-black text-gray-900 tracking-tight">{req.assignedWorker.name.toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`tel:${req.assignedWorker.phone}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-md hover:bg-indigo-600 hover:text-white transition-all duration-500 scale-90 group-hover:scale-100"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="pt-6 border-t border-gray-100">
                                            <div className="flex items-center gap-4 text-amber-500">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center animate-pulse">🛰️</div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-widest">Finding Worker</p>
                                                    <p className="text-xs font-black italic tracking-tighter">Looking for a worker near your area...</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {req.status === 'Completed' && (
                                        <div className="pt-6 border-t border-gray-100 mt-6 animate-fade-in-up">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/citizen/raise-complaint', {
                                                        state: {
                                                            areaId: req.area?._id,
                                                            garbageType: req.garbageType,
                                                            address: req.location?.address,
                                                            pickupId: req._id,
                                                            scheduledDate: req.scheduledDate,
                                                            timeSlot: req.timeSlot,
                                                            collectorName: req.assignedWorker?.name
                                                        }
                                                    });
                                                }}
                                                className="w-full py-4 bg-red-50 text-red-600 rounded-[24px] font-black text-[9px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-100 flex items-center justify-center gap-3 group/btn"
                                            >
                                                <span className="group-hover/btn:rotate-12 transition-transform">📢</span> REPORT A PROBLEM
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyRequests;
