import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const WorkerTaskDetails = () => {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTask();
    }, [id]);

    const fetchTask = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/pickup-requests/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setRequest(data);
        } catch (error) {
            console.error('Error fetching task:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/pickup-requests/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchTask();
            }
        } catch (error) {
            console.error('Error updating status:', error);
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

    if (loading) return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 opacity-40">
            <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="font-black text-gray-900 uppercase tracking-[0.3em] text-[10px] italic animate-pulse">Loading task details...</p>
        </div>
    );

    if (!request) return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-10 text-center">
            <div className="text-8xl mb-8 grayscale opacity-20">🏜️</div>
            <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Task Not Found</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-4">This task is no longer available in the system</p>
            <button
                onClick={() => navigate('/worker')}
                className="mt-12 px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition"
            >
                Back to Dashboard
            </button>
        </div>
    );

    const [lng, lat] = request.location?.coordinates || [77.4971, 12.9132];
    const destinationUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 animate-in fade-in duration-700">
            {/* Tactical Header */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/worker')}
                            className="mr-6 p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition active:scale-90"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Task Details</h1>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                <span className="opacity-50 text-gray-400">Task ID: </span>
                                {request._id.slice(-6).toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-6 mt-8">
                {/* Mission Visualizer Hero */}
                <div className="w-full h-80 bg-indigo-100 rounded-[56px] relative overflow-hidden shadow-2xl shadow-indigo-100/50 mb-10 group">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear group-hover:scale-125"
                        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&q=80&w=2000')` }}
                    ></div>
                    <div className="absolute inset-0 bg-linear-to-b from-indigo-950/20 via-transparent to-indigo-950/60"></div>

                    {/* Tactical Overlays */}
                    <div className="absolute top-8 right-8 flex flex-col gap-2">
                        <span className="px-5 py-2.5 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl border border-white/20">
                            Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                        </span>
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-indigo-600 rounded-[32px] shadow-2xl flex items-center justify-center text-white text-4xl animate-bounce border-4 border-white">
                                📍
                            </div>
                            <div className="text-white">
                                <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none">{request.area?.name}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 opacity-80">{request.area?.zone} | Area Details</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Primary Mission Card */}
                    <div className="bg-white rounded-[56px] p-10 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-full blur-[60px] -mr-20 -mt-20"></div>

                        <div className="flex justify-between items-start mb-10 relative">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter leading-tight uppercase">
                                    {request.garbageType} Waste Pickup
                                </h2>
                                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    Priority Level
                                </p>
                            </div>
                            <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500 ${request.status === 'Assigned' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                request.status === 'OnTheWay' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                {request.status}
                            </span>
                        </div>

                        <div className="space-y-8 relative">
                            <div className="flex gap-6 group/field">
                                <div className="w-16 h-16 bg-gray-50 rounded-[28px] flex items-center justify-center text-3xl group-hover/field:scale-110 group-hover/field:rotate-6 transition duration-500 border border-gray-100">👤</div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Citizen Name</p>
                                    <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">{request.user?.name}</h4>
                                    <a href={`tel:${request.user?.phone}`} className="inline-flex items-center gap-2 mt-2 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition group/link">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        Phone: {request.user?.phone}
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-6 group/field">
                                <div className="w-16 h-16 bg-gray-50 rounded-[28px] flex items-center justify-center text-3xl group-hover/field:scale-110 group-hover/field:-rotate-6 transition duration-500 border border-gray-100">🌍</div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Pickup Address</p>
                                    <p className="text-lg font-bold text-gray-900 leading-tight tracking-tight uppercase italic">{request.location?.address}</p>
                                    <p className="text-[9px] font-mono font-bold text-gray-400 mt-2">Area: {request.area?.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-14 space-y-5 relative">
                            <a
                                href={destinationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-6 bg-white border-2 border-indigo-600 text-indigo-600 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-indigo-600 hover:text-white transition duration-500 transform active:scale-[0.98] shadow-2xl shadow-indigo-100/50"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
                                </svg>
                                Open in Google Maps
                            </a>

                            {request.status !== 'Completed' && request.status !== 'Cancelled' && (
                                <button
                                    onClick={() => handleUpdateStatus(getNextStatus(request.status))}
                                    className="w-full py-7 bg-linear-to-r from-emerald-600 to-emerald-700 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-[0_24px_48px_-12px_rgba(16,185,129,0.4)] flex items-center justify-center gap-4 active:scale-95 transition-all duration-500 hover:scale-[1.02] transform"
                                >
                                    Update Status: {getNextStatus(request.status)}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 opacity-20 hover:opacity-100 transition duration-1000 mt-10">
                        <p className="text-[8px] font-mono tracking-[2em] uppercase text-gray-400">--- End of Details ---</p>
                        <div className="flex gap-2">
                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WorkerTaskDetails;
