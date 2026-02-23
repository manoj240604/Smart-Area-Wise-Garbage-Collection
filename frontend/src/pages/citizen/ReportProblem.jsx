import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import LocationPicker from '../../components/LocationPicker';

const ReportProblem = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [areas, setAreas] = useState([]);
    const [formData, setFormData] = useState({
        areaId: '',
        wasteCategory: 'Mixed',
        description: '',
        location: {
            address: '',
            coordinates: [72.8777, 19.0760]
        },
        photo: null
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/areas', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setAreas(Array.isArray(data) ? data : []);
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, areaId: data[0]._id }));
            }
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, photo: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Location must be pinpointed
        if (!formData.location.address || formData.location.address === '' || formData.location.address === 'Address not found') {
            setMessage({ type: 'error', text: 'Please pinpoint a valid location on the map first.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            data.append('areaId', formData.areaId);
            data.append('wasteCategory', formData.wasteCategory);
            data.append('description', formData.description);
            data.append('location[address]', formData.location.address);
            data.append('location[coordinates]', JSON.stringify(formData.location.coordinates));
            if (formData.photo) {
                data.append('photo', formData.photo);
            }

            const res = await fetch('http://localhost:5000/api/problems', {
                method: 'POST',
                headers: { Authorization: `Bearer ${user.token}` },
                body: data
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Problem reported successfully! Our team will look into it.' });
                setTimeout(() => navigate('/citizen/my-requests'), 2000);
            } else {
                const errorData = await res.json();
                setMessage({ type: 'error', text: errorData.message || 'Error submitting report.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection error. Try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh pb-20">
            {/* Header */}
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
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Found uncollected waste? Let us know.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6">
                <div className="glass-card rounded-[48px] overflow-hidden shadow-2xl relative">
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
                                        className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                                        required
                                    >
                                        {areas.map(area => (
                                            <option key={area._id} value={area._id}>{area.name.toUpperCase()} ({area.zone.toUpperCase()})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Waste Category</label>
                                    <select
                                        name="wasteCategory"
                                        value={formData.wasteCategory}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-white/50 border border-transparent rounded-[20px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                                        required
                                    >
                                        <option value="Mixed">MIXED WASTE</option>
                                        <option value="Wet">WET WASTE (KITCHEN)</option>
                                        <option value="Dry">DRY WASTE (RECYCLABLE)</option>
                                        <option value="E-Waste">ELECTRONIC WASTE</option>
                                        <option value="Hazardous">HAZARDOUS WASTE</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pinpoint Location</label>
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
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Describe the Issue</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Explain the situation briefly..."
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
                                                        onClick={() => { setFormData({ ...formData, photo: null }); setPreview(null); }}
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
                                                            <input type="file" className="sr-only" onChange={handlePhotoChange} accept="image/*" />
                                                        </label>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">A photo helps us identify the issue</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 text-center text-gray-400">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-5 bg-linear-to-r from-emerald-500 to-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-100 hover:scale-[1.02] transition-all duration-300 active:scale-95 group overflow-hidden relative ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="relative z-10">{loading ? 'PLEASE WAIT...' : 'SUBMIT PROBLEM'}</span>
                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                </button>
                                <p className="mt-6 text-[10px] font-black uppercase tracking-widest italic font-mono">Problems reported here are prioritized for cleanup</p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportProblem;
