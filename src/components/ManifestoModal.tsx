'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicAvatar } from './DoodleAvatars';

interface Candidate {
  id: string;
  name: string;
  manifesto: string;
  avatar_id: string;
}

interface ManifestoModalProps {
  candidate: Candidate;
  rollNo: string;
  email: string;
  deviceId: string;
  onClose: () => void;
  onVoteSuccess: (candidateName: string) => void;
}

export default function ManifestoModal({
  candidate,
  rollNo,
  email,
  deviceId,
  onClose,
  onVoteSuccess
}: ManifestoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleVote = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poll_id: 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88', // Default seed poll
          roll_no: rollNo,
          email: email,
          candidate_id: candidate.id,
          device_id: deviceId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.already_voted && data.voted_for) {
          throw new Error(`You have already voted in this election. You voted for: ${data.voted_for}. Duplicate votes are strictly blocked.`);
        }
        throw new Error(data.error || 'Something went wrong while submitting.');
      }

      onVoteSuccess(candidate.name);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ y: 50, scale: 0.9, opacity: 0, rotate: -1 }}
        animate={{ y: 0, scale: 1, opacity: 1, rotate: 1 }}
        exit={{ y: 50, scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-[#fffdf0] border-3 border-slate-800 p-8 shadow-[8px_8px_0px_0px_rgba(44,44,44,1)] relative sketch-element paper-texture"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '100% 24px',
          lineHeight: '24px'
        }}
      >
        {/* Top binder holes on index card */}
        <div className="absolute top-3 left-10 right-10 flex justify-between pointer-events-none opacity-40">
          <div className="w-3 h-3 rounded-full border border-slate-500 bg-slate-200" />
          <div className="w-3 h-3 rounded-full border border-slate-500 bg-slate-200" />
          <div className="w-3 h-3 rounded-full border border-slate-500 bg-slate-200" />
          <div className="w-3 h-3 rounded-full border border-slate-500 bg-slate-200" />
        </div>

        {/* Index Card Header Red Line */}
        <div className="w-full h-[1px] bg-red-400/50 mb-6 mt-2" />

        {/* Modal Close Button (Wobbly X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-3xl font-sketch text-slate-500 hover:text-slate-900 w-10 h-10 border-2 border-transparent hover:border-slate-800 rounded-full flex items-center justify-center transition-all select-none"
        >
          ✕
        </button>

        <div className="flex flex-col sm:flex-row gap-6 mt-4">
          {/* Avatar Container */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 border-2 border-slate-700 bg-white rounded-sm sketch-element-heavy flex-shrink-0 flex items-center justify-center relative p-2 shadow-sm">
            <DynamicAvatar avatarId={candidate.avatar_id} active={true} />
            <div className="absolute -bottom-3 -right-2 bg-yellow-300 border-2 border-slate-800 text-[10px] px-1.5 py-0.5 rounded-sm font-sketch font-bold rotate-6">
              CANDIDATE
            </div>
          </div>

          {/* Bio & Manifesto */}
          <div className="flex-1">
            <h3 className="text-3xl font-sketch font-bold text-slate-800 leading-none mb-3">
              {candidate.name}
            </h3>
            
            <div className="font-hand text-slate-700 text-lg mb-6 max-h-[160px] overflow-y-auto pr-2 pt-1 leading-relaxed">
              <strong className="font-sketch text-slate-800 text-sm block mb-1">MANIFESTO:</strong>
              {candidate.manifesto || "No manifesto written yet. This candidate is ready to represent you!"}
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-3 bg-red-50 border-2 border-red-500 text-red-700 font-hand rounded-sm text-md flex items-center gap-2 sketch-element"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 border-t-2 border-dashed border-slate-300 pt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-slate-800 hover:bg-slate-100 text-slate-800 font-sketch text-lg rounded-sm transition-all select-none"
          >
            ← Back to Corridor
          </button>
          
          <button
            onClick={handleVote}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-[#ff4757] hover:bg-[#e03d4c] active:translate-y-0.5 text-white font-sketch text-lg rounded-sm border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] hover:shadow-[1px_1px_0px_0px_rgba(44,44,44,1)] transition-all wiggle-hover select-none"
          >
            {isSubmitting ? 'Casting Vote...' : 'CAST VOTE! ✍'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
