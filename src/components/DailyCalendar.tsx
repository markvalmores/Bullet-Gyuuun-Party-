import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Gift, CheckCircle2, Star, X, MapPin } from 'lucide-react';
import { UserProfile } from '../types';

interface CalendarProps {
  profile: UserProfile;
  onClaim: (reward: number, bonusReason?: string) => void;
  onClose: () => void;
}

export const DailyCalendar: React.FC<CalendarProps> = ({ profile, onClaim, onClose }) => {
  const [region, setRegion] = useState<string>('Global');
  const [seasonalBonus, setSeasonalBonus] = useState<{ name: string; bonus: number } | null>(null);

  useEffect(() => {
    // Detect region based on timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Manila') || tz.includes('Asia/Manila')) {
      setRegion('Philippines');
    } else if (tz.includes('Tokyo')) {
      setRegion('Japan');
    } else {
      setRegion('Global');
    }

    // Check for seasonal occasions
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();

    // Occasions
    if (month === 12 && day >= 20) setSeasonalBonus({ name: 'Christmas Party', bonus: 1000 });
    else if (month === 1 && day <= 5) setSeasonalBonus({ name: 'New Year Blast', bonus: 2000 });
    else if (month === 2 && day === 14) setSeasonalBonus({ name: 'Valentine\'s Gyuuun', bonus: 500 });
    
    // Seasons (Simple logic)
    if (region === 'Philippines') {
      if (month >= 3 && month <= 5) setSeasonalBonus({ name: 'PH Summer Heat', bonus: 300 });
    } else {
      if (month === 12 || month <= 2) setSeasonalBonus({ name: 'Winter Chill', bonus: 300 });
      else if (month >= 6 && month <= 8) setSeasonalBonus({ name: 'Global Summer', bonus: 300 });
    }
  }, [region]);

  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  const currentStreak = (profile.dailyStreak || 0) % 7;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-10 border-b border-white/5 bg-gradient-to-br from-blue-600/10 to-purple-600/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <CalendarIcon className="text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Login Rewards</h2>
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                  <MapPin size={12} className="text-zinc-600" />
                  <span>{region} Region Calendar</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-black/40 rounded-3xl p-6 border border-white/5">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Current Streak</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white italic">{profile.dailyStreak || 0}</span>
                <span className="text-sm font-bold text-zinc-500">Days</span>
              </div>
            </div>
            {seasonalBonus && (
              <div className="flex-1 bg-yellow-400/10 rounded-3xl p-6 border border-yellow-400/20">
                <span className="text-[10px] font-black text-yellow-500/60 uppercase tracking-widest block mb-2">{seasonalBonus.name}</span>
                <div className="flex items-center gap-2">
                  <Gift size={20} className="text-yellow-400" />
                  <span className="text-xl font-black text-yellow-400">+{seasonalBonus.bonus} Bonus</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="p-10">
          <div className="grid grid-cols-7 gap-3 mb-10">
            {days.map((day) => {
              const isToday = currentStreak + 1 === day && !profile.claimedToday;
              const isClaimed = day <= currentStreak || (day === currentStreak + 1 && profile.claimedToday);
              
              return (
                <div key={day} className="flex flex-col gap-2">
                  <div className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center relative transition-all ${
                    isClaimed 
                      ? 'bg-blue-600/10 border-blue-500/50' 
                      : isToday 
                        ? 'bg-white border-white scale-110 shadow-lg shadow-white/20' 
                        : 'bg-zinc-800/50 border-white/5'
                  }`}>
                    {isClaimed ? (
                      <CheckCircle2 className="text-blue-400" size={24} />
                    ) : (
                      <>
                        <Star className={isToday ? 'text-zinc-900' : 'text-zinc-600'} size={20} />
                        <span className={`text-[10px] font-black mt-1 ${isToday ? 'text-zinc-900' : 'text-zinc-500'}`}>
                          {day === 7 ? 'MEGA' : 'x' + (day * 100)}
                        </span>
                      </>
                    )}
                  </div>
                  <span className={`text-[10px] font-black text-center uppercase tracking-tighter ${isToday ? 'text-white' : 'text-zinc-600'}`}>
                    Day {day}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            disabled={profile.claimedToday}
            onClick={() => onClaim((currentStreak + 1) * 100 + (seasonalBonus?.bonus || 0), seasonalBonus?.name)}
            className={`w-full py-6 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-3 ${
              profile.claimedToday
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-[0.98]'
            }`}
          >
            {profile.claimedToday ? 'Already Claimed' : 'Claim Today\'s Reward'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
