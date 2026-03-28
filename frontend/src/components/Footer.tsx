import {
  Mail,
  MapPin,
  GitBranch,
  MessageCircle,
  Globe,
  Vault,
  Zap,
  Lock,
} from "lucide-react";
import { FooterBackgroundGradient, TextHoverEffect } from "./ui/hover-footer";

function Footer() {
  const footerLinks = [
    {
      title: "Protocol",
      links: [
        { label: "My Vaults", href: "#vaults" },
        { label: "Features", href: "#features" },
        { label: "Security", href: "#security" },
        { label: "FAQs", href: "#faqs" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Testimonials", href: "#testimonials" },
        { label: "Algorand Foundation", href: "https://algorand.foundation", },
        {
          label: "Discord",
          href: "#",
          pulse: true,
        },
        { label: "GitHub", href: "#" },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: <Mail size={18} className="text-neon-lime" />,
      text: "hello@pennystalker.io",
      href: "mailto:hello@pennystalker.io",
    },
    {
      icon: <Lock size={18} className="text-neon-lime" />,
      text: "Deployed on Algorand Mainnet",
    },
    {
      icon: <MapPin size={18} className="text-neon-lime" />,
      text: "Decentralized & Borderless",
    },
  ];

  const socialLinks = [
    { icon: <GitBranch size={20} />, label: "GitHub", href: "#" },
    { icon: <MessageCircle size={20} />, label: "Discord", href: "#" },
    { icon: <Globe size={20} />, label: "Website", href: "#" },
    { icon: <Vault size={20} />, label: "Vaults", href: "#vaults" },
    { icon: <Zap size={20} />, label: "Algorand", href: "#" },
  ];

  return (
    <footer className="bg-white/[0.02] border border-white/10 rounded-3xl relative h-fit overflow-hidden w-full max-w-7xl mx-auto pt-12 pb-4 backdrop-blur-md mb-8">
      <div className="max-w-7xl mx-auto p-10 md:p-14 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-16 pb-12">
          {/* Brand section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-4xl font-extrabold" style={{ color: '#C0FF00' }}>⬡</span>
              <span className="text-white text-2xl font-bold tracking-tight">
                Penny<span style={{ color: '#C0FF00' }}>Stalker</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">
              Goal-based savings vaults powered by trustless Algorand smart contracts.
              Lock your ALGO. Hit your targets. <span className="text-neon-lime">No exceptions.</span>
            </p>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white text-lg font-semibold mb-6">
                {section.title}
              </h4>
              <ul className="space-y-3 text-gray-300">
                {section.links.map((link) => (
                  <li key={link.label} className="relative">
                    <a
                      href={link.href}
                      className="hover:text-neon-lime transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                    {'pulse' in link && link.pulse && (
                      <span className="absolute top-1 -right-4 w-2 h-2 rounded-full bg-neon-lime animate-pulse"></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-6">
              Contact
            </h4>
            <ul className="space-y-4 text-gray-300">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="hover:text-neon-lime transition-colors duration-200 text-sm"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-sm">{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-t border-white/10 my-8" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-300 space-y-4 md:space-y-0">
          <div className="flex space-x-6">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="hover:text-neon-lime transition-colors duration-200"
              >
                {icon}
              </a>
            ))}
          </div>
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Penny Stalker. Built on Algorand. All rights reserved.
          </p>
        </div>
      </div>

      {/* Animated hover text */}
      <div className="lg:flex hidden h-[30rem] -mt-52 -mb-36">
        <TextHoverEffect text="PENNY STALKER" className="z-50" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}

export default Footer;
