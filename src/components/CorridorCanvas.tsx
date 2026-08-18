'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { DynamicAvatar } from './DoodleAvatars';

interface Candidate {
  id: string;
  name: string;
  manifesto: string;
  avatar_id: string;
  vote_count?: number;
}

interface CorridorCanvasProps {
  candidates: Candidate[];
  focusIndex: number;
  onSelectCandidate: (candidate: Candidate) => void;
  isClosed?: boolean;
  totalVotes?: number;
}

// Helper to align candidates side-by-side
const getCandidateX = (index: number, total: number) => {
  if (total <= 1) return 0;
  const spacing = 2.4; // horizontal side-by-side gap
  const totalWidth = (total - 1) * spacing;
  return -totalWidth / 2 + index * spacing;
};

// Camera control rig for smooth horizontal panning transitions
function CameraRig({ focusIndex, candidatesCount }: { focusIndex: number; candidatesCount: number }) {
  const { camera } = useThree();
  const lerpTargetLookAt = useRef(new THREE.Vector3(0, 1, 0));

  useFrame(() => {
    let targetX = 0;
    let targetY = 1.4;
    let targetZ = 3.6;
    const targetLookAt = new THREE.Vector3(0, 0.95, 0);

    if (focusIndex === -1) {
      // Hallway entrance overview (shows all side-by-side)
      targetX = 0;
      targetY = 1.45;
      targetZ = 4.2;
      targetLookAt.set(0, 0.95, 0);
    } else {
      // Focus directly in front of the specific candidate (perfectly aligned, no rotation distortions)
      const xPos = getCandidateX(focusIndex, candidatesCount);
      targetX = xPos;
      targetY = 1.1;
      targetZ = 1.95; // centered zoom-in

      targetLookAt.set(xPos, 1.05, 0);
    }

    // Smoothly lerp camera position
    camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.08);

    // Smoothly lerp camera rotation target
    lerpTargetLookAt.current.lerp(targetLookAt, 0.08);
    camera.lookAt(lerpTargetLookAt.current);
  });

  return null;
}

// Hallway walls and ceiling doodle sketches
function HallwayStructure({ isClosed, winner }: { isClosed: boolean; winner: Candidate | null }) {
  return (
    <>
      {/* Hand-drawn style Grid floor */}
      <Grid
        position={[0, -0.5, 0]}
        args={[15, 30]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#e2e0d5"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#cbd5e1"
        fadeDistance={20}
        infiniteGrid
      />

      {/* Classroom chalkboard backplane moved right behind candidates (Z = -2.5) */}
      <mesh position={[0, 1.5, -2.5]}>
        <planeGeometry args={[14, 5]} />
        <meshBasicMaterial color="#1e293b" />
        <Html transform position={[0, 0, 0.01]} distanceFactor={6} pointerEvents="none">
          <div className="chalkboard w-[950px] h-[350px] border-8 border-amber-900 rounded-md p-6 flex flex-col items-center justify-center text-center">
            {isClosed ? (
              <div className="space-y-2">
                <h2 className="text-5xl font-sketch font-bold text-yellow-300 mb-2 animate-bounce">
                  🏆 FINAL RESULTS 🏆
                </h2>
                <p className="text-4xl text-slate-100 font-sketch mb-2">
                  Winner: {winner?.name || 'No votes cast'} {winner ? '👑' : ''}
                </p>
                <p className="text-2xl text-slate-300 font-hand max-w-2xl mx-auto">
                  Voting is officially CLOSED. Check the poster counts below for final standings.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-5xl font-sketch font-bold text-slate-100/90 mb-4 animate-pulse">
                  CR ELECTION 2026
                </h2>
                <p className="text-2xl text-slate-200/80 max-w-xl font-hand leading-relaxed">
                  Cast your vote wisely. Every single voice counts in representing our class interests.
                </p>
                <div className="mt-8 text-xl text-yellow-200 border-2 border-dashed border-yellow-200/50 px-4 py-1.5 rounded-sm">
                  ▲ Use controls below to select a candidate ▲
                </div>
              </>
            )}
          </div>
        </Html>
      </mesh>
    </>
  );
}

export default function CorridorCanvas({
  candidates,
  focusIndex,
  onSelectCandidate,
  isClosed = false,
  totalVotes = 0
}: CorridorCanvasProps) {
  // Determine election winner if closed
  const winner = isClosed && candidates.length > 0
    ? candidates.reduce((prev, current) => ((prev.vote_count || 0) > (current.vote_count || 0) ? prev : current), candidates[0])
    : null;

  return (
    <div className="w-full h-[480px] bg-[#fdfdfb] border-3 border-slate-800 rounded-sm relative sketch-element overflow-hidden shadow-inner">
      
      {/* Hand-drawn wobbly decorations overlay */}
      <div className="absolute top-4 left-4 z-10 font-sketch text-slate-600 bg-white/80 px-3 py-1.5 border-2 border-slate-700 rounded-sm shadow-sm rotate-[-2deg] pointer-events-none select-none">
        {isClosed ? '📊 Election Standings' : '🏫 Classroom Corridor 3D'}
      </div>

      <Canvas
        camera={{ position: [0, 1.5, 4.5], fov: 60 }}
        style={{ background: '#fbfaf6' }}
      >
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />

        <HallwayStructure isClosed={isClosed} winner={winner} />

        {/* Dynamic Candidate Billboard booths aligned side-by-side at Z = 0 */}
        {candidates.map((cand, index) => {
          const xPos = getCandidateX(index, candidates.length);
          const yPos = 0.5;
          const zPos = 0;

          // Calculate vote percentage for closed view
          const votes = cand.vote_count || 0;
          const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

          return (
            <group key={cand.id} position={[xPos, yPos, zPos]}>
              {/* Stand / Easel 3D Drawing */}
              <mesh position={[0, -0.4, 0]}>
                <boxGeometry args={[0.08, 1.2, 0.08]} />
                <meshBasicMaterial color="#475569" />
              </mesh>
              <mesh position={[0.2, -0.4, -0.2]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[0.06, 1.2, 0.06]} />
                <meshBasicMaterial color="#334155" />
              </mesh>
              <mesh position={[-0.2, -0.4, -0.2]} rotation={[0, 0, 0.2]}>
                <boxGeometry args={[0.06, 1.2, 0.06]} />
                <meshBasicMaterial color="#334155" />
              </mesh>

              {/* Poster Board Billboard facing straight (rotation = 0) */}
              <Html
                transform
                distanceFactor={2.4}
                rotation={[0, 0, 0]}
                pointerEvents="auto"
              >
                <div
                  onClick={() => onSelectCandidate(cand)}
                  className={`w-[260px] bg-white border-3 border-slate-800 p-4 shadow-[5px_5px_0px_0px_rgba(44,44,44,1)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 sketch-element text-center relative paper-texture group ${
                    focusIndex === index ? 'wiggle-active ring-2 ring-indigo-500 ring-offset-2' : ''
                  }`}
                >
                  {/* Floating winner crown */}
                  {isClosed && winner?.id === cand.id && (
                    <div className="absolute -top-14 left-[95px] text-5xl doodle-float select-none z-20 pointer-events-none">👑</div>
                  )}

                  {/* Tape decoration */}
                  <div className="absolute -top-3 left-[90px] w-20 h-6 bg-yellow-200/60 -rotate-2 border border-slate-400 border-dashed" />

                  {/* Doodle Avatar */}
                  <div className="w-24 h-24 mx-auto mb-2 border-2 border-slate-700 bg-white rounded-sm flex items-center justify-center p-1 relative shadow-sm group-hover:bg-slate-50">
                    <DynamicAvatar avatarId={cand.avatar_id} active={focusIndex === index} />
                  </div>

                  {/* Candidate Name */}
                  <h4 className="text-xl font-sketch font-bold text-slate-800 leading-tight">
                    {cand.name}
                  </h4>
                  
                  {!isClosed ? (
                    <>
                      <p className="text-sm text-slate-500 font-hand italic mt-1 max-w-[220px] truncate mx-auto">
                        {cand.manifesto || 'Click to read manifesto!'}
                      </p>
                      <div className="mt-4 py-1.5 bg-slate-800 group-hover:bg-slate-700 text-white font-sketch text-sm rounded-sm transition-all shadow-[2px_2px_0px_0px_rgba(100,116,139,1)]">
                        View Manifesto ✍
                      </div>
                    </>
                  ) : (
                    /* Closed election standings display */
                    <div className="mt-3 border-t-2 border-dashed border-slate-200 pt-3 text-left">
                      <div className="flex justify-between items-center font-sketch text-sm text-slate-800 font-bold">
                        <span>🗳️ {votes} votes</span>
                        <span className="text-indigo-600">{pct.toFixed(1)}%</span>
                      </div>
                      
                      {/* STANDINGS BAR WITH ANIMATION */}
                      <div className="w-full h-3 bg-slate-100 border-2 border-slate-800 rounded-sm mt-1.5 overflow-hidden relative">
                        <div 
                          className="h-full bg-yellow-400/90 border-r border-slate-800 transition-all duration-1000"
                          style={{ 
                            width: `${pct}%`,
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)' 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Html>
            </group>
          );
        })}

        <CameraRig focusIndex={focusIndex} candidatesCount={candidates.length} />
      </Canvas>

      {/* Guide lines helper in corner */}
      <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-hand pointer-events-none select-none">
        {isClosed ? 'Results tallies loaded.' : 'Click posters to view manifestos.'}
      </div>
    </div>
  );
}
