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
      <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tight leading-tight max-w-2xl">
        Nền tảng Giáo dục <br/><span className="text-primary">Lưu trữ Đám mây</span>
      </h2>
      <p className="text-muted-foreground text-lg font-medium mb-12 max-w-lg leading-relaxed">
        Dữ liệu của bạn giờ đây được đồng bộ hóa tức thì. Không còn nỗi lo mất dữ liệu khi đổi trình duyệt hay thiết bị.
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
