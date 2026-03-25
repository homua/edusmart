
"use client"

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {}

const Logo = ({ className, ...props }: LogoProps) => {
  const logoData = PlaceHolderImages.find(img => img.id === 'school-logo');
  
  if (!logoData) return null;

  return (
    <div className={cn("relative flex items-center justify-center", className)} {...props}>
      <Image
        src={logoData.imageUrl}
        alt={logoData.description}
        width={400}
        height={400}
        className="w-full h-full object-contain"
        data-ai-hint={logoData.imageHint}
        priority
      />
    </div>
  );
};

export default Logo;
