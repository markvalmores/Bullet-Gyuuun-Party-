import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Copy, Check, ExternalLink, X, Smartphone, CreditCard, Sparkles, Gift } from 'lucide-react';

interface DonateModalProps {
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const gcashNumber = '09763329358';
  const gcashName = 'Mark David';
  const streamlabsUrl = 'https://streamlabs.com/usagyuunvtuber/tip';

  const handleCopyGcash = () => {
    navigator.clipboard.writeText(gcashNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-zinc-900 border-2 border-pink-500/30 rounded-3xl p-6 md:p-8 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-500/30"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-zinc-300 hover:text-white transition-all active:scale-95 z-10"
          title="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div 
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-500/30 mb-3"
          >
            <Heart size={32} className="text-white fill-white" />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-yellow-300">
            Support Usagyuuun
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-sm">
            Keep the rhythms playing & server running! Your donations directly empower future updates and 24/7 cross-device support.
          </p>
        </div>

        {/* Streamlabs Card */}
        <div className="mb-4 bg-gradient-to-r from-teal-900/40 to-emerald-900/40 border border-teal-500/40 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <Gift size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-teal-200">Streamlabs Tip</h3>
                <p className="text-xs text-teal-400/80">Usagyuuun VTuber Stream</p>
              </div>
            </div>
            <Sparkles size={16} className="text-teal-400 animate-pulse" />
          </div>

          <a 
            href={streamlabsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all active:scale-98"
          >
            <span>Tip on Streamlabs</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* GCash Card */}
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/40 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-200">GCash Direct</h3>
                <p className="text-xs text-blue-300/80">Account: {gcashName}</p>
              </div>
            </div>
            <CreditCard size={18} className="text-blue-400" />
          </div>

          <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">GCash Number</span>
              <span className="text-lg font-mono font-bold text-white tracking-wider">{gcashNumber}</span>
            </div>

            <button
              onClick={handleCopyGcash}
              className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 ${
                copied 
                  ? 'bg-green-500 text-black' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Compatibility Footer Note */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center flex flex-col items-center gap-1">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
            Universal Device Support Active
          </p>
          <p className="text-[11px] text-zinc-400">
            Supports legacy (1990s HTML5 browsers) & future-gen 3478 devices across all screen sizes.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
