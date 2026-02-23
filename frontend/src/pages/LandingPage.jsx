import { useNavigate, Link } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            title: 'Book a Pickup',
            desc: 'Select a time that works for you. We collect garbage from your doorstep.',
            icon: '⚡',
            color: 'from-indigo-400 to-blue-500',
            action: () => navigate('/citizen/schedule-pickup')
        },
        {
            title: 'Track Collection',
            desc: 'See exactly when your garbage will be collected with our live tracker.',
            icon: '🚀',
            color: 'from-amber-400 to-orange-500',
            action: () => navigate('/citizen/my-requests')
        },
        {
            title: 'Report Problems',
            desc: 'Take a photo of garbage or dumping and we will handle the rest.',
            icon: '📸',
            color: 'from-emerald-400 to-teal-500',
            action: () => navigate('/citizen/raise-complaint')
        }
    ];

    return (
        <div className="min-h-screen bg-mesh font-sans text-gray-900 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl glass-card rounded-[32px] z-50 px-8 py-4 flex items-center justify-between transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-200">🍃</div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-emerald-600 tracking-tighter leading-none">SMART GARBAGE</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Management</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-emerald-500 transition">Citizen</Link>
                    <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-emerald-500 transition">Worker</Link>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="px-6 py-2.5 text-gray-600 text-sm font-bold hover:text-emerald-600 transition">Login</Link>
                    <Link to="/register" className="px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition active:scale-95">Signup</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-48 pb-32 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full mb-8 border border-emerald-100 animate-float">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cleaning Our Streets</span>
                        </div>
                        <h2 className="text-6xl lg:text-8xl font-black leading-[0.9] mb-8 tracking-tighter text-gray-900">
                            Keeping Our City <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-500 to-indigo-600">Clean & Green.</span>
                        </h2>
                        <p className="text-xl text-gray-500 max-w-lg leading-relaxed mb-12 font-medium">
                            Join the movement for a cleaner tomorrow. Our AI-powered system makes waste collection efficient, transparent, and eco-friendly.
                        </p>
                        <div className="flex flex-wrap gap-6">
                            <button onClick={() => navigate('/register')} className="btn-premium bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200">
                                Register Now
                            </button>
                            <button onClick={() => navigate('/login')} className="px-8 py-4 bg-white/50 backdrop-blur-sm text-gray-600 font-bold rounded-2xl hover:bg-white transition border border-gray-200">
                                See How It Works
                            </button>
                        </div>
                    </div>

                    <div className="relative lg:block">
                        <div className="relative w-full aspect-square max-w-xl mx-auto">
                            {/* Abstract decorative elements */}
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl"></div>

                            <div className="relative z-10 w-full h-full rounded-[60px] overflow-hidden glass-card p-4">
                                <img
                                    src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=1000"
                                    alt="Sustainable City"
                                    className="w-full h-full object-cover rounded-[48px]"
                                />
                                <div className="absolute bottom-12 left-12 right-12 glass-card p-6 rounded-3xl animate-float">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">📈</div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Impact Factor</p>
                                                <p className="text-lg font-black text-gray-900">98.4% Efficiency</p>
                                            </div>
                                        </div>
                                        <div className="h-10 w-px bg-gray-200"></div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Missions</p>
                                            <p className="text-lg font-black text-emerald-600">1,400+</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions Grid */}
            <section className="py-32 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-24">
                        <h3 className="text-4xl font-black mb-6 tracking-tight">Our Services</h3>
                        <p className="text-gray-500 font-bold leading-relaxed">Everything you need to keep your area clean. Simple, fast, and easy to use.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="group p-1 bg-linear-to-br from-white to-gray-50 rounded-[48px] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 transform hover:-translate-y-3"
                            >
                                <div className="bg-white p-10 rounded-[44px] h-full flex flex-col items-center text-center">
                                    <div className={`w-20 h-20 bg-linear-to-br ${f.color} rounded-3xl flex items-center justify-center text-4xl mb-10 group-hover:scale-110 transition-transform shadow-xl`}>
                                        {f.icon}
                                    </div>
                                    <h4 className="text-2xl font-black mb-4 tracking-tighter">{f.title}</h4>
                                    <p className="text-gray-500 leading-relaxed font-medium mb-8">{f.desc}</p>
                                    <p className="text-xs text-emerald-600 font-black uppercase tracking-[0.2em]">Service Status</p>
                                    <div className="w-px h-8 bg-black/10 mx-6"></div>
                                    <div className="flex items-center space-x-3 text-emerald-600 font-black text-sm uppercase tracking-widest group-hover:gap-4 transition-all">
                                        Learn More <span>→</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works - Split Section */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto glass-card rounded-[60px] overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-2xl">
                    <div className="p-12 lg:p-24 flex flex-col justify-center">
                        <h3 className="text-4xl lg:text-5xl font-black mb-12 tracking-tight">How it <br /><span className="text-emerald-500">Works</span></h3>
                        <div className="space-y-12">
                            {[
                                { n: '01', t: 'Smart Submission', d: 'Point, shoot, and submit. Our AI categorizes waste types automatically.', i: '📱' },
                                { n: '02', t: 'Intelligent Routing', d: 'Optimal paths for collectors to reduce carbon footprint and time.', i: '🛣️' },
                                { n: '03', t: 'Verified Completion', d: 'Real-time updates and photographic proof of pickup for total peace of mind.', i: '🤝' }
                            ].map((s, i) => (
                                <div key={i} className="flex gap-8 group">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl font-black text-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                        {s.i}
                                    </div>
                                    <div>
                                        <h5 className="text-xl font-black mb-2 text-gray-900 tracking-tight">{s.t}</h5>
                                        <p className="text-gray-500 font-medium leading-relaxed">{s.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-emerald-50 relative min-h-[500px]">
                        <img
                            src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=1000"
                            alt="Eco Friendly"
                            className="absolute inset-0 w-full h-full object-cover grayscale opacity-20"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-5xl animate-bounce shadow-2xl">♻️</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-950 text-white pt-32 pb-12 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl">🍃</div>
                            <h4 className="text-2xl font-black tracking-tighter italic">Smart Garbage System</h4>
                        </div>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Revolutionizing urban waste management with real-time tracking.<br />
                            Empowering citizens for a cleaner, greener tomorrow.<br />
                            Efficient, data-driven solutions for a sustainable city.
                        </p>
                    </div>

                    <div className="md:col-start-4">
                        <h5 className="font-black mb-8 uppercase tracking-widest text-[10px] text-emerald-500">Contact Us</h5>
                        <p className="text-gray-400 font-bold text-sm leading-relaxed">
                            Smart BIN muncipality, Global village<br />
                            Kengeri, RR nagar<br />
                            support@smartbin.com
                        </p>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto pt-10 border-t border-gray-900 text-center text-gray-600 text-xs font-black uppercase tracking-[0.4em]">
                    © 2026 CLEAN SYSTEMS. SHAPING MODERN FUTURES.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
