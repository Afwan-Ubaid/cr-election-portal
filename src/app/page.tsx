'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PaperLoader from '@/components/PaperLoader';
import StudentForm from '@/components/StudentForm';
import CorridorCanvas from '@/components/CorridorCanvas';
import ManifestoModal from '@/components/ManifestoModal';
import VoteSuccess from '@/components/VoteSuccess';

interface Candidate {
  id: string;
  name: string;
  manifesto: string;
  avatar_id: string;
}

export default function Home() {
  const [showLoader, setShowLoader] = useState(true);
  const [voter, setVoter] = useState<{ rollNo: string; email: string } | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [votedCandidateName, setVotedCandidateName] = useState<string | null>(null);
  const [poll, setPoll] = useState<{ id: string; title: string; is_active: boolean } | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  // 1. Fetch Candidates and Results on load
  const fetchElectionData = async () => {
    try {
      const response = await fetch('/api/results');
      const data = await response.json();
      if (response.ok) {
        setPoll(data.poll);
        // Sort alphabetically by name so they stay in a fixed order in the corridor
        const sortedCandidates = [...data.candidates].sort((a, b) => a.name.localeCompare(b.name));
        setCandidates(sortedCandidates);
        setTotalVotes(data.totalVotes);
      }
    } catch (err) {
      console.error('Failed to load election data:', err);
    }
  };

  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    fetchElectionData();
    // Load session if exists
    const savedRoll = localStorage.getItem('voter_roll');
    const savedEmail = localStorage.getItem('voter_email');
    if (savedRoll && savedEmail) {
      setVoter({ rollNo: savedRoll, email: savedEmail });
    }

    // Load or generate unique browser device fingerprint
    let devId = localStorage.getItem('voter_device_id');
    if (!devId) {
      devId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('voter_device_id', devId);
    }
    setDeviceId(devId);
  }, []);

  const handleLogin = (rollNo: string, email: string) => {
    localStorage.setItem('voter_roll', rollNo);
    localStorage.setItem('voter_email', email);
    setVoter({ rollNo, email });
  };

  const handleLogout = () => {
    localStorage.removeItem('voter_roll');
    localStorage.removeItem('voter_email');
    setVoter(null);
    setFocusIndex(-1);
    setSelectedCandidate(null);
  };

  const handleVoteSuccess = (name: string) => {
    setVotedCandidateName(name);
    setSelectedCandidate(null); // Automatically closes the modal
    // Clear session info so voter is signed out after voting
    localStorage.removeItem('voter_roll');
    localStorage.removeItem('voter_email');
    fetchElectionData(); // Refresh standings
  };

  const handleNextCandidate = () => {
    if (candidates.length === 0) return;
    setFocusIndex((prev) => (prev + 1 >= candidates.length ? -1 : prev + 1));
  };

  const handlePrevCandidate = () => {
    if (candidates.length === 0) return;
    setFocusIndex((prev) => (prev - 1 < -1 ? candidates.length - 1 : prev - 1));
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#faf9f5] paper-grid paper-margin paper-texture relative py-12 px-4 sm:px-8">
      {/* 1. Paper Tear Loader overlay */}
      {showLoader && <PaperLoader onComplete={() => setShowLoader(false)} />}

      {!showLoader && (
        <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center relative z-10 pl-12">
          
          <AnimatePresence mode="wait">
            {/* 2. Success Receipt screen */}
            {votedCandidateName ? (
              <VoteSuccess
                key="success"
                candidateName={votedCandidateName}
                rollNo={voter?.rollNo || ''}
                email={voter?.email || ''}
                onReset={() => {
                  setVotedCandidateName(null);
                  setVoter(null);
                  setFocusIndex(-1);
                }}
              />
            ) : !voter ? (
              /* 3. Credentials Validation Form */
              <StudentForm key="login" onSubmit={handleLogin} />
            ) : (
              /* 4. Interactive 3D Portal Corridor */
              <motion.div
                key="portal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-6"
              >
                {/* Header board */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-slate-700 pb-4">
                  <div>
                    <h1 className="text-4xl sm:text-5xl font-sketch font-bold text-slate-800 scribble-highlight relative inline-block">
                      CR ELECTION 2026
                    </h1>
                    <p className="text-md text-slate-500 font-hand mt-1">
                      {poll?.is_active 
                        ? "Navigate the wobbly classroom board side-by-side to cast your representative vote."
                        : "Voting is closed! Automatically displaying final election results animations."}
                    </p>
                  </div>
                  
                  {/* Voter Badge with Logout */}
                  <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white border-2 border-slate-700 p-2 shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] sketch-element">
                    <span className="font-mono text-sm font-bold text-slate-700">
                      ID: {voter.rollNo.toUpperCase()}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-red-50 text-red-600 border border-slate-400 rounded-sm font-sketch select-none"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* 3D Corridor Area */}
                <CorridorCanvas
                  candidates={candidates}
                  focusIndex={focusIndex}
                  onSelectCandidate={poll?.is_active ? (cand) => setSelectedCandidate(cand) : () => {}}
                  isClosed={poll ? !poll.is_active : false}
                  totalVotes={totalVotes}
                />

                {/* Corridor Controls Bar */}
                <div className="flex flex-wrap justify-between items-center gap-4 bg-white/70 border-2 border-slate-700 p-4 rounded-sm sketch-element relative">
                  {/* Info Badge */}
                  <div className="font-sketch text-lg text-slate-700">
                    {focusIndex === -1 ? (
                      <span>📍 Hallway Entryway</span>
                    ) : (
                      <span>
                        👉 Reviewing Candidate: <strong className="text-indigo-600">{candidates[focusIndex]?.name}</strong>
                      </span>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevCandidate}
                      className="px-4 py-2 bg-[#faf9f5] border-2 border-slate-800 hover:bg-slate-100 text-slate-800 font-sketch rounded-sm select-none transition-all active:translate-y-0.5"
                    >
                      ◀ Prev
                    </button>
                    <button
                      onClick={() => setFocusIndex(-1)}
                      className="px-4 py-2 bg-[#faf9f5] border-2 border-slate-800 hover:bg-slate-100 text-slate-800 font-sketch rounded-sm select-none transition-all active:translate-y-0.5"
                    >
                      Overview
                    </button>
                    <button
                      onClick={handleNextCandidate}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-900 rounded-sm font-sketch select-none transition-all active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(100,116,139,1)]"
                    >
                      Next ▶
                    </button>
                  </div>
                </div>

                {/* Footer Doodles */}
                <div className="flex justify-between items-center text-xs text-slate-400 font-hand mt-4">
                  <span>Scroll or click next/prev to navigate</span>
                  <a href="/admin" className="hover:underline hover:text-slate-600">
                    Teacher/Admin Chalkboard ➔
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Candidate Manifesto Modal overlay */}
          <AnimatePresence>
            {selectedCandidate && (
              <ManifestoModal
                key="modal"
                candidate={selectedCandidate}
                rollNo={voter?.rollNo || ''}
                email={voter?.email || ''}
                deviceId={deviceId}
                onClose={() => setSelectedCandidate(null)}
                onVoteSuccess={handleVoteSuccess}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
