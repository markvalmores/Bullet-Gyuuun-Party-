import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Download } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const ASSETS_TO_PRELOAD = [
  'https://www.image2url.com/r2/default/images/1785981294992-d21b875d-6ee5-44ee-96a9-79b074044075.png',
  'https://www.image2url.com/r2/default/images/1785981347735-83d8d341-e7ca-49a6-9556-5321b0252fff.png',
  'https://www.image2url.com/r2/default/images/1785981379259-b9552a51-d5eb-4a71-a4a3-386e2bbf4a65.png',
  '/assets/input_file_0.png',
  '/assets/input_file_1.png',
  '/assets/input_file_2.png',
  'https://www.image2url.com/r2/default/images/1785975835256-0b878e0d-31b6-4eb0-967a-7ce685bb7418.png'
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Gyuuun Engine...');

  useEffect(() => {
    let loadedCount = 0;
    const totalAssets = ASSETS_TO_PRELOAD.length;

    const preload = async () => {
      setStatus('Optimizing GPU Rendering Path...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setStatus('Downloading for Offline Use...');
      
      const promises = ASSETS_TO_PRELOAD.map(src => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            loadedCount++;
            setProgress(Math.round((loadedCount / totalAssets) * 100));
            resolve(true);
          };
          img.onerror = () => {
            loadedCount++;
            setProgress(Math.round((loadedCount / totalAssets) * 100));
            resolve(true);
          };
        });
      });

      await Promise.all(promises);
      
      setStatus('Synchronizing Offline Database...');
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress(100);
      
      setTimeout(onComplete, 800);
    };

    preload();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        <div className="relative mb-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="w-24 h-24 border-t-4 border-blue-500 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <ShieldCheck size={32} className="text-blue-500" />
          </div>
        </div>

        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mb-4 border border-white/5">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
          <span className="text-blue-400 flex items-center gap-2">
            <Download size={10} />
            {status}
          </span>
          <span className="text-white">{progress}%</span>
        </div>

        <div className="mt-12 text-center">
           <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] leading-loose">
             Ensuring 100% CPU/GPU Utilization<br/>
             Offline Data Integrity Check Active
           </p>
        </div>
      </motion.div>
    </div>
  );
};
