import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Clock, TrendingUp, Calendar, ChevronRight, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export interface Goal {
   id: string | number;
   onChainGoalId: number;
   name: string;
   target: number;
   saved: number;
   color: string;
   icon: LucideIcon;
   createdAt: string;
   deadline: string;
   frequency: string;
   lastDeposit: string;
   status: string;
   yieldEarned: number;
   consecutiveMonths: number;
   lastIncentiveAt: string | null;
   completedCreditedAt?: string | null;
}

interface GoalCardProps {
   goal: Goal;
   onClick: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
   const { formatINR, formatUSDC } = useCurrency();
   const progress = Math.min(100, Math.round((Number(goal.saved) / Number(goal.target)) * 100));

   const savedUsdc = Number(goal.saved);
   const targetUsdc = Number(goal.target);
   const yieldUsdc = Number(goal.yieldEarned);

   const isCompleted = goal.status === 'completed';

   if (isCompleted) {
      return (
         <Card
            className="group bg-[#141C18] border-[#C0FF00]/20 hover:border-[#C0FF00]/40 transition-all duration-500 cursor-pointer overflow-hidden relative"
            onClick={() => onClick(goal)}
         >
            {/* Completion glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#C0FF00]/5 via-transparent to-yellow-400/5 pointer-events-none" />
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-[100px] bg-[#C0FF00]/20 pointer-events-none" />

            <CardContent className="p-6 relative z-10">
               {/* Header */}
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/30 group-hover:scale-110 transition-transform duration-500 relative">
                        <goal.icon size={24} style={{ color: '#C0FF00' }} strokeWidth={1.5} />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#C0FF00] rounded-full flex items-center justify-center">
                           <CheckCircle2 size={10} className="text-black" strokeWidth={3} />
                        </div>
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{goal.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[0.65rem] font-bold text-gray-500 flex items-center gap-1 uppercase">
                              <Calendar size={10} /> Created {goal.createdAt}
                           </span>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <div className="px-2 py-1 rounded-lg bg-[#C0FF00]/15 border border-[#C0FF00]/30 text-[0.6rem] font-black text-[#C0FF00] uppercase tracking-tighter flex items-center gap-1">
                        <Trophy size={10} />
                        VAULT COMPLETE
                     </div>
                  </div>
               </div>

               {/* Progress values */}
               <div className="flex justify-between items-end mb-3">
                  <div>
                     <p className="text-[0.65rem] text-gray-500 font-black uppercase tracking-widest mb-1.5 opacity-60">Final Balance</p>
                     <div className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-2xl font-black tracking-tighter text-[#C0FF00]">{formatINR(savedUsdc)}</span>
                        <span className="text-[0.65rem] text-gray-600 font-bold uppercase tracking-widest">/ {formatINR(targetUsdc, true)}</span>
                     </div>
                  </div>
                  <span className="text-xl font-black text-[#C0FF00] tracking-tighter">100%</span>
               </div>

               {/* Full progress bar */}
               <div className="relative h-2 w-full bg-white/5 border border-[#C0FF00]/20 rounded-full overflow-hidden mb-4">
                  <div
                     className="h-full rounded-full w-full"
                     style={{ background: 'linear-gradient(90deg, #C0FF0055, #C0FF00)', boxShadow: '0 0 20px rgba(192,255,0,0.5)' }}
                  >
                     <div className="w-1 h-full bg-white/30 animate-pulse float-right" />
                  </div>
               </div>

               {/* Auto-credited confirmation */}
               <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20">
                  <Sparkles size={14} className="text-[#C0FF00]" />
                  <span className="text-[0.65rem] font-black text-[#C0FF00] uppercase tracking-widest">Funds Auto-Credited to Wallet</span>
               </div>
            </CardContent>
         </Card>
      );
   }

   return (
      <Card
         onClick={() => onClick(goal)}
         className="group bg-[#141C18] border-white/5 hover:border-[#C0FF00]/30 transition-all duration-500 cursor-pointer overflow-hidden relative"
      >
         {/* Ambient background glow */}
         <div
            className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-[80px] transition-all duration-700 opacity-5 group-hover:opacity-20"
            style={{ background: goal.color }}
         />

         <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 group-hover:scale-110 transition-transform duration-500">
                     <goal.icon size={24} style={{ color: goal.color }} strokeWidth={1.5} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white tracking-tight">{goal.name}</h3>
                     <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[0.65rem] font-bold text-gray-500 flex items-center gap-1 uppercase">
                           <Calendar size={10} /> Created {goal.createdAt}
                        </span>
                        {goal.consecutiveMonths > 0 && (
                           <span className="text-[0.6rem] font-black text-[#C0FF00] flex items-center gap-1 bg-[#C0FF00]/10 px-1.5 py-0.5 rounded border border-[#C0FF00]/20 animate-pulse">
                              🔥 {goal.consecutiveMonths} MO STREAK
                           </span>
                        )}
                     </div>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                  <div className="px-2 py-0.5 rounded bg-[#C0FF00]/10 border border-[#C0FF00]/20 text-[0.6rem] font-black text-[#C0FF00] uppercase tracking-tighter">
                     {goal.status === 'active' ? 'Live on Chain' : goal.status}
                  </div>
                  <span className="text-[0.6rem] font-bold text-gray-500 mt-2 flex items-center gap-1 uppercase">
                     <Clock size={10} /> {goal.frequency} Plan
                  </span>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <div>
                     <p className="text-[0.65rem] text-gray-500 font-black uppercase tracking-widest mb-1.5 opacity-60">Current Progress</p>
                     <div className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-2xl font-black tracking-tighter text-white">{formatINR(savedUsdc)}</span>
                        <span className="text-[0.65rem] text-gray-600 font-bold uppercase tracking-widest">/ {formatINR(targetUsdc, true)}</span>
                     </div>
                     <p className="text-[0.55rem] text-gray-600 font-bold uppercase tracking-widest mt-1">
                        ≈ {formatUSDC(savedUsdc)}
                     </p>
                  </div>
                  <div className="text-right">
                     <span className="text-xl font-black text-white tracking-tighter">{progress}%</span>
                     <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 justify-end text-[0.65rem] text-green-400 font-bold uppercase">
                           <TrendingUp size={10} /> +{formatINR(yieldUsdc)} Yield
                        </div>
                        <p className="text-[0.55rem] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
                           ≈ {formatUSDC(yieldUsdc)}
                        </p>
                     </div>
                  </div>
               </div>

               <div className="relative h-2 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden">
                  <div
                     className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end"
                     style={{
                        background: `linear-gradient(90deg, ${goal.color}33, ${goal.color})`,
                        width: `${progress}%`,
                        boxShadow: `0 0 15px ${goal.color}44`
                      }}
                  >
                     <div className="w-1 h-full bg-white/20 animate-pulse" />
                  </div>
               </div>

               <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-4">
                     <div>
                        <p className="text-[0.55rem] text-gray-600 font-bold uppercase tracking-widest leading-none mb-1">Deadline</p>
                        <p className="text-[0.7rem] text-white font-bold">{goal.deadline}</p>
                     </div>
                     <div className="w-px h-6 bg-white/10" />
                     <div>
                        <p className="text-[0.55rem] text-gray-600 font-bold uppercase tracking-widest leading-none mb-1">Last Deposit</p>
                        <p className="text-[0.7rem] text-white font-bold">{goal.lastDeposit}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-1 text-[0.65rem] font-black text-[#C0FF00] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     DETAILS <ChevronRight size={14} />
                  </div>
               </div>
            </div>
         </CardContent>
      </Card>
   );
};

export default GoalCard;
