
"use client";

import { Button } from "./ui/button";
import Logo from "./logo";

interface LandingPageProps {
  onNavigate: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <Logo className="w-32 h-32 mb-12" />
      <h2 className="text-3xl md:text-5xl font-black mb-12 tracking-tighter leading-[0.9] max-w-4xl select-none">
        <span className="block text-foreground uppercase">
          Hệ thống Giáo dục
        </span>
        <span className="block text-primary uppercase">
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
