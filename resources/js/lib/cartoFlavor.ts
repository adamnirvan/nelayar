import { LIGHT  } from '@protomaps/basemaps';
import type {Flavor} from '@protomaps/basemaps';
import { labelRules, paintRules } from 'protomaps-leaflet';

// Tema vektor yang meniru basemap raster CARTO Voyager. Tujuannya: saat basemap
// PMTiles offline (protomaps) aktif, tampilannya KONSISTEN dengan fallback CARTO
// online — bukan flavor "light" bawaan yang warnanya berbeda jauh.
//
// File id.pmtiles memakai skema basemap protomaps standar (layer earth, water,
// landcover, roads, places, dst.), jadi kita cukup menimpa token WARNA pada
// flavor LIGHT lalu membiarkan protomaps-leaflet membangun paint/label rules.
// Hanya token yang relevan untuk pandangan laut + pulau (z4–z10) yang diubah;
// sisanya mewarisi LIGHT.
const VOYAGER: Flavor = {
    ...LIGHT,

    // Dasar: laut biru lembut, daratan krem hangat (ciri khas Voyager)
    background: '#a5cce0', // dipakai sebagai fill saat tile air belum termuat
    water: '#a5cce0',
    earth: '#fbf8f3',

    // Vegetasi / taman → hijau pucat
    park_a: '#d6e6c8',
    park_b: '#d6e6c8',
    wood_a: '#d9e8cb',
    wood_b: '#d9e8cb',
    scrub_a: '#deead0',
    scrub_b: '#deead0',
    zoo: '#e3edd9',

    // Guna lahan lain (muncul di zoom lebih tinggi)
    industrial: '#f2efe9',
    hospital: '#f5e6e4',
    school: '#f2efde',
    sand: '#f3ecd9',
    beach: '#f5ecd0',
    pedestrian: '#f0ede6',
    buildings: '#ece8e0',

    // Jalan ala Voyager: arteri kuning-oranye pucat dengan casing putih,
    // jalan kecil putih
    highway: '#f9d9a0',
    highway_casing_early: '#ffffff',
    highway_casing_late: '#ffffff',
    major: '#fbe3b3',
    major_casing_early: '#ffffff',
    major_casing_late: '#ffffff',
    minor_a: '#ffffff',
    minor_b: '#ffffff',
    minor_casing: '#e6e1d6',
    minor_service: '#ffffff',
    minor_service_casing: '#e6e1d6',
    link: '#fbe3b3',
    link_casing: '#ffffff',
    other: '#ffffff',
    railway: '#cfc9bd',

    // Batas administrasi: abu-abu lembut
    boundaries: '#9aa0aa',

    // Label gelap dengan halo putih (gaya Voyager)
    city_label: '#42464d',
    city_label_halo: '#ffffff',
    state_label: '#7a7f87',
    state_label_halo: '#ffffff',
    country_label: '#5a5f66',
    subplace_label: '#6b7079',
    subplace_label_halo: '#ffffff',
    ocean_label: '#6aa0c0',
    roads_label_major: '#7a7468',
    roads_label_major_halo: '#ffffff',
    roads_label_minor: '#9a948a',
    roads_label_minor_halo: '#ffffff',

    landcover: {
        barren: '#f1ecdf',
        farmland: '#eef0dc',
        forest: '#d4e4c4',
        glacier: '#f4f6f7',
        grassland: '#dfead0',
        scrub: '#dde8cd',
        urban_area: '#efece5',
    },
};

/**
 * Paint/label rules + warna latar untuk basemap PMTiles vektor, diwarnai seperti
 * CARTO Voyager. Diberikan langsung ke `leafletLayer({ paintRules, labelRules,
 * backgroundColor })` — JANGAN dikombinasikan dengan opsi `flavor`, karena bila
 * `flavor` diset, protomaps-leaflet mengabaikan paint/label rules kustom ini.
 */
export function cartoVoyagerTheme(lang = 'en') {
    return {
        paintRules: paintRules(VOYAGER),
        labelRules: labelRules(VOYAGER, lang),
        backgroundColor: VOYAGER.background,
    };
}
