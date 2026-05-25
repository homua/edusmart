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
          <span className="block text-foreground uppercase">Ứng dụng</span>
          <span className="block text-primary uppercase">GIAO BÀI TẬP AI</span>
          <span className="block text-sm md:text-base text-muted-foreground mt-2 font-bold uppercase tracking-wider">
            Hệ thống giáo dục thông minh - giaobaitapai.cloud
          </span>
        </h2>
        <div className="h-1 w-20 bg-accent mx-auto rounded-full"></div>
      </div>

      <div className="bg-muted/10 p-4 rounded-2xl mb-8 max-w-sm mx-auto border border-border/30 backdrop-blur-sm">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] leading-relaxed">
          Đơn vị vận hành: <span className="text-foreground/80 font-black">Trường PTDTBT THCS Ma Thì Hồ</span> <br/>
          Phát triển bởi: <span className="text-foreground/80 font-black">Giàng Thị Long Nhi</span>
        </p>
      </div>

      <Button 
        onClick={onNavigate} 
        size="lg"
        className="px-10 py-7 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95"
      >
        Đăng nhập hệ thống
      </Button>

      <p className="mt-8 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.3em] opacity-40">
        &copy; 2024 giaobaitapai.cloud
      </p>
    </div>
  );
};

export default LandingPage;
