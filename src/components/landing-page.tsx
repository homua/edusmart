
"use client";

import { Button } from "./ui/button";
import Logo from "./logo";

interface LandingPageProps {
  onNavigate: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="w-24 h-24 mb-10 text-primary">
        <Logo />
      </div>
      <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-[1.1] max-w-3xl drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground to-foreground/20 select-none">
        Nền tảng Giáo dục <br/>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent drop-shadow-[0_10px_20px_rgba(79,70,229,0.3)]">Thông minh</span>
      </h2>
      <p className="text-muted-foreground text-[10px] font-medium mb-12 max-w-lg leading-relaxed">
        Học sinh: Vàng Thị Lan Anh <br/> Giáo viên hướng dẫn: Hồ A Mua
      </p>
      <Button 
        onClick={onNavigate} 
        className="px-10 py-8 text-xl font-black rounded-full shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
      >
        Đăng nhập ngay
      </Button>
    </div>
  );
};

export default LandingPage;
