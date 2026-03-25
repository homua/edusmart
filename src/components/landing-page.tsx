
"use client";

import { Button } from "./ui/button";
import Logo from "./logo";

interface LandingPageProps {
  onNavigate: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="w-24 h-24 mb-10 text-primary drop-shadow-[0_0_15px_rgba(79,70,229,0.3)]">
        <Logo />
      </div>
      <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-[1.1] max-w-4xl select-none">
        <span className="block text-transparent bg-clip-text bg-gradient-to-br from-slate-400 via-slate-100 to-slate-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] uppercase">
          Nền tảng Giáo dục
        </span>
        <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-300 to-accent drop-shadow-[0_15px_30px_rgba(79,70,229,0.4)] filter brightness-110 contrast-125">
          Thông minh
        </span>
      </h2>
      <p className="text-muted-foreground text-[10px] font-medium mb-12 max-w-lg leading-relaxed">
        Học sinh: Vàng Thị Lan Anh <br/> Giáo viên hướng dẫn: Hồ A Mua
      </p>
      <Button 
        onClick={onNavigate} 
        className="px-10 py-8 text-xl font-black rounded-full shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all bg-gradient-to-b from-primary to-indigo-800 border-t border-white/20"
      >
        Đăng nhập ngay
      </Button>
    </div>
  );
};

export default LandingPage;
