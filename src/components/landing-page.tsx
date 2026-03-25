
"use client";

import { Button } from "./ui/button";
import Logo from "./logo";

interface LandingPageProps {
  onNavigate: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <Logo className="w-32 h-32 relative z-10" />
      </div>
      <h2 className="text-2xl md:text-4xl font-black mb-8 tracking-tighter leading-[1.1] max-w-4xl select-none">
        <span className="block text-foreground uppercase">
          Hệ thống Giáo dục
        </span>
        <span className="block text-primary uppercase">
          Thông minh
        </span>
      </h2>
      <p className="text-muted-foreground text-[10px] font-medium mb-10 max-w-lg leading-relaxed opacity-60 italic">
        Học sinh: Vàng Thị Lan Anh <br/> Giáo viên hướng dẫn: Hồ A Mua
      </p>
      <Button 
        onClick={onNavigate} 
        className="px-8 py-6 text-lg font-black rounded-full shadow-none hover:bg-primary/90 transition-all"
      >
        Đăng nhập ngay
      </Button>
    </div>
  );
};

export default LandingPage;
