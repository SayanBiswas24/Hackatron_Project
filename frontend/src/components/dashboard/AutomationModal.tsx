import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Zap, 
  IndianRupee, 
  Calendar, 
  Clock, 
  Loader2, 
  Pause, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

interface AutomationModalProps {
  goal: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedGoal: any) => void;
}

const AutomationModal: React.FC<AutomationModalProps> = ({ goal, isOpen, onClose, onUpdate }) => {
  const [autopayAmount, setAutopayAmount] = useState('10');
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [step, setStep] = useState<'settings' | 'saving' | 'success'>('settings');
  const [error, setError] = useState<string | null>(null);

  const userId = localStorage.getItem('ps_user_id');

  useEffect(() => {
    if (goal) {
      setAutopayEnabled(!!goal.autopayEnabled);
      if (goal.autopayAmount) {
        setAutopayAmount((Number(goal.autopayAmount) / 1000000).toString());
      }
    }
  }, [goal]);

  const handleSave = async () => {
    if (!userId || !goal) return;
    
    setStep('saving');
    setError(null);

    try {
      const result = await api.updateAutopay({
        userId,
        onChainGoalId: goal.onChainId || goal.onChainGoalId,
        autopayEnabled,
        autopayAmount: parseFloat(autopayAmount)
      });
      
      setStep('success');
      setTimeout(() => {
        onUpdate(result);
        setStep('settings');
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Autopay update error:", err);
      setError(err.message || "Failed to update autopay settings.");
      setStep('settings');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-lg bg-[#0E1411] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                  Savings <span className="text-[#00F0FF] not-italic">Habits</span>
                </h2>
                <div className="flex items-center gap-2">
                   <div className="p-1 px-3 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                      <span className="text-[0.6rem] font-black text-[#00F0FF] uppercase tracking-widest">Vault Automation Enabled</span>
                   </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-colors"
                disabled={step === 'saving'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-10 pt-8">
              <AnimatePresence mode="wait">
                {step === 'settings' && (
                  <motion.div 
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {/* Policy Info */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
                       <div className="p-2.5 rounded-xl bg-white/5 text-gray-400">
                          <Calendar size={18} />
                       </div>
                       <div>
                          <p className="text-[0.55rem] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Schedule Policy</p>
                          <p className="text-[0.7rem] font-bold text-white uppercase italic">Monthly Cycle Only</p>
                       </div>
                    </div>

                    {/* Habit Amount */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end ml-1">
                        <label className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest">Monthly Target (USDC)</label>
                        <span className="text-[0.6rem] font-bold text-gray-600 uppercase tracking-tighter">Deducted every 30 days</span>
                      </div>
                      <div className="relative group">
                        <IndianRupee size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00F0FF]" />
                        <input 
                          type="number"
                          value={autopayAmount}
                          onChange={(e) => setAutopayAmount(e.target.value)}
                          className="w-full bg-black/40 border-2 border-white/5 rounded-3xl pl-14 pr-4 py-5 text-xl font-black text-white focus:border-[#00F0FF]/40 outline-none transition-all placeholder:text-gray-800"
                        />
                      </div>
                    </div>

                    {/* Autopay Toggle */}
                    <div className={cn(
                        "p-6 rounded-[2.5rem] border transition-all flex items-center justify-between",
                        autopayEnabled ? "bg-[#C0FF00]/10 border-[#C0FF00]/30" : "bg-white/[0.03] border-white/5"
                    )}>
                       <div className="space-y-1">
                          <p className="text-sm font-black text-white uppercase italic tracking-tight">Vault Autopay</p>
                          <p className="text-[0.6rem] text-gray-500 font-medium tracking-tight">Enable automatic monthly contributions.</p>
                       </div>
                       <button 
                         onClick={() => setAutopayEnabled(!autopayEnabled)}
                         className={cn(
                           "flex items-center gap-2 p-1.5 rounded-full px-4 text-[0.6rem] font-black uppercase tracking-widest transition-all",
                           autopayEnabled 
                             ? "bg-[#C0FF00] text-black shadow-[0_0_20px_rgba(192,255,0,0.2)]" 
                             : "bg-white/10 text-gray-500"
                         )}
                       >
                         {autopayEnabled ? <Zap size={12} strokeWidth={4} /> : <Pause size={12} strokeWidth={4} />}
                         {autopayEnabled ? 'Enabled' : 'Paused'}
                       </button>
                    </div>

                    {error && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[0.65rem] font-bold">
                        {error}
                      </div>
                    )}

                    <button 
                      onClick={handleSave}
                      className="w-full py-5 bg-[#00F0FF] text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                       Apply Habit Strategy <ArrowRight size={20} strokeWidth={3} />
                    </button>
                    
                    <p className="text-[0.5rem] text-center text-gray-600 font-medium px-4">
                       * If you manually deposit your target amount earlier, the monthly autopay will be skipped to keep your budget on track.
                    </p>
                  </motion.div>
                )}

                {step === 'saving' && (
                  <motion.div 
                    key="saving"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 space-y-10 flex flex-col items-center text-center"
                  >
                     <div className="relative">
                        <Loader2 className="text-[#00F0FF] animate-spin" size={80} strokeWidth={2.5} />
                        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C0FF00]" size={32} strokeWidth={2.5} />
                     </div>
                     <div className="space-y-3">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Updating <span className="text-[#C0FF00] not-italic">Messenger</span> Habits</h3>
                        <p className="text-[0.6rem] font-black text-gray-600 uppercase tracking-widest">Reconfiguring Vault Autopay permissions...</p>
                     </div>
                  </motion.div>
                )}

                {step === 'success' && (
                   <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 space-y-8 flex flex-col items-center text-center"
                   >
                     <div className="w-24 h-24 bg-[#C0FF00]/10 border border-[#C0FF00] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(192,255,0,0.3)]">
                       <ShieldCheck className="text-[#C0FF00]" size={48} strokeWidth={2.5} />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Strategy <span className="text-[#C0FF00] not-italic">Confirmed</span></h3>
                        <p className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest">Your automation habits have been synced.</p>
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

export default AutomationModal;
