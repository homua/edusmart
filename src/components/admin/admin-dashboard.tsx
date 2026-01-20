"use client";

import React, { useState } from 'react';
import type { User, Class, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Upload, Download, UserPlus } from 'lucide-react';

interface AdminDashboardProps {
  users: User[];
  classes: Class[];
  onAddUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onAddClass: (cls: Class) => Promise<void>;
  onDeleteClass: (id: string) => Promise<void>;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  classes,
  onAddUser,
  onDeleteUser,
  onAddClass,
  onDeleteClass,
  onExport,
  onImport,
}) => {
  const { toast } = useToast();
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isClassModalOpen, setClassModalOpen] = useState(false);

  // User form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT' as UserRole);

  // Class form state
  const [className, setClassName] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !password || !role) {
      toast({ variant: 'destructive', description: 'Vui lòng điền đầy đủ thông tin.' });
      return;
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      fullName,
      username,
      password,
      role,
    };
    await onAddUser(newUser);
    toast({ description: 'Đã thêm người dùng mới.' });
    setFullName('');
    setUsername('');
    setPassword('');
    setUserModalOpen(false);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className) {
      toast({ variant: 'destructive', description: 'Vui lòng nhập tên lớp.' });
      return;
    }
    const newClass: Class = {
      id: `class_${Date.now()}`,
      name: className,
      teacherId: teacherId || undefined,
    };
    await onAddClass(newClass);
    toast({ description: 'Đã thêm lớp học mới.' });
    setClassName('');
    setTeacherId('');
    setClassModalOpen(false);
  };
  
  const teachers = users.filter(u => u.role === 'TEACHER');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black text-foreground">Bảng điều khiển Quản trị viên</h1>
          <p className="text-muted-foreground">Quản lý người dùng, lớp học và dữ liệu hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={onExport} variant="outline">
              <Download className="mr-2" />
              Xuất dữ liệu
           </Button>
           <Label htmlFor="import-file" className="cursor-pointer">
            <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                <Upload className="mr-2" />
                Nhập dữ liệu
            </div>
             <Input id="import-file" type="file" accept=".json" className="hidden" onChange={onImport} />
           </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <Card className="rounded-3xl shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quản lý Người dùng</CardTitle>
              <CardDescription>{users.length} người dùng trong hệ thống.</CardDescription>
            </div>
            <Dialog open={isUserModalOpen} onOpenChange={setUserModalOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-full"><UserPlus /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Thêm người dùng mới</DialogTitle></DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <Input placeholder="Họ và tên" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  <Input placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required />
                  <Input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
                  <Select onValueChange={(v) => setRole(v as UserRole)} defaultValue={role}>
                    <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                      <SelectItem value="TEACHER">Giáo viên</SelectItem>
                      <SelectItem value="STUDENT">Học sinh</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full">Thêm người dùng</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                    </TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onDeleteUser(user.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Class Management */}
        <Card className="rounded-3xl shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quản lý Lớp học</CardTitle>
              <CardDescription>{classes.length} lớp học trong hệ thống.</CardDescription>
            </div>
             <Dialog open={isClassModalOpen} onOpenChange={setClassModalOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-full"><Plus /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Thêm lớp học mới</DialogTitle></DialogHeader>
                <form onSubmit={handleAddClass} className="space-y-4">
                  <Input placeholder="Tên lớp học" value={className} onChange={e => setClassName(e.target.value)} required />
                  <Select onValueChange={setTeacherId} value={teacherId}>
                    <SelectTrigger><SelectValue placeholder="Chọn giáo viên (tùy chọn)" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full">Thêm lớp học</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên lớp</TableHead>
                  <TableHead>Giáo viên</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map(cls => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{users.find(u => u.id === cls.teacherId)?.fullName || 'Chưa gán'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onDeleteClass(cls.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
