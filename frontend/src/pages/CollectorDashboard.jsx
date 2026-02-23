import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { io } from 'socket.io-client';

const CollectorDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [bins, setBins] = useState([]);

    useEffect(() => {
        const fetchBins = async () => {
            try {
                // If user has assignedArea, fetch bins for that area
                if (user.assignedArea) {
                    const res = await fetch(`http://localhost:5000/api/areas/${user.assignedArea}/bins`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    const data = await res.json();
                    setBins(data);
                }
            } catch (error) {
                console.error(error);
            }
        };

        if (user) fetchBins();

        const socket = io('http://localhost:5000');
        socket.on('binUpdate', (updatedBin) => {
            setBins(prevBins => prevBins.map(b => b._id === updatedBin._id ? updatedBin : b));
        });

        return () => socket.disconnect();
    }, [user]);

    const collectGarbage = async (binId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/bins/${binId}/collect`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                alert('Collection Recorded!');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Collector Dashboard</h1>
                <button onClick={logout} className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-700">Logout</button>
            </div>

            <h2 className="mb-4 text-xl text-gray-600">Assigned Area Tasks</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bins.map(bin => (
                    <div key={bin._id} className={`p-6 border-l-4 rounded shadow bg-white ${bin.status === 'Full' || bin.status === 'Overflowing' ? 'border-red-500' : 'border-green-500'}`}>
                        <div className="flex justify-between">
                            <h3 className="text-xl font-bold">{bin.binId}</h3>
                            <span className={`font-bold ${bin.status === 'Normal' ? 'text-green-600' : 'text-red-500'}`}>
                                {bin.status}
                            </span>
                        </div>
                        <p className="mt-2 text-gray-500">Level: {bin.garbageLevel}%</p>
                        <p className="text-xs text-gray-400">Last Collected: {bin.lastCollectedAt ? new Date(bin.lastCollectedAt).toLocaleString() : 'Never'}</p>

                        {(bin.status === 'Full' || bin.status === 'Overflowing') && (
                            <button
                                onClick={() => collectGarbage(bin._id)}
                                className="w-full py-2 mt-4 font-bold text-white bg-green-500 rounded hover:bg-green-600"
                            >
                                Mark Collected
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {bins.length === 0 && <p>No bins assigned or found.</p>}
        </div>
    );
};

export default CollectorDashboard;
