"use client";

import React, { useState } from 'react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface AuthFormProps {
  existingUsers: User[];
  onLogin: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ existingUsers, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleLoginAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    const user = existingUsers.find(u => u.username === username.trim());
    if (!user) {
      setError('Tên đăng nhập không tồn tại.');
      return;
    }

    // This is a placeholder for a real authentication system.
    // In a real app, passwords would be hashed and checked on the server.
    if (user.password !== password) {
      setError('Mật khẩu không chính xác.');
      return;
    }

    toast({ title: 'Đăng nhập thành công!', description: `Chào mừng trở lại, ${user.fullName}.` });
    onLogin(user);
  };

  return (
    <div className="flex justify-center items-center py-16 animate-in fade-in duration-500">
      <Card className="w-full max-w-md shadow-2xl shadow-primary/5 border-primary/10 rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black">Đăng nhập</CardTitle>
          <CardDescription>Truy cập vào hệ thống EduSmart</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLoginAttempt} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                placeholder="ví dụ: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="py-6 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="py-6 rounded-xl"
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full py-6 text-lg font-bold rounded-xl">
              <LogIn className="mr-2 h-5 w-5" />
              Đăng nhập
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
