import React from 'react';

interface AvatarProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  active?: boolean;
}

// Zainab: Glasses, pencil, studious look
export function ZainabAvatar({ className = '', active = false, ...props }: AvatarProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`sketch-element w-full h-full fill-none stroke-current text-slate-800 ${className} ${active ? 'wiggle-active' : ''}`}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Head */}
      <path d="M 60 25 C 40 25, 35 45, 35 60 C 35 80, 48 90, 60 90 C 72 90, 85 80, 85 60 C 85 45, 80 25, 60 25 Z" />
      {/* Hair (Wobbly bangs and sides) */}
      <path d="M 33 55 C 31 35, 45 20, 60 20 C 75 20, 89 35, 87 55 M 36 40 C 45 28, 55 35, 60 38 C 65 35, 75 28, 84 40" />
      <path d="M 85 35 Q 92 37, 90 45" /> {/* Small wobbly clip */}
      {/* Glasses (Double circles) */}
      <circle cx="48" cy="55" r="11" />
      <circle cx="72" cy="55" r="11" />
      <path d="M 59 55 L 61 55" /> {/* Glasses bridge */}
      <path d="M 37 53 L 35 55 M 83 53 L 85 55" /> {/* Glasses sides */}
      {/* Eyes */}
      <circle cx="48" cy="55" r="2.5" className="fill-slate-800" />
      <circle cx="72" cy="55" r="2.5" className="fill-slate-800" />
      {/* Eyebrows */}
      <path d="M 40 40 Q 48 37, 53 43" />
      <path d="M 80 40 Q 72 37, 67 43" />
      {/* Nose */}
      <path d="M 60 55 Q 63 65, 59 68" />
      {/* Smile */}
      <path d="M 48 76 Q 60 83, 72 76" />
      <path d="M 46 75 C 47 77, 49 77, 49 75 M 74 75 C 73 77, 71 77, 71 75" /> {/* Smile dimples */}
      {/* Neck */}
      <path d="M 52 90 L 52 98 M 68 90 L 68 98" />
      {/* Collar/Shirt */}
      <path d="M 40 105 Q 60 95, 80 105 M 60 97 L 60 115" />
    </svg>
  );
}

// Hamza: Messy hair, cap/headset, chill look
export function HamzaAvatar({ className = '', active = false, ...props }: AvatarProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`sketch-element w-full h-full fill-none stroke-current text-slate-800 ${className} ${active ? 'wiggle-active' : ''}`}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Head */}
      <path d="M 60 30 C 42 30, 38 45, 38 62 C 38 78, 48 90, 60 90 C 72 90, 82 78, 82 62 C 82 45, 78 30, 60 30 Z" />
      {/* Messy spikes of hair */}
      <path d="M 38 45 C 32 30, 48 20, 52 28 C 55 15, 68 18, 66 28 C 72 15, 82 25, 80 35 C 85 45, 81 55, 81 55" />
      {/* Headband/Headset outline */}
      <path d="M 38 58 Q 30 58, 32 68 Q 38 68, 38 58" className="fill-slate-800/10" />
      <path d="M 82 58 Q 90 58, 88 68 Q 82 68, 82 58" className="fill-slate-800/10" />
      <path d="M 38 58 C 38 35, 82 35, 82 58" strokeWidth="4" />
      {/* Eyes (Chill/Half-closed) */}
      <path d="M 44 56 Q 50 51, 54 56 M 44 58 L 54 58" />
      <path d="M 66 56 Q 72 51, 76 56 M 66 58 L 76 58" />
      {/* Eyebrows (Relaxed flat) */}
      <path d="M 42 48 L 54 48" />
      <path d="M 66 48 L 78 48" />
      {/* Nose */}
      <path d="M 60 58 L 60 65 Q 60 68, 57 68" />
      {/* Big smirk */}
      <path d="M 50 75 Q 63 82, 70 73" />
      {/* Neck */}
      <path d="M 50 90 Q 60 98, 70 90" />
      {/* Hoodie Collar */}
      <path d="M 34 105 Q 60 115, 86 105 M 34 105 Q 60 93, 86 105 M 60 105 L 60 118" />
    </svg>
  );
}

// Ayesha: Ponytail, active, happy look
export function AyeshaAvatar({ className = '', active = false, ...props }: AvatarProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`sketch-element w-full h-full fill-none stroke-current text-slate-800 ${className} ${active ? 'wiggle-active' : ''}`}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Ponytail (Back) */}
      <path d="M 35 48 C 15 35, 10 70, 25 78 C 32 75, 36 68, 38 60" fill="none" strokeWidth="3" />
      <path d="M 32 50 C 28 50, 28 55, 32 56 Z" fill="currentColor" /> {/* Hair tie */}
      {/* Head */}
      <path d="M 60 25 C 42 25, 38 43, 38 60 C 38 78, 48 90, 60 90 C 72 90, 82 78, 82 60 C 82 43, 78 25, 60 25 Z" />
      {/* Hair front/sides */}
      <path d="M 38 48 C 42 20, 78 20, 82 48 M 38 52 C 40 45, 45 42, 45 55 M 82 52 C 80 45, 75 42, 75 55" />
      {/* Winking Eyes */}
      <path d="M 44 58 Q 50 63, 54 58" strokeWidth="3" /> {/* Left happy wink */}
      <path d="M 66 58 Q 71 52, 76 56" /> {/* Right open eye */}
      <circle cx="71" cy="58" r="2" className="fill-slate-800" />
      {/* Eyebrows */}
      <path d="M 42 47 Q 48 42, 53 47" />
      <path d="M 67 44 Q 72 41, 77 46" />
      {/* Nose */}
      <path d="M 59 60 Q 61 63, 63 60" />
      {/* Cute mouth open */}
      <path d="M 52 72 Q 60 83, 68 72 Z" className="fill-slate-800/10" />
      {/* Cheeks (Blush lines) */}
      <path d="M 40 68 L 44 64 M 43 70 L 47 66" strokeWidth="1.5" className="text-rose-400" />
      <path d="M 76 68 L 80 64 M 79 70 L 83 66" strokeWidth="1.5" className="text-rose-400" />
      {/* Neck */}
      <path d="M 52 90 L 52 96 M 68 90 L 68 96" />
      {/* Shirt */}
      <path d="M 38 108 C 48 98, 72 98, 82 108 M 60 97 L 60 115" />
    </svg>
  );
}

// Helper component that selects avatar based on ID
export function DynamicAvatar({ avatarId, className = '', active = false }: { avatarId: string; className?: string; active?: boolean }) {
  switch (avatarId) {
    case 'avatar1':
      return <ZainabAvatar className={className} active={active} />;
    case 'avatar2':
      return <HamzaAvatar className={className} active={active} />;
    case 'avatar3':
      return <AyeshaAvatar className={className} active={active} />;
    default:
      // Fallback wobbly default doodle
      return (
        <svg viewBox="0 0 120 120" className={`sketch-element stroke-current text-slate-800 fill-none ${className}`} strokeWidth="2.5">
          <circle cx="60" cy="60" r="35" />
          <circle cx="48" cy="52" r="3" className="fill-slate-800" />
          <circle cx="72" cy="52" r="3" className="fill-slate-800" />
          <path d="M 50 75 Q 60 85, 70 75" />
        </svg>
      );
  }
}
