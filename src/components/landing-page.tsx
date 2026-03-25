
"use client";

import { Button } from "./ui/button";
import Logo from "./logo";

interface LandingPageProps {
  onNavigate: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="w-20 h-20 mb-12 text-primary">
        <Logo />
      </div>
      <h2 className="text-6xl md:text-8xl font-black mb-12 tracking-tighter leading-[0.9] max-w-4xl select-none">
        <span className="block text-foreground uppercase">
          Nền tảng Giáo dục
        </span>
        <span className="block text-primary">
          Thông minh
        </span>
      </h2>
      <p className="text-muted-foreground text-[10px] font-medium mb-16 max-w-lg leading-relaxed opacity-60">
        Học sinh: Vàng Thị Lan Anh <br/> Giáo viên hướng dẫn: Hồ A Mua
      </p>
      <Button 
        onClick={onNavigate} 
        className="px-12 py-8 text-xl font-black rounded-full shadow-none hover:bg-primary/90 transition-all"
      >
        Đăng nhập ngay
      </Button>
    </div>
  );
};

export default LandingPage;
