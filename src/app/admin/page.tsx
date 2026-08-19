'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DynamicAvatar } from '@/components/DoodleAvatars';

interface Candidate {
  id: string;
  name: string;
  manifesto: string;
  avatar_id: string;
  vote_count?: number;
}

interface AuditSummary {
  success: number;
  duplicates: number;
  invalidRolls: number;
  totalAttempts: number;
}

interface FlaggedDevice {
  device_id: string;
  vote_count: number;
  roll_numbers: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [poll, setPoll] = useState<{ id: string; title: string; is_active: boolean } | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [auditSummary, setAuditSummary] = useState<AuditSummary>({ success: 0, duplicates: 0, invalidRolls: 0, totalAttempts: 0 });
  const [flaggedDevices, setFlaggedDevices] = useState<FlaggedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Candidate Form States
  const [newCandName, setNewCandName] = useState('');
  const [newCandManifesto, setNewCandManifesto] = useState('');
  const [newCandAvatar, setNewCandAvatar] = useState('avatar1');
  const [formError, setFormError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Status message state
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Password, email, and device key check on mount
  useEffect(() => {
    // Parse device_key query parameter if present
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const key = urlParams.get('device_key');
      if (key) {
        localStorage.setItem('admin_device_key', key);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    const isAuth = localStorage.getItem('admin_authenticated') === 'true';
    const savedEmail = localStorage.getItem('admin_email');
    const savedDeviceKey = localStorage.getItem('admin_device_key');

    if (isAuth && savedEmail === 'afwanubaid9@gmail.com' && savedDeviceKey) {
      Promise.resolve().then(() => {
        setIsAuthenticated(true);
      });
    } else {
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_email');
      localStorage.removeItem('admin_password');
    }
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deviceKey = localStorage.getItem('admin_device_key') || '';
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-device-key': deviceKey
        },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setPasswordError('');
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_email', emailInput);
        localStorage.setItem('admin_password', passwordInput);
      } else {
        setPasswordError(data.error || 'Incorrect admin credentials. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Server connection failed. Please try again.');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_password');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const fetchResults = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/results');
      const data = await res.json();
      if (res.ok) {
        setPoll(data.poll);
        setCandidates(data.candidates);
        setTotalVotes(data.totalVotes);
        setAuditSummary(data.auditSummary);
        setFlaggedDevices(data.flaggedDevices || []);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      Promise.resolve().then(() => {
        fetchResults();
      });
      const interval = setInterval(fetchResults, 5000);
      return () => clearInterval(interval);
    } else {
      Promise.resolve().then(() => {
        setIsLoading(false);
      });
    }
  }, [isAuthenticated]);

  const handleTogglePoll = async (open: boolean) => {
    const adminEmail = localStorage.getItem('admin_email') || '';
    const adminPassword = localStorage.getItem('admin_password') || '';
    const deviceKey = localStorage.getItem('admin_device_key') || '';
    try {
      const res = await fetch('/api/admin/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
          'x-admin-password': adminPassword,
          'x-admin-device-key': deviceKey
        },
        body: JSON.stringify({ is_active: open })
      });
      const data = await res.json();
      if (res.ok) {
        setPoll(data.poll);
        setStatusMessage(data.message);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to toggle election state.');
    }
  };

  const handleSetupDatabase = async () => {
    if (!confirm('This will wipe all active votes and restart all counts back to zero. Are you sure?')) return;
    setIsLoading(true);
    const adminEmail = localStorage.getItem('admin_email') || '';
    const adminPassword = localStorage.getItem('admin_password') || '';
    const deviceKey = localStorage.getItem('admin_device_key') || '';
    try {
      const res = await fetch('/api/admin/setup', { 
        method: 'POST',
        headers: { 
          'x-admin-email': adminEmail,
          'x-admin-password': adminPassword,
          'x-admin-device-key': deviceKey
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchResults();
      } else {
        alert('Failed: ' + (data.details || data.error));
      }
    } catch (err) {
      console.error(err);
      alert('Reset API request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetVote = async (rollNo: string) => {
    if (!confirm(`Are you sure you want to delete the vote for ${rollNo.toUpperCase()}? This will allow them to vote again.`)) {
      return;
    }
    setIsLoading(true);
    const adminEmail = localStorage.getItem('admin_email') || '';
    const adminPassword = localStorage.getItem('admin_password') || '';
    const deviceKey = localStorage.getItem('admin_device_key') || '';
    try {
      const res = await fetch('/api/admin/delete-vote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
          'x-admin-password': adminPassword,
          'x-admin-device-key': deviceKey
        },
        body: JSON.stringify({ roll_no: rollNo })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message || `Vote for ${rollNo.toUpperCase()} deleted.`);
        setTimeout(() => setStatusMessage(''), 3000);
        fetchResults();
      } else {
        alert(data.error || 'Failed to delete vote.');
      }
    } catch (err) {
      console.error(err);
      alert('Delete vote request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandName.trim()) {
      setFormError('Candidate name cannot be empty.');
      return;
    }
    setIsAdding(true);
    setFormError('');
    const adminEmail = localStorage.getItem('admin_email') || '';
    const adminPassword = localStorage.getItem('admin_password') || '';
    const deviceKey = localStorage.getItem('admin_device_key') || '';

    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
          'x-admin-password': adminPassword,
          'x-admin-device-key': deviceKey
        },
        body: JSON.stringify({
          name: newCandName,
          manifesto: newCandManifesto,
          avatar_id: newCandAvatar
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNewCandName('');
        setNewCandManifesto('');
        setNewCandAvatar('avatar1');
        setStatusMessage('Candidate added successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
        fetchResults();
      } else {
        setFormError(data.error || 'Failed to add candidate.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network error occurred.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this candidate? This will also remove any votes they have received.')) return;
    const adminEmail = localStorage.getItem('admin_email') || '';
    const adminPassword = localStorage.getItem('admin_password') || '';
    const deviceKey = localStorage.getItem('admin_device_key') || '';
    try {
      const res = await fetch(`/api/candidates?id=${id}`, { 
        method: 'DELETE',
        headers: { 
          'x-admin-email': adminEmail,
          'x-admin-password': adminPassword,
          'x-admin-device-key': deviceKey
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message);
        setTimeout(() => setStatusMessage(''), 3000);
        fetchResults();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete candidate.');
    }
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Candidate Name,Votes Received,Percentage\n';
    
    candidates.forEach(cand => {
      const pct = totalVotes > 0 ? ((cand.vote_count || 0) / totalVotes * 100).toFixed(1) : '0.0';
      csvContent += `"${cand.name}",${cand.vote_count || 0},${pct}%\n`;
    });

    csvContent += `\nTotal Votes Cast,${totalVotes}\n`;
    csvContent += `Blocked Duplicate Attempts,${auditSummary.duplicates}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cr_election_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center font-sketch text-2xl text-slate-600">
        Loading teacher chalkboards...
      </div>
    );
  }

  // LOGIN PAGE IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen chalkboard flex items-center justify-center p-6">
        <div className="w-full max-w-md border-8 border-amber-950 rounded-lg p-8 shadow-2xl bg-emerald-950/20 text-center">
          <h1 className="text-3xl font-sketch font-bold text-slate-100 mb-6 drop-shadow">
            Teacher Desk Login
          </h1>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="text-left">
              <label className="block text-sm text-slate-300 mb-2">Admin Email:</label>
              <input
                type="email"
                placeholder="Enter admin email..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-3 bg-emerald-950/50 border-2 border-slate-400 rounded-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-yellow-300 text-lg"
              />
            </div>

            <div className="text-left">
              <label className="block text-sm text-slate-300 mb-2">Admin Password:</label>
              <input
                type="password"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-emerald-950/50 border-2 border-slate-400 rounded-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-yellow-300 text-lg"
              />
            </div>

            {passwordError && (
              <div className="text-rose-400 text-md font-hand bg-red-950/30 p-2.5 border border-rose-800 rounded-sm">
                ⚠️ {passwordError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-900 border border-yellow-400 font-bold rounded-sm text-xl transition-all"
            >
              Unlock Chalkboard ➔
            </button>
          </form>
          <div className="mt-8">
            <Link href="/" className="text-xs text-yellow-300/60 hover:text-yellow-300 hover:underline">
              ← Go back to Student Voting booth
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen chalkboard p-6 sm:p-12 relative flex flex-col items-center">
      {/* Wooden blackboard frame */}
      <div className="w-full max-w-5xl border-x-[16px] border-y-[12px] border-amber-950 rounded-lg p-6 sm:p-10 shadow-[0px_20px_50px_rgba(0,0,0,0.5)] bg-emerald-950/20 relative">
        
        {/* Chalk holder shelf decoration */}
        <div className="absolute bottom-[-16px] left-[10%] right-[10%] h-[12px] bg-amber-900 border-t-2 border-amber-950 rounded-sm flex justify-around px-12 items-center text-[10px] text-slate-300 pointer-events-none">
          <div className="w-8 h-2 bg-slate-100 rounded-sm rotate-12 opacity-80" />
          <div className="w-6 h-2 bg-yellow-100 rounded-sm rotate-[-8deg] opacity-70" />
          <div className="w-8 h-2.5 bg-[#4caf50]/20 rounded-sm rotate-6 opacity-30" />
        </div>

        {/* Dashboard Title */}
        <div className="text-center mb-8 border-b border-dashed border-slate-500 pb-6 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl font-sketch font-bold text-slate-100 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              CR ELECTION ADMIN PANEL
            </h1>
            <p className="text-lg text-slate-300 font-hand mt-2">
              Class representative voting statistics & controls.
            </p>
          </div>
          
          <button
            onClick={handleAdminLogout}
            className="mt-4 sm:mt-0 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 border border-slate-500 rounded-sm"
          >
            Lock Panel 🔒
          </button>
        </div>

        {statusMessage && (
          <div className="mb-6 p-3 border border-yellow-300 text-yellow-200 font-hand rounded-sm text-center text-lg bg-yellow-950/40">
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: CONTROLS & CANDIDATES */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Box 1: Election Controls */}
            <div className="border-2 border-slate-400 p-6 rounded-sm bg-emerald-950/40">
              <h2 className="text-2xl font-bold text-yellow-300 mb-4">✍ Election Controls</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span>Poll Status:</span>
                  {poll?.is_active ? (
                    <span className="text-emerald-400 font-bold border border-emerald-400 px-2 py-0.5 rounded-sm bg-emerald-950/60">OPEN / ACTIVE</span>
                  ) : (
                    <span className="text-rose-400 font-bold border border-rose-400 px-2 py-0.5 rounded-sm bg-rose-950/60">FROZEN / CLOSED</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleTogglePoll(true)}
                    disabled={poll?.is_active}
                    className="py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 disabled:opacity-40 text-white rounded-sm border border-emerald-500 font-bold transition-all"
                  >
                    Open Polls
                  </button>
                  <button
                    onClick={() => handleTogglePoll(false)}
                    disabled={!poll?.is_active}
                    className="py-2.5 bg-rose-800 hover:bg-rose-700 active:scale-95 disabled:opacity-40 text-white rounded-sm border border-rose-600 font-bold transition-all"
                  >
                    Freeze Polls
                  </button>
                </div>

                <div className="border-t border-slate-600 my-4 pt-4">
                  <button
                    onClick={handleSetupDatabase}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-100 rounded-sm border border-slate-500 text-sm font-bold transition-all"
                  >
                    ⚠ Wipe All Votes & Reset Counts
                  </button>
                </div>
              </div>
            </div>

            {/* Box 2: Add Candidate */}
            <div className="border-2 border-slate-400 p-6 rounded-sm bg-emerald-950/40">
              <h2 className="text-2xl font-bold text-yellow-300 mb-4">✚ Add New Candidate</h2>
              
              <form onSubmit={handleAddCandidate} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Candidate Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Bilal Khan"
                    value={newCandName}
                    onChange={(e) => setNewCandName(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-950/50 border border-slate-400 rounded-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-300"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Manifesto Points:</label>
                  <textarea
                    rows={3}
                    placeholder="Describe policies..."
                    value={newCandManifesto}
                    onChange={(e) => setNewCandManifesto(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-950/50 border border-slate-400 rounded-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-300 text-sm font-hand"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Select Avatar:</label>
                  <div className="flex gap-4">
                    {['avatar1', 'avatar2', 'avatar3'].map(avId => (
                      <label
                        key={avId}
                        className={`flex-1 p-2 border rounded-sm cursor-pointer flex flex-col items-center gap-1 transition-all ${
                          newCandAvatar === avId
                            ? 'border-yellow-300 bg-yellow-400/10'
                            : 'border-slate-500 bg-emerald-950/30 hover:border-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="avatarSelection"
                          value={avId}
                          checked={newCandAvatar === avId}
                          onChange={() => setNewCandAvatar(avId)}
                          className="hidden"
                        />
                        <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center p-1">
                          <DynamicAvatar avatarId={avId} active={newCandAvatar === avId} />
                        </div>
                        <span className="text-[10px] text-slate-300 capitalize">{avId}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formError && <div className="text-rose-400 text-sm">{formError}</div>}

                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-slate-900 rounded-sm font-bold border border-yellow-400 transition-all text-center select-none"
                >
                  {isAdding ? 'Adding...' : 'Add Candidate ➔'}
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT SIDE: STATISTICS & STANDINGS */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Box 3: Live Standings */}
            <div className="border-2 border-slate-400 p-6 rounded-sm bg-emerald-950/40">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-yellow-300">📊 Live Standings</h2>
                <button
                  onClick={handleExportCSV}
                  disabled={candidates.length === 0}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 border border-slate-500 text-slate-100 rounded-sm text-sm font-bold transition-all"
                >
                  Export CSV 💾
                </button>
              </div>

              {candidates.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No candidates seeded yet. Please seed or add candidates to start.
                </div>
              ) : (
                <div className="space-y-6">
                  {candidates.map((cand, idx) => {
                    const votesReceived = cand.vote_count || 0;
                    const pct = totalVotes > 0 ? (votesReceived / totalVotes) * 100 : 0;
                    
                    return (
                      <div key={cand.id} className="space-y-2 border-b border-slate-700/50 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center text-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-yellow-500 font-bold text-xl">#{idx + 1}</span>
                            <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center p-0.5 border border-slate-600">
                              <DynamicAvatar avatarId={cand.avatar_id} />
                            </div>
                            <span className="font-bold text-slate-100">{cand.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-yellow-300">{votesReceived} votes</span>
                            <button
                              onClick={() => handleDeleteCandidate(cand.id)}
                              className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Standings bar */}
                        <div className="relative w-full h-5 bg-slate-800/60 rounded-sm border border-slate-600 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-yellow-400/80 border-r border-yellow-300 relative"
                            style={{
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)'
                            }}
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-yellow-100 drop-shadow">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Box 4: Audit and Security Logging */}
            <div className="border-2 border-slate-400 p-6 rounded-sm bg-emerald-950/40">
              <h2 className="text-2xl font-bold text-yellow-300 mb-4">🛡 Voting Security Integrity</h2>
              
              <div className="grid grid-cols-4 gap-2.5 text-center mb-6">
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-sm">
                  <span className="block text-2xl font-bold text-emerald-400">{auditSummary.success}</span>
                  <span className="text-[10px] text-slate-400">Valid Votes</span>
                </div>
                <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-sm">
                  <span className="block text-2xl font-bold text-rose-400">{auditSummary.duplicates}</span>
                  <span className="text-[10px] text-slate-400">Blocked Duplicates</span>
                </div>
                <div className="p-3 bg-amber-950/60 border border-amber-900 rounded-sm">
                  <span className="block text-2xl font-bold text-amber-400">{auditSummary.invalidRolls}</span>
                  <span className="text-[10px] text-slate-400">Blocked Non-Voters</span>
                </div>
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-sm">
                  <span className="block text-2xl font-bold text-slate-300">{auditSummary.totalAttempts}</span>
                  <span className="text-[10px] text-slate-400">Total Attempts</span>
                </div>
              </div>

              {/* DUPLICATE BROWSER/DEVICE DETECTOR SUMMARY */}
              <div className="border-t border-slate-700 pt-4 space-y-4">
                <h3 className="text-lg font-bold text-yellow-200">🔍 Flagged Multi-Voting Devices</h3>
                
                {flaggedDevices.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">
                    ✓ Zero duplicate device signatures logged. All votes submitted from unique browser profiles.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2">
                    {flaggedDevices.map((device, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 border-2 border-red-500/50 bg-red-950/30 rounded-sm text-sm flex flex-col gap-1.5"
                      >
                        <div className="flex justify-between items-center text-rose-300 font-bold">
                          <span>⚠️ Flagged Device #{idx + 1}</span>
                          <span>{device.vote_count} votes cast</span>
                        </div>
                        <div className="text-xs text-slate-300">
                          <span className="text-slate-400 block font-mono">Fingerprint: {device.device_id}</span>
                          <div className="text-yellow-200 mt-1 block font-hand">
                            Roll numbers voted on this device:
                            <div className="flex flex-wrap gap-1.5 mt-1 font-mono">
                              {device.roll_numbers.split(', ').map((roll) => (
                                <span 
                                  key={roll} 
                                  className="inline-flex items-center bg-slate-850/80 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-200 shadow-sm"
                                >
                                  {roll.toUpperCase()}
                                  <button
                                    onClick={() => handleResetVote(roll)}
                                    className="ml-2 text-red-400 hover:text-red-300 font-bold hover:underline select-none"
                                    title={`Reset vote for ${roll.toUpperCase()}`}
                                  >
                                    [Reset]
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Back Link */}
        <div className="mt-8 border-t border-dashed border-slate-500 pt-6 text-center">
          <Link
            href="/"
            className="inline-block py-2 px-6 border-2 border-yellow-300/50 text-yellow-300 hover:text-yellow-100 hover:border-yellow-200 rounded-sm font-sketch transition-all"
          >
            ← Back to Main Voting Portal
          </Link>
        </div>

      </div>
    </div>
  );
}
