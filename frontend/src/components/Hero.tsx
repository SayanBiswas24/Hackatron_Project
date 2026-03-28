import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ShaderBackground from './ui/ShaderBackground';
import gsap from 'gsap';
import './Hero.css';
import { Play } from 'lucide-react';

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create a timeline for the load sequence
      const tl = gsap.timeline();

      // Title line reveal
      tl.fromTo('.title-line', 
        { y: 150, opacity: 0, rotateX: -20 },
        { y: 0, opacity: 1, rotateX: 0, duration: 2.2, stagger: 0.35, ease: 'power4.out' }
      );

      // Subtitle fade up
      tl.fromTo('.hero-subtext',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.8, ease: 'power3.out' },
        "-=1.4"
      );

      // CTA Buttons pop in
      tl.fromTo('.hero-cta',
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, stagger: 0.2, ease: 'back.out(1.2)' },
        "-=1.0"
      );

      // Random floating animation for geometric shapes
      gsap.to('.shape', {
        y: 'random(-20, 20)',
        x: 'random(-20, 20)',
        rotation: 'random(-45, 45)',
        duration: 'random(3, 5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="hero-container" ref={containerRef}>
      
      {/* Floating Background Geometric Shapes */}
      <div className="shape shape-circle top-left"></div>
      <div className="shape shape-triangle top-right"></div>
      <div className="shape shape-square bottom-left"></div>
      <div className="shape shape-circle bottom-right"></div>
      <div className="shape shape-triangle far-right"></div>

      <div className="hero-content">
        <h1 className="hero-title">
          <div className="title-overflow"><span className="title-line">The ultimate platform</span></div>
          <div className="title-overflow"><span className="title-line">for disciplined savings</span></div>
        </h1>
        
        <p className="hero-subtext">
          Automate your goals, lock your ALGO into trustless vaults, and let your pennies securely compound into a fortune on-chain.
        </p>

        <div className="hero-actions">
          <button className="hero-cta btn-solid" onClick={() => navigate('/auth')}>Get Started</button>
          <button className="hero-cta btn-play">
            <span className="play-icon"><Play size={16} fill="var(--accent-lime)" stroke="none" /></span>
            How It Works
          </button>
        </div>
      </div>

      <ShaderBackground />

    </div>
  );
};

export default Hero;
