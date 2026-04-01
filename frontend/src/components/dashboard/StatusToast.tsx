import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

interface StatusToastProps {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  onClose: (id: string) => void;
  duration?: number;
}

const StatusToast: React.FC<StatusToastProps> = ({ 
  id, 
  type, 
  message, 
  description, 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (type !== 'loading') {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, type, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="text-[#C0FF00]" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    loading: <Loader2 className="text-[#00F0FF] animate-spin" size={20} />,
    info: <Zap className="text-[#BF5AF2]" size={20} />
  };

  const borders = {
    success: 'border-[#C0FF00]/20 bg-[#C0FF00]/5',
    error: 'border-red-500/20 bg-red-500/5',
    loading: 'border-[#00F0FF]/20 bg-[#00F0FF]/5',
    info: 'border-[#BF5AF2]/20 bg-[#BF5AF2]/5'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm rounded-[1.5rem] border backdrop-blur-3xl shadow-2xl overflow-hidden",
        borders[type]
      )}
    >
      <div className="flex-1 p-4 flex gap-4">
        <div className="shrink-0 pt-0.5">
           {icons[type]}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
           <p className="text-sm font-black text-white italic uppercase tracking-tight">{message}</p>
           {description && <p className="text-[0.65rem] text-gray-500 font-medium leading-relaxed">{description}</p>}
        </div>
        <button 
          onClick={() => onClose(id)}
          className="shrink-0 p-1 h-fit rounded-lg hover:bg-white/5 text-gray-600 hover:text-white transition-all"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Progress Bar for non-loading */}
      {type !== 'loading' && (
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={cn(
            "absolute bottom-0 left-0 h-0.5",
            type === 'success' ? "bg-[#C0FF00]" : 
            type === 'error' ? "bg-red-500" : "bg-[#BF5AF2]"
          )}
        />
      )}
    </motion.div>
  );
};

export default StatusToast;
