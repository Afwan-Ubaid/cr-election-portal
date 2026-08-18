'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_STEPS = [
  'Sketching viewport canvas...',
  'Placing classroom desks...',
  'Hanging candidate posters...',
  'Organizing wobbly chairs...',
  'Sharpening pencil leads...',
  'Opening classroom booths...',
  'Ready to vote!'
];

export default function PaperLoader({ onComplete }: { onComplete: () => void }) {
  // Two-stage load: 1. Splash Screen, 2. Progress Loader
  const [isStarted, setIsStarted] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Sound effect helper (sfx representation)
  const playTearSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('AudioContext not supported or allowed yet');
    }
  };

  const handleStart = () => {
    playTearSound();
    setIsBreaking(true);
    setTimeout(() => {
      setIsStarted(true);
    }, 700);
  };

  useEffect(() => {
    if (!isStarted) return;

    let currentProgress = 0;
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 8) + 4;
      currentProgress = Math.min(currentProgress + increment, 100);
      setProgress(currentProgress);

      const stepIdx = Math.min(
        Math.floor((currentProgress / 100) * LOADING_STEPS.length),
        LOADING_STEPS.length - 1
      );
      setStepIndex(stepIdx);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsDone(true);
          playTearSound();
          setTimeout(onComplete, 850);
        }, 600);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isStarted, onComplete]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#e2e0d5] flex items-center justify-center">
      
      {/* STAGE 1: Notebook Splash Screen */}
      <AnimatePresence>
        {!isStarted && (
          <div className="absolute inset-0 z-40 flex overflow-hidden">
            {/* Left Cover Half */}
            <motion.div
              className="w-1/2 h-full bg-[#fcdb66] border-r border-dashed border-slate-600 paper-grid paper-texture flex flex-col justify-center items-end pr-10 shadow-[inset_-10px_0px_20px_rgba(0,0,0,0.15)]"
              animate={isBreaking ? { x: '-100%', rotate: -8, scale: 0.95 } : { x: 0 }}
              transition={{ duration: 0.7, ease: [0.77, 0, 0.175, 1] }}
            >
              {/* Binder line decorations on cover */}
              <div className="absolute left-6 top-0 bottom-0 flex flex-col justify-around pointer-events-none opacity-40">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-slate-400 border border-slate-600" />
                ))}
              </div>

              <div className="text-right max-w-sm pointer-events-none">
                <h1 className="text-6xl font-sketch font-bold text-slate-800 tracking-tight leading-none">
                  CLASS CR
                </h1>
                <p className="text-2xl font-hand text-slate-700 mt-2">
                  Election Portal 2026
                </p>
              </div>
            </motion.div>

            {/* Right Cover Half */}
            <motion.div
              className="w-1/2 h-full bg-[#fcdb66] border-l border-dashed border-slate-600 paper-grid paper-texture flex flex-col justify-center items-start pl-10 shadow-[inset_10px_0px_20px_rgba(0,0,0,0.15)]"
              animate={isBreaking ? { x: '100%', rotate: 8, scale: 0.95 } : { x: 0 }}
              transition={{ duration: 0.7, ease: [0.77, 0, 0.175, 1] }}
            >
              <div className="text-left max-w-sm pointer-events-none">
                <h1 className="text-6xl font-sketch font-bold text-slate-800 tracking-tight leading-none">
                  ELECTION
                </h1>
                <p className="text-2xl font-hand text-slate-700 mt-2">
                  lhr.nu.edu.pk verification
                </p>
              </div>
            </motion.div>

            {/* Central sticky note button on top of both covers */}
            {!isBreaking && (
              <motion.button
                onClick={handleStart}
                initial={{ scale: 0.8, rotate: -3 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05, rotate: 1 }}
                className="absolute z-50 left-[calc(50%-105px)] top-[calc(50%-55px)] w-[210px] h-[110px] bg-white border-3 border-slate-800 shadow-[5px_5px_0px_0px_rgba(44,44,44,1)] flex flex-col items-center justify-center p-4 cursor-pointer sketch-element wiggle-hover"
              >
                <span className="text-2xl font-sketch font-bold text-slate-800">
                  OPEN ELECTION BOOK
                </span>
                <span className="text-xs text-rose-500 font-hand font-bold mt-1.5 border border-dashed border-rose-400 px-2 py-0.5 rounded-sm">
                  ✂ TEAR TO START ✂
                </span>
              </motion.button>
            )}

            {/* Jagged page tear outline overlay during break */}
            {isBreaking && (
              <motion.div
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-40 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 100%22 preserveAspectRatio=%22none%22%3E%3Cpath d=%22M5,0 L10,5 L5,10 L10,15 L5,20 L10,25 L5,30 L10,35 L5,40 L10,45 L5,50 L10,55 L5,60 L10,65 L5,70 L10,75 L5,80 L10,85 L5,90 L10,95 L5,100 Z%22 fill=%22none%22 stroke=%22%23b45309%22 stroke-width=%221.5%22/%3E%3C/svg%3E')] bg-repeat-y bg-center bg-contain pointer-events-none"
              />
            )}
          </div>
        )}
      </AnimatePresence>

      {/* STAGE 2: Progress Loading Screen */}
      {isStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#faf9f5] paper-grid paper-texture overflow-hidden">
          
          {/* Loose Leaf Paper Margin Line */}
          <div className="absolute left-[50px] top-0 bottom-0 w-[2px] bg-red-400/35" />

          {/* Torn Edge Effect on Left & Right */}
          <div className="absolute left-0 top-0 bottom-0 w-[18px] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 100%22 preserveAspectRatio=%22none%22%3E%3Cpath d=%22M0,0 L10,5 L0,10 L10,15 L0,20 L10,25 L0,30 L10,35 L0,40 L10,45 L0,50 L10,55 L0,60 L10,65 L0,70 L10,75 L0,80 L10,85 L0,90 L10,95 L0,100 Z%22 fill=%22%23e2e0d5%22/%3E%3C/svg%3E')] bg-repeat-y bg-contain" />

          <div className="text-center p-8 max-w-md w-full relative z-10">
            {/* Hand-drawn Outer Border */}
            <div className="doodle-border p-8 bg-white/70 shadow-sm relative sketch-element">
              
              {/* Paper Clip Doodle */}
              <div className="absolute -top-6 left-12 w-8 h-12 border-2 border-slate-600 rounded-full rotate-12 bg-white/90 z-20 flex items-center justify-center">
                <div className="w-4 h-8 border border-slate-400 rounded-full" />
              </div>

              {/* Title with scribble highlight */}
              <h1 className="text-4xl font-sketch font-bold text-slate-800 mb-6 relative inline-block">
                LOADING DESKS...
                <div className="absolute -bottom-2 left-0 right-0 h-2 bg-yellow-300/60 -rotate-1 rounded-sm -z-10" />
              </h1>

              {/* Progress Circle (Wobbly) */}
              <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                  {/* Background Circle */}
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    stroke="#eae7db"
                    strokeWidth="3.5"
                    fill="transparent"
                    strokeDasharray="6 4"
                    className="sketch-element"
                  />
                  {/* Active progress */}
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    stroke="#2c2c2c"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * progress) / 100}
                    className="sketch-element transition-all duration-75"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-3xl font-sketch font-bold text-slate-700">{progress}%</span>
              </div>

              {/* Loading Status */}
              <div className="h-6">
                <motion.p
                  key={stepIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-lg text-slate-500 font-medium font-hand"
                >
                  {LOADING_STEPS[stepIndex]}
                </motion.p>
              </div>

              {/* Doodles */}
              <div className="absolute -bottom-4 -left-4 text-slate-400 font-sketch text-2xl select-none rotate-[-12deg] pointer-events-none">✎</div>
              <div className="absolute -top-4 -right-4 text-slate-400 font-sketch text-2xl select-none rotate-[25deg] pointer-events-none">★</div>
            </div>
          </div>

          {/* Left and Right rips that split when loading is fully complete */}
          {isDone && (
            <div className="absolute inset-0 z-50 flex">
              <motion.div
                className="w-1/2 h-full bg-[#faf9f5] border-r-4 border-dashed border-slate-600 shadow-[5px_0px_20px_rgba(0,0,0,0.15)] flex justify-end items-center"
                initial={{ x: 0 }}
                animate={{ x: '-100%', rotate: -5 }}
                transition={{ duration: 0.65, ease: [0.77, 0, 0.175, 1] }}
              >
                {/* Jagged tear line decoration on exit */}
                <div className="w-[15px] h-full bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 100%22%3E%3Cpath d=%22M10,0 L0,5 L10,10 L0,15 L10,20 L0,25 L10,30 L0,35 L10,40 L0,45 L10,50 L0,55 L10,60 L0,65 L10,70 L0,75 L10,80 L0,85 L10,90 L0,95 L10,100 Z%22 fill=%22%23cbd5e1%22/%3E%3C/svg%3E')] bg-repeat-y opacity-30" />
              </motion.div>
              <motion.div
                className="w-1/2 h-full bg-[#faf9f5] border-l-4 border-dashed border-slate-600 shadow-[-5px_0px_20px_rgba(0,0,0,0.15)] flex justify-start items-center"
                initial={{ x: 0 }}
                animate={{ x: '100%', rotate: 5 }}
                transition={{ duration: 0.65, ease: [0.77, 0, 0.175, 1] }}
              >
                {/* Jagged tear line decoration on exit */}
                <div className="w-[15px] h-full bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 100%22%3E%3Cpath d=%22M0,0 L10,5 L0,10 L10,15 L0,20 L10,25 L0,30 L10,35 L0,40 L10,45 L0,50 L10,55 L0,60 L10,65 L0,70 L10,75 L0,80 L10,85 L0,90 L10,95 L0,100 Z%22 fill=%22%23cbd5e1%22/%3E%3C/svg%3E')] bg-repeat-y opacity-30" />
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
