/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheck, AlertCircle, LogIn, UserPlus } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
  onGuestPlay: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onGuestPlay }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isAdminEmail = ['mdv4244@gmail.com', 'zerozone757@gmail.com', 'usagyuuunquan@gmail.com'].includes(email.toLowerCase());
    const adminPass = 'mark4246';

    try {
      if (isLogin) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (loginErr: any) {
          // If admin fails login (account doesn't exist or wrong password initially), 
          // and they used the correct admin password, try to create/fix it
          if (isAdminEmail && password === adminPass) {
            try {
              await createUserWithEmailAndPassword(auth, email, password);
            } catch (createErr: any) {
              // If already exists but login failed, it might be password mismatch (though unlikely if mark4246 is the rule)
              // We'll just throw the original error if creation fails for other reasons
              if (createErr.code !== 'auth/email-already-in-use') throw createErr;
              throw loginErr;
            }
          } else {
            throw loginErr;
          }
        }
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error("Auth Error:", err.code, err.message);
      
      let message = 'Authentication failed. Please check your credentials.';
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email or password. If you haven\'t signed up yet, please click "Sign Up" below.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please login instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }

      // Special hint for admin emails
      const isAdminEmail = ['mdv4244@gmail.com', 'zerozone757@gmail.com', 'usagyuuunquan@gmail.com'].includes(email.toLowerCase());
      if (isAdminEmail && err.code === 'auth/invalid-credential') {
        message = 'Admin access detected. If you haven\'t created your account yet, switch to "Sign Up" and use your assigned password.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md p-8 bg-black/80 backdrop-blur-xl border-2 border-white/10 rounded-[2.5rem] shadow-2xl">
      <div className="flex flex-col items-center mb-8">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/50"
        >
          <ShieldCheck className="text-blue-400" size={40} />
        </motion.div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase text-center">
          Bullet Gyuuun Party!!!
        </h1>
        <p className="text-gray-400 text-sm mt-2 font-medium tracking-widest uppercase">Security Protocol Active</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
            placeholder="usagyuuun@minto.inc"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-sm"
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
              {isLogin ? 'Login To Play' : 'Initialize Account'}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onGuestPlay}
          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-zinc-400 font-bold uppercase text-xs tracking-[0.2em] transition-all"
        >
          Play As Guest
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-gray-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </button>
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-2">
        <div className="text-[10px] text-gray-600 uppercase font-bold tracking-[0.3em]">Anti-Virus: Enabled</div>
        <div className="text-[10px] text-green-500/50 uppercase font-bold tracking-[0.3em]">System Status: Optimal</div>
      </div>
    </div>
  );
};
