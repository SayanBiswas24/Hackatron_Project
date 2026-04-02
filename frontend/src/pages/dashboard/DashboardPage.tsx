import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatsGrid from '../../components/dashboard/StatsGrid';
import SavingsEvolution from '../../components/dashboard/SavingsEvolution';
import GoalsOverview from '../../components/dashboard/GoalsOverview';
import RecentActivity from '../../components/dashboard/RecentActivity';
import { motion, AnimatePresence } from 'framer-motion';
import { SparkEffect } from '../../components/ui/spark-effect';
import StatusToast from '../../components/dashboard/StatusToast';
import type { ToastType } from '../../components/dashboard/StatusToast';
import { ShieldCheck, Zap, AlertCircle, Loader2, Target } from 'lucide-react';
import { api } from '../../lib/api';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAdminMode, setIsAdminMode] = useState(false); // Simulated "First Login" toggle
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const userId = localStorage.getItem('ps_user_id');

  const addToast = (type: ToastType, message: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!userId) {
      navigate('/auth');
      return;
    }

    let isMounted = true;
    const initializeData = async () => {
      try {
        setIsLoading(true);
        // Fetch user data
        const user = await api.fetchUser(userId);
        if (!isMounted) return;
        setUserData(user);
        
        // Fetch specific data
        const fetchedGoals = await api.fetchGoals(userId);
        const mappedGoals = fetchedGoals.map((g: any) => ({
          id: g.id,
          name: g.title,
          target: Number(g.targetAmount) / 1000000, 
          saved: Number(g.currentBalance) / 1000000,
          color: g.colorHex || '#C0FF00',
          icon: Target,
          createdAt: new Date(g.createdAt).toLocaleDateString(),
          deadline: new Date(g.deadline).toLocaleDateString(),
          frequency: 'Flexible',
          lastDeposit: 'Recent',
          status: g.status.toLowerCase(),
          yieldEarned: 0,
        }));

        const fetchedActivities = await api.fetchActivity(userId);
        const mappedActivities = fetchedActivities.map((a: any) => ({
          id: a.id,
          type: a.type === 'GOAL_CREATED' ? 'goal_creation' : a.type.toLowerCase(),
          name: a.type === 'DEPOSIT' ? 'Vault Fast-Track' : a.type === 'WITHDRAWAL' ? 'Goal Reached' : 'Initialized Vault',
          amount: a.amount ? Number(a.amount) / 1000000 : 0,
          date: new Date(a.timestamp).toLocaleDateString(),
          status: 'completed',
          goal: fetchedGoals.find((g: any) => g.onChainGoalId === a.onChainGoalId)?.title || 'Vault',
        }));
        
        if (isMounted) {
          setGoals(mappedGoals);
          setActivities(mappedActivities);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        addToast('error', 'Connection Error', 'Failed to sync with backend.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initializeData();
    return () => { isMounted = false; }
  }, [userId, navigate]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const isEmpty = isAdminMode || (!isLoading && goals.length === 0);

  const totalSaved = goals.reduce((acc, g) => acc + g.saved, 0);
  const activeGoalsCount = goals.filter(g => g.status === 'active').length;

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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
             <Loader2 className="animate-spin text-[#00F0FF]" size={48} />
             <p className="text-sm font-black text-white italic uppercase tracking-widest">Syncing with Backend Vaults...</p>
          </div>
        ) : (
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
                  Hello, <span className="text-[#C0FF00] not-italic">{userData?.displayName || 'Satoshi'}</span>
                </h1>
                <p className="text-sm text-gray-400 font-medium tracking-tight">Your PennyStalker vault strategy is loaded securely.</p>
              </motion.div>

              {/* Test Simulation Controls */}
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <button
                  onClick={() => setIsAdminMode(!isAdminMode)}
                  className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-widest border transition-all ${isAdminMode ? 'bg-[#C0FF00]/10 border-[#C0FF00] text-[#C0FF00]' : 'bg-white/5 border-white/10 text-gray-500'}`}
                >
                  {isAdminMode ? 'Show Real Data' : 'Simulate Empty State'}
                </button>
              </motion.div>
            </div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants}>
              <StatsGrid 
                isEmpty={isEmpty} 
                totalSaved={totalSaved}
                activeGoals={activeGoalsCount}
              />
            </motion.div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Chart Section */}
              <motion.div variants={itemVariants} className="xl:col-span-8">
                <SavingsEvolution isEmpty={isEmpty} activities={isEmpty ? [] : activities} />
              </motion.div>

              {/* Activity Section */}
              <motion.div variants={itemVariants} className="xl:col-span-4">
                <RecentActivity activities={isEmpty ? [] : activities} />
              </motion.div>
            </div>

            {/* Goals Section */}
            <motion.div variants={itemVariants}>
              <GoalsOverview goals={isEmpty ? [] : goals} />
            </motion.div>
          </motion.div>
        )}

        {/* Informational Banner for New Users */}
        {!isLoading && isEmpty && (
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
};

export default DashboardPage;
