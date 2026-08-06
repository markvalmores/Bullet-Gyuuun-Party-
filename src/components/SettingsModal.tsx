/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  MousePointer2, 
  Zap, 
  Clock, 
  Smartphone, 
  Monitor, 
  Gamepad2, 
  Tv, 
  ChevronRight, 
  Save, 
  X,
  Target,
  Cpu,
  Download,
  Upload,
  Trash2,
  Database,
  FileJson,
  User,
  Camera,
  Edit2
} from 'lucide-react';
import { GameSettings, UserProfile } from '../types';
import { playSound } from '../lib/sound';

interface SettingsModalProps {
  settings: GameSettings;
  profile: UserProfile | null;
  onSave: (newSettings: GameSettings) => void;
  onClose: () => void;
  onExport: () => void;
  onImport: (data: string) => void;
  onDeleteData: () => void;
  onManualSave: () => void;
  onUpdateProfileImage: (base64: string) => void;
  onUpdateBannerImage?: (url: string) => void;
  onUpdateUsername: (name: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  settings, 
  profile,
  onSave, 
  onClose, 
  onExport, 
  onImport, 
  onDeleteData, 
  onManualSave,
  onUpdateProfileImage,
  onUpdateBannerImage,
  onUpdateUsername
}) => {
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationData, setCalibrationData] = useState<number[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile?.username || "");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const profileImageInputRef = React.useRef<HTMLInputElement>(null);
  const bannerImageInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    playSound('click');
    fileInputRef.current?.click();
  };

  const handleProfileImageClick = () => {
    playSound('click');
    profileImageInputRef.current?.click();
  };

  const handleBannerImageClick = () => {
    playSound('click');
    bannerImageInputRef.current?.click();
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Banner image too large! Please keep it under 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (onUpdateBannerImage) onUpdateBannerImage(base64);
        playSound('purchase');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Image too large! Please keep it under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onUpdateProfileImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      onUpdateUsername(tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onImport(content);
      };
      reader.readAsText(file);
    }
  };

  // Simple Device Detection
  useEffect(() => {
    const ua = navigator.userAgent;
    let deviceType = "PC";
    let os = "Web";

    if (/Android/i.test(ua)) {
      deviceType = "Mobile/Handheld";
      os = "Android";
      const match = ua.match(/Android\s([0-9\.]+)/);
      if (match) os += ` ${match[1]}`;
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      deviceType = "Mobile/Handheld";
      os = "iOS";
    } else if (/Samsung|SM-|GT-/i.test(ua)) {
      deviceType = "Samsung Device";
      os = "Android";
    } else if (/Nintendo Switch/i.test(ua)) {
      deviceType = "Console (Switch)";
      os = "Horizon OS";
    } else if (/PlayStation/i.test(ua)) {
      deviceType = "Console (PS)";
      os = "FreeBSD/Orbis";
    } else if (/Smart-TV|Tizen|NetCast|Web0S/i.test(ua)) {
      deviceType = "Smart TV";
      os = "TV OS";
    }

    setLocalSettings(prev => ({ ...prev, deviceType, os }));
  }, []);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    setCalibrationData([]);
  };

  const onCalibrateHit = () => {
    const now = Date.now();
    // Simulate latency check - in a real app, this would compare with a visual beat
    setCalibrationData(prev => [...prev, now]);
    if (calibrationData.length >= 4) {
      // Calculate average jitter/offset
      const avgOffset = 0; // Simplified for this demo
      setLocalSettings(prev => ({ ...prev, offset: avgOffset }));
      setIsCalibrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Settings className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic tracking-tight uppercase">System Settings</h2>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <Cpu size={10} />
                Future Core Engine v4.2
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          
          {/* Profile Section */}
          <div className="bg-zinc-800/40 p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <User className="text-green-400" size={18} />
              </div>
              <div>
                <h3 className="text-white font-black italic uppercase tracking-tight">Gyuuun Pilot Card</h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Profile Picture & Cover Banner (GIF, PNG, JPG)</p>
              </div>
            </div>

            {/* Profile Card Banner & Avatar */}
            <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 shadow-xl group">
              {profile?.bannerURL ? (
                <img src={profile.bannerURL} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-900 via-indigo-900 to-pink-900 opacity-60" />
              )}

              {/* Banner Upload Button */}
              <button
                onClick={handleBannerImageClick}
                className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/20 transition-all active:scale-95 shadow-lg"
              >
                <Camera size={12} />
                <span>Change Banner</span>
              </button>
              <input 
                type="file" 
                ref={bannerImageInputRef} 
                onChange={handleBannerImageChange} 
                accept="image/jpeg,image/png,image/gif,image/webp" 
                className="hidden" 
              />

              {/* Avatar Overlay */}
              <div className="absolute -bottom-2 left-4 flex items-end gap-3">
                <div className="relative group/avatar">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-zinc-900 bg-zinc-900 shadow-2xl">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <User size={36} />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleProfileImageClick}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-2xl cursor-pointer"
                    title="Change Profile Picture"
                  >
                    <Camera size={16} className="text-white" />
                  </button>
                  <input 
                    type="file" 
                    ref={profileImageInputRef} 
                    onChange={handleProfileImageChange} 
                    accept="image/jpeg,image/png,image/gif,image/webp" 
                    className="hidden" 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex-1 space-y-1 w-full text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 w-full max-w-xs">
                      <input 
                        type="text" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-blue-500/50 rounded-xl px-4 py-2 text-sm text-white font-black italic outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button onClick={handleNameSave} className="p-2 bg-green-500 text-white rounded-xl">
                        <Save size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">{profile?.username || "Anonymous Soldier"}</h4>
                      <button onClick={() => { playSound('click'); setIsEditingName(true); }} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500">
                        <Edit2 size={14} />
                      </button>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  Pilot ID: {profile?.uid.substring(0, 12)}...
                </div>
              </div>
            </div>
          </div>
          
          {/* Device Info (Read Only) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/30 p-4 rounded-2xl border border-white/5">
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-widest flex items-center gap-1">
                <Monitor size={10} /> Detected Hardware
              </div>
              <div className="text-sm font-black text-blue-400 italic">{localSettings.deviceType}</div>
            </div>
            <div className="bg-zinc-800/30 p-4 rounded-2xl border border-white/5">
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-widest flex items-center gap-1">
                <Smartphone size={10} /> System OS
              </div>
              <div className="text-sm font-black text-purple-400 italic">{localSettings.os}</div>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold uppercase text-xs tracking-widest">
                  <MousePointer2 size={14} className="text-blue-400" />
                  Mouse Sensitivity
                </div>
                <span className="text-blue-400 font-black italic">{localSettings.sensitivity.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.5" max="3" step="0.1"
                value={localSettings.sensitivity}
                onChange={(e) => setLocalSettings({...localSettings, sensitivity: parseFloat(e.target.value)})}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold uppercase text-xs tracking-widest">
                  <Clock size={14} className="text-yellow-400" />
                  Input Offset (Latency)
                </div>
                <span className="text-yellow-400 font-black italic">{localSettings.offset}ms</span>
              </div>
              <div className="flex gap-4 items-center">
                <input 
                  type="range" min="-200" max="200" step="1"
                  value={localSettings.offset}
                  onChange={(e) => setLocalSettings({...localSettings, offset: parseInt(e.target.value)})}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
                <button 
                  onClick={handleCalibrate}
                  className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[10px] font-black text-yellow-500 uppercase tracking-widest hover:bg-yellow-500/20 transition-all"
                >
                  Recalibrate
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold uppercase text-xs tracking-widest">
                  <Zap size={14} className="text-cyan-400" />
                  Target Speed
                </div>
                <span className="text-cyan-400 font-black italic">{localSettings.speed.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.5" max="2" step="0.1"
                value={localSettings.speed}
                onChange={(e) => setLocalSettings({...localSettings, speed: parseFloat(e.target.value)})}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          {/* Fever & AutoSave Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-800/20 p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-black italic uppercase tracking-tight">Fever Auto-Burst</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Automatic Activation</p>
                  </div>
                  <button 
                    onClick={() => setLocalSettings({...localSettings, autoFever: !localSettings.autoFever})}
                    className={`w-14 h-8 rounded-full p-1 transition-all ${localSettings.autoFever ? 'bg-red-500' : 'bg-zinc-700'}`}
                  >
                    <motion.div 
                      animate={{ x: localSettings.autoFever ? 24 : 0 }}
                      className="w-6 h-6 bg-white rounded-full shadow-lg"
                    />
                  </button>
              </div>
            </div>

            <div className="bg-zinc-800/20 p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-black italic uppercase tracking-tight">Autosave</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Keep Data Synced</p>
                  </div>
                  <button 
                    onClick={() => setLocalSettings({...localSettings, autoSave: !localSettings.autoSave})}
                    className={`w-14 h-8 rounded-full p-1 transition-all ${localSettings.autoSave ? 'bg-blue-500' : 'bg-zinc-700'}`}
                  >
                    <motion.div 
                      animate={{ x: localSettings.autoSave ? 24 : 0 }}
                      className="w-6 h-6 bg-white rounded-full shadow-lg"
                    />
                  </button>
              </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="bg-zinc-800/40 p-6 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Database className="text-purple-400" size={18} />
              </div>
              <div>
                <h3 className="text-white font-black italic uppercase tracking-tight">Data Management</h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Local & Cloud Sync</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={onExport}
                className="flex items-center justify-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all border border-white/5 group"
              >
                <Download size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
                Export .BGP
              </button>

              <button 
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-all border border-white/5 group"
              >
                <Upload size={14} className="text-green-400 group-hover:scale-110 transition-transform" />
                Import .BGP
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".bgp,.json" 
                  className="hidden" 
                />
              </button>

              <button 
                onClick={onManualSave}
                className="flex items-center justify-center gap-2 py-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-widest transition-all"
              >
                <Save size={14} />
                Save Data
              </button>

              <button 
                onClick={onDeleteData}
                className="flex items-center justify-center gap-2 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest transition-all"
              >
                <Trash2 size={14} />
                Clear Data
              </button>
            </div>
          </div>

          {/* Calibration Overlay */}
          <AnimatePresence>
            {isCalibrating && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-10 text-center"
              >
                <div className="mb-10">
                  <h3 className="text-3xl font-black text-white italic uppercase mb-2">Syncing Heartbeats...</h3>
                  <p className="text-sm text-gray-400">TAP THE TARGET 5 TIMES ON THE BEAT</p>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onCalibrateHit}
                  className="w-40 h-40 rounded-full bg-yellow-500 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)]"
                >
                  <Target size={80} className="text-black" />
                </motion.button>

                <div className="mt-10 flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full ${i < calibrationData.length ? 'bg-yellow-500' : 'bg-zinc-800'}`} 
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-800/80 backdrop-blur-md border-t border-white/5 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-2xl text-xs font-black text-white uppercase tracking-[0.2em] transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(localSettings)}
            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-black text-white uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Save size={16} />
            Apply Core Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
};
