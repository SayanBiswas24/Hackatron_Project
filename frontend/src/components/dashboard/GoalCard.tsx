import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Clock, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
}

interface GoalCardProps {
   goal: Goal;
   onClick: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
   const progress = Math.min(100, Math.round((Number(goal.saved) / Number(goal.target)) * 100));

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
                     <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black tracking-tighter text-white">₹{(Number(goal.saved) / 1000000).toLocaleString()}</span>
                        <span className="text-[0.7rem] text-gray-600 font-bold uppercase tracking-widest">/ ₹{(Number(goal.target) / 1000000).toLocaleString()}</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className="text-xl font-black text-white tracking-tighter">{progress}%</span>
                     <div className="flex items-center gap-1 justify-end text-[0.65rem] text-green-400 font-bold uppercase">
                        <TrendingUp size={10} /> +₹{(Number(goal.yieldEarned) / 1000000).toLocaleString()} Yield
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
