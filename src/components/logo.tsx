
"use client"

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {}

const Logo = ({ className, ...props }: LogoProps) => {
  const schoolLogo = PlaceHolderImages.find(img => img.id === 'school-logo');

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-full", className)} {...props}>
      {schoolLogo && (
        <Image
          src={schoolLogo.imageUrl}
          alt={schoolLogo.description}
          width={400}
          height={400}
          className="object-contain w-full h-full"
          data-ai-hint={schoolLogo.imageHint}
        />
      )}
    </div>
  );
};

export default Logo;
