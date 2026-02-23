import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../../context/AuthContext';
import AdminAnalytics from './Analytics';
import ZoneManagement from './ZoneManagement';
import WorkerManagement from './WorkerManagement';
import VerifyWorkers from './VerifyWorkers';

const ProblemsTable = ({ user, workers, onlineWorkerIds }) => {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        scheduledDate: new Date().toISOString().split('T')[0],
        timeSlot: 'Morning (6AM-10AM)',
        workerId: ''
    });

    useEffect(() => {
        fetchProblems();

        const socket = io('http://localhost:5000');

        socket.on('newProblem', (newProblem) => {
            setProblems(prev => [newProblem, ...prev]);
        });

        socket.on('problemUpdate', (updatedProblem) => {
            setProblems(prev => prev.map(p => p._id === updatedProblem._id ? updatedProblem : p));
        });

        return () => {
            socket.off('newProblem');
            socket.off('problemUpdate');
            socket.disconnect();
        };
    }, []);

    const fetchProblems = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/problems', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setProblems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/problems/${selectedProblem._id}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(scheduleData)
            });
            if (res.ok) {
                fetchProblems();
                setShowSchedule(false);
                setSelectedProblem(null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return (
        <div className="p-20 text-center">
            <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="font-black text-gray-400 italic uppercase tracking-widest text-xs animate-pulse">Loading Problems...</p>
        </div>
    );

    return (
        <div className="relative">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reporter</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Category / Area</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Description</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {problems.length === 0 ? (
                            <tr><td colSpan="5" className="px-8 py-20 text-center font-black text-gray-400 italic uppercase tracking-widest">No Reported Problems Found</td></tr>
                        ) : problems.map(prob => (
                            <tr key={prob._id} className="hover:bg-emerald-50/30 transition duration-300 group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs shadow-sm shadow-emerald-100">
                                            {prob.citizenId?.name?.[0] || 'C'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 leading-none group-hover:text-emerald-600 transition">{prob.citizenId?.name || 'Anonymous'}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 italic font-mono">{new Date(prob.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="w-fit px-3 py-1 bg-gray-100 text-[9px] font-black uppercase text-gray-500 rounded-full tracking-wider">{prob.wasteCategory}</span>
                                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{prob.areaId?.name}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6 max-w-xs">
                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-medium">{prob.description}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm inline-block border ${prob.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        prob.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                        {prob.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setSelectedProblem(prob)}
                                            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition shadow-sm"
                                            title="View Details"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        {prob.status === 'Pending' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedProblem(prob);
                                                    setShowSchedule(true);
                                                }}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition active:scale-95"
                                            >
                                                Schedule Pickup
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Problem Detailed View */}
            {selectedProblem && !showSchedule && (
                <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-50 flex items-center justify-center p-6 sm:p-4 font-sans">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
                        <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-linear-to-r from-gray-50 to-white">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Problem Details</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Field Report
                                </p>
                            </div>
                            <button onClick={() => setSelectedProblem(null)} className="p-3.5 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition shadow-inner">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Reporter Information</p>
                                    <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                                        <p className="font-black text-gray-900 text-lg">{selectedProblem.citizenId?.name}</p>
                                        <p className="text-xs text-indigo-600 font-bold mt-1.5 tracking-tighter">{selectedProblem.citizenId?.phone}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1 lowercase font-mono">{selectedProblem.citizenId?.email}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Location Context</p>
                                    <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 italic">{selectedProblem.areaId?.name}</p>
                                        <p className="text-sm font-black text-gray-900 leading-tight">{selectedProblem.location?.address || 'N/A'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest font-mono italic">Zone: {selectedProblem.areaId?.zone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-10">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Problem Description</p>
                                <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="w-fit px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-full tracking-[0.2em] shadow-lg shadow-indigo-100 italic">{selectedProblem.wasteCategory} Waste</span>
                                    </div>
                                    <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedProblem.description}</p>
                                </div>
                            </div>

                            {selectedProblem.photo && (
                                <div className="mb-10">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Photo Evidence</p>
                                    <div className="rounded-[32px] border-4 border-gray-50 p-2 bg-white shadow-xl overflow-hidden group">
                                        <img
                                            src={`http://localhost:5000${selectedProblem.photo}`}
                                            alt="Problem Evidence"
                                            className="w-full h-auto rounded-[24px] shadow-inner group-hover:scale-[1.02] transition-all duration-1000 ease-out"
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedProblem.scheduledPickupId && (
                                <div className="p-8 bg-indigo-600 rounded-[32px] border border-indigo-500 shadow-2xl flex items-center gap-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl relative z-10">🚀</div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1 italic">Action Update</p>
                                        <p className="text-lg text-white font-black italic tracking-tight">Pickup Scheduled: TASK #{selectedProblem.scheduledPickupId._id?.slice(-6).toUpperCase()}</p>
                                        <p className="text-[10px] text-indigo-100 font-bold uppercase mt-1 tracking-widest">Team Dispatched</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Pickup Modal */}
            {showSchedule && selectedProblem && (
                <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-60 flex items-center justify-center p-6 sm:p-4 font-sans">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
                        <div className="p-10 border-b border-gray-100 bg-linear-to-r from-emerald-50 to-white">
                            <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Schedule Pickup</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 font-mono italic">Create a task for the cleanup crew</p>
                        </div>
                        <form onSubmit={handleSchedule} className="p-10 space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Schedule Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={scheduleData.scheduledDate}
                                        onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                                        className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent outline-none font-black text-sm text-gray-900 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Preferred Time Slot</label>
                                    <select
                                        required
                                        value={scheduleData.timeSlot}
                                        onChange={(e) => setScheduleData({ ...scheduleData, timeSlot: e.target.value })}
                                        className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent outline-none font-black text-sm text-gray-900 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all appearance-none"
                                    >
                                        <option>Morning (6AM-10AM)</option>
                                        <option>Afternoon (10AM-2PM)</option>
                                        <option>Evening (2PM-6PM)</option>
                                        <option>Night (6PM-10PM)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Assign Task Force</label>
                                    <select
                                        value={scheduleData.workerId}
                                        onChange={(e) => setScheduleData({ ...scheduleData, workerId: e.target.value })}
                                        className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent outline-none font-black text-sm text-gray-900 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all appearance-none"
                                    >
                                        <option value="">SELECT AVAILABLE WORKER</option>
                                        {workers.filter(w => onlineWorkerIds.includes(w._id)).map(worker => (
                                            <option key={worker._id} value={worker._id}>
                                                {worker.name.toUpperCase()} ({worker.availabilityStatus || 'PENDING'})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2 ml-1 italic opacity-70">Showing Online Workers only</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSchedule(false)}
                                    className="flex-1 py-4.5 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all group overflow-hidden relative"
                                >
                                    <span className="relative z-10">Confirm Link</span>
                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ComplaintsTable = ({ user }) => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduleData, setRescheduleData] = useState({
        scheduledDate: new Date().toISOString().split('T')[0],
        timeSlot: 'Morning (6AM-10AM)'
    });

    useEffect(() => {
        fetchComplaints();

        const socket = io('http://localhost:5000');

        socket.on('complaintUpdate', (updatedComplaint) => {
            setComplaints(prevComplaints => {
                const index = prevComplaints.findIndex(c => c._id === updatedComplaint._id);
                if (index !== -1) {
                    // Update existing complaint
                    const newComplaints = [...prevComplaints];
                    newComplaints[index] = updatedComplaint;
                    return newComplaints;
                } else {
                    // Add new complaint to top
                    return [updatedComplaint, ...prevComplaints];
                }
            });
        });

        return () => {
            socket.off('complaintUpdate');
            socket.disconnect();
        };
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/complaints', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setComplaints(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resolveComplaint = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/complaints/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ status: 'Resolved' })
            });
            if (res.ok) fetchComplaints();
        } catch (error) {
            console.error(error);
        }
    };

    const handleReschedule = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/complaints/${selectedComplaint._id}/reschedule`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify(rescheduleData)
            });
            if (res.ok) {
                fetchComplaints();
                setShowReschedule(false);
                setSelectedComplaint(null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return (
        <div className="p-20 text-center">
            <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="font-black text-gray-400 italic uppercase tracking-widest text-xs animate-pulse">Loading Complaints...</p>
        </div>
    );

    return (
        <div className="relative">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Citizen Name</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Complaint Details</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pickup ID</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {complaints.length === 0 ? (
                            <tr><td colSpan="5" className="px-8 py-20 text-center font-black text-gray-400 italic uppercase tracking-widest">No Complaints Found</td></tr>
                        ) : complaints.map(c => (
                            <tr key={c._id} className="hover:bg-indigo-50/30 transition duration-300 group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-50 to-red-100 text-red-600 flex items-center justify-center font-black text-xs shadow-sm shadow-red-100">
                                            {c.citizenId?.name?.[0] || 'C'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 leading-none group-hover:text-red-600 transition">{c.citizenId?.name || 'Anonymous'}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 italic font-mono">{c.areaId?.name} // {c.areaId?.zone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 max-w-xs">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{c.garbageStatus}</p>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-medium">{c.description}</p>
                                </td>
                                <td className="px-8 py-6">
                                    {c.pickupId ? (
                                        <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 group-hover:bg-white transition">
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">ID: #{c.pickupId._id.slice(-6).toUpperCase()}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">WORKER: {c.pickupId.assignedWorker?.name || 'PENDING'}</p>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest italic font-mono px-3">GENERAL</span>
                                    )}
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm inline-block border ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        c.status === 'Rescheduled' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right font-mono">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setSelectedComplaint(c)}
                                            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-600 hover:text-white transition shadow-sm"
                                            title="View Details"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        {c.status !== 'Resolved' && c.status !== 'Rescheduled' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setSelectedComplaint(c);
                                                        setShowReschedule(true);
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95"
                                                >
                                                    Reschedule
                                                </button>
                                                <button
                                                    onClick={() => resolveComplaint(c._id)}
                                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition active:scale-95"
                                                >
                                                    Resolve
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail View Modal */}
            {selectedComplaint && !showReschedule && (
                <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-50 flex items-center justify-center p-6 sm:p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
                        <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-linear-to-r from-gray-50 to-white">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Complaint Details</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                    Complaint Report
                                </p>
                            </div>
                            <button onClick={() => setSelectedComplaint(null)} className="p-3.5 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition shadow-inner">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Citizen Details</p>
                                    <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                                        <p className="font-black text-gray-900 text-lg">{selectedComplaint.citizenId?.name}</p>
                                        <p className="text-xs text-indigo-600 font-bold mt-1.5 tracking-tighter break-all">{selectedComplaint.citizenId?.phone}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1 lowercase font-mono break-all">{selectedComplaint.citizenId?.email}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Pickup Details</p>
                                    <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Scheduled Date</p>
                                        {selectedComplaint.pickupId ? (
                                            <>
                                                <p className="text-lg font-black text-gray-900 italic leading-none">{new Date(selectedComplaint.pickupId.scheduledDate).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-widest font-mono">{selectedComplaint.pickupId.timeSlot}</p>
                                            </>
                                        ) : (
                                            <p className="text-xs text-gray-400 font-black italic mt-2 uppercase tracking-widest">No Linked Pickup</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-10">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Problem Description</p>
                                <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" /></svg>
                                    </div>
                                    <div className="flex justify-between items-start mb-6">
                                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedComplaint.garbageStatus === 'Not Picked Up' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {selectedComplaint.garbageStatus}
                                        </span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-mono">{selectedComplaint.areaId?.name}</span>
                                    </div>
                                    <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedComplaint.description}</p>
                                </div>
                            </div>

                            {selectedComplaint.imageUrl && (
                                <div className="mb-10">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Complaint Photo</p>
                                    <div className="rounded-[32px] border-4 border-gray-50 p-2 bg-white shadow-xl overflow-hidden group">
                                        <img
                                            src={`http://localhost:5000${selectedComplaint.imageUrl}`}
                                            alt="Tactical Evidence"
                                            className="w-full h-auto rounded-[24px] shadow-inner group-hover:scale-[1.02] transition-all duration-1000 ease-out"
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedComplaint.rescheduledPickupId && (
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-100">🚀</div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Success</p>
                                        <p className="text-sm text-emerald-900 font-black italic">New Pickup Booked: TASK #{selectedComplaint.rescheduledPickupId._id?.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showReschedule && selectedComplaint && (
                <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-60 flex items-center justify-center p-6 sm:p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
                        <div className="p-10 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
                            <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Reschedule Pickup</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 font-mono">Select a new date and time for pickup</p>
                        </div>
                        <form onSubmit={handleReschedule} className="p-10 space-y-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">New Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={rescheduleData.scheduledDate}
                                        onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledDate: e.target.value })}
                                        className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent outline-none font-black text-sm text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">New Time Slot</label>
                                    <select
                                        required
                                        value={rescheduleData.timeSlot}
                                        onChange={(e) => setRescheduleData({ ...rescheduleData, timeSlot: e.target.value })}
                                        className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent outline-none font-black text-sm text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all appearance-none"
                                    >
                                        <option>Morning (6AM-10AM)</option>
                                        <option>Afternoon (10AM-2PM)</option>
                                        <option>Evening (2PM-6PM)</option>
                                        <option>Night (6PM-10PM)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReschedule(false)}
                                    className="flex-1 py-4.5 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                                >
                                    Confirm Reschedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        completedToday: 0,
        areaStats: []
    });
    const [requests, setRequests] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [onlineWorkerIds, setOnlineWorkerIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '', area: '' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchDashboardData();
        }

        const socket = io('http://localhost:5000');
        if (user?._id) {
            socket.emit('joinPresence', user._id, user.role);
        }
        socket.emit('requestPresenceSync');

        socket.on('updatePresence', (onlineIds) => {
            setOnlineWorkerIds(onlineIds);
        });

        socket.on('driverStatusChanged', ({ driverId, status }) => {
            setOnlineWorkerIds(prev => {
                if (status === 'online') {
                    if (prev.includes(driverId)) return prev;
                    return [...prev, driverId];
                } else {
                    return prev.filter(id => id !== driverId);
                }
            });
        });

        socket.on('driverAvailabilityChanged', ({ driverId, availabilityStatus }) => {
            setWorkers(prevWorkers =>
                prevWorkers.map(w =>
                    w._id === driverId ? { ...w, availabilityStatus } : w
                )
            );
        });

        socket.on('requestUpdate', (updatedRequest) => {
            if (activeTab === 'dashboard') {
                // Update requests list
                setRequests(prevRequests => {
                    const index = prevRequests.findIndex(r => r._id === updatedRequest._id);
                    if (index !== -1) {
                        const newRequests = [...prevRequests];
                        newRequests[index] = updatedRequest;
                        return newRequests;
                    } else {
                        return [updatedRequest, ...prevRequests];
                    }
                });

                // Refresh stats live
                fetch('http://localhost:5000/api/pickup-requests/stats/dashboard', {
                    headers: { Authorization: `Bearer ${user.token}` }
                })
                    .then(res => res.json())
                    .then(data => setStats(data))
                    .catch(err => console.error('Error updating stats:', err));
            } else {
                // Still update counts even if not on dashboard tab
                fetch('http://localhost:5000/api/pickup-requests/stats/dashboard', {
                    headers: { Authorization: `Bearer ${user.token}` }
                })
                    .then(res => res.json())
                    .then(data => setStats(data))
                    .catch(err => console.error('Error updating stats:', err));
            }
        });

        socket.on('analyticsUpdate', () => {
            // New centralized event to refresh all counters
            fetch('http://localhost:5000/api/pickup-requests/stats/dashboard', {
                headers: { Authorization: `Bearer ${user.token}` }
            })
                .then(res => res.json())
                .then(data => setStats(data))
                .catch(err => console.error('Error updating stats:', err));
        });

        return () => {
            socket.off('updatePresence');
            socket.off('driverStatusChanged');
            socket.off('driverAvailabilityChanged');
            socket.off('requestUpdate');
            socket.off('analyticsUpdate');
            socket.disconnect();
        };
    }, [filter, activeTab, user.token]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, requestsRes, workersRes] = await Promise.all([
                fetch('http://localhost:5000/api/pickup-requests/stats/dashboard', {
                    headers: { Authorization: `Bearer ${user.token}` }
                }),
                fetch(`http://localhost:5000/api/pickup-requests?status=${filter.status}&area=${filter.area}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                }),
                fetch('http://localhost:5000/api/workers', {
                    headers: { Authorization: `Bearer ${user.token}` }
                })
            ]);

            const statsData = await statsRes.json();
            const requestsData = await requestsRes.json();
            const workersData = await workersRes.json();

            setStats(statsData || { totalRequests: 0, pendingRequests: 0, completedToday: 0, areaStats: [] });
            setRequests(Array.isArray(requestsData) ? requestsData : []);
            setWorkers(Array.isArray(workersData) ? workersData : []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignWorker = async (requestId, workerId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/pickup-requests/${requestId}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ workerId })
            });

            if (res.ok) {
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error assigning worker:', error);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics':
                return <AdminAnalytics />;
            case 'zones':
                return <ZoneManagement />;
            case 'workers':
                return <WorkerManagement onlineWorkerIds={onlineWorkerIds} />;
            case 'verify-workers':
                return <VerifyWorkers />;
            case 'complaints':
                return (
                    <div className="p-8">
                        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-8 border-b border-gray-50">
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Citizen Complaints</h3>
                                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">View & Manage Complaints</p>
                            </div>
                            <ComplaintsTable user={user} />
                        </div>
                    </div>
                );
            case 'problems':
                return (
                    <div className="p-8">
                        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-8 border-b border-gray-50">
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Reported Problems</h3>
                                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">Citizen Field Reports</p>
                            </div>
                            <ProblemsTable user={user} workers={workers} onlineWorkerIds={onlineWorkerIds} />
                        </div>
                    </div>
                );
            default:
                // Dashboard View
                return (
                    <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Stats Grid - Intelligence Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="bg-linear-to-br from-indigo-50/50 to-white rounded-[40px] p-8 shadow-sm border border-indigo-100/50 group hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-3xl group-hover:scale-110 transition duration-500 border border-indigo-50">📋</div>
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">Over All</span>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-5xl font-black text-gray-900 leading-none tracking-tighter mb-4">{stats.totalRequests}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-none flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                        Total Pickups
                                    </p>
                                </div>
                            </div>

                            <div className="bg-linear-to-br from-amber-50/50 to-white rounded-[40px] p-8 shadow-sm border border-amber-100/50 group hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-3xl group-hover:scale-110 transition duration-500 border border-amber-50">⚡</div>
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">Active Now</span>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-5xl font-black text-gray-900 leading-none tracking-tighter mb-4">{stats.pendingRequests}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-none flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                        Pending Requests
                                    </p>
                                </div>
                            </div>

                            <div className="bg-linear-to-br from-emerald-50/50 to-white rounded-[40px] p-8 shadow-sm border border-emerald-100/50 group hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-3xl group-hover:scale-110 transition duration-500 border border-emerald-50">✅</div>
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">Target Met</span>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-5xl font-black text-gray-900 leading-none tracking-tighter mb-4">{stats.completedToday}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-none flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Completed Today
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Live Feed Table - Tactical Command */}
                        <div className="bg-white rounded-[48px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative">
                            <div className="p-10 border-b border-gray-100 bg-linear-to-r from-gray-50/50 to-white flex flex-wrap justify-between items-center gap-6">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-3">
                                        Recent Pickup Requests
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                        </span>
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                                        Track all active and pending requests <span className="text-indigo-600 font-black">//</span> STREAM_ACTIVE
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative group">
                                        <select
                                            className="appearance-none pl-10 pr-12 py-4 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer shadow-sm"
                                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                        >
                                            <option value="">Filter by Status</option>
                                            <option value="Requested">Requested</option>
                                            <option value="Assigned">Assigned</option>
                                            <option value="Accepted">Accepted</option>
                                            <option value="OnTheWay">On The Way</option>
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Citizen</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Garbage Type</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Schedule</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Assigned Worker</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? (
                                            <tr><td colSpan="5" className="px-10 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                                                    <p className="font-black text-gray-400 animate-pulse uppercase tracking-[0.3em] text-xs italic">Loading requests...</p>
                                                </div>
                                            </td></tr>
                                        ) : requests.length === 0 ? (
                                            <tr><td colSpan="5" className="px-10 py-24 text-center">
                                                <p className="font-black text-gray-300 uppercase tracking-[0.4em] text-sm italic">No pickup requests found</p>
                                            </td></tr>
                                        ) : (
                                            requests.map(req => (
                                                <tr key={req._id} className="hover:bg-indigo-50/30 transition duration-300 group">
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center text-indigo-600 font-black text-xl group-hover:scale-110 group-hover:border-indigo-200 transition duration-500">
                                                                {req.user?.name?.[0] || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition">{req.user?.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 font-mono">{req.user?.phone}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-gray-100">
                                                                {req.garbageType === 'Wet' ? '🍎' : '📦'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900 uppercase italic tracking-tighter">{req.garbageType}</p>
                                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1.5 font-mono">{req.area?.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 group-hover:bg-white transition duration-300">
                                                            <p className="text-sm font-black text-gray-900 leading-none">{new Date(req.scheduledDate).toLocaleDateString()}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{req.timeSlot}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm inline-block border ${req.status === 'Requested' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            req.status === 'Assigned' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                req.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                    'bg-indigo-900 text-white border-indigo-950'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        {req.assignedWorker ? (
                                                            <div className="flex items-center gap-4 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-black text-xs shadow-md">
                                                                    {req.assignedWorker.name?.[0] || 'W'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black leading-none flex items-center gap-2">
                                                                        {req.assignedWorker.name}
                                                                        <span className={`w-2 h-2 rounded-full ${onlineWorkerIds.includes(req.assignedWorker?._id) ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} title={onlineWorkerIds.includes(req.assignedWorker?._id) ? 'Online' : 'Offline'}></span>
                                                                    </p>
                                                                    <p className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">Deployed</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="relative group/select">
                                                                <select
                                                                    className="w-full min-w-[160px] pl-5 pr-10 py-4.5 bg-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border-2 border-transparent focus:border-indigo-600 focus:bg-white hover:bg-gray-100 transition-all cursor-pointer appearance-none"
                                                                    onChange={(e) => handleAssignWorker(req._id, e.target.value)}
                                                                    defaultValue=""
                                                                >
                                                                    <option value="" disabled>Assign Worker</option>
                                                                    {workers.map(w => {
                                                                        const isOnline = onlineWorkerIds.includes(w._id);
                                                                        const isOnDuty = w.availabilityStatus === 'online';
                                                                        const canAssign = isOnline && isOnDuty;

                                                                        return (
                                                                            <option
                                                                                key={w._id}
                                                                                value={w._id}
                                                                                disabled={!canAssign}
                                                                            >
                                                                                {w.name} {!isOnDuty ? '(OFF DUTY)' : !isOnline ? '(OFFLINE)' : ''}
                                                                            </option>
                                                                        );
                                                                    })}
                                                                </select>
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within/select:text-indigo-600">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-10 bg-linear-to-r from-gray-50 to-white flex justify-center border-t border-gray-50">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] italic flex items-center gap-4">
                                    <span className="w-8 h-px bg-gray-200"></span>
                                    Live Dashboard // Auto-refresh active
                                    <span className="w-8 h-px bg-gray-200"></span>
                                </p>
                            </div>
                        </div>
                    </main>
                );
        }
    };

    return (
        <div className="h-screen bg-[#f8fafc] flex overflow-hidden">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Command Navigation */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-linear-to-b from-indigo-950 to-gray-950 shadow-2xl 
                transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                flex flex-col
            `}>
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 via-indigo-500 to-amber-500 opacity-50"></div>

                <div className="p-10 shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10 group cursor-pointer hover:bg-white/20 transition-all duration-500">
                            <span className="text-2xl group-hover:rotate-12 transition-transform">🛰️</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tighter italic">SMART<span className="text-emerald-400">BIN</span></h2>
                    </div>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.3em] ml-1 opacity-60">Garbage Management System</p>
                </div>

                <nav className="mt-6 px-6 space-y-2 flex-1 overflow-y-auto custom-scrollbar pb-32">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                        { id: 'analytics', label: 'Analytics & Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                        { id: 'zones', label: 'Manage Areas', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
                        { id: 'workers', label: 'Manage Workers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                        { id: 'verify-workers', label: 'Verify Workers', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { id: 'complaints', label: 'Complaints', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                        { id: 'problems', label: 'Problems', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                    ].map((item) => (
                        <div
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={`group p-4 rounded-2xl font-bold flex items-center gap-4 cursor-pointer transition-all duration-300 ${activeTab === item.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                : 'text-indigo-300/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${activeTab === item.id ? 'bg-white/20' : 'group-hover:bg-white/10'}`}>
                                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                            </div>
                            <span className="text-sm tracking-wide">{item.label}</span>
                            {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></div>}
                        </div>
                    ))}
                </nav>

                <div className="p-6 shrink-0">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Core Status: Optimal</span>
                        </div>
                        <p className="text-[9px] text-indigo-300 font-bold leading-relaxed opacity-60">System v4.0.2 // secure connection</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar lg:rounded-l-[48px] bg-white lg:-ml-6 relative z-10 shadow-2xl h-screen">
                <header className="px-6 lg:px-12 py-8 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 lg:hidden"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 capitalize italic tracking-tighter">
                                {activeTab === 'dashboard' ? 'Admin Dashboard' : `${activeTab.replace(/^./, c => c.toUpperCase())} Panel`}
                            </h1>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 hidden sm:flex items-center gap-2">
                                Management Dashboard <span className="text-indigo-600">//</span> 08 Feb 2026
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Notifications dot */}
                        <div className="relative group cursor-pointer">
                            <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            </div>
                        </div>

                        <div onClick={() => navigate('/admin/profile')} className="flex items-center gap-4 cursor-pointer group">
                            <div className="flex flex-col text-right">
                                <span className="font-black text-gray-900 text-sm group-hover:text-indigo-600 transition tracking-tight">{user.name}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Administrator</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 group-hover:scale-105 transition-all duration-500">
                                {user.name[0]}
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="p-3.5 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300 shadow-sm border border-gray-100"
                            title="Deactivate Session"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="px-12 pb-12">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
