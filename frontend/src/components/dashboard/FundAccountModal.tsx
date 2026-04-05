import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Wallet, 
  CreditCard, ShieldCheck, Loader2, Landmark, 
  Smartphone, ArrowDownLeft, ArrowUpRight, 
  ChevronRight, BadgePercent
} from 'lucide-react';
import { useRef } from 'react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useCurrency } from '../../context/CurrencyContext';

interface FundAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentBalance: number;
  onFunded?: () => void;
}

type Tab = 'deposit' | 'withdraw';
type Method = 'upi' | 'bank' | 'card';
type Step = 'select' | 'input' | 'payment' | 'processing' | 'success';

const FundAccountModal: React.FC<FundAccountModalProps> = ({ 
  isOpen, 
  onClose, 
  userId, 
  currentBalance,
  onFunded 
}) => {
  const { exchangeRate, toUSDC, formatINR, formatUSDC } = useCurrency();
  const [activeTab, setActiveTab] = useState<Tab>('deposit');
  const [activeMethod, setActiveMethod] = useState<Method>('upi');
  const [step, setStep] = useState<Step>('select');
  const [amount, setAmount] = useState('5000'); // Default 5000 INR
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const isExecuting = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setActiveTab('deposit');
      fetchWallet();
    }
  }, [isOpen]);

  const fetchWallet = async () => {
    try {
      await api.fetchWalletBalance(userId);
    } catch (e) {
      console.error(e);
    }
  };

  // Derived: USDC equivalent of current INR input
  const parsedAmountUsdc = toUSDC(parseFloat(amount) || 0);
  const isOverBalance = activeTab === 'withdraw' && parsedAmountUsdc > currentBalance;

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (activeTab === 'withdraw') {
      const usdc = toUSDC(parseFloat(val) || 0);
      if (usdc > currentBalance) {
        setWithdrawError(
          `Exceeds your wallet balance of ${formatUSDC(currentBalance)} USDC (≈ ${formatINR(currentBalance)})`
        );
      } else {
        setWithdrawError(null);
      }
    } else {
      setWithdrawError(null);
    }
  };

  const handleAction = async () => {
    if (isExecuting.current) return;
    
    try {
      isExecuting.current = true;
      // We are already in 'processing' step from the button click
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Immersion delay

      const amountToProcess = parseFloat(amount);
      const usdcToProcess = toUSDC(amountToProcess);

      if (activeTab === 'deposit') {
        const methodLabel = activeMethod === 'upi' ? 'UPI' : activeMethod === 'bank' ? 'Net Banking' : 'Credit Card';
        await api.purchaseUsdc(userId, usdcToProcess, methodLabel);
        toast.success(`₹${amountToProcess.toLocaleString()} converted to ${usdcToProcess.toFixed(2)} USDC!`);
      } else {
        await api.withdrawUsdc(userId, usdcToProcess);
        toast.success(`${usdcToProcess.toFixed(2)} USDC converted to ${formatINR(usdcToProcess)} and sent to bank!`);
      }

      setStep('success');
      if (onFunded) onFunded();
    } catch (error: any) {
      toast.error(error.message || 'Transaction failed');
      setStep('input');
    } finally {
      isExecuting.current = false;
    }
  };

  const methods = [
    { id: 'upi', name: 'UPI / PhonePe / GPay', icon: Smartphone, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'bank', name: 'Net Banking', icon: Landmark, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'card', name: 'Debit/Credit Card', icon: CreditCard, color: 'text-[#C0FF00]', bg: 'bg-[#C0FF00]/10' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden bg-[#0A0F0D] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            {/* Glossy Header */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#C0FF00]/10 flex items-center justify-center text-[#C0FF00] border border-[#C0FF00]/20">
                    <Wallet size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black tracking-tight uppercase italic text-white leading-none">Banking <span className="text-[#C0FF00] not-italic">Hub</span></h2>
                   <p className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-widest mt-1">Institutional Grade Bridge</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors"
                disabled={step === 'processing'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            {step !== 'processing' && step !== 'success' && (
              <div className="p-1 mx-8 mt-6 bg-white/[0.03] rounded-2xl border border-white/5 flex gap-1">
                {(['deposit', 'withdraw'] as const).map((t) => {
                  return (
                    <button
                      key={t}
                      onClick={() => { setActiveTab(t); setStep('select'); setWithdrawError(null); }}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        activeTab === t
                          ? "bg-[#C0FF00] text-black shadow-[0_0_20px_rgba(192,255,0,0.2)]"
                          : "text-gray-500 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {t === 'deposit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      {t === 'deposit' ? 'Add Funds' : 'Withdraw'}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="p-8">
              <AnimatePresence mode="wait">
                {step === 'select' && (
                  <motion.div 
                    key="select"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-end mb-2">
                       <p className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest">Select Method</p>
                       <p className="text-[0.65rem] font-bold text-gray-400 italic">Balance: <span className="text-white">{formatINR(currentBalance)}</span></p>
                    </div>
                    {methods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setActiveMethod(m.id as Method); setStep('input'); }}
                        className="w-full p-5 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/[0.05] hover:border-[#C0FF00]/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                           <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", m.bg)}>
                              <m.icon className={m.color} size={22} />
                           </div>
                           <div className="text-left">
                              <p className="text-sm font-black text-white italic">{m.name}</p>
                              <p className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-wider">Instant Settlement</p>
                           </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-700 group-hover:text-[#C0FF00] transition-colors" />
                      </button>
                    ))}
                    
                    <div className="mt-6 p-4 bg-[#C0FF00]/5 border border-[#C0FF00]/10 rounded-2xl flex items-center gap-3">
                       <BadgePercent className="text-[#C0FF00]" size={20} />
                       <p className="text-[0.65rem] text-[#C0FF00]/80 font-bold leading-tight">
                         0% Transaction Fee on all {activeTab === 'deposit' ? 'deposits' : 'withdrawals'} for first-time users.
                       </p>
                    </div>
                  </motion.div>
                )}

                {step === 'input' && (
                  <motion.div 
                    key="input"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <label className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest ml-1">
                        Amount to {activeTab === 'deposit' ? 'Add (INR)' : 'Withdraw (INR)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-600 italic leading-none">
                          ₹
                        </span>
                        <input 
                          type="number"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className={cn(
                            "w-full bg-white/[0.03] border rounded-3xl py-6 px-12 text-3xl font-black text-white outline-none italic leading-none transition-colors",
                            isOverBalance
                              ? "border-red-500/60 focus:border-red-500"
                              : "border-white/10 focus:border-[#C0FF00]/50"
                          )}
                          autoFocus
                        />
                      </div>

                      {/* Inline withdrawal error */}
                      {isOverBalance && withdrawError && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl">
                          <span className="text-red-400 text-lg leading-none">⚠</span>
                          <p className="text-[0.65rem] font-bold text-red-400 leading-tight">{withdrawError}</p>
                        </div>
                      )}

                      {/* Max balance hint for withdraw */}
                      {activeTab === 'withdraw' && !isOverBalance && (
                        <button
                          type="button"
                          onClick={() => handleAmountChange(String(Math.floor(currentBalance * exchangeRate)))}
                          className="text-[0.6rem] font-black text-[#C0FF00]/70 hover:text-[#C0FF00] uppercase tracking-widest text-right transition-colors ml-auto block"
                        >
                          Max: {formatINR(currentBalance)} →
                        </button>
                      )}
                      
                      <div className="flex justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="space-y-1">
                          <p className="text-[0.5rem] font-black text-gray-500 uppercase tracking-tighter">You will {activeTab === 'deposit' ? 'Receive' : 'Pay'}</p>
                          <p className="text-sm font-black text-white italic">
                             {formatUSDC(toUSDC(parseFloat(amount) || 0))} USDC
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[0.5rem] font-black text-gray-500 uppercase tracking-tighter">Exchange Rate</p>
                          <p className="text-[0.65rem] font-bold text-gray-400 leading-none">1 USDC = ₹{exchangeRate.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setStep('select')}
                            className="flex-1 py-4 bg-white/5 text-white font-black uppercase text-[0.65rem] tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all font-mono"
                        >
                            Back
                        </button>
                        <button 
                            onClick={() => setStep(activeMethod === 'card' ? 'payment' : 'processing')}
                            disabled={!amount || parseFloat(amount) <= 0 || isOverBalance}
                            className="flex-[2] py-4 bg-[#C0FF00] text-black font-black uppercase text-[0.65rem] tracking-widest rounded-2xl shadow-[0_0_30px_rgba(192,255,0,0.2)] hover:scale-[1.02] transition-all font-mono flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm {activeTab === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </button>
                    </div>
                  </motion.div>
                )}

                {step === 'payment' && (
                   <motion.div 
                    key="payment"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <p className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest ml-1">Secure Card Terminal</p>
                      <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center mb-4">
                           <div className="flex items-center gap-2">
                              <CreditCard size={20} className="text-[#C0FF00]" />
                              <span className="text-sm font-bold text-white italic">Security Level: PCI-DSS v4</span>
                           </div>
                           <ShieldCheck size={18} className="text-[#C0FF00]" />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[0.5rem] font-black text-gray-600 uppercase italic">Card Number</p>
                           <div className="w-full h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-gray-400 font-mono text-sm tracking-widest italic">
                              **** **** **** 4242
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <p className="text-[0.5rem] font-black text-gray-600 uppercase italic">Expiry Date</p>
                              <div className="w-full h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-gray-400 font-mono text-sm tracking-widest">
                                 12/28
                              </div>
                           </div>
                           <div className="space-y-2">
                              <p className="text-[0.5rem] font-black text-gray-600 uppercase italic">CVV</p>
                              <div className="w-full h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-gray-400 font-mono text-sm tracking-widest italic">
                                 ***
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setStep('input')}
                            className="flex-1 py-4 bg-white/5 text-white font-black uppercase text-[0.65rem] tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all font-mono"
                        >
                            Back
                        </button>
                        <button 
                            onClick={() => setStep('processing')}
                            className="flex-[2] py-4 bg-[#C0FF00] text-black font-black uppercase text-[0.65rem] tracking-widest rounded-2xl shadow-[0_0_30px_rgba(192,255,0,0.2)] hover:scale-[1.02] transition-all font-mono"
                        >
                            Complete Payment
                        </button>
                    </div>
                  </motion.div>
                )}

                {step === 'processing' && (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="relative">
                        <Loader2 className="text-[#C0FF00] animate-spin" size={80} strokeWidth={3} />
                        <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Verifying Settlement</h3>
                        <p className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-widest leading-relaxed max-w-[240px]">
                            {activeTab === 'deposit' 
                              ? "Awaiting confirmation from bank partner and bridging USDC to LocalNet..."
                              : "Sending USDC to off-ramp and initiating IMPS transfer to your linked bank account..."
                            }
                        </p>
                        <div className="mt-4 px-3 py-1 bg-white/5 rounded-full inline-block">
                           <p className="text-[0.5rem] text-gray-400 font-mono">TX_REF: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                        </div>
                    </div>
                    {/* Trigger the real handleAction after initial animation */}
                    <ComponentRefresher onMount={handleAction} />
                  </motion.div>
                )}

                {step === 'success' && (
                   <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-24 h-24 bg-[#C0FF00]/10 border border-[#C0FF00] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(192,255,0,0.3)]">
                        <ShieldCheck size={48} className="text-[#C0FF00]" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Funds Secured</h3>
                        <p className="text-xs text-gray-400 font-medium max-w-[300px]">
                            Your {activeTab === 'deposit' ? 'deposit' : 'withdrawal'} of {activeTab === 'deposit' ? `₹${amount}` : `${amount} USDC`} was successful. 
                            The transaction is reflected in your audit trail.
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-12 py-4 bg-[#C0FF00]/10 border border-[#C0FF00] text-[#C0FF00] font-black uppercase text-[0.65rem] tracking-widest rounded-2xl hover:bg-[#C0FF00] hover:text-black transition-all font-mono"
                    >
                        Return to Dashboard
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Helper component to trigger effects on mount properly within AnimatePresence
const ComponentRefresher = ({ onMount }: { onMount: () => void }) => {
  useEffect(() => { onMount(); }, []);
  return null;
};

export default FundAccountModal;
