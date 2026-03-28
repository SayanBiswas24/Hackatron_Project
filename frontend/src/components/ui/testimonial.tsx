import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    quote:
      "Penny Stalker's automated goal-tracking forced me to hit my emergency fund target. The fact that the vaults are mathematically locked on Algorand provides an insane level of security.",
    name: "Alex Vance",
    designation: "Early DeFi Adopter",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop",
  },
  {
    quote:
      "I used to drain my savings randomly. With the Penny Stalker 30-day smart contract logic, my ALGO is fully staked and protected from my own impulses. It's revolutionizing disciplined habits.",
    name: "Marcus Johnson",
    designation: "Web3 Analyst at Synergy",
    src: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop",
  },
  {
    quote:
      "Because it natively reads Algorand state proofs, the user interface updates literally instantly. Tracking multiple goal pipelines simultaneously has never looked this beautiful.",
    name: "Isabella Rossi",
    designation: "Frontend Engineer",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop",
  },
  {
    quote:
      "The exact timeline locks give me incredible peace of mind. I locked away 10,000 ALGO for my downpayment vault and haven't touched it since.",
    name: "Kenji Tanaka",
    designation: "Independent Validator",
    src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1887&auto=format&fit=crop",
  },
  {
    quote:
      "I'm completely blown away by the execution speed. What used to take days of routing through centralized exchanges is now an instant on-chain transaction.",
    name: "Fatima Al-Jamil",
    designation: "DeFi Retail Investor",
    src: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=1887&auto=format&fit=crop",
  },
];

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export const AnimatedTestimonials = ({
  testimonialsList = testimonials,
  autoplay = true,
}: {
  testimonialsList?: Testimonial[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = React.useCallback(() => {
    setActive((prev) => (prev + 1) % testimonialsList.length);
  }, [testimonialsList.length]);

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonialsList.length) % testimonialsList.length);
  };

  useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [autoplay, handleNext]);

  const isActive = (index: number) => index === active;

  const randomRotate = () => `${Math.floor(Math.random() * 16) - 8}deg`;

  return (
    <div className="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-7xl md:px-8 lg:px-12 relative z-10 w-full bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-md my-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Trusted by the <span className="text-neon-lime">Network</span>
        </h2>
        <p className="text-lg text-emerald-100/60 max-w-2xl mx-auto">
          See how our trustless vaults are forcing on-chain financial discipline for hundreds of users.
        </p>
      </div>

      <div className="relative grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-20">
        
        {/* Image Section */}
        <div className="flex items-center justify-center">
            <div className="relative h-80 w-full max-w-xs">
              <AnimatePresence>
                {testimonialsList.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.src}
                    initial={{ opacity: 0, scale: 0.9, y: 50, rotate: randomRotate() }}
                    animate={{
                      opacity: isActive(index) ? 1 : 0.5,
                      scale: isActive(index) ? 1 : 0.9,
                      y: isActive(index) ? 0 : 20,
                      zIndex: isActive(index) ? testimonialsList.length : testimonialsList.length - Math.abs(index - active),
                      rotate: isActive(index) ? '0deg' : randomRotate(),
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: -50 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0 origin-bottom"
                    style={{ perspective: '1000px' }}
                  >
                    {/* Ring glow wrapper for neon lime aesthetics */}
                    <div className="absolute inset-0 rounded-3xl ring-2 ring-neon-lime/20" />
                    <img
                      src={testimonial.src}
                      alt={testimonial.name}
                      width={500}
                      height={500}
                      draggable={false}
                      className="h-full w-full rounded-3xl object-cover shadow-2xl shadow-neon-lime/10"
                      onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/500x500/101827/C0FF00?text=${testimonial.name.charAt(0)}`;
                        e.currentTarget.onerror = null;
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
        </div>

        {/* Text and Controls Section */}
        <div className="flex flex-col justify-center py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col justify-between"
            >
                <div>
                    <h3 className="text-2xl font-bold text-white">
                        {testimonialsList[active].name}
                    </h3>
                    <p className="text-sm text-neon-lime uppercase tracking-widest mt-1">
                        {testimonialsList[active].designation}
                    </p>
                    <motion.p className="mt-8 text-xl leading-relaxed text-gray-300">
                        "{testimonialsList[active].quote}"
                    </motion.p>
                </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="flex gap-4 pt-12">
            <button
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="group flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 transition-colors hover:bg-neon-lime hover:border-neon-lime focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-deep-dark"
            >
              <ArrowLeft className="h-5 w-5 text-gray-300 transition-transform duration-300 group-hover:-translate-x-1 group-hover:text-black" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next testimonial"
              className="group flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 transition-colors hover:bg-neon-lime hover:border-neon-lime focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-deep-dark"
            >
              <ArrowRight className="h-5 w-5 text-gray-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
