"use client";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-foreground/80 animate-pulse uppercase tracking-widest text-xs">
          Kết nối Cloud EduSmart...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
