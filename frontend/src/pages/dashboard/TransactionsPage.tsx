import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  ExternalLink,
  Calendar,
  Clock,
  Download,
  Loader2
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import EmptyState from '../../components/dashboard/EmptyState';
import { api } from '../../lib/api';

interface Transaction {
  id: string;
  type: string;
  goal?: string;
  amount: number | null;
  date: string;
  time: string;
  txHash: string;
  status: 'confirmed' | 'pending';
}

const TransactionsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'goal_created'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = localStorage.getItem('ps_user_id');

  useEffect(() => {
    const loadTransactions = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const [activities, goals] = await Promise.all([
          api.fetchActivity(userId),
          api.fetchGoals(userId)
        ]);

        const mapped: Transaction[] = activities.map((a: any) => {
          const timestamp = new Date(a.timestamp);
          const type = a.type.toLowerCase();
          return {
            id: a.id,
            type: type === 'goal_created' ? 'vault Initialized' : type,
            goal: goals.find((g: any) => g.onChainGoalId === a.onChainGoalId)?.title || 'Vault',
            amount: a.amount ? Number(a.amount) / 1000000 : null,
            date: timestamp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            txHash: a.transactionId,
            status: 'confirmed'
          };
        });
        setTransactions(mapped);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [userId]);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'deposit' && tx.type === 'deposit') return true;
    if (filter === 'withdrawal' && tx.type === 'withdrawal') return true;
    if (filter === 'goal_created' && tx.type === 'vault initialized') return true;
    return false;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <DashboardLayout>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-10 pb-16"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
              Transaction <span className="text-[#C0FF00] not-italic">History</span>
            </h1>
            <p className="text-gray-400 font-medium tracking-tight text-sm">Detailed audit trail of your Algorand vault operations.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[0.65rem] font-bold text-white hover:bg-white/[0.1] hover:border-white/20 transition-all uppercase tracking-widest shadow-lg">
            <Download size={14} /> Export CSV
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col xl:flex-row gap-5 items-center justify-start bg-white/[0.01] p-3 rounded-2xl border border-white/5">
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 w-full xl:w-auto">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'deposit', label: 'Deposits' },
              { id: 'goal_created', label: 'Vault Initialized' },
              { id: 'withdrawal', label: 'Withdrawals' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={cn(
                  "flex-1 px-5 py-2.5 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === tab.id 
                    ? "bg-[#C0FF00] text-black shadow-[0_0_25px_rgba(192,255,0,0.3)]" 
                    : "text-gray-500 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Transactions list */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#141C18]/50 border-white/5 shadow-2xl overflow-hidden backdrop-blur-3xl rounded-2xl">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={48} className="text-[#C0FF00] animate-spin" />
                <p className="text-[0.65rem] font-black text-gray-500 uppercase tracking-[0.2em] italic">Pulling records from blockchain...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[0.55rem] font-black text-gray-500 uppercase tracking-[0.2em]">Activity</th>
                    <th className="px-6 py-4 text-[0.55rem] font-black text-gray-500 uppercase tracking-[0.2em]">Vault Destination</th>
                    <th className="px-6 py-4 text-[0.55rem] font-black text-gray-500 uppercase tracking-[0.2em]">Movement (₹)</th>
                    <th className="px-6 py-4 text-[0.55rem] font-black text-gray-500 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-6 py-4 text-[0.55rem] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-4 text-[0.55rem] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-all duration-200 group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg border",
                            tx.type === 'deposit' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                            tx.type === 'received' ? "bg-[#C0FF00]/10 border-[#C0FF00]/20 text-[#C0FF00]" :
                            "bg-red-500/10 border-red-500/20 text-red-400"
                          )}>
                            {tx.type === 'deposit' ? <ArrowUpRight size={16} /> :
                             tx.type === 'received' ? <TrendingUp size={16} /> :
                             <ArrowDownRight size={16} />}
                          </div>
                          <span className="text-[0.65rem] font-black text-white uppercase tracking-widest">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-white group-hover:text-[#C0FF00] transition-colors">{tx.goal || 'On-chain Protocol'}</p>
                          <p className="text-[0.55rem] text-gray-600 font-bold uppercase tracking-tighter">HASH: {tx.txHash}</p>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                           <p className={cn(
                             "text-sm font-black tracking-tight",
                             tx.type === 'withdrawal' ? "text-red-400" : "text-white"
                           )}>
                             {tx.type === 'withdrawal' ? '-' : (tx.amount ? '+' : '')}₹{(tx.amount ?? 0).toLocaleString()}
                           </p>
                           {tx.type === 'received' && (
                              <span className="text-[0.5rem] font-bold text-[#C0FF00] bg-[#C0FF00]/10 px-1 py-0.5 rounded border border-[#C0FF00]/20 leading-none">YIELD</span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-bold tracking-tight">
                            <Calendar size={12} className="text-gray-500" /> {tx.date}
                          </div>
                          <div className="flex items-center gap-1.5 text-[0.6rem] text-gray-600 font-bold uppercase">
                            <Clock size={10} /> {tx.time}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            tx.status === 'confirmed' ? "bg-green-400" : "bg-orange-400 animate-pulse"
                          )} />
                          <span className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest italic leading-none">
                            {tx.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <button className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-gray-500 hover:text-[#C0FF00] hover:border-[#C0FF00]/30 transition-all">
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <EmptyState type="activity" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default TransactionsPage;
