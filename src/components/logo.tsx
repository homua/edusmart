
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
        {/* Khối biểu tượng sách cách điệu hiện đại */}
        <path
          d="M20 35C20 32.2386 22.2386 30 25 30H50V75H25C22.2386 75 20 72.7614 20 70V35Z"
          className="fill-primary"
        />
        <path
          d="M80 35C80 32.2386 77.7614 30 75 30H50V75H75C77.7614 75 80 72.7614 80 70V35Z"
          className="fill-primary/80"
        />
        
        {/* Biểu tượng ánh sáng tri thức (Sparkle) rực rỡ ở trung tâm */}
        <circle cx="50" cy="52" r="15" className="fill-accent/20 animate-pulse" />
        <path
          d="M50 38L53 48L63 51L53 54L50 64L47 54L37 51L47 48L50 38Z"
          className="fill-accent"
        />
        
        {/* Các nút thắt kết nối đại diện cho công nghệ Cloud/Digital */}
        <circle cx="50" cy="20" r="4" className="fill-primary/40" />
        <path d="M50 24V30" className="stroke-primary/40" strokeWidth="2" strokeLinecap="round" />
        
        {/* Các đường kẻ đại diện cho trang sách tinh tế */}
        <path d="M30 42H42" className="stroke-white/30" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 52H42" className="stroke-white/30" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 62H42" className="stroke-white/30" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default Logo;
