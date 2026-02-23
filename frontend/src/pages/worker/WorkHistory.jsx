import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const WorkHistory = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/workers/work-history', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setHistory(data.history || []);
        } catch (error) {
            console.error('Error fetching work history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white shadow-sm mb-8">
                <div className="max-w-xl mx-auto px-4 py-4 flex items-center">
                    <button onClick={() => navigate('/worker')} className="mr-4 text-gray-600 hover:text-gray-900 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">My Completed Tasks</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-white rounded-[40px] p-10 text-center shadow-sm border border-gray-100">
                        <div className="text-5xl mb-4">📭</div>
                        <h3 className="text-lg font-bold text-gray-900">No completed tasks</h3>
                        <p className="text-gray-500 text-sm mt-2">Your finished tasks will show up here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(task => (
                            <div key={task._id} className="bg-white rounded-[30px] p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl">
                                    ✅
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{task.garbageType} Waste</h3>
                                            <p className="text-xs text-gray-500 font-medium">{task.area?.name}</p>
                                            <div className="mt-2">
                                                {task.rating ? (
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={`text-[10px] ${i < task.rating ? 'text-amber-400' : 'text-gray-200'}`}>
                                                                ⭐
                                                            </span>
                                                        ))}
                                                        <span className="text-[9px] font-black text-gray-400 ml-1 uppercase tracking-widest">({task.rating}/5)</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Not Rated Yet</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-900">{new Date(task.completedAt).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkHistory;
