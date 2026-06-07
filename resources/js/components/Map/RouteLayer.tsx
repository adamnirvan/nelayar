import L from 'leaflet';
import { GeoJSON, Marker, Popup } from 'react-leaflet';
import { useNavigation } from './NavigationContext';

// Ikon Titik Akhir (End Node) Minimalis pengganti emoji jangkar.
// Desainnya hanya berupa titik biru dengan border putih agar menyatu dengan garis rute.
// Ikon Murni Berbentuk Bendera (Tanpa Lingkaran Pembungkus)
// Ikon Bendera Premium dengan Podium 3D (Map Pin Style)
// Ikon Bendera Flat Minimalis (Gaya Google Maps)
const destinationIcon = L.divIcon({
    className: 'bg-transparent border-none',
    html: `
        <div class="relative w-8 h-10 transition-transform hover:-translate-y-1">
            <svg class="w-full h-full drop-shadow-md" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                
                <circle cx="10" cy="34" r="3.5" fill="#3b82f6" />
                
                <path d="M10 8 Q 16 5 24 9 L 24 18 Q 16 14 10 18 Z" fill="#3b82f6" stroke="white" stroke-width="2.5" stroke-linejoin="round" />

                <line x1="10" y1="34" x2="10" y2="7" stroke="white" stroke-width="3" stroke-linecap="round" />
                
            </svg>
        </div>
    `,
    iconSize: [32, 40], // Kanvas 32x40
    
    // Titik Tancap Presisi: Berada tepat di tengah lingkaran dasar (X=10, Y=34).
    iconAnchor: [10, 34], 
});

export default function RouteLayer() {
    const { routeGeoJson, origin, destination, status } = useNavigation();

    if (!routeGeoJson) {
        return null;
    }

    const isActive = status === 'active';
    
    // Warna disamakan secara total dengan User Marker (Biru terang Tailwind blue-500)
    // Entah itu aktif atau sekadar rencana, warnanya tetap identik.
    const color = '#3b82f6';

    return (
        <>
            <GeoJSON
                key={`route-${origin?.lat},${origin?.lng}-${destination?.lat},${destination?.lng}-${status}`}
                data={routeGeoJson}
                style={{
                    color,
                    // Saat aktif garisnya utuh dan lebih tebal (5), saat rencana putus-putus dan sedikit tipis (4)
                    weight: isActive ? 5 : 4,
                    opacity: 1,
                    dashArray: isActive ? undefined : '10, 10', // Jarak putus-putus yang elegan
                    lineCap: 'round',
                    lineJoin: 'round',
                }}
            />

            {/* Marker tujuan kini menjadi titik biru kecil yang rapi di ujung rute */}
            {destination && (
                <Marker
                    position={[destination.lat, destination.lng]}
                    icon={destinationIcon}
                >
                    <Popup>Tujuan: Zona Potensi Ikan</Popup>
                </Marker>
            )}
        </>
    );
}