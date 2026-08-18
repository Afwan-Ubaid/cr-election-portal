'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface VoteSuccessProps {
  candidateName: string;
  rollNo: string;
  email: string;
  onReset: () => void;
}

export default function VoteSuccess({ candidateName, rollNo, email, onReset }: VoteSuccessProps) {
  useEffect(() => {
    // Trigger confetti explosion on mount
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2c2c2c', '#ff4757', '#ffc107', '#4caf50']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2c2c2c', '#ff4757', '#ffc107', '#4caf50']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }, []);

  const formatTime = () => {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[500px]">
      <motion.div
        initial={{ y: 50, opacity: 0, rotate: 2 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className="w-full max-w-sm bg-white border-3 border-slate-800 p-8 shadow-[6px_6px_0px_0px_rgba(44,44,44,1)] relative sketch-element paper-texture"
      >
        {/* Hand-drawn torn edge top and bottom */}
        <div className="absolute top-[-10px] left-0 right-0 h-3 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 10%22 preserveAspectRatio=%22none%22%3E%3Cpolygon points=%220,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10%22 fill=%22%23faf9f5%22/%3E%3C/svg%3E')] bg-repeat-x bg-cover" />
        <div className="absolute bottom-[-10px] left-0 right-0 h-3 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 10%22 preserveAspectRatio=%22none%22%3E%3Cpolygon points=%220,0 5,10 10,0 15,10 20,0 25,10 30,0 35,10 40,0 45,10 50,0 55,10 60,0 65,10 70,0 75,10 80,0 85,10 90,0 95,10 100,0%22 fill=%22%23faf9f5%22/%3E%3C/svg%3E')] bg-repeat-x bg-cover" />

        <div className="text-center">
          {/* Big Green Sketch Checkmark */}
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border-3 border-emerald-500 rounded-full text-emerald-500 sketch-element rotate-[-6deg]">
            <svg
              viewBox="0 0 24 24"
              className="w-12 h-12 fill-none stroke-current"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h3 className="text-3xl font-sketch font-bold text-slate-800 mb-1">
            VOTE CAST!
          </h3>
          <p className="text-sm text-slate-400 font-hand mb-6">
            Official Election Commission Receipt
          </p>

          <div className="border-t-2 border-b-2 border-dashed border-slate-300 py-4 my-6 text-left space-y-3 font-mono text-sm text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">RECEIPT NO:</span>
              <span className="font-bold">#{Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">VOTER ID:</span>
              <span className="font-bold">{rollNo.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">EMAIL:</span>
              <span className="font-bold truncate max-w-[180px]">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SELECTION:</span>
              <span className="font-bold text-slate-900 scribble-highlight relative inline-block">
                {candidateName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">TIMESTAMP:</span>
              <span className="font-bold text-[10px] mt-0.5">{formatTime()}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-hand mb-6 italic leading-relaxed">
            Thank you for participating! Your vote was successfully registered in the database, protected by single-entry constraints.
          </p>

          <button
            onClick={onReset}
            className="w-full py-3 bg-[#faf9f5] border-2 border-slate-800 hover:bg-[#eae8df] text-slate-800 font-sketch text-lg rounded-sm transition-all wiggle-hover select-none"
          >
            ← Logout Voter
          </button>
        </div>
      </motion.div>
    </div>
  );
}
