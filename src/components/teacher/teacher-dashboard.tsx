
"use client";

import type { User, Class, Assignment, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Trash2, FileText, PieChart, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

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
}) => {
  const currentClass = classes.find(c => c.id === currentUser.classId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Bảng điều khiển Giáo viên</h1>
          <p className="text-muted-foreground">Lớp chủ nhiệm: <span className="font-bold text-primary">{currentClass?.name || 'Chưa có'}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onViewRoster} variant="outline"><Users className="mr-2" /> Quản lý lớp</Button>
          <Button onClick={onCreateNew}><Plus className="mr-2" /> Tạo bài tập mới</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length > 0 ? assignments.map(assignment => {
          const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
          
          // Calculate students in target classes assigned for this specific assignment
          const targetStudentsCount = students.filter(s => assignment.classIds.includes(s.classId || '')).length;
          
          const isCompleted = assignmentSubmissions.length >= targetStudentsCount && targetStudentsCount > 0;
          return (
            <Card key={assignment.id} className="rounded-3xl shadow-lg shadow-primary/5 flex flex-col">
              <CardHeader>
                <CardTitle className="leading-tight">{assignment.title}</CardTitle>
                <CardDescription>
                  <span className="font-semibold text-primary">{assignment.subject}</span>
                  <span className="mx-2 text-muted-foreground/50">|</span>
                  <span>Tạo ngày: {format(parseISO(assignment.createdAt), "d 'tháng' M, yyyy", { locale: vi })}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4"/>
                    <span>{assignment.questions.length} câu hỏi</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4"/>
                    <span>{assignmentSubmissions.length} / {targetStudentsCount} học sinh đã nộp</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-accent text-accent-foreground" : ""}>
                  {isCompleted ? 'Hoàn thành' : 'Đang giao'}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onEdit(assignment)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onViewReport(assignment)}><PieChart className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => onDelete(assignment.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardFooter>
            </Card>
          )
        }) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-muted/50 rounded-3xl">
            <h3 className="text-xl font-bold text-muted-foreground">Chưa có bài tập nào</h3>
            <p className="text-muted-foreground mb-4">Nhấn "Tạo bài tập mới" để bắt đầu.</p>
            <Button onClick={onCreateNew}><Plus className="mr-2"/>Tạo bài tập mới</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
