
"use client";

import React, { useState } from 'react';
import type { User, Class, Assignment, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Trash2, FileText, PieChart, Pencil, KeyRound, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
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

  const getTimeStatus = (assignment: Assignment) => {
    const now = new Date();
    const start = assignment.startDate ? parseISO(assignment.startDate) : null;
    const end = assignment.endDate ? parseISO(assignment.endDate) : null;

    if (start && isBefore(now, start)) {
      return { status: 'NOT_STARTED', message: `Bắt đầu: ${format(start, "HH:mm, dd/MM", { locale: vi })}` };
    }
    if (end && isAfter(now, end)) {
      return { status: 'EXPIRED', message: `Đã hết hạn: ${format(end, "HH:mm, dd/MM", { locale: vi })}` };
    }
    return { status: 'ACTIVE', message: end ? `Hết hạn: ${format(end, "HH:mm, dd/MM", { locale: vi })}` : 'Không giới hạn thời gian' };
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
          const { status, message } = getTimeStatus(assignment);

          return (
            <Card key={assignment.id} className="rounded-3xl shadow-lg shadow-primary/5 flex flex-col overflow-hidden border-primary/10 hover:border-primary/30 transition-all group">
              <CardHeader>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-tighter font-black">
                    {assignment.subject}
                  </Badge>
                  {isCompleted ? (
                    <Badge className="bg-accent text-accent-foreground text-[10px] uppercase font-black">Hoàn thành</Badge>
                  ) : status === 'NOT_STARTED' ? (
                    <Badge variant="secondary" className="text-[10px] uppercase font-black">Chưa đến giờ</Badge>
                  ) : status === 'EXPIRED' ? (
                    <Badge variant="destructive" className="text-[10px] uppercase font-black">Đã kết thúc</Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px] uppercase font-black">Đang diễn ra</Badge>
                  )}
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{assignment.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 font-medium">
                    <FileText className="w-3.5 h-3.5 text-primary" /> {assignment.questions.length} câu
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-primary" /> {message}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className={`p-4 rounded-2xl border transition-all ${isCompleted ? 'bg-accent/10 border-accent/20 text-accent-foreground' : 'bg-muted/40 border-border/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                        {isCompleted ? "Tất cả đã nộp" : "Tiến độ nộp bài"}
                      </div>
                      <span className="text-lg font-black">{assignmentSubmissions.length} / {targetStudentsCount}</span>
                    </div>
                    {targetStudentsCount > 0 && (
                      <div className="w-full bg-muted-foreground/10 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all ${isCompleted ? 'bg-accent' : 'bg-primary'}`} 
                          style={{ width: `${(assignmentSubmissions.length / targetStudentsCount) * 100}%` }}
                        />
                      </div>
                    )}
                 </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => onEdit(assignment)} title="Chỉnh sửa">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => onViewReport(assignment)} title="Báo cáo chi tiết">
                    <PieChart className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => onDelete(assignment.id)} title="Xóa bài tập">
                  <Trash2 className="w-4 h-4" />
                </Button>
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
