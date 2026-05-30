import L from 'leaflet';
import type { Feature } from 'geojson';

interface ZoneDetailSidebarProps {
    zone: Feature;
    onClose: () => void;
}

export default function ZoneDetailSidebar({ zone, onClose }: ZoneDetailSidebarProps) {
    const props = zone.properties;

    return (
        <div 
            className="absolute top-0 left-0 h-full w-[350px] bg-white shadow-2xl z-[1000] p-6 overflow-y-auto"
            // Mencegah klik/scroll tembus ke peta di belakangnya
            ref={(ref) => {
                if (ref) {
                    L.DomEvent.disableClickPropagation(ref);
                    L.DomEvent.disableScrollPropagation(ref);
                }
            }}
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Zona Potensi Ikan</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
            </div>

            {/* Info Oseanografi (Data Real dari Python) */}
            <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100 shadow-inner">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Parameter Area</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex justify-between">
                        <span>🌡️ Suhu Permukaan</span> 
                        <span className="font-bold">{props?.sst_rata}°C</span>
                    </li>
                    <li className="flex justify-between">
                        <span>🌿 Klorofil-a</span> 
                        <span className="font-bold">{props?.chl_rata !== 'N/A' ? `${props?.chl_rata} mg/m³` : 'N/A'}</span>
                    </li>
                    <li className="flex justify-between">
                        <span>📅 Tanggal Data</span> 
                        <span className="font-bold">{props?.zone_date}</span>
                    </li>
                </ul>
            </div>

            {/* Daftar Probabilitas Ikan */}
            <div>
                <h3 className="text-md font-bold text-gray-800 mb-4">Target Spesies Potensial</h3>
                <div className="space-y-4">
                    {props?.ikan_cocok?.map((ikan: any, idx: number) => {
                        // Mencocokkan gambar ikan statis berdasarkan nama
                        const imgPath = ikan.image_path 
                        ? `/storage${ikan.image_path}` // Ini akan menjadi /storage/images/fishes/cakalang.png
                        : '/storage/images/fishes/default.png';

                        return (
                            <div key={idx} className="flex items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1">
                                    <img src={imgPath} alt={ikan.nama_lokal} className="max-h-full max-w-full object-contain drop-shadow-sm" />
                                </div>
                                <div className="ml-4 flex-grow">
                                    {/* Menampilkan Nama Lokal dan Nama Lain (jika ada) */}
                                    <h4 className="font-bold text-gray-800 text-sm">
                                        {ikan.nama_lokal} 
                                        {ikan.nama_lain && <span className="text-gray-500 font-normal"> / {ikan.nama_lain}</span>}
                                    </h4>
                                    
                                    {/* Menampilkan Nama Ilmiah dengan gaya cetak miring (italic) */}
                                    <p className="text-xs text-blue-600 italic mb-1">{ikan.nama_ilmiah}</p>
                                    
                                    <div className="flex items-center mt-1">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${ikan.confidence * 100}%` }}></div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600">{Math.round(ikan.confidence * 100)}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tombol Mulai Navigasi (Persiapan PWA) */}
            <div className="mt-8 mb-4">
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                    Mulai Navigasi
                </button>
            </div>
        </div>
    );
}