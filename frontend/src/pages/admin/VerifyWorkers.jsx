import { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const VerifyWorkers = () => {
    const { user } = useContext(AuthContext);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/workers/verification-candidates', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            // Filter for pending workers or show all with status
            // Plan says: list ALL drivers with status
            setWorkers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this worker?`)) return;

        try {
            const res = await fetch(`http://localhost:5000/api/auth/verify-worker/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                alert(`Worker ${status} Successfully`);
                fetchWorkers();
            } else {
                const data = await res.json();
                alert(data.message || 'Action failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-10 text-center font-black text-gray-400 animate-pulse uppercase tracking-widest">Loading Workers...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Worker Details</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Licence Info</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">DL Photo</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {workers.map(worker => (
                        <tr key={worker._id} className="hover:bg-indigo-50/30 transition duration-300 group">
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${worker.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-600' :
                                        worker.verificationStatus === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                        {worker.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900 leading-none">{worker.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{worker.email}</p>
                                        <p className="text-[10px] text-indigo-600 font-bold tracking-tighter mt-0.5">{worker.phone}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <p className="text-xs font-black text-gray-700 font-mono tracking-wider">{worker.dlNumber || 'N/A'}</p>
                            </td>
                            <td className="px-8 py-6">
                                {worker.dlPhoto ? (
                                    <a href={`http://localhost:5000${worker.dlPhoto}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                        View Photo <span className="text-lg leading-none">↗</span>
                                    </a>
                                ) : (
                                    <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest italic">No Photo</span>
                                )}
                            </td>
                            <td className="px-8 py-6">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm inline-block border ${worker.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    worker.verificationStatus === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                        'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                    {worker.verificationStatus || 'Pending'}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                {worker.verificationStatus === 'Pending' && (
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleVerify(worker._id, 'Verified')}
                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition active:scale-95"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleVerify(worker._id, 'Rejected')}
                                            className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-100 hover:bg-red-600 transition active:scale-95"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default VerifyWorkers;
