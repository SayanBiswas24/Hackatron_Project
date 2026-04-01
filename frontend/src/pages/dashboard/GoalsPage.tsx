import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { SparkEffect } from '../../components/ui/spark-effect';
import GoalCard from '../../components/dashboard/GoalCard';
import type { Goal } from '../../components/dashboard/GoalCard';
import GoalDetailModal from '../../components/dashboard/GoalDetailModal';
import CreateGoalModal from '../../components/dashboard/CreateGoalModal';
import EmptyState from '../../components/dashboard/EmptyState';
import { Target, TrendingUp, Zap, Plus, Search, Filter } from 'lucide-react';

const mockGoals: Goal[] = [
  { 
    id: 1, 
    name: 'New Car', 
    target: 1500000, 
    saved: 975000, 
    color: '#C0FF00', 
    icon: Target,
    createdAt: '12 Jan 2026',
    deadline: '12 Jul 2027',
    frequency: 'Monthly',
    lastDeposit: '24 Mar 2026',
    status: 'active',
    yieldEarned: 24500
  },
  { 
    id: 2, 
    name: 'Emergency Fund', 
    target: 500000, 
    saved: 180000, 
    color: '#00F0FF', 
    icon: Zap,
    createdAt: '01 Feb 2026',
    deadline: 'Ongoing',
    frequency: 'Weekly',
    lastDeposit: '28 Mar 2026',
    status: 'active',
    yieldEarned: 12800
  },
  { 
    id: 3, 
    name: 'Trip to Ladakh', 
    target: 80000, 
    saved: 7500, 
    color: '#BF5AF2', 
    icon: TrendingUp,
    createdAt: '15 Mar 2026',
    deadline: '15 Sep 2026',
    frequency: 'Monthly',
    lastDeposit: '15 Mar 2026',
    status: 'active',
    yieldEarned: 450
  },
  { 
    id: 4, 
    name: 'Retirement fund', 
    target: 25000000, 
    saved: 125000, 
    color: '#FF9F0A', 
    icon: Target,
    createdAt: '01 Jan 2026',
    deadline: '01 Jan 2050',
    frequency: 'Monthly',
    lastDeposit: '02 Mar 2026',
    status: 'active',
    yieldEarned: 8400
  },
];

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDetailModalOpen(true);
  };

  const handleAddGoal = (newGoal: Goal) => {
    setGoals([newGoal, ...goals]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden">
        <SparkEffect />

        <div className="relative z-10 max-w-7xl mx-auto space-y-10 pb-20">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-1"
            >
              <h1 className="text-4xl font-black text-white tracking-tight">Manage Your <span className="text-[#C0FF00]">Vaults</span></h1>
              <p className="text-sm text-gray-500 font-medium italic">Track your goal-conditioned savings across the Algorand blockchain.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
               <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search vaults..."
                    className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C0FF00]/40 transition-all w-64"
                  />
               </div>
               <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
                  <Filter size={18} />
               </button>
               <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 bg-[#C0FF00] hover:brightness-110 text-black px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(192,255,0,0.2)] transition-all active:scale-95"
                >
                  <Plus size={18} strokeWidth={3} /> New Goal
               </button>
            </motion.div>
          </div>

          {/* Goals Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <h2 className="text-xl font-black text-white tracking-tight italic uppercase">Active Savings Targets</h2>
               <div className="h-px flex-1 bg-white/5" />
               <span className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest">{String(goals.length).padStart(2, '0')} Total Vaults</span>
            </div>
            
            {goals.length === 0 ? (
              <EmptyState type="goals" onCreateClick={() => setIsCreateModalOpen(true)} />
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {goals.map((goal) => (
                  <motion.div key={goal.id} variants={itemVariants}>
                    <GoalCard 
                      goal={goal} 
                      onClick={handleGoalClick}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        <GoalDetailModal 
          goal={selectedGoal}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />

        {/* Create Goal Modal */}
        <CreateGoalModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleAddGoal}
        />
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage;
