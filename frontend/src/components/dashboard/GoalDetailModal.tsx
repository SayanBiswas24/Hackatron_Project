import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, Clock, History, AlertTriangle, CheckCircle, ArrowUpRight, Zap, Target } from 'lucide-react';
import type { Goal } from './GoalCard';
import DepositModal from './DepositModal';
import WithdrawalModal from './WithdrawalModal';
import AutomationModal from './AutomationModal';

interface GoalDetailModalProps {
   goal: Goal | null;
   isOpen: boolean;
   onClose: () => void;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ goal, isOpen, onClose }) => {
   const [isDepositModalOpen, setIsDepositModalOpen] = React.useState(false);
   const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = React.useState(false);
   const [isAutomationModalOpen, setIsAutomationModalOpen] = React.useState(false);

   if (!goal) return null;

   const progress = Math.min(100, Math.round((Number(goal.saved) / Number(goal.target)) * 100));

   return (
      <AnimatePresence>
         {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               {/* Overlay */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
               />

               {/* Modal Content */}
               <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-2xl bg-[#0E1411] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
               >
                  {/* Header / Accent Colors */}
                  <div
                     className="absolute top-0 left-0 right-0 h-1.5 opacity-60"
                     style={{ background: goal.color }}
                  />

                  {/* Top Bar */}
                  <div className="flex items-center justify-between p-6 pb-0">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                           <goal.icon size={22} style={{ color: goal.color }} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-white tracking-tight">{goal.name}</h2>
                           <p className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              <Clock size={12} /> Vault active since {goal.createdAt}
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-8 space-y-8">
                     {/* Hero Stats */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                           <span className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest mb-1 block">Total Balance</span>
                           <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-white tracking-tighter">₹{(Number(goal.saved) / 1000000).toLocaleString()}</span>
                              <span className="text-[0.65rem] text-neon-lime font-bold">LIVE</span>
                           </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                           <span className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest mb-1 block">Target Amount</span>
                           <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-white tracking-tighter">₹{(Number(goal.target) / 1000000).toLocaleString()}</span>
                              <span className="text-[0.65rem] text-gray-600 font-bold">GOAL</span>
                           </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#C0FF00]/5 border border-[#C0FF00]/10">
                           <span className="text-[0.6rem] font-black text-[#C0FF00] uppercase tracking-widest mb-1 block">Yield Generated</span>
                           <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-[#C0FF00] tracking-tighter">+₹{(Number(goal.yieldEarned) / 1000000).toLocaleString()}</span>
                              <span className="text-[0.65rem] text-[#C0FF00]/60 font-bold">APY 8.4%</span>
                           </div>
                        </div>
                     </div>

                     {/* Timeline & Details */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 rounded-lg bg-white/[0.05] text-purple-400">
                                    <Calendar size={18} />
                                 </div>
                                 <div className="">
                                    <p className="text-[0.65rem] text-gray-500 font-black uppercase tracking-widest">Final Deadline</p>
                                    <p className="text-sm font-bold text-white">{goal.deadline}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="p-2 rounded-lg bg-white/[0.05] text-orange-400">
                                    <AlertTriangle size={18} />
                                 </div>
                                 <div className="">
                                    <p className="text-[0.65rem] text-gray-500 font-black uppercase tracking-widest">Next Deposit Before</p>
                                    <p className="text-sm font-bold text-white">15th April 2026</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="p-2 rounded-lg bg-white/[0.05] text-blue-400">
                                    <History size={18} />
                                 </div>
                                 <div className="">
                                    <p className="text-[0.65rem] text-gray-500 font-black uppercase tracking-widest">Last Deposit</p>
                                    <p className="text-sm font-bold text-white">{goal.lastDeposit}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex justify-between items-end mb-2">
                              <span className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest">Completion Progress</span>
                              <span className="text-sm font-black text-[#C0FF00]">{progress}%</span>
                           </div>
                           <div className="h-4 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden p-1">
                              <div
                                 className="h-full rounded-full transition-all duration-1000 ease-out"
                                 style={{
                                    background: goal.color,
                                    width: `${progress}%`,
                                    boxShadow: `0 0 10px ${goal.color}66`
                                 }}
                              />
                           </div>
                           <p className="text-[0.65rem] text-gray-500 italic text-center">
                              You need ₹{(Math.max(0, Number(goal.target) - Number(goal.saved)) / 1000000).toLocaleString()} more to reach your goal.
                           </p>
                        </div>
                     </div>

                     {/* Activity Log Preview */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <History size={14} /> Recent Vault Transactions
                           </h4>
                           <button className="text-[0.6rem] font-bold text-[#C0FF00] hover:underline uppercase">View Full History</button>
                        </div>
                        <div className="space-y-2">
                           {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                                 <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded bg-green-500/10 text-green-400">
                                       <DollarSign size={14} />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-white">Deposit</p>
                                       <p className="text-[0.6rem] text-gray-500">24 Mar 2026 • 11:24 AM</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs font-black text-white font-mono">+₹{(5000 * i).toLocaleString()}</p>
                                    <p className="text-[0.55rem] text-gray-600 font-bold flex items-center gap-1 justify-end uppercase">
                                       <CheckCircle size={10} /> Confirmed
                                    </p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                           onClick={() => setIsDepositModalOpen(true)}
                           className="flex-1 py-4 rounded-2xl bg-[#C0FF00] text-black font-black text-[0.7rem] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                           <ArrowUpRight size={16} strokeWidth={3} /> Deposit Now
                        </button>
                        <button 
                           onClick={() => setIsWithdrawalModalOpen(true)}
                           className="flex-1 py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-black text-[0.7rem] uppercase tracking-widest hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
                        >
                           <Target size={16} /> Withdraw Funds
                        </button>
                        <button 
                           onClick={() => setIsAutomationModalOpen(true)}
                           className="p-4 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-all flex items-center justify-center"
                           title="Automation Settings"
                        >
                           <Zap size={20} strokeWidth={2.5} />
                        </button>
                     </div>
                  </div>
               </motion.div>

               <DepositModal 
                  goal={goal}
                  isOpen={isDepositModalOpen}
                  onClose={() => setIsDepositModalOpen(false)}
                  onSuccess={(amount) => {
                     console.log(`Deposited ${amount} to ${goal.name}`);
                  }}
               />

               <WithdrawalModal 
                  goal={goal}
                  isOpen={isWithdrawalModalOpen}
                  onClose={() => setIsWithdrawalModalOpen(false)}
                  onSuccess={() => {
                     console.log(`Withdrawn funds from ${goal.name}`);
                  }}
               />

               <AutomationModal 
                  goal={goal}
                  isOpen={isAutomationModalOpen}
                  onClose={() => setIsAutomationModalOpen(false)}
                  onUpdate={(settings) => {
                     console.log(`Updated automation for ${goal.name}`, settings);
                  }}
               />
            </div>
         )}
      </AnimatePresence>
   );
};

export default GoalDetailModal;
