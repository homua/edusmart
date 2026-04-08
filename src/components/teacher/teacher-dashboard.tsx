
"use client";

import React, { useState } from 'react';
import type { User, Class, Assignment, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Trash2, FileText, PieChart, Pencil, KeyRound } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface TeacherDashboardProps {
  currentUser: User;
  classes: Class[];
  students: User[];
  assignments: Assignment[];
  submissions: Submission[];
  onCreateNew: () => void;
  onEdit: (assignment: Assignment) => void;
  onViewReport: (assignment: Assignment) => void;
  onDelete: (id: string) => Promise<void>;
  onViewRoster: () => void;
  onUpdateUser: (user: User) => Promise<void>;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  classes,
  students,
  assignments,
  submissions,
  onCreateNew,
  onEdit,
  onViewReport,
  onDelete,
  onViewRoster,
  onUpdateUser,
}) => {
  const { toast } = useToast();
  // Find managed classes where current user is one of the teachers
  const managedClasses = classes.filter(c => c.teacherIds?.includes(currentUser.id));
  const classNamesText = managedClasses.map(c => c.name).join(', ');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast({ variant: 'destructive', description: 'Vui lòng nhập mật khẩu mới.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', description: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setIsUpdating(true);
    try {
      const updatedUser: User = {
        ...currentUser,
        password: newPassword
      };
      await onUpdateUser(updatedUser);
      toast({ description: 'Đã đổi mật khẩu thành công.' });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể đổi mật khẩu.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Bảng điều khiển Giáo viên</h1>
          <p className="text-muted-foreground">Lớp chủ nhiệm: <span className="font-bold text-primary">{classNamesText || 'Chưa gán'}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <KeyRound className="mr-2 h-4 w-4" /> Đổi mật khẩu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Đổi mật khẩu cá nhân</DialogTitle>
                <DialogDescription>Nhập mật khẩu mới để bảo mật tài khoản của bạn.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Mật khẩu mới</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Nhập mật khẩu mới"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Nhập lại mật khẩu mới"
                    className="rounded-xl"
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl py-6" disabled={isUpdating}>
                  {isUpdating ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {managedClasses.length > 0 && (
            <Button onClick={onViewRoster} variant="outline" className="rounded-xl">
              <Users className="mr-2 h-4 w-4" /> Quản lý lớp
            </Button>
          )}
          <Button onClick={onCreateNew} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Tạo bài tập mới
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length > 0 ? assignments.map(assignment => {
          const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
          const targetStudentsCount = students.filter(s => assignment.classIds.includes(s.classId || '')).length;
          const isCompleted = assignmentSubmissions.length >= targetStudentsCount && targetStudentsCount > 0;
          
          return (
            <Card key={assignment.id} className="rounded-3xl shadow-lg shadow-primary/5 flex flex-col">
              <CardHeader>
                <CardTitle className="leading-tight">{assignment.title}</CardTitle>
                <CardDescription>
                  <span className="font-semibold text-primary">{assignment.subject}</span>
                  <span className="mx-2 text-muted-foreground/50">|</span>
                  <span>{format(parseISO(assignment.createdAt), "d 'tháng' M, yyyy", { locale: vi })}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4"/>
                    <span>{assignment.questions.length} câu hỏi</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4"/>
                    <span>{assignmentSubmissions.length} / {targetStudentsCount} đã nộp</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-accent text-accent-foreground" : ""}>
                  {isCompleted ? 'Hoàn thành' : 'Đang giao'}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onEdit(assignment)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onViewReport(assignment)}><PieChart className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-full" onClick={() => onDelete(assignment.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardFooter>
            </Card>
          )
        }) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-muted/50 rounded-3xl">
            <h3 className="text-xl font-bold text-muted-foreground">Chưa có bài tập nào</h3>
            <p className="text-muted-foreground mb-4">Nhấn "Tạo bài tập mới" để bắt đầu.</p>
            <Button onClick={onCreateNew} className="rounded-xl"><Plus className="mr-2 h-4 w-4"/>Tạo bài tập mới</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
