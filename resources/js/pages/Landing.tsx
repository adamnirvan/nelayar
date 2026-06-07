import { Head } from '@inertiajs/react';
import HeroSection from '../components/Landing/HeroSection';
import VideoShowcase from '../components/Landing/VideoShowcase';
import QuoteSection from '../components/Landing/QuoteSection';
import TechFeatures from '../components/Landing/TechFeatures';
import CTASection from '../components/Landing/CTASection';
import Navbar from '../components/Landing/Navbar';
import Footer from '../components/Landing/Footer';

export default function Landing() {
    return (
        <>
            <Head title="Nelayar - Navigasi Masa Depan Perikanan" />
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                html { scroll-behavior: smooth; }
            `}</style>

            <div 
                className="bg-[#f8fafc] text-slate-900" 
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                <Navbar />

                <HeroSection />

                {/* Berikan ID yang sesuai dengan link di Navbar */}
                <div id="demo">
                    <VideoShowcase />
                </div>

                <QuoteSection />

                <div id="fitur">
                    <TechFeatures />
                </div>

                <div id="tentang-kami">
                    <CTASection />
                </div>

                <Footer />
            </div>
        </>
    );
}