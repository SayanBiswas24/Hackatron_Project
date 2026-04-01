import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Zap, 
  Repeat, 
  DollarSign, 
  Calendar, 
  Clock, 
  Loader2, 
  Pause, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AutomationModalProps {
  goal: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (settings: any) => void;
}

const AutomationModal: React.FC<AutomationModalProps> = ({ goal: _goal, isOpen, onClose, onUpdate }) => {
  const [habitAmount, setHabitAmount] = useState('10');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [isFacilitatorActive, setIsFacilitatorActive] = useState(true);
  const [step, setStep] = useState<'settings' | 'saving'>('settings');

  const handleSave = () => {
    setStep('saving');
    setTimeout(() => {
      onUpdate({ habitAmount, frequency, isFacilitatorActive });
      setStep('settings');
      onClose();
    }, 2000);
  };

  const frequencies = [
    { id: 'Daily', label: 'Every Day', icon: Sparkles },
    { id: 'Weekly', label: 'Every Week', icon: Repeat },
    { id: 'Monthly', label: 'Every Month', icon: Calendar },
  ];

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
                      <span className="text-[0.6rem] font-black text-[#00F0FF] uppercase tracking-widest">Silent Messenger Enabled</span>
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
                    {/* Frequency Selector */}
                    <div className="space-y-4">
                      <label className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest ml-1">Deposit Frequency</label>
                      <div className="grid grid-cols-3 gap-3">
                         {frequencies.map((freq) => (
                           <button 
                             key={freq.id}
                             onClick={() => setFrequency(freq.id as any)}
                             className={cn(
                               "p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 text-center",
                               frequency === freq.id 
                                 ? "bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.15)]" 
                                 : "bg-white/[0.02] border-white/5 hover:border-white/10"
                             )}
                           >
                              <freq.icon size={20} className={frequency === freq.id ? "text-[#00F0FF]" : "text-gray-500"} />
                              <span className={cn(
                                "text-[0.6rem] font-black uppercase tracking-tighter transition-colors",
                                frequency === freq.id ? "text-white" : "text-gray-600"
                              )}>{freq.id}</span>
                           </button>
                         ))}
                      </div>
                    </div>

                    {/* Habit Amount */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end ml-1">
                        <label className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest">Habit Amount (USDC)</label>
                        <span className="text-[0.6rem] font-bold text-gray-600 uppercase">Per {frequency.toLowerCase()}</span>
                      </div>
                      <div className="relative group">
                        <DollarSign size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00F0FF]" />
                        <input 
                          type="number"
                          value={habitAmount}
                          onChange={(e) => setHabitAmount(e.target.value)}
                          className="w-full bg-black/40 border-2 border-white/5 rounded-3xl pl-14 pr-4 py-5 text-xl font-black text-white focus:border-[#00F0FF]/40 outline-none transition-all placeholder:text-gray-800"
                        />
                      </div>
                    </div>

                    {/* Facilitator Toggle */}
                    <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-sm font-black text-white uppercase italic tracking-tight">Facilitated Auto-Saving</p>
                          <p className="text-[0.6rem] text-gray-500 font-medium tracking-tight">Allow Silent Messenger to auto-sign these habits.</p>
                       </div>
                       <button 
                         onClick={() => setIsFacilitatorActive(!isFacilitatorActive)}
                         className={cn(
                           "flex items-center gap-2 p-1.5 rounded-full px-4 text-[0.6rem] font-black uppercase tracking-widest transition-all",
                           isFacilitatorActive 
                             ? "bg-[#C0FF00] text-black shadow-[0_0_20px_rgba(192,255,0,0.2)]" 
                             : "bg-white/10 text-gray-500"
                         )}
                       >
                         {isFacilitatorActive ? <Zap size={12} strokeWidth={4} /> : <Pause size={12} strokeWidth={4} />}
                         {isFacilitatorActive ? 'Active' : 'Paused'}
                       </button>
                    </div>

                    {/* Projections */}
                    <div className="p-6 rounded-[2.5rem] bg-[#C0FF00]/5 border border-[#C0FF00]/10 flex items-center gap-5">
                       <div className="p-3 rounded-2xl bg-[#C0FF00]/10 text-[#C0FF00]">
                          <Clock size={24} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[0.6rem] font-black text-[#C0FF00] uppercase tracking-widest">Velocity Impact</p>
                          <p className="text-xs text-gray-400 font-medium">With ₹{habitAmount} {frequency}, you reach your goal <span className="text-white font-bold italic">14 days sooner</span>.</p>
                       </div>
                    </div>

                    <button 
                      onClick={handleSave}
                      className="w-full py-5 bg-[#00F0FF] text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                       Confirm Habit Strategy <ArrowRight size={20} strokeWidth={3} />
                    </button>
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
                        <p className="text-[0.6rem] font-black text-gray-600 uppercase tracking-widest">Reconfiguring Silent Facilitator permissions...</p>
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
