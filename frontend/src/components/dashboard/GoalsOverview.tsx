import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Target, Clock } from 'lucide-react';
import type { Goal } from './GoalCard';
import EmptyState from './EmptyState';
import { useCurrency } from '../../context/CurrencyContext';

const GoalsOverview: React.FC<{ goals: Goal[], onDepositClick: (goal: Goal) => void }> = ({ goals, onDepositClick }) => {
  const { formatINR } = useCurrency();
  const isEmpty = goals.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-white">
          Active Goals <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[0.65rem] text-gray-400 font-bold">{String(goals.length).padStart(2, '0')} Total</span>
        </h2>
        <button className="text-[0.65rem] font-bold text-[#C0FF00] hover:underline uppercase tracking-widest transition-all">
          View All Goals
        </button>
      </div>

      {isEmpty ? (
        <EmptyState type="goals" onCreateClick={() => window.dispatchEvent(new CustomEvent('open-create-goal'))} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100));
            return (
              <Card key={goal.id} className="relative overflow-hidden group border-white/5 bg-[#141C18] backdrop-blur-3xl hover:border-[#C0FF00]/20 transition-all duration-500">
                <div
                  className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-[80px] transition-all duration-700 opacity-10 group-hover:opacity-30"
                  style={{ background: goal.color }}
                />
                <CardContent className="p-6 relative z-10 flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-gray-400 group-hover:text-white transition-all duration-300">
                      <goal.icon size={22} strokeWidth={1.5} style={{ color: goal.color }} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[0.65rem] font-black text-[#C0FF00] tracking-tighter mb-1 uppercase">+{formatINR(goal.yieldEarned ?? 0)} Yield</span>
                      <span className="text-[0.6rem] font-bold text-gray-500 flex items-center gap-1 uppercase">
                        <Clock size={10} /> {goal.deadline}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight mb-1 group-hover:translate-x-1 transition-transform">{goal.name}</h3>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-gray-400 font-medium">Progress <span className="font-bold text-white">{progress}%</span></span>
                      <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-wider">{formatINR(goal.saved)} <span className="text-gray-700">/ {formatINR(goal.target, true)}</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ background: goal.color, width: `${progress}%`, boxShadow: `0 0 10px ${goal.color}66` }}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => onDepositClick(goal)}
                    className="w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-[0.65rem] font-black text-gray-400 hover:bg-[#C0FF00] hover:text-black hover:border-transparent transition-all uppercase tracking-widest shadow-xl"
                  >
                    Quick Deposit
                  </button>
                </CardContent>
              </Card>
            );
          })}
          {/* Add New Goal Card */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-create-goal'))}
            className="h-full min-h-[220px] rounded-2xl border-2 border-dashed border-white/5 bg-[#101614] backdrop-blur-3xl flex flex-col items-center justify-center gap-4 group hover:border-[#C0FF00]/40 transition-all duration-500"
          >
            <div className="p-4 rounded-full bg-white/[0.05] border border-white/10 text-gray-500 group-hover:text-[#C0FF00] group-hover:bg-[#C0FF00]/10 transition-all duration-300">
              <Target size={32} strokeWidth={1} />
            </div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Setup New Savings Target</p>
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalsOverview;
