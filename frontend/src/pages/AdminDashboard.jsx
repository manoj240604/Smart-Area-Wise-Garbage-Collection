import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { io } from 'socket.io-client';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [areas, setAreas] = useState([]);
    const [bins, setBins] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch initial data
        const fetchData = async () => {
            try {
                const token = user.token;
                const areaRes = await fetch('http://localhost:5000/api/areas', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const areasData = await areaRes.json();
                setAreas(areasData);

                // Fetch all bins (simple implementation: fetch for each area or a generic all bins endpoint if existed)
                // For now, let's just fetch for the first area or iterate. 
                // Better approach: Add endpoint to get all bins or mock for now.
                // We'll iterate areas to get bins for visualization
                let allBins = [];
                for (const area of areasData) {
                    const binRes = await fetch(`http://localhost:5000/api/areas/${area._id}/bins`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const binsData = await binRes.json();
                    allBins = [...allBins, ...binsData];
                }
                setBins(allBins);
                setLoading(false);
            } catch (error) {
                console.error(error);
            }
        };

        if (user) fetchData();

        // Socket.io
        const socket = io('http://localhost:5000');

        socket.on('binUpdate', (updatedBin) => {
            setBins(prevBins => prevBins.map(b => b._id === updatedBin._id ? updatedBin : b));
        });

        socket.on('binAlert', (alert) => {
            setAlerts(prev => [alert, ...prev]);
            // Optional: Play sound or toast
        });

        return () => socket.disconnect();
    }, [user]);

    const getStatusColor = (status) => {
        if (status === 'Overflowing') return 'bg-red-500';
        if (status === 'Full') return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <button onClick={logout} className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-700">Logout</button>
            </div>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div className="p-4 mb-8 bg-white rounded shadow">
                    <h2 className="mb-4 text-xl font-bold text-red-600">Active Alerts</h2>
                    <ul>
                        {alerts.map((alert, idx) => (
                            <li key={idx} className="p-2 mb-2 text-red-800 bg-red-100 rounded">
                                {alert.message} ({new Date().toLocaleTimeString()})
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Overview Stats */}
            <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
                <div className="p-6 bg-white rounded shadow">
                    <h3 className="text-lg font-semibold text-gray-600">Total Areas</h3>
                    <p className="text-3xl font-bold">{areas.length}</p>
                </div>
                <div className="p-6 bg-white rounded shadow">
                    <h3 className="text-lg font-semibold text-gray-600">Total Bins</h3>
                    <p className="text-3xl font-bold">{bins.length}</p>
                </div>
                <div className="p-6 bg-white rounded shadow">
                    <h3 className="text-lg font-semibold text-gray-600">Critical Bins</h3>
                    <p className="text-3xl font-bold text-red-500">
                        {bins.filter(b => b.status === 'Overflowing' || b.status === 'Full').length}
                    </p>
                </div>
            </div>

            {/* Area-wise View */}
            <h2 className="mb-4 text-2xl font-bold text-gray-800">Area Status</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {areas.map(area => (
                    <div key={area._id} className="p-6 bg-white rounded shadow">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-xl font-semibold">{area.name}</h3>
                            <span className={`px-2 py-1 text-sm text-white rounded ${area.priorityLevel === 'High' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                {area.priorityLevel} Priority
                            </span>
                        </div>

                        <div className="space-y-4">
                            {bins.filter(b => b.areaId._id === area._id || b.areaId === area._id).map(bin => (
                                <div key={bin._id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-700">{bin.binId}</p>
                                        <div className="w-32 h-2 mt-1 bg-gray-200 rounded-full">
                                            <div
                                                className={`h-2 rounded-full ${getStatusColor(bin.status)}`}
                                                style={{ width: `${bin.garbageLevel}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`block text-sm font-bold ${bin.status === 'Normal' ? 'text-green-600' : 'text-red-500'}`}>
                                            {bin.status}
                                        </span>
                                        <span className="text-xs text-gray-500">{bin.garbageLevel}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
