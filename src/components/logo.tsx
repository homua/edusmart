
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
        className="w-full h-full drop-shadow-xl"
      >
        <rect x="5" y="5" width="90" height="90" rx="24" fill="url(#logo-gradient)" />
        
        <path
          d="M50 72V42M50 42C42 38 25 38 25 38V64C25 64 38 64 50 68M50 42C58 38 75 38 75 38V64C75 64 62 64 50 68"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        <path
          d="M50 15L53 22L60 25L53 28L50 35L47 28L40 25L47 22L50 15Z"
          fill="white"
        />

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
