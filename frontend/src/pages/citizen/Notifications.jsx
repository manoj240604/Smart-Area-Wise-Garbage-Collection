import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../../context/AuthContext';

const Notifications = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();

        const socket = io('http://localhost:5000');

        // Join user's personal room for targeted notifications
        if (user?._id) {
            socket.emit('joinPresence', user._id, user.role);
        }

        // Listen for new notifications
        socket.on('newNotification', (newNotification) => {
            setNotifications(prevNotifications => {
                // Prevent duplicates
                if (prevNotifications.some(n => n._id === newNotification._id)) {
                    return prevNotifications;
                }
                // Add new notification to the top
                return [newNotification, ...prevNotifications];
            });
        });

        return () => {
            socket.off('newNotification');
            socket.disconnect();
        };
    }, [user._id]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'Success': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'StatusUpdate': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Warning': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Complaint': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-mesh pb-20">
            {/* Premium Header */}
            <div className="sticky top-0 z-50 px-6 py-6">
                <div className="max-w-2xl mx-auto glass-card rounded-[32px] px-8 py-5 flex items-center justify-between shadow-xl">
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
                            <h1 className="text-lg font-black text-gray-900 tracking-tighter uppercase leading-none">NOTIFI<span className="text-emerald-500">CATIONS</span></h1>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Updates on your garbage collection requests</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                        {notifications.filter(n => !n.read).length}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6">
                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="glass-card text-center py-24 rounded-[48px] shadow-2xl border border-white/50 animate-fade-in px-8">
                        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-8 animate-float">📡</div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">No New Notifications</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 italic">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {notifications.map(noti => (
                            <div
                                key={noti._id}
                                onClick={() => {
                                    markAsRead(noti._id);
                                    if (noti.relatedRequest) navigate(`/citizen/track/${noti.relatedRequest._id}`);
                                }}
                                className={`glass-card p-6 rounded-[32px] shadow-lg border transition-all duration-500 cursor-pointer group relative overflow-hidden ${noti.read ? 'bg-white/40 border-white/20 opacity-70 scale-95' : 'bg-white border-white ring-1 ring-indigo-50 hover:scale-[1.02] hover:shadow-2xl'
                                    }`}
                            >
                                {!noti.read && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                )}

                                <div className="flex gap-6 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl border shadow-sm group-hover:scale-110 group-hover:rotate-3 transition duration-500 ${getTypeStyles(noti.type)}`}>
                                        {noti.type === 'StatusUpdate' ? '🔄' :
                                            noti.type === 'Success' ? '🌿' :
                                                noti.type === 'Complaint' ? '📢' : '⚠️'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                {/* Display Order ID if related to a pickup request */}
                                                {noti.relatedRequest && (
                                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">
                                                        Order ID: #{typeof noti.relatedRequest === 'object' ? noti.relatedRequest._id?.slice(-6).toUpperCase() : noti.relatedRequest.slice(-6).toUpperCase()}
                                                    </p>
                                                )}
                                                <h4 className={`text-sm font-black tracking-tight leading-relaxed ${noti.read ? 'text-gray-500' : 'text-gray-900 group-hover:text-indigo-600'}`}>{noti.message}</h4>
                                            </div>
                                            <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">
                                                {new Date(noti.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                    </div>
                                    {!noti.read && (
                                        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-2 animate-pulse shadow-lg shadow-indigo-200"></div>
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

export default Notifications;
