import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../../context/AuthContext';

const TrackStatus = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    const statuses = [
        { label: 'Requested', desc: 'Request received', icon: '📡' },
        { label: 'Assigned', desc: 'Worker assigned to your area', icon: '👤' },
        { label: 'Accepted', desc: 'Worker accepted the request', icon: '📜' },
        { label: 'OnTheWay', desc: 'Worker is coming for pickup', icon: '🚛' },
        { label: 'PickedUp', desc: 'Waste has been collected', icon: '📦' },
        { label: 'Completed', desc: 'Thank you! Waste collected.', icon: '✅' }
    ];

    useEffect(() => {
        fetchRequestDetails();

        const socket = io('http://localhost:5000');

        socket.on('requestUpdate', (updatedRequest) => {
            if (updatedRequest._id === id) {
                setRequest(updatedRequest);
            }
        });

        return () => {
            socket.off('requestUpdate');
            socket.disconnect();
        };
    }, [id]);

    const fetchRequestDetails = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/pickup-requests/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setRequest(data);
        } catch (error) {
            console.error('Error fetching request details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRate = async (stars) => {
        try {
            const res = await fetch(`http://localhost:5000/api/pickup-requests/${id}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ rating: stars })
            });
            if (res.ok) fetchRequestDetails();
        } catch (error) {
            console.error('Error submitting rating:', error);
        }
    };

    const currentStatusIndex = statuses.findIndex(s => s.label === request?.status);

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center bg-mesh">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    if (!request) return (
        <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center bg-mesh">
            <div className="w-24 h-24 bg-white/50 rounded-[32px] flex items-center justify-center text-5xl mb-8 border border-white shadow-xl">🔍</div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Not Found</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 italic">We couldn't find the details for this pickup.</p>
            <button
                onClick={() => navigate('/citizen')}
                className="mt-10 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100"
            >
                Go Back
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-mesh pb-20">
            {/* Premium Header */}
            <div className="sticky top-0 z-50 px-6 py-6">
                <div className="max-w-xl mx-auto glass-card rounded-[32px] px-8 py-5 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/citizen/my-requests')}
                            className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-500 rounded-xl transition-all shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 tracking-tighter uppercase leading-none">TRACK <span className="text-emerald-500">PICKUP</span></h1>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Real-time updates for your pickup</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 space-y-8 animate-fade-in">
                {/* Visual Status Header */}
                <div className="glass-card rounded-[48px] p-10 shadow-2xl relative overflow-hidden transition-all duration-700">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/50 bg-white/40 ${request.status === 'Completed' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            STATUS: {request.status.toUpperCase()}
                        </span>

                        <h2 className="text-4xl font-black text-gray-900 mt-8 tracking-tighter leading-none uppercase">
                            {request.status === 'Completed' ? 'Pickup Completed' : request.status === 'OnTheWay' ? 'Worker is very close' : 'Request in progress'}
                        </h2>

                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 flex items-center gap-2">
                            <span className="w-4 h-px bg-gray-200"></span>
                            Scheduled Time: {new Date(request.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {request.timeSlot.split('(')[0]}
                        </p>
                    </div>

                    <div className="mt-10 pt-10 border-t border-white/40 flex items-center gap-6">
                        <div className="w-20 h-20 bg-white rounded-[28px] shadow-lg flex items-center justify-center text-4xl group hover:scale-110 transition duration-500">
                            {request.garbageType === 'Wet' ? '🌿' : request.garbageType === 'Dry' ? '♻️' : '🗑️'}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-none">{request.garbageType} PICKUP</h3>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-3 flex items-center gap-2 italic">
                                📍 {request.location?.address || request.area?.name || 'LOCATION SET'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rating Card */}
                {request.status === 'Completed' && !request.rating && (
                    <div className="bg-linear-to-br from-indigo-600 to-indigo-800 rounded-[48px] p-10 shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition duration-1000"></div>

                        <div className="relative z-10">
                            <h3 className="text-3xl font-black tracking-tighter uppercase leading-none mb-3 italic">Rate our Service</h3>
                            <p className="text-xs font-bold text-indigo-100/80 mb-10 tracking-tight">How was your experience with our collection team?</p>

                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRate(star)}
                                        className="w-14 h-14 bg-white/10 hover:bg-white/40 border border-white/20 rounded-[24px] flex items-center justify-center text-3xl transition-all duration-300 hover:scale-110 active:scale-90"
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mt-10">Tap a star to rate</p>
                        </div>
                    </div>
                )}

                {/* Worker Card */}
                {request.assignedWorker && (
                    <div className="glass-card rounded-[48px] p-10 shadow-xl border border-white/50 flex items-center justify-between group hover:shadow-2xl transition-all duration-500">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[32px] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black relative overflow-hidden shadow-xl shadow-indigo-100">
                                {request.assignedWorker.name[0]}
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2">Assigned Worker</p>
                                <h4 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{request.assignedWorker.name}</h4>
                                <div className="flex items-center gap-2 mt-4 text-emerald-500 font-black text-[9px] uppercase tracking-[0.2em] bg-emerald-50/50 py-1.5 px-3 rounded-full border border-emerald-100 w-fit">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Worker Verified
                                </div>
                            </div>
                        </div>
                        <a href={`tel:${request.assignedWorker.phone}`} className="w-16 h-16 bg-white text-indigo-600 rounded-[28px] flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:text-white transition-all duration-500 scale-90 group-hover:scale-100">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                            </svg>
                        </a>
                    </div>
                )}

                {/* Tracking Timeline */}
                <div className="glass-card rounded-[48px] p-14 shadow-xl border border-white/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-gray-50/50 to-transparent"></div>
                    <h3 className="text-xl font-black text-gray-900 mb-14 italic tracking-tighter uppercase relative z-10">Pickup Timeline</h3>

                    <div className="relative">
                        {/* Vertical Progress Line */}
                        <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gray-100"></div>

                        <div className="space-y-16">
                            {statuses.map((status, index) => {
                                const isCompleted = index <= currentStatusIndex;
                                const isCurrent = index === currentStatusIndex;
                                const isUpcoming = index > currentStatusIndex;

                                return (
                                    <div key={status.label} className="relative flex items-start gap-12 group">
                                        <div className={`z-10 w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-1000 border-2 ${isCompleted
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-100 scale-110'
                                            : 'bg-white border-gray-100 text-gray-200 group-hover:border-indigo-200'}`}>
                                            {isCompleted ? (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span className="text-lg grayscale">{status.icon}</span>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <h4 className={`text-lg font-black tracking-tight uppercase leading-none transition-colors duration-700 ${isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                                                {status.label}
                                            </h4>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mt-2 transition-colors duration-700 ${isCompleted ? 'text-gray-400' : 'text-gray-200'}`}>
                                                {status.desc}
                                            </p>
                                            {isCurrent && request.status !== 'Completed' && (
                                                <div className="mt-6 flex items-center gap-3 bg-indigo-50/50 py-2 px-4 rounded-full border border-indigo-100 w-fit animate-fade-in-up">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                                                    </div>
                                                    <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">LIVE STATUS</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackStatus;
