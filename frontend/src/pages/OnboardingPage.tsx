import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Mail,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Lock,
  Globe
} from 'lucide-react';
import { Banner } from '../components/ui/banner';
import { FlippingCard } from '../components/ui/flipping-card';
import { cn } from '../lib/utils';

type OnboardingStep = 'wallet-selection' | 'usdc-optin' | 'success';

const OnboardingPage: React.FC = () => {
  const [step] = useState<OnboardingStep>('wallet-selection');
  const [selectedWallet, setSelectedWallet] = useState<'pera' | 'custodial' | null>(null);
  const [optInStatus] = useState<'idle' | 'scanning' | 'requesting' | 'confirmed'>('idle');
  const navigate = useNavigate();

  const handleWalletSelect = (type: 'pera' | 'custodial') => {
    setSelectedWallet(type);
    // Auto-scroll or signal that selection is made
  };

  const startOnboarding = () => {
    navigate('/dashboard');
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } }
  };

  const peraFront = (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="p-6 rounded-[2rem] bg-[#C0FF00]/10 border border-[#C0FF00]/20 text-[#C0FF00] shadow-[0_0_30px_rgba(192,255,0,0.1)]">
        <Wallet size={64} strokeWidth={1.2} />
      </div>
      <div className="space-y-3">
        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Pera Wallet</h3>
        <p className="text-[#C0FF00] text-[0.7rem] font-black uppercase tracking-[0.3em] bg-[#C0FF00]/5 py-1 px-3 rounded-full inline-block">Pro-Grade Control</p>
      </div>
      <p className="text-gray-500 text-sm font-medium max-w-[280px]">
        The gold standard for Algorand self-custody. Complete transparency and ownership.
      </p>
    </div>
  );

  const peraBack = (
    <div className="flex flex-col h-full items-center justify-between py-6">
      <div className="space-y-8 w-full">
        <h4 className="text-2xl font-black uppercase italic text-[#C0FF00] tracking-tight">Full Authority</h4>
        <ul className="space-y-5 text-left px-4">
          {[
            { text: "Full ownership of private keys", icon: <ShieldCheck size={16} /> },
            { text: "Ledger Hardware wallet support", icon: <Lock size={16} /> },
            { text: "Direct blockchain interaction", icon: <Globe size={16} /> },
            { text: "Manual signature Required", icon: <CheckCircle2 size={16} /> }
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-sm font-bold text-gray-300 uppercase tracking-tight">
              <div className="text-[#C0FF00] p-1.5 bg-[#C0FF00]/10 rounded-lg">{item.icon}</div>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleWalletSelect('pera'); }}
        className={cn(
          "w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
          selectedWallet === 'pera'
            ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            : "bg-[#C0FF00] text-black hover:scale-[1.02] shadow-[0_0_40px_rgba(192,255,0,0.2)]"
        )}
      >
        {selectedWallet === 'pera' ? "Selected" : "Select Pera"}
        {selectedWallet === 'pera' && <CheckCircle2 size={20} strokeWidth={3} />}
      </button>
    </div>
  );

  const custodialFront = (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="p-6 rounded-[2rem] bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.1)]">
        <Zap size={64} strokeWidth={1.2} />
      </div>
      <div className="space-y-3">
        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Silent Vault</h3>
        <p className="text-[#00F0FF] text-[0.7rem] font-black uppercase tracking-[0.3em] bg-[#00F0FF]/5 py-1 px-3 rounded-full inline-block">Email-Managed</p>
      </div>
      <p className="text-gray-500 text-sm font-medium max-w-[280px]">
        Seamless, bank-like experience. No keys to manage, just pure savings power.
      </p>
    </div>
  );

  const custodialBack = (
    <div className="flex flex-col h-full items-center justify-between py-6">
      <div className="space-y-8 w-full">
        <h4 className="text-2xl font-black uppercase italic text-[#00F0FF] tracking-tight">Frictionless Entry</h4>
        <ul className="space-y-5 text-left px-4">
          {[
            { text: "Instant Email / Social Login", icon: <Mail size={16} /> },
            { text: "No seed phrases to manage", icon: <ShieldCheck size={16} /> },
            { text: "Auto-signs recurring deposits", icon: <Zap size={16} /> },
            { text: "Zero-friction onboarding", icon: <CheckCircle2 size={16} /> }
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-sm font-bold text-gray-300 uppercase tracking-tight">
              <div className="text-[#00F0FF] p-1.5 bg-[#00F0FF]/10 rounded-lg">{item.icon}</div>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleWalletSelect('custodial'); }}
        className={cn(
          "w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
          selectedWallet === 'custodial'
            ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            : "bg-[#00F0FF] text-black hover:scale-[1.02] shadow-[0_0_40px_rgba(0,240,255,0.2)]"
        )}
      >
        {selectedWallet === 'custodial' ? "Selected" : "Select Vault"}
        {selectedWallet === 'custodial' && <CheckCircle2 size={20} strokeWidth={3} />}
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0A0F0D]">


      <div className="relative z-10 w-full max-w-6xl px-6 py-20">
        <AnimatePresence mode="wait">
          {step === 'wallet-selection' && (
            <motion.div
              key="wallet"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-12"
            >
              <Banner
                id="onboarding-banner"
                variant="rainbow"
                className="w-full max-w-7xl mx-auto rounded-[2.5rem] py-3 px-6 md:py-4 md:px-10 shadow-[0_0_60px_rgba(192,255,0,0.1)] border border-white/5"
              >
                <div className="text-center space-y-1">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase whitespace-nowrap" style={{ letterSpacing: '0.3em' }}>
                    Choose Your <span className="text-[#C0FF00]">Vault Gate</span>
                  </h1>
                  <p className="text-gray-400 font-medium text-sm md:text-base tracking-tight max-w-3xl mx-auto">
                    Select your interaction layer. This determines how your transactions are signed and secured.
                  </p>
                </div>
              </Banner>

              <div className="bg-[#141C18]/60 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl max-w-5xl mx-auto mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
                  <FlippingCard
                    frontContent={peraFront}
                    backContent={peraBack}
                    className={selectedWallet === 'pera' ? "border-[#C0FF00]/50" : ""}
                  />

                  <FlippingCard
                    frontContent={custodialFront}
                    backContent={custodialBack}
                    className={selectedWallet === 'custodial' ? "border-[#00F0FF]/50" : ""}
                  />
                </div>
              </div>

              {/* Progress CTA */}
              <div className="flex flex-col items-center gap-6 pt-6">
                <button
                  type="button"
                  onClick={startOnboarding}
                  className="w-full md:w-72 py-4 rounded-2xl text-base font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 bg-[#C0FF00] text-black hover:brightness-110 active:scale-95 shadow-[0_0_40px_rgba(192,255,0,0.2)]"
                >
                  Confirm your choice <ArrowRight size={20} strokeWidth={3} />
                </button>

                <p className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-gray-700">
                  Secured by Algorand Native Cryptography
                </p>
              </div>
            </motion.div>
          )}

          {/* ... keeping existing steps ... */}
          {step === 'usdc-optin' && (
            <motion.div
              key="optin"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-[#141C18] border border-white/10 rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden max-w-2xl mx-auto"
            >
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#C0FF00]/5 blur-[100px] rounded-full" />

              <div className="relative space-y-4">
                <div className="flex justify-center flex-col items-center">
                  <div className="relative w-24 h-24 mb-6">
                    {optInStatus !== 'confirmed' && (
                      <div className="absolute inset-0 border-4 border-[#C0FF00]/20 rounded-full animate-ping" />
                    )}
                    <div className={cn(
                      "absolute inset-0 rounded-full border-4 flex items-center justify-center transition-all duration-500",
                      optInStatus === 'confirmed' ? "border-[#C0FF00] bg-[#C0FF00]/10" : "border-white/10"
                    )}>
                      {optInStatus === 'confirmed' ? (
                        <CheckCircle2 className="text-[#C0FF00]" size={40} strokeWidth={3} />
                      ) : (
                        <ShieldAlert className="text-gray-500" size={40} />
                      )}
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Initializing <span className="text-[#C0FF00] not-italic">USDC</span> Vault</h2>
                  <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto mt-2">
                    We need to authorize your wallet to hold and trade USDC for your goal-based savings.
                  </p>
                </div>

                {/* Status Steps */}
                <div className="pt-8 space-y-4 max-w-xs mx-auto text-left">
                  {[
                    { id: 'scanning', label: 'Probing Testnet Node...' },
                    { id: 'requesting', label: 'Accepting Asset ID 10458941...' },
                    { id: 'confirmed', label: 'Vault Ready for Deposits' }
                  ].map((item, idx) => {
                    const isActive = optInStatus === item.id;
                    const isPast = (optInStatus === 'requesting' && idx === 0) || (optInStatus === 'confirmed' && idx < 2);

                    return (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                          isActive ? "border-[#C0FF00] shadow-[0_0_15px_rgba(192,255,0,0.3)] bg-[#C0FF00]/20" :
                            isPast ? "border-[#C0FF00] bg-[#C0FF00]" : "border-white/10"
                        )}>
                          {isPast && <CheckCircle2 className="text-black" size={10} strokeWidth={4} />}
                          {isActive && <Loader2 className="text-[#C0FF00] animate-spin" size={10} strokeWidth={4} />}
                        </div>
                        <span className={cn(
                          "text-[0.65rem] font-bold uppercase tracking-widest transition-all",
                          isActive ? "text-white" : isPast ? "text-gray-400" : "text-gray-600"
                        )}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#C0FF00] blur-[60px] opacity-20 rounded-full" />
                  <div className="relative bg-[#141C18] border border-[#C0FF00]/30 w-32 h-32 rounded-[2.5rem] flex items-center justify-center rotate-12">
                    <CheckCircle2 size={64} className="text-[#C0FF00] -rotate-12" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">Vault <br /><span className="text-[#C0FF00] not-italic">Armed</span></h2>
                <p className="text-gray-400 text-lg font-medium tracking-tight">Onboarding complete. Your Algorand wallet is ready to stalk some pennies.</p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full md:w-80 py-6 bg-[#C0FF00] text-black font-black text-lg uppercase tracking-[0.2em] rounded-[2rem] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_60px_rgba(192,255,0,0.3)] flex items-center justify-center gap-3"
                >
                  Enter Dashboard <ArrowRight size={24} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
