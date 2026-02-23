import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const WorkerManagement = ({ onlineWorkerIds = [] }) => {
    const { user } = useContext(AuthContext);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'rating'

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/workers', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            // Filter to show ONLY verified workers in this management view
            const verifiedWorkers = Array.isArray(data) ? data.filter(w => w.isVerified) : [];
            setWorkers(verifiedWorkers);
        } catch (error) {
            console.error('Error fetching workers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredWorkers = workers
        .filter(w =>
            w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.assignedArea?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'rating') {
                return (b.averageRating || 0) - (a.averageRating || 0);
            }
            return a.name.localeCompare(b.name);
        });

    return (
        <main className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12 flex flex-wrap justify-between items-end gap-6 text-white/90">
                <div className="text-gray-900">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">Manage Workers</h2>
                    <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                        Monitor and manage all field workers
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-1 max-w-2xl">
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            placeholder="Search by worker..."
                            className="w-full pl-14 pr-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white border border-gray-100 rounded-2xl px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-indigo-600 shadow-sm appearance-none cursor-pointer hover:bg-gray-50 transition-all min-w-[160px]"
                    >
                        <option value="name">Sort: Name</option>
                        <option value="rating">Sort: Rating</option>
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-24 text-center">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="font-black text-gray-300 uppercase tracking-[0.3em] text-[10px] italic animate-pulse">Loading worker data...</p>
                    </div>
                ) : filteredWorkers.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-4 border-dashed border-gray-50 rounded-[56px] bg-gray-50/30">
                        <p className="font-black text-gray-300 uppercase tracking-[0.5em] text-xs italic">No workers found matching your search</p>
                    </div>
                ) : (
                    filteredWorkers.map(worker => (
                        <div key={worker._id} className="group relative">
                            {/* Card Background Decoration */}
                            <div className="absolute inset-0 bg-linear-to-br from-indigo-600 to-indigo-800 rounded-[56px] rotate-1 group-hover:rotate-0 transition-transform duration-500 -z-10 opacity-5 group-hover:opacity-10"></div>

                            <div className="bg-white p-10 rounded-[56px] shadow-2xl shadow-gray-200/50 border border-gray-100 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-indigo-100 relative overflow-hidden h-full flex flex-col">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-linear-to-br from-indigo-50 to-white rounded-2xl border-2 border-indigo-100 shadow-sm flex items-center justify-center text-indigo-600 font-black text-2xl group-hover:scale-110 group-hover:rotate-3 transition duration-500">
                                            {worker.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 group-hover:text-indigo-600 transition tracking-tighter text-lg flex items-center gap-3">
                                                {worker.name}
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${onlineWorkerIds.includes(worker._id) ? 'bg-emerald-500 text-white animate-pulse' : 'bg-red-500 text-white opacity-50'}`}>
                                                    {onlineWorkerIds.includes(worker._id) ? 'Online' : 'Offline'}
                                                </span>
                                            </h3>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1.5 font-mono">{worker.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all duration-500 ${worker.availabilityStatus === 'online'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white shadow-sm shadow-emerald-50'
                                        : 'bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-gray-400 group-hover:text-white shadow-sm'
                                        }`}>
                                        {worker.availabilityStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
                                    </span>
                                </div>

                                <div className="space-y-5 flex-1">
                                    <div className="bg-gray-50/80 rounded-3xl p-5 border border-gray-100 group-hover:bg-white group-hover:border-indigo-100 transition duration-300">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Assigned Area</span>
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-200"></span>
                                            </div>
                                        </div>
                                        <p className="text-base font-black text-gray-900 uppercase italic tracking-tighter">
                                            {worker.assignedArea?.name || 'NOT ASSIGNED'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-2xl border transition duration-300 ${worker.averageRating >= 4.5 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50/50 border-gray-50'}`}>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Rating</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-black text-gray-900 italic">{worker.averageRating ? worker.averageRating.toFixed(1) : '0.0'}</span>
                                                <span className="text-[10px]">⭐</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50 group-hover:bg-white group-hover:border-indigo-50 transition duration-300">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Total Rated</p>
                                            <p className="text-[10px] font-black text-gray-700 font-mono tracking-tighter">{worker.totalRatings || 0} Pickups</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-gray-50 flex justify-between items-center group/footer">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[8px] font-black text-indigo-400 group-hover/footer:translate-x-1 transition duration-500">
                                                {i}
                                            </div>
                                        ))}
                                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[8px] font-black text-gray-300">
                                            +
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-800 transition flex items-center gap-2 group/btn">
                                        View Tasks
                                        <span className="group-hover/btn:translate-x-1 transition duration-300">→</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-20 flex justify-center opacity-20 hover:opacity-100 transition duration-1000">
                <p className="text-[9px] font-mono tracking-[1.5em] uppercase text-gray-400">--- End of List ---</p>
            </div>
        </main>
    );
};

export default WorkerManagement;
