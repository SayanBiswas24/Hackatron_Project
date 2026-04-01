import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Mail, 
  ShieldCheck, 
  Zap, 
  Info, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import ShaderBackground from '../components/ui/ShaderBackground';
import { cn } from '../lib/utils';

type OnboardingStep = 'wallet-selection' | 'usdc-optin' | 'success';

const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('wallet-selection');
  const [selectedWallet, setSelectedWallet] = useState<'pera' | 'custodial' | null>(null);
  const [optInStatus, setOptInStatus] = useState<'idle' | 'scanning' | 'requesting' | 'confirmed'>('idle');
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  const handleWalletSelect = (type: 'pera' | 'custodial') => {
    setSelectedWallet(type);
  };

  const startOnboarding = () => {
    setStep('usdc-optin');
    runSimulatedOptIn();
  };

  const runSimulatedOptIn = () => {
    setOptInStatus('scanning');
    setTimeout(() => {
      setOptInStatus('requesting');
      setTimeout(() => {
        setOptInStatus('confirmed');
        setTimeout(() => {
          setStep('success');
        }, 1500);
      }, 2500);
    }, 2000);
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0A0F0D]">
      <ShaderBackground />

      <div className="relative z-10 w-full max-w-2xl px-6">
        <AnimatePresence mode="wait">
          {step === 'wallet-selection' && (
            <motion.div 
              key="wallet"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                  Choose Your <span className="text-[#C0FF00] not-italic">Vault Gate</span>
                </h1>
                <p className="text-gray-400 font-medium text-sm tracking-tight max-w-md mx-auto">
                  Select how you want to interact with the Algorand blockchain. This determines your security and transaction experience.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pera Wallet Option */}
                <button 
                  onClick={() => handleWalletSelect('pera')}
                  className={cn(
                    "relative flex flex-col items-start p-6 rounded-3xl border-2 transition-all duration-300 text-left group",
                    selectedWallet === 'pera' 
                      ? "bg-[#C0FF00]/10 border-[#C0FF00] shadow-[0_0_40px_rgba(192,255,0,0.1)]" 
                      : "bg-white/[0.02] border-white/10 hover:border-white/30"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl mb-4 transition-colors",
                    selectedWallet === 'pera' ? "bg-[#C0FF00] text-black" : "bg-white/5 text-gray-400 group-hover:text-white"
                  )}>
                    <Wallet size={24} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Pera Wallet</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                    Self-custody experience. Use your existing Algorand wallet with full control over your private keys. Recommended for Pro users.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest text-[#C0FF00]">
                    <ShieldCheck size={12} /> Maximum Security
                  </div>
                </button>

                {/* Custodial Wallet Option */}
                <button 
                  onClick={() => handleWalletSelect('custodial')}
                  className={cn(
                    "relative flex flex-col items-start p-6 rounded-3xl border-2 transition-all duration-300 text-left group",
                    selectedWallet === 'custodial' 
                      ? "bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_40px_rgba(0,240,255,0.1)]" 
                      : "bg-white/[0.02] border-white/10 hover:border-white/30"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl mb-4 transition-colors",
                    selectedWallet === 'custodial' ? "bg-[#00F0FF] text-black" : "bg-white/5 text-gray-400 group-hover:text-white"
                  )}>
                    <Mail size={24} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Custodial</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                    Silent signing via Email login. No mnemonics or manual signing for small deposits. Best for a seamless "bank-like" experience.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest text-[#00F0FF]">
                    <Zap size={12} /> Instant access
                  </div>
                </button>
              </div>

              {/* Comparison Section */}
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
                >
                  <Info size={14} /> {showDetails ? "Hide Comparison" : "View Full Comparison"}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-8 text-[0.65rem] font-bold uppercase tracking-widest text-gray-500">
                        <div className="space-y-4">
                          <p className="text-white border-b border-white/10 pb-2">Pera Architecture</p>
                          <ul className="space-y-2">
                            <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-[#C0FF00] mt-1.5" /> Direct Blockchain Interaction</li>
                            <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-[#C0FF00] mt-1.5" /> Hardware Wallet (Ledger) support</li>
                            <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-[#C0FF00] mt-1.5" /> Manual Signature per txn</li>
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <p className="text-white border-b border-white/10 pb-2">Custodial Architecture</p>
                          <ul className="space-y-2">
                            <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-[#00F0FF] mt-1.5" /> Magic Link / Social Login</li>
                            <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-[#00F0FF] mt-1.5" /> Auto-sign low risk deposits</li>
                            <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-[#00F0FF] mt-1.5" /> Zero backup management</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  disabled={!selectedWallet}
                  onClick={startOnboarding}
                  className={cn(
                    "mt-4 w-full md:w-64 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2",
                    selectedWallet 
                      ? "bg-[#C0FF00] text-black hover:brightness-110 active:scale-95" 
                      : "bg-white/5 text-gray-600 cursor-not-allowed"
                  )}
                >
                  Continue Onboarding <ArrowRight size={18} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'usdc-optin' && (
            <motion.div 
              key="optin"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-[#141C18] border border-white/10 rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden"
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
                  <div className="pt-8 space-y-4 max-w-xs mx-auto">
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
                     <div className="relative bg-[#141C18] border border-[#C0FF00]/30 w-32 h-32 rounded-[2rem] flex items-center justify-center rotate-12">
                        <CheckCircle2 size={64} className="text-[#C0FF00] -rotate-12" strokeWidth={2.5} />
                     </div>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Vault <span className="text-[#C0FF00] not-italic">Armed</span></h2>
                  <p className="text-gray-500 font-medium tracking-tight">Onboarding complete. Your Algorand wallet is ready to stalk some pennies.</p>
               </div>

               <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full md:w-64 py-5 bg-[#C0FF00] text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(192,255,0,0.2)]"
                  >
                    Enter Dashboard
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
