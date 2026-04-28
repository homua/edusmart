
"use client";

import type { User } from '@/lib/types';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from './logo';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onLogoClick }) => {
  return (
    <header className="glass sticky top-0 z-[100] border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={onLogoClick}>
          <Logo className="w-10 h-10 text-primary" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">EduSmart</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">
                Hệ thống giao bài tập thông minh Trường PTDTBT THCS Ma Thì Hồ
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser && (
            <>
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-foreground">{currentUser.fullName}</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{currentUser.role}</span>
              </div>
              <Avatar>
                <AvatarFallback>
                  <UserIcon className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <Button onClick={onLogout} variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 hover:text-destructive" title="Đăng xuất">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
