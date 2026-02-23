import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';

const CitizenHome = () => {
    const { user, logout } = useContext(AuthContext);
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('');
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState('');

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/areas', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const data = await res.json();
                setAreas(data);
                if (data.length > 0) setSelectedArea(data[0]._id);
            } catch (e) {
                console.error(e);
            }
        };
        if (user) fetchAreas();
    }, [user]);

    const submitComplaint = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    description,
                    areaId: selectedArea
                })
            });
            if (res.ok) {
                setStatus('Complaint Submitted Successfully!');
                setDescription('');
            } else {
                setStatus('Failed to submit.');
            }
        } catch (e) {
            setStatus('Error occurred.');
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}</h1>
                <button onClick={logout} className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-700">Logout</button>
            </div>

            <div className="max-w-xl mx-auto bg-white rounded shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Report an Issue</h2>
                {status && <p className="mb-4 text-green-600">{status}</p>}

                <form onSubmit={submitComplaint}>
                    <div className="mb-4">
                        <label className="block mb-2 font-bold">Select Area</label>
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            {areas.map(area => (
                                <option key={area._id} value={area._id}>{area.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 font-bold">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border rounded"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                        Submit Complaint
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CitizenHome;
