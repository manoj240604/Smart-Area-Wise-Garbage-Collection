import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issues in React-Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationPicker = ({ onLocationSelect, initialPosition = [19.0760, 72.8777] }) => {
    const [position, setPosition] = useState(initialPosition);
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    // Update map view when initialPosition changes
    function ChangeView({ center }) {
        const map = useMap();
        useEffect(() => {
            map.setView(center);
        }, [center, map]);
        return null;
    }

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                handlePositionChange([lat, lng]);
            },
        });
        return null;
    };

    const handlePositionChange = async (newPos) => {
        setPosition(newPos);
        setLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos[0]}&lon=${newPos[1]}&zoom=18&addressdetails=1`);
            const data = await response.json();
            const formattedAddress = data.display_name || 'Address not found';
            setAddress(formattedAddress);
            onLocationSelect({
                lat: newPos[0],
                lng: newPos[1],
                address: formattedAddress
            });
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            setAddress('Error fetching address');
        } finally {
            setLoading(false);
        }
    };

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                handlePositionChange([pos.coords.latitude, pos.coords.longitude]);
            });
        }
    };

    useEffect(() => {
        // Run once for initial position address
        handlePositionChange(initialPosition);
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-gray-700">Pick Location on Map</label>
                <button
                    type="button"
                    onClick={handleLocateMe}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold hover:bg-blue-100 transition"
                >
                    📍 Use My Location
                </button>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner relative z-10">
                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <ChangeView center={position} />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapEvents />
                    <Marker position={position} draggable={true} eventHandlers={{
                        dragend: (e) => {
                            const marker = e.target;
                            const { lat, lng } = marker.getLatLng();
                            handlePositionChange([lat, lng]);
                        }
                    }} />
                </MapContainer>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic text-sm text-gray-600">
                {loading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Getting address...
                    </div>
                ) : (
                    <span><strong>Selected Address:</strong> {address || 'Tap on map to select location'}</span>
                )}
            </div>
        </div>
    );
};

export default LocationPicker;
