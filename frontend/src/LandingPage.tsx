import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import { AnimatedTestimonials } from './components/ui/testimonial';
import { FeaturesDemo } from './components/ui/features-8';
import FAQDemo from './components/ui/faq-tabs';
import Footer from './components/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />

        <section id="features" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden py-24">
          <FeaturesDemo />
        </section>

        <section id="testimonials" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden py-24">
          {/* Animated grid background */}
          <style>{`
            @keyframes animate-grid {
              0% { background-position: 0% 50%; }
              100% { background-position: 100% 50%; }
            }
            .animated-grid {
              width: 200%;
              height: 200%;
              background-image:
                linear-gradient(to right, rgba(192, 255, 0, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(192, 255, 0, 0.05) 1px, transparent 1px);
              background-size: 4rem 4rem;
              animation: animate-grid 40s linear infinite alternate;
            }
          `}</style>
          <div className="animated-grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100 pointer-events-none" />
          <AnimatedTestimonials />
        </section>

        <section id="faqs" className="relative flex w-full items-center justify-center py-24">
          <FAQDemo />
        </section>
      </main>

      <Footer />
    </>
  );
}
