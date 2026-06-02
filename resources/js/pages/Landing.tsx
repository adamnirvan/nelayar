import { Head } from '@inertiajs/react';
import HeroSection from '../components/Landing/HeroSection';
import VideoShowcase from '../components/Landing/VideoShowcase';
import QuoteSection from '../components/Landing/QuoteSection';
import TechFeatures from '../components/Landing/TechFeatures';
import CTASection from '../components/Landing/CTASection';
import Navbar from '../components/Landing/Navbar';

export default function Landing() {
    return (
        <>
            <Head title="Nelayar - Navigasi Masa Depan Perikanan" />
            
            {/* Inject Font Outfit secara global untuk halaman ini */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                html { scroll-behavior: smooth; }
            `}</style>

            <div 
                className="bg-[#f8fafc] text-slate-900" 
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                <Navbar />

                {/* 1. Header & Text In-Animation */}
                <HeroSection />

                

                {/* 3. Video Box Parallax */}
                <VideoShowcase />

                {/* 4. Kutipan Tipografi Animasi */}
                <QuoteSection />

                {/* 5. Hover Reveal Card */}
                <TechFeatures />

                {/* 6. Call to Action */}
                <CTASection />
            </div>
        </>
    );
}