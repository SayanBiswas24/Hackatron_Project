import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  Coins, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Gift
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface WithdrawalModalProps {
  goal: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ goal, isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'status' | 'processing' | 'success'>('status');
  
  // Logic from Smart Contract: Saved >= Target OR Now >= Deadline
  const isUnlocked = goal.saved >= goal.target || new Date() >= new Date(goal.deadline);
  const remainingAmount = Math.max(0, goal.target - goal.saved);

  const handleWithdraw = () => {
    setStep('processing');
    
    // Simulate Smart Contract Withdrawal Execution
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    }, 4000);
  };

  const handleClose = () => {
    setStep('status');
    onClose();
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-md bg-[#0A0F0D] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
          >
            {/* Header Accent */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 blur-[30px]"
              style={{ background: isUnlocked ? '#C0FF00' : '#FF3B30' }}
            />

            <div className="p-10 pt-12 text-center space-y-8">
               <AnimatePresence mode="wait">
                  {step === 'status' && (
                    <motion.div 
                      key="status"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                       <div className="flex justify-center">
                          <div className={cn(
                            "relative w-24 h-24 rounded-3xl flex items-center justify-center border-2 transition-all duration-500",
                            isUnlocked ? "bg-[#C0FF00]/10 border-[#C0FF00] shadow-[0_0_50px_rgba(192,255,0,0.2)]" : "bg-red-500/5 border-red-500/20"
                          )}>
                             {isUnlocked ? (
                               <Unlock className="text-[#C0FF00] animate-bounce" size={40} />
                             ) : (
                               <Lock className="text-red-500" size={40} />
                             )}
                             <div className="absolute -top-3 -right-3 p-2 bg-black border border-white/10 rounded-xl">
                                <Coins size={14} className={isUnlocked ? "text-[#C0FF00]" : "text-gray-500"} />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                            Vault {isUnlocked ? <span className="text-[#C0FF00] not-italic">Ready</span> : <span className="text-red-500 not-italic">Locked</span>}
                          </h2>
                          <p className="text-sm text-gray-500 font-medium max-w-[250px] mx-auto">
                            {isUnlocked 
                              ? "Smart contract conditions met. You can now liquidate your goal funds." 
                              : "This goal is locked to prevent impulsive spending until your target is reached."}
                          </p>
                       </div>

                       {!isUnlocked && (
                          <div className="flex flex-col gap-3 p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                             <div className="flex justify-between items-center text-[0.65rem] font-bold uppercase tracking-widest text-gray-500">
                                <span>Remaining Fund</span>
                                <span className="text-white">₹{remainingAmount.toLocaleString()}</span>
                             </div>
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-500/50" 
                                  style={{ width: `${(goal.saved / goal.target) * 100}%` }}
                                />
                             </div>
                          </div>
                       )}

                       <div className="pt-4 flex flex-col gap-3">
                          {isUnlocked ? (
                            <button 
                              onClick={handleWithdraw}
                              className="w-full py-5 bg-[#C0FF00] text-black font-black text-sm uppercase tracking-widest rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(192,255,0,0.2)] flex items-center justify-center gap-3"
                            >
                               Claim Vault Funds <ArrowRight size={20} strokeWidth={3} />
                            </button>
                          ) : (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-left">
                               <AlertCircle size={18} className="text-red-500 shrink-0" />
                               <p className="text-[0.65rem] font-bold text-red-500 uppercase tracking-widest leading-relaxed">
                                 Transaction Reverted: On-chain conditions not met.
                               </p>
                            </div>
                          )}
                          <button 
                            onClick={handleClose}
                            className="w-full py-4 text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors"
                          >
                             Keep Strategy Active
                          </button>
                       </div>
                    </motion.div>
                  )}

                  {step === 'processing' && (
                    <motion.div 
                      key="processing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 space-y-8"
                    >
                       <div className="flex justify-center">
                          <div className="relative">
                             <Loader2 className="text-[#C0FF00] animate-spin" size={80} strokeWidth={2} />
                             <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={32} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Liquidating <span className="text-[#00F0FF] not-italic">Vault</span></h3>
                          <div className="flex flex-col items-center gap-2">
                             <p className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-[#C0FF00]" /> Scanning Multi-Goal Box
                             </p>
                             <p className="text-[0.65rem] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin text-[#00F0FF]" /> Broadcasting Inner Assets
                             </p>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 space-y-8"
                    >
                       <div className="flex justify-center">
                          <div className="w-24 h-24 bg-[#C0FF00] rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(192,255,0,0.4)]">
                             <Gift className="text-black" size={48} strokeWidth={2.5} />
                          </div>
                       </div>
                       <div className="space-y-2 text-center">
                          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Goal <span className="text-[#C0FF00] not-italic">Crushed</span></h3>
                          <p className="text-xs text-gray-500 font-medium">Funds successfully released to your primary wallet.</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3 justify-center text-[0.65rem] font-black text-[#C0FF00] uppercase tracking-widest">
                          <CheckCircle2 size={16} /> Transaction Finalized
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

export default WithdrawalModal;
