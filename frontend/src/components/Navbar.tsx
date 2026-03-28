import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="navbar">
      {/* Logo pinned to top-left */}
      <div className="navbar-logo">
        <div className="logo-box">
          <span className="logo-num">PENNY</span>
          <span className="logo-text">STALKER</span>
        </div>
      </div>

      {/* Center nav links */}
      <div className="navbar-links">
        <a href="#vaults"       onClick={(e) => scrollTo(e, 'vaults')}>My Vaults</a>
        <a href="#security"     onClick={(e) => scrollTo(e, 'security')}>Security</a>
        <a href="#faqs"         onClick={(e) => scrollTo(e, 'faqs')}>FAQs</a>
        <a href="#testimonials" onClick={(e) => scrollTo(e, 'testimonials')}>Testimonials</a>
      </div>

      {/* CTA button pinned to top-right */}
      <div className="navbar-action">
        <button className="btn-outline" onClick={() => navigate('/auth')}>Let's Begin</button>
      </div>
    </nav>
  );
};

export default Navbar;
