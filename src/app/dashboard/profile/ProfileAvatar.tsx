"use client";

import { useState } from "react";

interface ProfileAvatarProps {
  avatarUrl: string;
  fullName: string;
  initials: string;
}

export default function ProfileAvatar({ avatarUrl, fullName, initials }: ProfileAvatarProps) {
  const [error, setError] = useState(false);

  return (
    <div className="shrink-0 relative">
      {!error && avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={fullName}
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-700"
          onError={() => setError(true)}
        />
      ) : (
        <div 
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center border-4 border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-700"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }}
        >
          <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter select-none">{initials}</span>
        </div>
      )}
    </div>
  );
}
