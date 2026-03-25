
"use client"

import { cn } from '@/lib/utils';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {}

const Logo = ({ className, ...props }: LogoProps) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)} {...props}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        {/* Background rounded container with modern gradient */}
        <rect x="5" y="5" width="90" height="90" rx="28" fill="url(#logo-gradient)" />
        
        {/* Stylized Open Book pages */}
        <path
          d="M50 75V40M50 40C40 35 22 35 22 35V65C22 65 38 65 50 70M50 40C60 35 78 35 78 35V65C78 65 62 65 50 70"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Central Sparkle of intelligence/tech */}
        <path
          d="M50 12L53 20L61 23L53 26L50 34L47 26L39 23L47 20L50 12Z"
          fill="white"
        />
        
        {/* Decorative inner glow */}
        <circle cx="50" cy="50" r="40" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />

        <defs>
          <linearGradient id="logo-gradient" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(var(--primary))" />
            <stop offset="1" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default Logo;
