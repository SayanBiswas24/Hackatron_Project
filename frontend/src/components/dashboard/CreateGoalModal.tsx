import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Target, 
  Calendar, 
  IndianRupee, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Calculator
} from 'lucide-react';
import { api } from '../../lib/api';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';
import { PennyStalkerClient, calcGoalMbr } from '../../lib/contracts/PennyStalkerClient';
import { useCurrency } from '../../context/CurrencyContext';

const ALGOD_SERVER = import.meta.env.VITE_ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = import.meta.env.VITE_ALGOD_PORT || '';
const ALGOD_TOKEN = import.meta.env.VITE_ALGOD_TOKEN || '';
const APP_ID = BigInt(import.meta.env.VITE_APP_ID || '0');

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (goal: any) => void;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toUSDC, formatUSDC } = useCurrency();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [mbrPreview, setMbrPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateMbr = () => {
    if (!name) return;
    const mbr = calcGoalMbr(name);
    setMbrPreview((Number(mbr) / 1000000).toFixed(4));
    return mbr;
  };

  const { activeWallet, activeAddress, transactionSigner } = useWallet();
  const userId = localStorage.getItem('ps_user_id');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setStep('processing');
    setError(null);

    try {
      const targetInr = parseFloat(target);
      const targetAmount = toUSDC(targetInr); // Convert INR to USDC for storage
      const targetMicroUsdc = BigInt(Math.round(targetAmount * 1_000_000)); // 6 decimals
      const deadlineUnixSec = BigInt(Math.floor(new Date(deadline).getTime() / 1000));
      const mbrMicroAlgo = calculateMbr()!;

      // Determine wallet type
      const userRes = await api.fetchUser(userId);
      const isCustodial = userRes?.walletType === 'CUSTODIAL';

      let onChainGoalId: number;

      if (isCustodial) {
        const res = await api.createGoalCustodial({
          userId,
          title: name,
          targetAmount,
          deadline,
          category: 'general'
        });
        onChainGoalId = res.onChainGoalId;
      } else {
        if (!activeWallet || !activeAddress) throw new Error("No active wallet detected");
        
        const client = new PennyStalkerClient({
          algodClient,
          appId: APP_ID,
          sender: {
            addr: activeAddress,
            signer: transactionSigner
          }
        });

        const resultId = await client.createGoal({
          name,
          targetAmountMicroUsdc: targetMicroUsdc,
          deadlineUnixSec,
          mbrMicroAlgo
        });
        onChainGoalId = Number(resultId);

        await api.createGoalMetadata({
          userId,
          onChainGoalId,
          title: name,
          targetAmount,
          deadline,
          category: 'general'
        });
      }

      setStep('success');
      setTimeout(() => {
        onSuccess({
            id: onChainGoalId,
            name,
            target: targetAmount * 1000000,
            saved: 0,
            color: '#C0FF00',
            icon: Target,
            createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            deadline: new Date(deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: 'active'
        });
        handleClose();
      }, 1500);

    } catch (err: any) {
      console.error("Goal creation error:", err);
      setError(err.message || "Failed to initialize on-chain vault.");
      setStep('form');
    }
  };

  const handleClose = () => {
    setStep('form');
    setName('');
    setTarget('');
    setDeadline('');
    setMbrPreview(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#141C18] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                  Initialize <span className="text-[#C0FF00] not-italic">Vault</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium tracking-tight">Create a new goal-conditioned smart contract on Algorand.</p>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-colors"
                disabled={step === 'processing'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 pt-6">
              <AnimatePresence mode="wait">
                {step === 'form' && (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* Goal Name */}
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Goal Identifier</label>
                      <div className="relative">
                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C0FF00]" size={18} />
                        <input 
                          required
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onBlur={calculateMbr}
                          placeholder="e.g. Dream Home Fund"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-[#C0FF00]/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {/* Target Amount */}
                      <div className="space-y-2">
                        <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Target Amount (INR)</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C0FF00]" size={18} />
                          <input 
                            required
                            type="number"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-[#C0FF00]/50 outline-none transition-all placeholder:text-gray-700 font-bold leading-none"
                          />
                        </div>
                        {target && (
                          <p className="text-[0.6rem] text-gray-600 font-bold uppercase tracking-widest mt-1 ml-1 leading-none">
                            ≈ {formatUSDC(toUSDC(parseFloat(target) || 0))} USDC
                          </p>
                        )}
                      </div>

                      {/* Deadline */}
                      <div className="space-y-2">
                        <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Exit Date (Deadline)</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C0FF00]" size={18} />
                          <input 
                            required
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-[#C0FF00]/50 outline-none transition-all [color-scheme:dark] font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* MBR Info */}
                    {mbrPreview && (
                      <div className="p-4 rounded-2xl bg-[#C0FF00]/5 border border-[#C0FF00]/20 flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00]">
                            <Calculator size={16} />
                         </div>
                         <div className="flex-1">
                            <p className="text-[0.6rem] font-black text-[#C0FF00] uppercase tracking-widest leading-none">Protocol MBR Deposit</p>
                            <p className="text-[0.65rem] text-gray-400 font-medium mt-1 leading-none">This vault requires <span className="text-white font-bold">{mbrPreview} ALGO</span> for on-chain storage.</p>
                         </div>
                      </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold leading-none">
                            {error}
                        </div>
                    )}

                    <button 
                      type="submit"
                      disabled={!name || !target || !deadline}
                      className="w-full py-5 bg-[#C0FF00] text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(192,255,0,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale"
                    >
                      Initialize On-Chain Vault <ArrowRight size={18} strokeWidth={3} />
                    </button>
                  </motion.form>
                )}

                {step === 'processing' && (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="relative">
                       <Loader2 className="text-[#C0FF00] animate-spin" size={64} strokeWidth={3} />
                       <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00F0FF] animate-pulse" size={24} />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-white uppercase italic tracking-tight leading-none">Deploying to Algorand</h3>
                       <div className="flex flex-col items-center gap-2 mt-4">
                          <p className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             <ShieldCheck size={12} className="text-[#C0FF00]" /> Constructing Atomic Group
                          </p>
                          <p className="text-[0.65rem] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                             <Loader2 size={12} className="animate-spin text-[#00F0FF]" /> Broadcasting Box Storage
                          </p>
                       </div>
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center text-center space-y-4"
                  >
                    <div className="w-24 h-24 bg-[#C0FF00]/10 border border-[#C0FF00] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(192,255,0,0.25)]">
                       <CheckCircle2 className="text-[#C0FF00]" size={48} strokeWidth={3} />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none">Vault Confirmed</h3>
                       <p className="text-xs text-gray-500 font-medium">Smart contract successfully initialized on Testnet.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">
                       <ShieldCheck size={14} className="text-[#C0FF00]" /> Verified by PennyStalker Client
                    </div>
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

export default CreateGoalModal;
