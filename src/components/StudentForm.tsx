'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface StudentFormProps {
  onSubmit: (rollNo: string, email: string) => void;
}

export default function StudentForm({ onSubmit }: StudentFormProps) {
  const [rollNo, setRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRollChange = (val: string) => {
    const clean = val.replace(/\s/g, ''); // Remove spaces
    setRollNo(clean);
    
    // Auto-update email to match roll number exactly (prevents typos)
    if (clean) {
      setEmail(`${clean.toLowerCase()}@lhr.nu.edu.pk`);
    } else {
      setEmail('');
    }
  };

  const validate = () => {
    const cleanRoll = rollNo.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanRoll) {
      setError('Oops! Please write down your Roll Number.');
      return false;
    }
    if (!/^[ll]\d{6}$/.test(cleanRoll)) {
      setError('Invalid Roll Number format. Use L followed by 6 digits (e.g. L253100).');
      return false;
    }
    if (!cleanEmail) {
      setError('Please fill in your University Email.');
      return false;
    }
    if (cleanEmail !== `${cleanRoll}@lhr.nu.edu.pk`) {
      setError('Credential mismatch: Email must be exactly your roll number + @lhr.nu.edu.pk');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (validate()) {
      onSubmit(rollNo.trim().toLowerCase(), email.trim().toLowerCase());
    } else {
      setIsSubmitting(false);
      // Play shake animation on form
      const formEl = document.getElementById('login-form-container');
      if (formEl) {
        formEl.classList.add('animate-shake');
        setTimeout(() => formEl.classList.remove('animate-shake'), 500);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 relative min-h-[500px]">
      <motion.div
        id="login-form-container"
        initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        className="w-full max-w-md bg-white p-5 sm:p-8 border-3 border-slate-800 shadow-[8px_8px_0px_0px_rgba(44,44,44,1)] rounded-sm relative sketch-element paper-texture"
      >
        {/* Binder Holes */}
        <div className="absolute left-3 top-10 flex flex-col space-y-16 pointer-events-none">
          <div className="w-4 h-4 rounded-full border-2 border-slate-700 bg-[#fcfbf7]" />
          <div className="w-4 h-4 rounded-full border-2 border-slate-700 bg-[#fcfbf7]" />
          <div className="w-4 h-4 rounded-full border-2 border-slate-700 bg-[#fcfbf7]" />
        </div>

        <div className="pl-6 border-l-2 border-red-300/40">
          <h2 className="text-3xl font-sketch font-bold text-slate-800 mb-2 relative">
            Voter Login Sheet
            <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-indigo-500/35 skew-x-3" />
          </h2>
          <p className="text-sm text-slate-500 mb-6 font-hand">
            Fill in your roll number. Your official email will autofill.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Roll Number */}
            <div>
              <label className="block text-lg font-sketch text-slate-700 mb-2">
                Student Roll Number:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. L253100"
                  value={rollNo}
                  onChange={(e) => handleRollChange(e.target.value)}
                  className="w-full px-4 py-3 bg-[#faf9f5] border-2 border-slate-700 rounded-sm text-lg text-slate-800 focus:outline-none focus:ring-0 focus:border-indigo-600 sketch-element-heavy font-mono placeholder:text-slate-400 placeholder:font-hand"
                />
                <span className="absolute right-3 top-3.5 text-xs text-slate-400 font-hand pointer-events-none">
                  (7 chars)
                </span>
              </div>
            </div>

            {/* Email (Autofilled & locked to prevent mismatches) */}
            <div>
              <label className="block text-lg font-sketch text-slate-700 mb-2">
                University Email Address:
              </label>
              <input
                type="email"
                value={email}
                readOnly
                placeholder="e.g. l253100@lhr.nu.edu.pk"
                className="w-full px-4 py-3 bg-slate-100/50 border-2 border-slate-400 text-slate-500 rounded-sm text-lg focus:outline-none cursor-not-allowed font-mono sketch-element"
              />
              <span className="text-[11px] text-indigo-500 font-hand mt-1 block">
                ✓ Auto-filled to match your roll number
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-red-50 border-2 border-red-400 text-red-700 font-hand rounded-sm text-md flex items-center gap-2 sketch-element"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 active:translate-y-1 text-white font-sketch text-xl rounded-sm border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(100,116,139,1)] hover:shadow-[2px_2px_0px_0px_rgba(100,116,139,1)] transition-all wiggle-hover select-none"
            >
              {isSubmitting ? 'Verifying...' : 'Enter Corridor ➔'}
            </button>
          </form>

          <div className="mt-8 flex justify-between items-center text-xs text-slate-400 font-hand">
            <span>Class Representative Election 2026</span>
            <span className="rotate-12 border border-slate-300 px-2 py-0.5 rounded-sm">CR ELECTION</span>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-0.5deg); }
          20%, 40%, 60%, 80% { transform: translateX(4px) rotate(0.5deg); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
