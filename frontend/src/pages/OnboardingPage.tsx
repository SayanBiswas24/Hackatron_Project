import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet, WalletId } from '@txnlab/use-wallet-react';
import {
  Wallet,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Lock,
  Globe,
  Copy,
  ArrowLeft,
  Key
} from 'lucide-react';
import { FlippingCard } from '../components/ui/flipping-card';
import { api } from '../lib/api';

type OnboardingStep = 
  | 'selection' 
  | 'custodial-choice' 
  | 'custodial-create' 
  | 'custodial-import' 
  | 'pera-status' 
  | 'success';

const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('selection');
  const [mnemonic, setMnemonic] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [hasConfirmedMnemonic, setHasConfirmedMnemonic] = useState(false);
  const [importMnemonic, setImportMnemonic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { wallets } = useWallet();
  const navigate = useNavigate();
  const userId = localStorage.getItem('ps_user_id');

  useEffect(() => {
    if (!userId) {
      navigate('/auth');
    }
  }, [userId, navigate]);

  const handlePeraConnect = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const peraWallet = wallets.find(w => w.id === WalletId.PERA);
      if (!peraWallet) throw new Error("Pera Wallet provider not found");
      
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        const address = accounts[0].address;
        await api.setupWallet({
          userId: userId!,
          type: 'PERA',
          walletAddress: address
        });
        setStep('success');
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect Pera Wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustodialCreate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.setupWallet({
        userId: userId!,
        type: 'CUSTODIAL'
      });
      setMnemonic(res.mnemonic);
      setStep('custodial-create');
    } catch (err: any) {
      setError(err.message || "Failed to create vault");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustodialImport = async () => {
    if (!importMnemonic.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      await api.setupWallet({
        userId: userId!,
        type: 'CUSTODIAL',
        mnemonic: importMnemonic.trim()
      });
      setStep('success');
    } catch (err: any) {
      setError(err.message || "Failed to import vault. Ensure mnemonic is valid.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mnemonic);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
        <p className="text-[#C0FF00] text-[0.7rem] font-black uppercase tracking-[0.3em] bg-[#C0FF00]/5 py-1 px-3 rounded-full inline-block">External Control</p>
      </div>
      <p className="text-gray-500 text-sm font-medium max-w-[280px]">
        Connect your existing Pera Wallet. You maintain full control over your keys.
      </p>
    </div>
  );

  const peraBack = (
    <div className="flex flex-col h-full items-center justify-between py-6">
      <div className="space-y-8 w-full">
        <h4 className="text-2xl font-black uppercase italic text-[#C0FF00] tracking-tight">Self-Custody</h4>
        <ul className="space-y-5 text-left px-4">
          {[
            { text: "Use your own Pera account", icon: <ShieldCheck size={16} /> },
            { text: "Transactions signed in-app", icon: <Lock size={16} /> },
            { text: "Full blockchain transparency", icon: <Globe size={16} /> },
            { text: "No platform key storage", icon: <CheckCircle2 size={16} /> }
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-sm font-bold text-gray-300 uppercase tracking-tight">
              <div className="text-[#C0FF00] p-1.5 bg-[#C0FF00]/10 rounded-lg">{item.icon}</div>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handlePeraConnect(); }}
        disabled={isLoading}
        className="w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest bg-[#C0FF00] text-black hover:scale-[1.02] shadow-[0_0_40px_rgba(192,255,0,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Connect Pera"}
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
        <p className="text-[#00F0FF] text-[0.7rem] font-black uppercase tracking-[0.3em] bg-[#00F0FF]/5 py-1 px-3 rounded-full inline-block">Managed Security</p>
      </div>
      <p className="text-gray-500 text-sm font-medium max-w-[280px]">
        Seamless, native experience. We manage the security while you focus on saving.
      </p>
    </div>
  );

  const custodialBack = (
    <div className="flex flex-col h-full items-center justify-between py-6">
      <div className="space-y-8 w-full">
        <h4 className="text-2xl font-black uppercase italic text-[#00F0FF] tracking-tight">Native Vault</h4>
        <ul className="space-y-5 text-left px-4">
          {[
            { text: "One-click vault creation", icon: <Zap size={16} /> },
            { text: "Import existing vault keys", icon: <Key size={16} /> },
            { text: "AES-256 cloud encryption", icon: <ShieldCheck size={16} /> },
            { text: "Auto-signed transactions", icon: <CheckCircle2 size={16} /> }
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-sm font-bold text-gray-300 uppercase tracking-tight">
              <div className="text-[#00F0FF] p-1.5 bg-[#00F0FF]/10 rounded-lg">{item.icon}</div>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setStep('custodial-choice'); }}
        className="w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest bg-[#00F0FF] text-black hover:scale-[1.02] shadow-[0_0_40px_rgba(0,240,255,0.2)]"
      >
        Configure Vault
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0A0F0D]">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#C0FF00]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00F0FF]/5 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-6xl px-6 py-20">
        <AnimatePresence mode="wait">
          {step === 'selection' && (
            <motion.div
              key="selection"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter" style={{ letterSpacing: '-0.02em' }}>
                  Secure Your <span className="text-[#C0FF00]">Vault</span>
                </h1>
                <p className="text-gray-400 font-medium text-lg max-w-2xl mx-auto">
                  How would you like to sign your growth? Choose between full self-custody or our seamless managed vault.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 justify-items-center mt-12">
                <FlippingCard
                  frontContent={peraFront}
                  backContent={peraBack}
                />
                <FlippingCard
                  frontContent={custodialFront}
                  backContent={custodialBack}
                />
              </div>

              {error && (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold text-center">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {step === 'custodial-choice' && (
            <motion.div
              key="custodial-choice"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-xl mx-auto space-y-8"
            >
              <button 
                onClick={() => setStep('selection')}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase font-bold text-xs tracking-widest"
              >
                <ArrowLeft size={14} /> Back to selection
              </button>
              
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">Silent Vault <span className="text-[#00F0FF] not-italic">Setup</span></h2>
                <p className="text-gray-400">Generate a new secure vault or import your existing one.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <button
                  onClick={handleCustodialCreate}
                  disabled={isLoading}
                  className="group relative overflow-hidden p-8 rounded-3xl bg-[#141C18] border border-white/5 hover:border-[#00F0FF]/30 transition-all text-left"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase italic">Create New Vault</h3>
                      <p className="text-gray-500 text-sm mt-1">We'll generate a secure Algorand account for you.</p>
                    </div>
                    {isLoading ? <Loader2 size={24} className="animate-spin text-[#00F0FF]" /> : <Zap size={24} className="text-[#00F0FF] group-hover:scale-110 transition-transform" />}
                  </div>
                </button>

                <button
                  onClick={() => setStep('custodial-import')}
                  className="group relative overflow-hidden p-8 rounded-3xl bg-[#141C18] border border-white/5 hover:border-[#00F0FF]/30 transition-all text-left"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase italic">Import Existing</h3>
                      <p className="text-gray-500 text-sm mt-1">Use your existing 25-word mnemonic phrase.</p>
                    </div>
                    <Key size={24} className="text-[#00F0FF] group-hover:scale-110 transition-transform" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'custodial-create' && (
            <motion.div
              key="custodial-create"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-2xl mx-auto space-y-8 bg-[#141C18] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#00F0FF]/5 blur-[100px] rounded-full" />
              
              <div className="text-center space-y-6 relative">
                <div className="flex justify-center">
                  <div className="p-4 rounded-2xl bg-[#00F0FF]/10 text-[#00F0FF]">
                    <ShieldCheck size={48} />
                  </div>
                </div>
                <h2 className="text-3xl font-black text-white uppercase italic">Secure Your <span className="text-[#00F0FF] not-italic">Keys</span></h2>
                <p className="text-gray-400 text-sm max-w-sm mx-auto font-medium">
                  This 25-word phrase is the ONLY way to recover your vault. Write it down and keep it somewhere safe. <span className="text-red-400 font-bold">Never share this.</span>
                </p>

                <div className="relative p-6 rounded-2xl bg-black/40 border border-white/5 font-mono text-sm leading-relaxed text-[#00F0FF] group">
                  {mnemonic}
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#00F0FF]/5 border border-[#00F0FF]/10 text-left">
                  <input 
                    type="checkbox" 
                    id="confirm-mnemonic" 
                    checked={hasConfirmedMnemonic}
                    onChange={(e) => setHasConfirmedMnemonic(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-[#00F0FF] focus:ring-[#00F0FF]"
                  />
                  <label htmlFor="confirm-mnemonic" className="text-xs font-bold text-gray-300 uppercase tracking-tight cursor-pointer">
                    I have safely stored my 25-word recovery phrase.
                  </label>
                </div>

                <button
                  onClick={() => setStep('success')}
                  disabled={!hasConfirmedMnemonic}
                  className="w-full py-4 bg-[#00F0FF] text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.2)] hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2"
                >
                  Finalize Vault <ArrowRight size={20} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'custodial-import' && (
            <motion.div
              key="custodial-import"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-xl mx-auto space-y-8"
            >
              <button 
                onClick={() => setStep('custodial-choice')}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase font-bold text-xs tracking-widest"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">Import <span className="text-[#00F0FF] not-italic">Vault</span></h2>
                <p className="text-gray-400">Enter your 25-word recovery phrase below.</p>
              </div>

              <div className="space-y-6">
                <textarea
                  value={importMnemonic}
                  onChange={(e) => setImportMnemonic(e.target.value)}
                  placeholder="word1 word2 word3..."
                  className="w-full h-32 p-6 rounded-3xl bg-[#141C18] border border-white/10 text-[#00F0FF] font-mono text-sm focus:border-[#00F0FF]/50 outline-none transition-all resize-none"
                />

                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCustodialImport}
                  disabled={isLoading || !importMnemonic.trim()}
                  className="w-full py-4 bg-[#00F0FF] text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.2)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Verify & Import"}
                  <ArrowRight size={20} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-12"
            >
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#C0FF00] blur-[80px] opacity-20 rounded-full animate-pulse" />
                  <div className="relative bg-[#141C18] border-2 border-[#C0FF00]/50 w-40 h-40 rounded-[3.5rem] flex items-center justify-center rotate-12">
                    <CheckCircle2 size={80} className="text-[#C0FF00] -rotate-12" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-7xl font-black text-white italic uppercase tracking-tighter leading-none">Vault <br /><span className="text-[#C0FF00] not-italic">Armed</span></h2>
                <p className="text-gray-400 text-xl font-medium tracking-tight max-w-lg mx-auto">
                  Security protocols established. Your financial fortress is now fully operational on the Algorand blockchain.
                </p>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="group w-full md:w-96 py-6 bg-gradient-to-r from-[#C0FF00] to-[#00F0FF] text-black font-black text-xl uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_60px_rgba(192,255,0,0.4)] flex items-center justify-center gap-4 mt-8"
              >
                Enter Dashboard <ArrowRight size={28} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
