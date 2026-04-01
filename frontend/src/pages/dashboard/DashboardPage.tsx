import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatsGrid from '../../components/dashboard/StatsGrid';
import SavingsEvolution from '../../components/dashboard/SavingsEvolution';
import GoalsOverview from '../../components/dashboard/GoalsOverview';
import RecentActivity from '../../components/dashboard/RecentActivity';
import { motion, AnimatePresence } from 'framer-motion';
import { SparkEffect } from '../../components/ui/spark-effect';
import StatusToast from '../../components/dashboard/StatusToast';
import type { ToastType } from '../../components/dashboard/StatusToast';
import { ShieldCheck, Zap, AlertCircle } from 'lucide-react';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

const DashboardPage: React.FC = () => {
  const [isAdminMode, setIsAdminMode] = useState(false); // Simulated "First Login" toggle
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const isEmpty = !isAdminMode;

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden">
        <SparkEffect />

        {/* Global Toast Container */}
        <div className="fixed top-24 right-8 z-[200] flex flex-col gap-4">
           <AnimatePresence>
              {toasts.map((toast) => (
                <StatusToast 
                  key={toast.id}
                  {...toast}
                  onClose={removeToast}
                />
              ))}
           </AnimatePresence>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10 space-y-8 pb-12"
        >
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <motion.div variants={itemVariants} className="flex flex-col gap-1">
              <h1 className="text-4xl font-black tracking-tight text-white italic uppercase">
                Hello, <span className="text-[#C0FF00] not-italic">Satoshi</span>
              </h1>
              <p className="text-sm text-gray-400 font-medium tracking-tight">Your PennyStalker vault strategy is operational.</p>
            </motion.div>

            {/* Test Simulation Controls */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
               <button 
                 onClick={() => setIsAdminMode(!isAdminMode)}
                 className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-widest border transition-all ${
                   isAdminMode ? 'bg-[#C0FF00]/10 border-[#C0FF00] text-[#C0FF00]' : 'bg-white/5 border-white/10 text-gray-500'
                 }`}
               >
                 {isAdminMode ? 'Show Real Data' : 'Simulate New User'}
               </button>
               <button 
                 onClick={() => addToast('error', 'Reverted: Insufficient USDC', 'Asset transfer denied by smart contract logic.')}
                 className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                 title="Simulate Error"
               >
                 <AlertCircle size={18} />
               </button>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants}>
            <StatsGrid isEmpty={isEmpty} />
          </motion.div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Chart Section */}
            <motion.div variants={itemVariants} className="xl:col-span-8">
              <SavingsEvolution />
            </motion.div>

            {/* Activity Section */}
            <motion.div variants={itemVariants} className="xl:col-span-4">
              <RecentActivity activities={isEmpty ? [] : undefined} />
            </motion.div>
          </div>

          {/* Goals Section */}
          <motion.div variants={itemVariants}>
            <GoalsOverview goals={isEmpty ? [] : undefined} />
          </motion.div>
        </motion.div>

        {/* Informational Banner for New Users */}
        {isEmpty && (
           <motion.div 
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             className="mt-8 p-6 rounded-[2.5rem] bg-[#C0FF00]/5 border border-[#C0FF00]/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl"
           >
              <div className="absolute -left-10 top-0 w-32 h-32 bg-[#C0FF00]/10 blur-[60px] rounded-full" />
              <div className="flex items-center gap-6 relative z-10">
                 <div className="p-4 rounded-3xl bg-[#C0FF00]/10 text-[#C0FF00]">
                    <ShieldCheck size={32} />
                 </div>
                 <div className="space-y-1 text-center md:text-left">
                    <p className="text-lg font-black text-white italic uppercase tracking-tight">On-Chain Verification Required</p>
                    <p className="text-xs text-gray-500 font-medium max-w-md">To begin saving, initialize your first goal so the smart contract can allocate box storage for your deposits.</p>
                 </div>
              </div>
              <button 
                onClick={() => addToast('success', 'USDC Funding Initiated', 'Testnet USDC is being bridged to your wallet.')}
                className="bg-[#C0FF00] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(192,255,0,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 relative z-10"
              >
                 <Zap size={16} fill="currentColor" /> Request Testnet USDC
              </button>
           </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;
