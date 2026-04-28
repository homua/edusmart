
"use client";

import { Button } from "./ui/button";
import Logo from "./logo";

interface LandingPageProps {
  onNavigate: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/15 blur-2xl rounded-full scale-125"></div>
        <Logo className="w-24 h-24 md:w-28 md:h-28 relative z-10" />
      </div>
      
      <div className="space-y-2 mb-8">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">
          <span className="block text-foreground uppercase">HỆ THỐNG</span>
          <span className="block text-primary uppercase">GIAO BÀI TẬP THÔNG MINH</span>
          <span className="block text-sm md:text-base text-muted-foreground mt-2 font-bold uppercase tracking-wider">
            Trường PTDTBT THCS Ma Thì Hồ
          </span>
        </h2>
        <div className="h-1 w-20 bg-accent mx-auto rounded-full"></div>
      </div>

      <div className="bg-muted/10 p-3 rounded-2xl mb-8 max-w-xs mx-auto border border-border/30">
        <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-[0.2em] leading-relaxed">
          Học sinh: <span className="text-foreground/60">Điêu Nguyên Tân</span> <br/> 
          GV hướng dẫn: <span className="text-foreground/60">Hồ A Mua, Đàm Thị Ngọc</span>
        </p>
      </div>

      <Button 
        onClick={onNavigate} 
        size="lg"
        className="px-10 py-7 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95"
      >
        Đăng nhập ngay
      </Button>
    </div>
  );
};

export default LandingPage;
