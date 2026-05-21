import { GeoJSON } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';

interface Props {
    geojson: FeatureCollection;
}

export default function ZppiLayer({ geojson }: Props) {
    return (
        <GeoJSON 
            key={JSON.stringify(geojson)} 
            data={geojson} 
            style={{ 
                fillColor: '#10B981', 
                weight: 1.5, 
                opacity: 0.8, 
                color: '#047857', 
                fillOpacity: 0.35 
            }}
            onEachFeature={(feature, layer) => {
                if (feature.properties) {
                    // Ambil properti dari data satelit yang kita parse di Python
                    const { zone_date, confidence, data_source } = feature.properties;
                    
                    // Fallback kalau data belum lengkap
                    const acc = confidence ? (confidence * 100).toFixed(1) : 'N/A';
                    const source = data_source || 'Satelit Copernicus';
                    const date = zone_date || 'Data Aktual';

                    layer.bindPopup(`
                        <div style="padding: 4px; font-family: ui-sans-serif, system-ui, sans-serif;">
                            <h4 style="margin: 0 0 8px; font-weight: 600; color: #1e293b; font-size: 15px;">🎯 Zona Potensi Tangkapan</h4>
                            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Tanggal: <strong>${date}</strong></p>
                            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Sumber: <strong>${source}</strong></p>
                            <hr style="margin: 8px 0; border: 0; border-top: 1px solid #e2e8f0;" />
                            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #059669;">✨ Akurasi: ${acc}%</p>
                        </div>
                    `);
                }
            }}
        />
    );
}