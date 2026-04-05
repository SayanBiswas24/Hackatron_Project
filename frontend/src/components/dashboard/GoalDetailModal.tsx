import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  DollarSign, 
  Clock, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight, 
  Zap, 
  Target,
  RefreshCw,
  Loader2
} from 'lucide-react';
import type { Goal } from './GoalCard';
import DepositModal from './DepositModal';
import WithdrawalModal from './WithdrawalModal';
import AutomationModal from './AutomationModal';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

interface GoalDetailModalProps {
   goal: Goal | null;
   isOpen: boolean;
   onClose: () => void;
   onRefresh?: () => void;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ goal, isOpen, onClose, onRefresh }) => {
   const { formatINR, formatUSDC } = useCurrency();
   const [isDepositModalOpen, setIsDepositModalOpen] = React.useState(false);
   const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = React.useState(false);
   const [isAutomationModalOpen, setIsAutomationModalOpen] = React.useState(false);
   
   const [activities, setActivities] = React.useState<any[]>([]);
   const [loadingActivity, setLoadingActivity] = React.useState(false);
   const userId = localStorage.getItem('ps_user_id');

   const fetchActivity = async () => {
      if (!userId || !goal) return;
      try {
         setLoadingActivity(true);
         const data = await api.fetchGoalActivity(userId, goal.onChainGoalId);
         setActivities(data);
      } catch (err) {
         console.error('Failed to fetch activities:', err);
      } finally {
         setLoadingActivity(false);
      }
   };

   React.useEffect(() => {
      if (isOpen && goal) {
         fetchActivity();
      }
   }, [isOpen, goal?.id]);

   if (!goal) return null;

   const progress = Math.min(100, Math.round((Number(goal.saved) / Number(goal.target)) * 100));

   const savedUsdc = Number(goal.saved);
   const targetUsdc = Number(goal.target);
   const remainingUsdc = Math.max(0, targetUsdc - savedUsdc);

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
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                           <span className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest mb-1 block leading-none">Total Balance</span>
                           <div className="flex flex-col">
                              <div className="flex items-baseline gap-1 mt-1">
                                 <span className="text-xl font-black text-white tracking-tighter">{formatINR(savedUsdc)}</span>
                                 <span className="text-[0.65rem] text-neon-lime font-bold">LIVE</span>
                              </div>
                              <span className="text-[0.55rem] text-gray-600 font-bold uppercase tracking-widest mt-0.5">≈ {formatUSDC(savedUsdc)}</span>
                           </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                           <span className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest mb-1 block leading-none">Target Amount</span>
                           <div className="flex flex-col">
                              <div className="flex items-baseline gap-1 mt-1">
                                 <span className="text-xl font-black text-white tracking-tighter">{formatINR(targetUsdc)}</span>
                                 <span className="text-[0.65rem] text-gray-600 font-bold">GOAL</span>
                              </div>
                              <span className="text-[0.55rem] text-gray-600 font-bold uppercase tracking-widest mt-0.5">≈ {formatUSDC(targetUsdc)}</span>
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
                                    <p className="text-[0.65rem] text-gray-500 font-black uppercase tracking-widest">Vault Activity</p>
                                    <p className="text-sm font-bold text-white">{activities.length} Recorded Traces</p>
                                 </div>
                              </div>
                           </div>

                           {/* Incentive Status */}
                           {goal.consecutiveMonths > 0 && (
                             <div className="p-5 rounded-2xl bg-[#C0FF00]/5 border border-[#C0FF00]/20 space-y-3">
                               <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2 text-[#C0FF00]">
                                   <Zap size={18} fill="currentColor" />
                                   <span className="text-xs font-black uppercase tracking-widest">Consistency Bonus Active</span>
                                 </div>
                                 <span className="text-[0.6rem] font-bold text-[#C0FF00]/60 uppercase">{goal.consecutiveMonths} MO STREAK</span>
                               </div>
                               <div className="flex items-baseline gap-2">
                                 <span className="text-3xl font-black text-white tracking-tighter">+{Math.min(4.0, 0.5 * goal.consecutiveMonths).toFixed(1)}%</span>
                                 <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-widest leading-none">Bonus on your next deposit</span>
                               </div>
                               <p className="text-[0.55rem] text-gray-500 italic leading-snug">
                                 Your incentive grows by 0.5% every consecutive month you save. Max 4.0%.
                               </p>
                             </div>
                           )}
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
                              You need {formatINR(remainingUsdc)} more to reach your goal.
                           </p>
                        </div>
                     </div>

                     {/* Activity Log Preview */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <History size={14} /> Recent Vault Transactions
                           </h4>
                           <button onClick={fetchActivity} className="text-[0.65rem] font-bold text-[#C0FF00] hover:underline uppercase flex items-center gap-1 transition-all">
                              <RefreshCw size={12} className={loadingActivity ? 'animate-spin' : ''} /> Sync
                           </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                           {loadingActivity ? (
                              <div className="py-8 flex flex-col items-center gap-2">
                                 <Loader2 className="animate-spin text-gray-600" size={24} />
                                 <p className="text-[0.55rem] font-bold text-gray-600 uppercase tracking-widest">Fetching traces...</p>
                              </div>
                           ) : activities.length === 0 ? (
                              <div className="py-8 text-center bg-white/[0.02] border border-white/5 rounded-xl">
                                 <p className="text-[0.6rem] font-bold text-gray-600 uppercase tracking-widest italic">No transactions detected in this vault.</p>
                              </div>
                           ) : (
                              activities.map((a: any) => {
                                 const amountUsdc = Number(a.amount) / 1_000_000;
                                 const isPositive = a.type === 'deposit' || a.type === 'incentive';
                                 
                                 return (
                                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                                       <div className="flex items-center gap-3">
                                          <div className={cn(
                                             "p-1.5 rounded",
                                             a.type === 'deposit' ? "bg-[#C0FF00]/10 text-[#C0FF00]" : 
                                             a.type === 'incentive' ? "bg-cyan-500/10 text-cyan-400" :
                                             "bg-red-500/10 text-red-400"
                                          )}>
                                             {a.type === 'incentive' ? <Zap size={14} /> : <DollarSign size={14} />}
                                          </div>
                                          <div>
                                             <p className="text-xs font-bold text-white capitalize">{a.type}</p>
                                             <p className="text-[0.6rem] text-gray-500">{new Date(a.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                          </div>
                                       </div>
                                       <div className="flex flex-col items-end">
                                          <div className="flex flex-col items-end">
                                             <p className={cn(
                                                "text-xs font-black font-mono leading-none",
                                                isPositive ? "text-white" : "text-red-400"
                                             )}>
                                                {isPositive ? "+" : ""}{formatINR(amountUsdc)}
                                             </p>
                                             <p className="text-[0.55rem] text-gray-600 font-bold uppercase tracking-widest mt-1">≈ {formatUSDC(amountUsdc)}</p>
                                          </div>
                                          <p className="text-[0.55rem] text-gray-600 font-bold flex items-center gap-1 justify-end uppercase mt-1">
                                             <CheckCircle size={10} className="text-[#C0FF00]" /> Confirmed
                                          </p>
                                       </div>
                                    </div>
                                 );
                              })
                           )}
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
                     if (onRefresh) onRefresh();
                     fetchActivity(); // Refresh history immediately
                  }}
               />

               <WithdrawalModal 
                  goal={goal}
                  isOpen={isWithdrawalModalOpen}
                  onClose={() => setIsWithdrawalModalOpen(false)}
                  onSuccess={() => {
                     console.log(`Withdrawn funds from ${goal.name}`);
                     if (onRefresh) onRefresh();
                     fetchActivity();
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
