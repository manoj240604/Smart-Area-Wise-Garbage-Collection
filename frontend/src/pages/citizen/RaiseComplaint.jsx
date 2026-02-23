import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import LocationPicker from '../../components/LocationPicker';

const RaiseComplaint = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state || {};
    const descriptionRef = useRef(null);

    const [areas, setAreas] = useState([]);
    const [formData, setFormData] = useState({
        areaId: '',
        garbageType: 'Mixed',
        garbageStatus: 'Not Picked Up',
        description: '',
        location: {
            address: '',
            coordinates: [72.8777, 19.0760]
        },
        image: null
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchAreas();
        if (locationState.pickupId) {
            const template = `Pickup Details:\n- ID: #${locationState.pickupId.slice(-6).toUpperCase()}\n- Date: ${new Date(locationState.scheduledDate).toLocaleDateString()}\n- Slot: ${locationState.timeSlot}\n- Collector: ${locationState.collectorName || 'Not Assigned'}\n\nIssue: `;

            setFormData(prev => ({
                ...prev,
                areaId: locationState.areaId || prev.areaId,
                garbageType: locationState.garbageType || 'Mixed',
                description: template,
                location: {
                    ...prev.location,
                    address: locationState.address || ''
                }
            }));

            setTimeout(() => {
                if (descriptionRef.current) {
                    descriptionRef.current.focus();
                    descriptionRef.current.setSelectionRange(template.length, template.length);
                }
            }, 100);
        }
    }, [locationState.pickupId]);

    const fetchAreas = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/areas', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setAreas(data);
            if (data.length > 0 && !locationState.areaId) {
                setFormData(prev => ({ ...prev, areaId: data[0]._id }));
            }
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            data.append('areaId', formData.areaId);
            data.append('garbageType', formData.garbageType);
            data.append('description', formData.description);
            data.append('garbageStatus', formData.garbageStatus);
            if (locationState.pickupId) {
                data.append('pickupId', locationState.pickupId);
            }

            let fullDescription = `${formData.description} \n\nLocation: ${formData.location.address}`;
            if (locationState.pickupId) {
                fullDescription += `\n\nReference Pickup ID: ${locationState.pickupId}`;
            }
            data.set('description', fullDescription);

            if (image) {
                data.append('image', image);
            }

            const res = await fetch('http://localhost:5000/api/complaints', {
                method: 'POST',
                headers: { Authorization: `Bearer ${user.token}` },
                body: data
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Complaint reported! We will look into it.' });
                setTimeout(() => navigate('/citizen/my-requests'), 2000);
            } else {
                const errorData = await res.json();
                setMessage({ type: 'error', text: errorData.message || 'Could not submit. Try again.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

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
                            <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">REPORT <span className="text-emerald-500">PROBLEM</span></h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Help us keep the area clean</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6">
                <div className="glass-card rounded-[48px] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

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
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Area</label>
                                    <select
                                        name="areaId"
                                        value={formData.areaId}
                                        onChange={handleChange}
                                        className={`w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm ${locationState.areaId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        required
                                        disabled={!!locationState.areaId}
                                    >
                                        {areas.map(area => (
                                            <option key={area._id} value={area._id}>{area.name.toUpperCase()} ({area.zone.toUpperCase()})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Waste Category</label>
                                    <select
                                        name="garbageType"
                                        value={formData.garbageType}
                                        onChange={handleChange}
                                        className={`w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm ${locationState.garbageType ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        required
                                        disabled={!!locationState.garbageType}
                                    >
                                        <option value="Mixed">MIXED GARBAGE</option>
                                        <option value="Wet">WET GARBAGE (KITCHEN/FOOD)</option>
                                        <option value="Dry">DRY GARBAGE (PLASTIC/PAPER)</option>
                                        <option value="E-Waste">E-WASTE (OLD ELECTRONICS)</option>
                                        <option value="Hazardous">HAZARDOUS (MEDICAL/CHEMICAL)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50/50 p-8 rounded-[32px] border border-gray-100">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-6 text-center">Garbage Status</label>
                                <div className="grid grid-cols-2 gap-6">
                                    {[
                                        { id: 'Not Picked Up', label: 'NOT COLLECTED', icon: '❌', color: 'red' },
                                        { id: 'Picked Up', label: 'COLLECTED', icon: '✅', color: 'emerald' }
                                    ].map(status => (
                                        <label
                                            key={status.id}
                                            className={`cursor-pointer group flex flex-col items-center p-6 rounded-[24px] border-2 transition-all duration-300 ${formData.garbageStatus === status.id
                                                ? `bg-white border-${status.color}-500 shadow-xl shadow-${status.color}-50 scale-105`
                                                : 'bg-white/40 border-transparent hover:border-gray-200'}`}
                                        >
                                            <input
                                                type="radio"
                                                name="garbageStatus"
                                                value={status.id}
                                                checked={formData.garbageStatus === status.id}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <span className={`text-3xl mb-3 transition-transform duration-500 ${formData.garbageStatus === status.id ? 'scale-125' : 'group-hover:scale-110'}`}>{status.icon}</span>
                                            <span className={`text-[10px] font-black tracking-widest ${formData.garbageStatus === status.id ? `text-${status.color}-600` : 'text-gray-400'}`}>{status.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {!locationState.address && (
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Where is the garbage?</label>
                                    <div className="rounded-[32px] overflow-hidden border border-gray-100 shadow-inner group">
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
                            )}

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Details about the problem</label>
                                <textarea
                                    ref={descriptionRef}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="6"
                                    placeholder="Tell us more about the issue..."
                                    className="w-full px-8 py-6 bg-white/50 border border-transparent rounded-[32px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                                    required
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Upload Photo (Optional)</label>
                                <div className="relative group">
                                    <div className={`mt-1 flex justify-center px-10 py-12 border-4 border-dashed rounded-[40px] transition-all duration-500 ${preview ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200 hover:border-emerald-300 bg-white/40'}`}>
                                        <div className="space-y-1 text-center">
                                            {preview ? (
                                                <div className="relative inline-block animate-float">
                                                    <img src={preview} alt="Preview" className="h-48 w-auto rounded-[24px] shadow-2xl border-4 border-white" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImage(null); setPreview(null); }}
                                                        className="absolute -top-4 -right-4 bg-red-500 text-white rounded-2xl p-3 shadow-xl hover:bg-red-600 transition-all hover:scale-110"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-4xl mx-auto mb-6 group-hover:scale-110 transition duration-500">📸</div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="relative cursor-pointer bg-emerald-500 px-8 py-3 rounded-2xl font-black text-[10px] text-white uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                                                            <span>Upload Photo</span>
                                                            <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                                        </label>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">A photo helps us fix the problem faster</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-5 bg-linear-to-r from-emerald-500 to-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-100 hover:scale-[1.02] transition-all duration-300 active:scale-95 group overflow-hidden relative"
                                >
                                    <span className="relative z-10">{loading ? 'Please wait...' : 'SUBMIT COMPLAINT'}</span>
                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RaiseComplaint;
