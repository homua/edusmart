
"use client";

import React, { useState } from 'react';
import type { User, Class, Assignment, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Trash2, FileText, Pencil, KeyRound, Clock, CheckCircle, Search } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

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
        password: newPassword,
        passwordUpdatedAt: new Date().toISOString()
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

  const getTimeStatus = (assignment: Assignment) => {
    const now = new Date();
    const start = assignment.startDate ? parseISO(assignment.startDate) : null;
    const end = assignment.endDate ? parseISO(assignment.endDate) : null;

    if (start && isBefore(now, start)) {
      return { status: 'NOT_STARTED', message: `Bắt đầu: ${format(start, "HH:mm, dd/MM", { locale: vi })}` };
    }
    if (end && isAfter(now, end)) {
      return { status: 'EXPIRED', message: `Hết hạn: ${format(end, "HH:mm, dd/MM", { locale: vi })}` };
    }
    return { status: 'ACTIVE', message: end ? `Hết hạn: ${format(end, "HH:mm, dd/MM", { locale: vi })}` : 'Không giới hạn thời gian' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Bảng điều khiển Giáo viên</h1>
          <p className="text-muted-foreground">Lớp chủ nhiệm: <span className="font-bold text-primary">{classNamesText || 'Chưa gán'}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border-2">
                <KeyRound className="mr-2 h-4 w-4" /> Đổi mật khẩu
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
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
                    className="rounded-xl h-12"
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
                    className="rounded-xl h-12"
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl py-6 font-bold shadow-lg shadow-primary/10" disabled={isUpdating}>
                  {isUpdating ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {managedClasses.length > 0 && (
            <Button onClick={onViewRoster} variant="outline" className="rounded-xl border-2">
              <Users className="mr-2 h-4 w-4" /> Quản lý lớp
            </Button>
          )}
          <Button onClick={onCreateNew} className="rounded-xl font-bold shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Tạo bài tập mới
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length > 0 ? assignments.map(assignment => {
          const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
          const targetStudentsCount = students.filter(s => assignment.classIds.includes(s.classId || '')).length;
          const isCompleted = assignmentSubmissions.length >= targetStudentsCount && targetStudentsCount > 0;
          const { status, message } = getTimeStatus(assignment);
          const completionRate = Math.round((assignmentSubmissions.length / (targetStudentsCount || 1)) * 100);

          return (
            <Card key={assignment.id} className="rounded-3xl shadow-lg shadow-primary/5 flex flex-col overflow-hidden border-primary/10 hover:border-primary/30 transition-all group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground uppercase tracking-widest font-black px-2 py-0.5">
                    {assignment.subject}
                  </Badge>
                  {isCompleted ? (
                    <Badge className="bg-accent/20 text-accent-foreground border-none text-[10px] uppercase font-black px-2 py-0.5">Hoàn thành</Badge>
                  ) : status === 'NOT_STARTED' ? (
                    <Badge variant="secondary" className="text-[10px] uppercase font-black px-2 py-0.5">Chưa đến giờ</Badge>
                  ) : status === 'EXPIRED' ? (
                    <Badge variant="destructive" className="text-[10px] uppercase font-black px-2 py-0.5">Đã kết thúc</Badge>
                  ) : (
                    <Badge className="bg-primary/20 text-primary-foreground border-none text-[10px] uppercase font-black px-2 py-0.5">Đang giao</Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                  {assignment.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase">
                    <FileText className="w-3.5 h-3.5 text-primary/70" /> {assignment.questions.length} câu
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase">
                    <Clock className="w-3.5 h-3.5 text-primary/70" /> {message}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                 <div className="p-5 rounded-2xl border-none transition-all bg-accent/10 text-accent-foreground">
                    <div className="flex items-center justify-between font-black text-xs mb-3 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 opacity-80" /> 
                        Tiến độ nộp bài
                      </div>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium">
                        <span className="text-2xl font-black">{assignmentSubmissions.length}</span>
                        <span className="mx-1 opacity-60">/</span>
                        <span className="text-lg opacity-80">{targetStudentsCount} HS</span>
                      </div>
                      <Progress value={completionRate} className="h-2.5 bg-background/50" />
                    </div>
                 </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-3 flex justify-center border-t border-border/50">
                <div className="flex items-center gap-2 w-full">
                  <Button 
                    variant="ghost" 
                    className="flex-1 rounded-xl h-10 font-black text-[11px] uppercase tracking-wider hover:bg-primary/10 hover:text-primary" 
                    onClick={() => onViewReport(assignment)}
                  >
                    <Search className="mr-2 w-4 h-4" /> Báo cáo
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary" 
                    onClick={() => onEdit(assignment)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-xl h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                    onClick={() => onDelete(assignment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )
        }) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-24 bg-muted/30 rounded-3xl border-2 border-dashed border-muted-foreground/20">
            <h3 className="text-xl font-bold text-muted-foreground">Chưa có bài tập nào</h3>
            <p className="text-muted-foreground mb-6">Hãy bắt đầu bằng cách tạo một bài tập mới cho học sinh.</p>
            <Button onClick={onCreateNew} className="rounded-2xl px-8 py-6 font-bold shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-5 w-5"/> Tạo ngay bài tập đầu tiên
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
