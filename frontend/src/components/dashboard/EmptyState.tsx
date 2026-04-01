import React from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, ShieldCheck, Zap, ArrowRight, History } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  type: 'goals' | 'activity';
  onCreateClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onCreateClick }) => {
  const isGoals = type === 'goals';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#141C18]/40 backdrop-blur-3xl p-10 text-center",
        isGoals ? "min-h-[400px] flex flex-col items-center justify-center" : "py-12"
      )}
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#C0FF00]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm mx-auto">
        {/* Icon Circle */}
        <div className="relative">
           <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              {isGoals ? (
                <Target size={40} className="text-[#C0FF00]" strokeWidth={1} />
              ) : (
                <History size={40} className="text-gray-500" strokeWidth={1} />
              )}
           </div>
           {isGoals && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-2 -right-2 p-2 rounded-xl bg-[#C0FF00]/20 border border-[#C0FF00]/30 text-[#C0FF00]"
              >
                 <Zap size={16} fill="currentColor" />
              </motion.div>
           )}
        </div>

        {/* Text Content */}
        <div className="space-y-2">
           <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
             {isGoals ? "No Active Vaults" : "Empty Audit Trail"}
           </h3>
           <p className="text-sm text-gray-500 font-medium leading-relaxed">
             {isGoals 
               ? "Your Penny Stalker dashboard is currently a clean slate. Initialize your first goal-conditioned vault to start saving." 
               : "No blockchain events recorded yet. Your deposits and smart-contract actions will appear here."}
           </p>
        </div>

        {/* Action Button */}
        {isGoals && (
          <div className="pt-4 w-full">
            <button 
              onClick={onCreateClick}
              className="w-full py-4 bg-[#C0FF00] text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(192,255,0,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus size={16} strokeWidth={4} /> Setup New Vault <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="mt-6 flex items-center justify-center gap-6 opacity-40">
               <div className="flex items-center gap-1 text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest">
                  <ShieldCheck size={12} /> On-Chain Security
               </div>
               <div className="flex items-center gap-1 text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest">
                  <Zap size={12} /> Instant USDC
               </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EmptyState;
