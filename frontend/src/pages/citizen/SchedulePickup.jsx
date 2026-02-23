import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import LocationPicker from '../../components/LocationPicker';

const SchedulePickup = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [formData, setFormData] = useState({
        scheduledDate: '',
        timeSlot: 'Morning (6AM-10AM)',
        areaId: '',
        garbageType: 'Mixed',
        location: {
            address: '',
            coordinates: [72.8777, 19.0760]
        },
        description: '',
        image: null,
        isEmergency: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchAreas();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData(prev => ({ ...prev, scheduledDate: tomorrow.toISOString().split('T')[0] }));
    }, []);

    const fetchAreas = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/areas', {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            const data = await res.json();
            const areaList = Array.isArray(data) ? data : [];
            setAreas(areaList);
            if (areaList.length > 0) {
                setFormData(prev => ({ ...prev, areaId: areaList[0]._id }));
            }
        } catch (error) {
            console.error('Error fetching areas:', error);
            setAreas([]);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const data = new FormData();
        data.append('area', formData.areaId);
        data.append('garbageType', formData.garbageType);
        data.append('scheduledDate', formData.scheduledDate);
        data.append('timeSlot', formData.timeSlot);
        data.append('isEmergency', formData.isEmergency);
        data.append('description', formData.description || 'Pickup Request');
        data.append('location[address]', formData.location.address);
        data.append('location[coordinates]', JSON.stringify(formData.location.coordinates));

        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            const res = await fetch('http://localhost:5000/api/pickup-requests', {
                method: 'POST',
                headers: { Authorization: `Bearer ${user.token}` },
                body: data
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Pickup booked! Our team will arrive at the scheduled time.' });
                setTimeout(() => navigate('/citizen/my-requests'), 2000);
            } else {
                const errorData = await res.json();
                setMessage({ type: 'error', text: errorData.message || 'Could not book pickup. Try again.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const timeSlots = [
        'Morning (6AM-10AM)',
        'Afternoon (10AM-2PM)',
        'Evening (2PM-6PM)',
        'Night (6PM-10PM)'
    ];

    return (
        <div className="min-h-screen bg-mesh pb-20">
            {/* Premium Header */}
            <div className="sticky top-0 z-50 px-6 py-6">
                <div className="max-w-4xl mx-auto glass-card rounded-[32px] px-8 py-5 flex items-center justify-between shadow-xl">
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
                            <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">BOOK <span className="text-emerald-500">PICKUP</span></h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Request doorstep garbage collection</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6">
                <div className="glass-card rounded-[48px] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="p-10 sm:p-14 relative z-10">
                        {message.text && (
                            <div className={`mb-10 p-6 rounded-[24px] flex items-center gap-4 animate-bounce font-black text-xs uppercase tracking-widest ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                <span className="text-2xl">{message.type === 'success' ? '✅' : '🚨'}</span>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pickup Date</label>
                                    <input
                                        type="date"
                                        name="scheduledDate"
                                        value={formData.scheduledDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Time Slot</label>
                                    <select
                                        name="timeSlot"
                                        value={formData.timeSlot}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                                        required
                                    >
                                        {timeSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Your Area</label>
                                    <select
                                        name="areaId"
                                        value={formData.areaId}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                                    >
                                        <option value="">SELECT AREA (IF KNOWN)</option>
                                        {(Array.isArray(areas) ? areas : []).map(area => (
                                            <option key={area._id} value={area._id}>{area.name.toUpperCase()} ({area.zone.toUpperCase()})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Garbage Type</label>
                                    <select
                                        name="garbageType"
                                        value={formData.garbageType}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                                        required
                                    >
                                        <option value="Mixed">MIXED WASTE</option>
                                        <option value="Wet">WET WASTE (KITCHEN/FOOD)</option>
                                        <option value="Dry">DRY WASTE (RECYCLABLE)</option>
                                        <option value="E-Waste">ELECTRONIC WASTE</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pickup Location</label>
                                <div className="rounded-[32px] overflow-hidden border border-gray-100 shadow-inner">
                                    <LocationPicker
                                        onLocationSelect={(loc) => setFormData({
                                            ...formData,
                                            location: {
                                                address: loc.address,
                                                coordinates: [loc.lng, loc.lat]
                                            }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Special Instructions (Optional)</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="e.g. Near the main gate, call before arriving..."
                                    className="w-full px-8 py-6 bg-white/50 border border-transparent rounded-[32px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                                ></textarea>
                            </div>

                            <div className="pt-8 text-center">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-5 bg-linear-to-r from-emerald-500 to-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-100 hover:scale-[1.02] transition-all duration-300 active:scale-95 group overflow-hidden relative ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="relative z-10">{loading ? 'PLEASE WAIT...' : 'CONFIRM PICKUP'}</span>
                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                </button>
                                <p className="mt-4 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Our worker will come to your location at the selected time.</p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchedulePickup;
