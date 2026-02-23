import { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const ZoneManagement = () => {
    const { user } = useContext(AuthContext);
    const [areas, setAreas] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(null); // Area ID
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [editingArea, setEditingArea] = useState(null);
    const [newArea, setNewArea] = useState({ name: '', zone: '', latitude: '', longitude: '', priorityLevel: 'Medium' });

    useEffect(() => {
        if (user?.token) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [areasRes, workersRes] = await Promise.all([
                fetch('http://localhost:5000/api/areas', {
                    headers: { Authorization: `Bearer ${user.token}` }
                }),
                fetch('http://localhost:5000/api/workers', {
                    headers: { Authorization: `Bearer ${user.token}` }
                })
            ]);
            const areasData = await areasRes.json();
            const workersData = await workersRes.json();
            setAreas(Array.isArray(areasData) ? areasData : []);
            setWorkers(Array.isArray(workersData) ? workersData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveArea = async (e) => {
        e.preventDefault();
        const url = editingArea
            ? `http://localhost:5000/api/areas/${editingArea._id}`
            : 'http://localhost:5000/api/areas';
        const method = editingArea ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    name: newArea.name,
                    zone: newArea.zone,
                    latitude: parseFloat(newArea.latitude),
                    longitude: parseFloat(newArea.longitude),
                    priorityLevel: newArea.priorityLevel
                })
            });

            if (res.ok) {
                setShowModal(false);
                setEditingArea(null);
                setNewArea({ name: '', zone: '', latitude: '', longitude: '', priorityLevel: 'Medium' });
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteArea = async (id) => {
        if (!window.confirm('Are you sure you want to delete this area?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/areas/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openEditModal = (area) => {
        setEditingArea(area);
        setNewArea({
            name: area.name,
            zone: area.zone || '',
            latitude: area.location?.coordinates[1] || '',
            longitude: area.location?.coordinates[0] || '',
            priorityLevel: area.priorityLevel
        });
        setShowModal(true);
    };

    const handleAssignWorkers = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/areas/${showAssignModal}/workers`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ workerIds: selectedWorkers })
            });

            if (res.ok) {
                setShowAssignModal(null);
                setSelectedWorkers([]);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleWorkerSelection = (workerId) => {
        if (selectedWorkers.includes(workerId)) {
            setSelectedWorkers(selectedWorkers.filter(id => id !== workerId));
        } else if (selectedWorkers.length < 3) {
            setSelectedWorkers([...selectedWorkers, workerId]);
        }
    };

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap justify-between items-end mb-12 gap-8">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">Manage Areas</h2>
                    <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-100"></span>
                        Add or update garbage collection areas
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingArea(null);
                        setNewArea({ name: '', zone: '', latitude: '', longitude: '', priorityLevel: 'Medium' });
                        setShowModal(true);
                    }}
                    className="px-8 py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95 flex items-center gap-3 group"
                >
                    <span className="text-lg group-hover:rotate-90 transition duration-300">+</span>
                    Add New Area
                </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[56px] w-full max-w-xl p-12 shadow-[0_32px_128px_-16px_rgba(30,27,75,0.4)] border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-[80px] -mr-32 -mt-32"></div>

                        <div className="relative">
                            <h3 className="text-3xl font-black mb-2 italic tracking-tighter uppercase">{editingArea ? 'Edit Area' : 'Add Area'}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-10">Details of the garbage collection area</p>

                            <form onSubmit={handleSaveArea} className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Area Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition font-bold text-gray-900"
                                            placeholder="e.g. MG Road"
                                            value={newArea.name}
                                            onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zone</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition font-bold text-gray-900"
                                            placeholder="e.g. Zone 1"
                                            value={newArea.zone}
                                            onChange={(e) => setNewArea({ ...newArea, zone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition font-mono font-black"
                                            placeholder="19.076"
                                            value={newArea.latitude}
                                            onChange={(e) => setNewArea({ ...newArea, latitude: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition font-mono font-black"
                                            placeholder="72.877"
                                            value={newArea.longitude}
                                            onChange={(e) => setNewArea({ ...newArea, longitude: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority Level</label>
                                    <select
                                        className="w-full px-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition font-black text-gray-900 cursor-pointer appearance-none"
                                        value={newArea.priorityLevel}
                                        onChange={(e) => setNewArea({ ...newArea, priorityLevel: e.target.value })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="flex gap-6 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 active:scale-95 transition"
                                    >
                                        {editingArea ? 'Update Area' : 'Save Area'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[56px] w-full max-w-xl p-12 shadow-[0_32px_128px_-16px_rgba(30,27,75,0.4)] border border-gray-100 relative overflow-hidden">
                        <div className="relative">
                            <h3 className="text-3xl font-black mb-2 italic tracking-tighter">Assign Workers</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-10">Select up to 3 workers for this area</p>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto mb-10 pr-4 custom-scrollbar">
                                {workers.map(worker => (
                                    <div
                                        key={worker._id}
                                        onClick={() => toggleWorkerSelection(worker._id)}
                                        className={`p-5 rounded-[28px] border-2 transition-all duration-300 cursor-pointer flex justify-between items-center group/item ${selectedWorkers.includes(worker._id)
                                            ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                                            : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-indigo-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${selectedWorkers.includes(worker._id) ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-100 shadow-sm'}`}>
                                                {worker.name[0]}
                                            </div>
                                            <div className="text-sm font-black text-gray-900 tracking-tight">{worker.name}</div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${selectedWorkers.includes(worker._id) ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-gray-200 group-hover/item:border-indigo-300'}`}>
                                            {selectedWorkers.includes(worker._id) && <span className="text-white text-[10px] font-black">✓</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-6">
                                <button
                                    onClick={() => { setShowAssignModal(null); setSelectedWorkers([]); }}
                                    className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignWorkers}
                                    className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 active:scale-95 transition"
                                >
                                    Confirm Selection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-24 text-center">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="font-black text-gray-300 uppercase tracking-[0.3em] text-[10px] italic animate-pulse">Loading areas...</p>
                    </div>
                ) : areas.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-4 border-dashed border-gray-50 rounded-[56px] bg-gray-50/30">
                        <p className="font-black text-gray-300 uppercase tracking-[0.5em] text-xs italic">No areas found</p>
                    </div>
                ) : (
                    areas.map(area => (
                        <div key={area._id} className="group relative">
                            {/* Card Background Decoration */}
                            <div className={`absolute inset-0 rounded-[56px] transition-all duration-500 -z-10 opacity-5 group-hover:opacity-10 ${area.priorityLevel === 'High' ? 'bg-red-600 rotate-1 group-hover:rotate-0' :
                                area.priorityLevel === 'Medium' ? 'bg-indigo-600 -rotate-1 group-hover:rotate-0' :
                                    'bg-emerald-600 rotate-0 hover:rotate-1'
                                }`}></div>

                            <div className="bg-white p-10 rounded-[56px] shadow-2xl shadow-gray-200/50 border border-gray-100 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-indigo-100 relative overflow-hidden h-full flex flex-col">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs shadow-sm shadow-indigo-100/50 ${area.priorityLevel === 'High' ? 'bg-red-50 text-red-600' :
                                            area.priorityLevel === 'Medium' ? 'bg-indigo-50 text-indigo-600' :
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {area.priorityLevel[0]}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">{area.zone || 'GEN_Z'}</span>
                                    </div>
                                    <div className="text-xl grayscale group-hover:grayscale-0 transition duration-500">🏢</div>
                                </div>

                                <div className="flex-1">
                                    <h4 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase mb-6 group-hover:text-indigo-600 transition">{area.name}</h4>

                                    <div className="space-y-4 mb-10">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-4">
                                            <span>Priority</span>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] ${area.priorityLevel === 'High' ? 'text-red-600 bg-red-50' :
                                                area.priorityLevel === 'Medium' ? 'text-indigo-600 bg-indigo-50' :
                                                    'text-emerald-600 bg-emerald-50'
                                                }`}>
                                                {area.priorityLevel} PRIORITY
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <span>Worker Capacity</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${(area.assignedWorkers?.length || 0) >= 3 ? 'bg-indigo-600' : 'bg-gray-300'
                                                            }`}
                                                        style={{ width: `${((area.assignedWorkers?.length || 0) / 3) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-gray-900 font-mono italic tracking-tighter">{area.assignedWorkers?.length || 0} / 3</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            setShowAssignModal(area._id);
                                            setSelectedWorkers(area.assignedWorkers || []);
                                        }}
                                        className="w-full py-4.5 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 hover:text-white hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500"
                                    >
                                        Assign Workers
                                    </button>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => openEditModal(area)}
                                            className="flex-1 py-4 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:border-indigo-100 border-2 border-transparent transition-all"
                                        >
                                            Modify
                                        </button>
                                        <button
                                            onClick={() => handleDeleteArea(area._id)}
                                            className="flex-1 py-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:border-red-100 border-2 border-transparent transition-all"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-20 flex justify-center opacity-10 hover:opacity-100 transition duration-1000">
                <p className="text-[9px] font-mono tracking-[1.5em] uppercase text-gray-400">--- End of List ---</p>
            </div>
        </div>
    );
};

export default ZoneManagement;
