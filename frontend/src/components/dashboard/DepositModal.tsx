import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowUpRight, 
  Coins, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface DepositModalProps {
  goal: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ goal, isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [walletType] = useState<'pera' | 'custodial'>(Math.random() > 0.5 ? 'custodial' : 'pera');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setStep('processing');

    // Simulate Smart Contract Deposit Execution
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess(parseFloat(amount));
        handleClose();
      }, 1500);
    }, 3500);
  };

  const handleClose = () => {
    setAmount('');
    setStep('form');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#141C18] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                  Deposit <span className="text-[#00F0FF] not-italic">USDC</span>
                </h2>
                <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C0FF00]" />
                      <span className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest">{goal.name}</span>
                   </div>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-colors"
                disabled={step === 'processing'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 pt-6">
              <AnimatePresence mode="wait">
                {step === 'form' && (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-end ml-1">
                         <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">Amount to Save</label>
                         <span className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-tighter">Balance: 1,240.50 USDC</span>
                      </div>
                      <div className="relative group">
                        <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00F0FF]" />
                        <input 
                          required
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-16 py-5 text-xl font-black text-white focus:border-[#00F0FF]/50 outline-none transition-all placeholder:text-gray-800"
                        />
                        <button 
                          type="button"
                          onClick={() => setAmount('100')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] text-[0.6rem] font-black uppercase tracking-widest border border-[#00F0FF]/20 hover:bg-[#00F0FF]/20 transition-all"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    {/* Transaction Context */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                       <div className="flex justify-between text-[0.65rem] font-bold uppercase tracking-widest text-gray-500">
                          <span>Network Fee</span>
                          <span className="text-gray-400">~ 0.001 ALGO</span>
                       </div>
                       <div className="flex justify-between text-[0.65rem] font-bold uppercase tracking-widest text-gray-500">
                          <span>Route</span>
                          <span className="text-gray-400 flex items-center gap-1">
                             {walletType === 'custodial' ? 'Silent Facilitator' : 'Pera Signer'} <ShieldCheck size={12} className="text-[#C0FF00]" />
                          </span>
                       </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-5 bg-[#00F0FF] text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      Confirm Deposit <ArrowUpRight size={18} strokeWidth={3} />
                    </button>
                  </motion.form>
                )}

                {step === 'processing' && (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="relative">
                       <Loader2 className="text-[#00F0FF] animate-spin" size={64} strokeWidth={3} />
                       <Coins className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C0FF00] animate-pulse" size={24} />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                         {walletType === 'custodial' ? 'Silent Signing' : 'Awaiting Signature'}
                       </h3>
                       <p className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest">
                         {walletType === 'custodial' 
                           ? 'Facilitator is broadcasting USDC transfer...' 
                           : 'Please confirm the transaction in your Pera Wallet App.'}
                       </p>
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-24 h-24 bg-[#00F0FF]/10 border border-[#00F0FF] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.25)]">
                       <CheckCircle2 className="text-[#C0FF00]" size={48} strokeWidth={3} />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Saved <span className="text-[#C0FF00] not-italic">${amount}</span></h3>
                       <p className="text-xs text-gray-500 font-medium">Funds successfully locked in vault.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DepositModal;
