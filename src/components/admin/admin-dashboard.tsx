
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, type User, type Class, type Assignment, type Submission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Upload, Download, UserPlus, Pencil, FileDown, ChevronDown, BarChart3, Users, BookOpen, CheckCircle2, Calendar, LayoutGrid, Search, Copy, KeyRound, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as XLSX from 'xlsx';
import { subDays, isAfter, parseISO, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AdminDashboardProps {
  users: User[];
  classes: Class[];
  assignments: Assignment[];
  submissions: Submission[];
  onAddUser: (user: User) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (user: User) => Promise<void>;
  onDeleteUsers: (ids: string[]) => Promise<void>;
  onAddClass: (cls: Class) => Promise<void>;
  onUpdateClass: (cls: Class) => Promise<void>;
  onDeleteClasses: (ids: string[]) => Promise<void>;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  classes,
  assignments,
  submissions,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onDeleteUsers,
  onAddClass,
  onUpdateClass,
  onDeleteClasses,
  onExport,
  onImport,
}) => {
  const { toast } = useToast();
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
  const [isClassModalOpen, setClassModalOpen] = useState(false);
  const [isClassEditModalOpen, setClassEditModalOpen] = useState(false);

  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.STUDENT);

  const [className, setClassName] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);

  const [classToEdit, setClassToEdit] = useState<Class | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editTeacherIds, setEditTeacherIds] = useState<string[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

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
      passwordUpdatedAt: new Date().toISOString()
    };
    await onAddUser(newUser);
    toast({ description: 'Đã thêm người dùng mới.' });
    setFullName('');
    setUsername('');
    setPassword('');
    setUserModalOpen(false);
  };

  const handleOpenEditUserModal = (user: User) => {
    setUserToEdit(user);
    setEditFullName(user.fullName);
    setEditUsername(user.username);
    setEditPassword(user.password || '');
    setEditRole(user.role);
    setEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit || !editFullName || !editUsername) {
      toast({ variant: 'destructive', description: 'Vui lòng điền đầy đủ thông tin.' });
      return;
    }

    const isPasswordChanged = editPassword !== userToEdit.password;

    const updatedUser: User = {
      ...userToEdit,
      fullName: editFullName,
      username: editUsername,
      password: editPassword,
      role: editRole,
      passwordUpdatedAt: isPasswordChanged ? new Date().toISOString() : userToEdit.passwordUpdatedAt
    };
    await onUpdateUser(updatedUser);
    toast({ description: isPasswordChanged ? 'Đã cập nhật thông tin và mật khẩu mới.' : 'Đã cập nhật thông tin người dùng.' });
    setEditUserModalOpen(false);
    setUserToEdit(null);
  };

  const handleCopyCredentials = (user: User) => {
    const text = `Họ tên: ${user.fullName}\nTài khoản: ${user.username}\nMật khẩu: ${user.password}`;
    navigator.clipboard.writeText(text);
    toast({ description: `Đã sao chép tài khoản của ${user.fullName}` });
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
      teacherIds: teacherIds,
    };
    
    await onAddClass(newClass);
    toast({ description: 'Đã thêm lớp học mới.' });
    setClassName('');
    setTeacherIds([]);
    setClassModalOpen(false);
  };
  
  const handleOpenEditClassModal = (cls: Class) => {
    setClassToEdit(cls);
    setEditClassName(cls.name);
    setEditTeacherIds(cls.teacherIds || []);
    setClassEditModalOpen(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classToEdit || !editClassName.trim()) {
      toast({ variant: 'destructive', description: 'Tên lớp không được để trống.' });
      return;
    }
    const updatedClass: Class = {
      ...classToEdit,
      name: editClassName.trim(),
      teacherIds: editTeacherIds,
    };
    await onUpdateClass(updatedClass);
    toast({ description: 'Đã cập nhật lớp học.' });
    setClassEditModalOpen(false);
    setClassToEdit(null);
  };

  const allTeachers = useMemo(() => {
    return users.filter(u => u.role === UserRole.TEACHER).sort((a, b) => {
      const nameA = a.fullName.trim().split(' ').pop() || '';
      const nameB = b.fullName.trim().split(' ').pop() || '';
      return nameA.localeCompare(nameB, 'vi');
    });
  }, [users]);

  const getTeachersText = (ids: string[]) => {
    if (!ids || ids.length === 0) return "Chưa gán";
    return ids
      .map(id => users.find(u => u.id === id)?.fullName || 'Không xác định')
      .sort((a, b) => {
          const nameA = a.trim().split(' ').pop() || '';
          const nameB = b.trim().split(' ').pop() || '';
          return nameA.localeCompare(nameB, 'vi');
      })
      .join(', ');
  };

  const handleToggleTeacherSelection = (teacherId: string) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };
  
  const handleBulkDeleteTeachers = async () => {
    await onDeleteUsers(selectedTeachers);
    setSelectedTeachers([]);
  };

  const handleToggleClassSelection = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };
  
  const handleBulkDeleteClasses = async () => {
    await onDeleteClasses(selectedClasses);
    setSelectedClasses([]);
  };

  const handleToggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
        prev.includes(studentId)
            ? prev.filter(id => id !== studentId)
            : [...prev, studentId]
    );
  };

  const handleBulkDeleteStudents = async () => {
      await onDeleteUsers(selectedStudents);
      setSelectedStudents([]);
  };

  const handleExportTeachersExcel = () => {
    const teachersToExport = allTeachers.map(t => ({
      'Họ và tên': t.fullName,
      'Tên đăng nhập': t.username,
      'Mật khẩu': t.password,
      'Cập nhật mật khẩu cuối': t.passwordUpdatedAt ? format(parseISO(t.passwordUpdatedAt), "HH:mm, dd/MM/yyyy", { locale: vi }) : 'Chưa có',
      'Vai trò': 'Giáo viên'
    }));
    const ws = XLSX.utils.json_to_sheet(teachersToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sach Giao vien");
    XLSX.writeFile(wb, `Danh_sach_Giao_vien_${new Date().getTime()}.xlsx`);
    toast({ title: "Thành công", description: "Đã xuất danh sách giáo viên." });
  };

  const admins = users.filter(u => u.role === UserRole.ADMIN);
  const studentsByClass = useMemo(() => {
    return classes.reduce((acc, cls) => {
      acc[cls.id] = users.filter(s => s.role === UserRole.STUDENT && s.classId === cls.id).sort((a, b) => {
        const nameA = a.fullName.trim().split(' ').pop() || '';
        const nameB = b.fullName.trim().split(' ').pop() || '';
        return nameA.localeCompare(nameB, 'vi');
      });
      return acc;
    }, {} as Record<string, User[]>);
  }, [classes, users]);

  const unassignedStudents = useMemo(() => {
    return users.filter(s => s.role === UserRole.STUDENT && (!s.classId || !classes.some(c => c.id === s.classId))).sort((a, b) => {
      const nameA = a.fullName.trim().split(' ').pop() || '';
      const nameB = b.fullName.trim().split(' ').pop() || '';
      return nameA.localeCompare(nameB, 'vi');
    });
  }, [users, classes]);

  useEffect(() => {
    if (!classes.some(c => c.id === selectedClassId) && selectedClassId !== 'unassigned') {
      if (classes.length > 0) setSelectedClassId(classes[0].id);
      else setSelectedClassId('unassigned');
    }
  }, [classes, selectedClassId]);

  const currentStudentList = selectedClassId ? (selectedClassId === 'unassigned' ? unassignedStudents : studentsByClass[selectedClassId] || []) : [];

  const statsData = useMemo(() => {
    const now = new Date();
    const cutoffDate = timeRange === 'month' ? subDays(now, 30) : timeRange === 'week' ? subDays(now, 7) : null;

    const filteredAssignments = cutoffDate 
      ? assignments.filter(a => isAfter(parseISO(a.createdAt), cutoffDate))
      : assignments;

    const filteredSubmissions = cutoffDate
      ? submissions.filter(s => isAfter(parseISO(s.submittedAt), cutoffDate))
      : submissions;

    const teacherStats = allTeachers.map(teacher => {
      const count = filteredAssignments.filter(a => a.teacherId === teacher.id).length;
      return { name: teacher.fullName, count };
    }).sort((a, b) => b.count - a.count);

    const classStats = classes.map(cls => {
      const classAssignments = filteredAssignments.filter(a => a.classIds.includes(cls.id));
      const classStudents = studentsByClass[cls.id] || [];
      
      let totalSubmissionsNeeded = classAssignments.length * classStudents.length;
      let actualSubmissions = 0;

      classAssignments.forEach(a => {
          const assignmentSubmissions = filteredSubmissions.filter(s => 
              s.assignmentId === a.id && classStudents.some(cs => cs.id === s.studentId)
          );
          actualSubmissions += assignmentSubmissions.length;
      });

      const completionRate = totalSubmissionsNeeded > 0 
          ? Math.round((actualSubmissions / totalSubmissionsNeeded) * 100) 
          : 0;

      return {
          id: cls.id,
          name: cls.name,
          studentCount: classStudents.length,
          assignmentCount: classAssignments.length,
          completionRate
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    return { teacherStats, classStats };
  }, [assignments, submissions, users, classes, timeRange, allTeachers, studentsByClass]);

  const { teacherStats, classStats } = statsData;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black text-foreground">Bảng điều khiển Quản trị viên</h1>
          <p className="text-muted-foreground">Quản lý người dùng, lớp học và giám sát tài khoản hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={onExport} variant="outline" title="Xuất toàn bộ dữ liệu ra file Excel (.xlsx)" className="rounded-xl border-2">
              <Download className="mr-2 h-4 w-4" />
              Xuất dữ liệu
           </Button>
           <Label htmlFor="import-file" className="cursor-pointer">
            <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                <Upload className="mr-2 h-4 w-4" />
                Nhập dữ liệu
            </div>
             <Input id="import-file" type="file" accept=".xlsx, .xls" className="hidden" onChange={onImport} />
           </Label>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-2xl h-auto">
          <TabsTrigger value="users" className="py-3 text-base font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Quản lý Người dùng</TabsTrigger>
          <TabsTrigger value="classes" className="py-3 text-base font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Quản lý Lớp học</TabsTrigger>
          <TabsTrigger value="stats" className="py-3 text-base font-bold uppercase tracking-tight rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Thống kê & Báo cáo</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="rounded-3xl shadow-lg shadow-primary/5 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Người dùng & Tài khoản</CardTitle>
                <CardDescription>Quản trị viên có thể xem mật khẩu và cấp lại tài khoản khi người dùng quên.</CardDescription>
              </div>
              <Dialog open={isUserModalOpen} onOpenChange={setUserModalOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" className="rounded-full h-12 w-12 shadow-lg shadow-primary/20"><UserPlus /></Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader><DialogTitle>Thêm người dùng mới</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Họ và tên</Label>
                        <Input placeholder="Họ và tên" value={fullName} onChange={e => setFullName(e.target.value)} required className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label>Tên đăng nhập</Label>
                        <Input placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label>Mật khẩu mặc định</Label>
                        <Input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label>Vai trò</Label>
                        <Select onValueChange={(v) => setRole(v as UserRole)} defaultValue={role}>
                            <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value={UserRole.ADMIN}>Quản trị viên</SelectItem>
                                <SelectItem value={UserRole.TEACHER}>Giáo viên</SelectItem>
                                <SelectItem value={UserRole.STUDENT}>Học sinh</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold mt-2">Thêm người dùng</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-2xl">
                  <TabsTrigger value="students" className="rounded-xl font-bold">Học sinh</TabsTrigger>
                  <TabsTrigger value="teachers" className="rounded-xl font-bold">Giáo viên</TabsTrigger>
                  <TabsTrigger value="admins" className="rounded-xl font-bold">Quản trị viên</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="mt-6 space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Lọc theo lớp</Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-full h-14 rounded-2xl border-2 border-primary/10 focus:border-primary transition-all px-6 text-lg font-bold bg-background">
                            <div className="flex justify-between items-center w-full pr-4">
                                <SelectValue placeholder="Chọn một lớp..." />
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black px-2 py-0.5 rounded-full ml-4">
                                    {selectedClassId === 'unassigned' ? unassignedStudents.length : (studentsByClass[selectedClassId]?.length || 0)} HS
                                </Badge>
                            </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-primary/10 shadow-xl">
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id} className="rounded-xl py-3 focus:bg-primary/5">
                                <div className="flex items-center justify-between w-full min-w-[200px]">
                                    <span className="font-bold">{cls.name}</span>
                                    <span className="text-xs text-muted-foreground ml-4">({studentsByClass[cls.id]?.length || 0} học sinh)</span>
                                </div>
                                </SelectItem>
                            ))}
                            {(unassignedStudents.length > 0 || classes.length === 0) && (
                                <SelectItem value="unassigned" className="rounded-xl py-3 focus:bg-primary/5">
                                <div className="flex items-center justify-between w-full min-w-[200px]">
                                    <span className="font-bold">Chưa phân lớp</span>
                                    <span className="text-xs text-muted-foreground ml-4">({unassignedStudents.length} học sinh)</span>
                                </div>
                                </SelectItem>
                            )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 h-14 bg-muted/30 px-4 rounded-2xl border border-border/50">
                        <Checkbox 
                            id="select-all-students"
                            checked={selectedStudents.length > 0 && currentStudentList.length > 0 && selectedStudents.length === currentStudentList.length} 
                            onCheckedChange={(checked) => setSelectedStudents(checked ? currentStudentList.map((s) => s.id) : [])}
                        />
                        <Label htmlFor="select-all-students" className="text-xs font-bold cursor-pointer whitespace-nowrap">Chọn tất cả</Label>
                    </div>
                    {selectedStudents.length > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="h-14 rounded-2xl px-6 font-bold">
                              <Trash2 className="mr-2 h-5 w-5" />
                              Xóa ({selectedStudents.length})
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa học sinh</AlertDialogTitle>
                              <AlertDialogDescription>Bạn chắc chắn muốn xóa {selectedStudents.length} học sinh đã chọn? Thao tác này không thể hoàn tác.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={handleBulkDeleteStudents} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Xóa vĩnh viễn</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                  </div>
                  
                  <ScrollArea className="h-[500px] w-full rounded-2xl border border-border/50 bg-muted/10 p-4">
                    <div className="grid grid-cols-1 gap-4">
                      {currentStudentList.map(user => (
                        <div key={user.id} className={`group relative p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center gap-4 ${selectedStudents.includes(user.id) ? 'bg-primary/5 border-primary shadow-md' : 'bg-card border-transparent hover:border-primary/20 hover:shadow-sm'}`}>
                          <div className="absolute top-4 right-4 md:static md:order-last z-10">
                            <Checkbox 
                                checked={selectedStudents.includes(user.id)} 
                                onCheckedChange={() => handleToggleStudentSelection(user.id)} 
                            />
                          </div>
                          
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary flex-shrink-0">
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-foreground truncate leading-tight text-lg">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground/70 truncate">@{user.username}</p>
                                {user.passwordUpdatedAt && (
                                  <p className="text-[10px] text-muted-foreground/60 flex items-center mt-1">
                                    <Clock className="w-2.5 h-2.5 mr-1" />
                                    MK cập nhật: {format(parseISO(user.passwordUpdatedAt), "HH:mm, dd/MM", { locale: vi })}
                                  </p>
                                )}
                            </div>
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 flex justify-between">
                              <span>Thông tin đăng nhập</span>
                              <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleCopyCredentials(user)} title="Sao chép tài khoản">
                                <Copy className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-xl text-xs flex justify-between items-center gap-4 border border-border/30">
                                <span className="font-mono text-foreground/80 truncate">TK: {user.username}</span>
                                <span className="font-black text-primary flex-shrink-0">MK: {user.password}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-border/50">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenEditUserModal(user)} 
                                className="flex-1 md:flex-none h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:text-primary"
                                title="Chỉnh sửa hoặc Cấp lại mật khẩu"
                            >
                                <KeyRound className="mr-1 h-3 w-3" /> Cấp lại
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onDeleteUser(user)} 
                                className="flex-1 md:flex-none h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-tighter text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="mr-1 h-3 w-3" /> Xóa
                            </Button>
                          </div>
                        </div>
                      ))}
                      {currentStudentList.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <LayoutGrid className="h-12 w-12 opacity-10 mb-4" />
                            <p className="italic font-medium">Không có học sinh nào trong mục này.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="teachers" className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <Button variant="outline" size="sm" onClick={handleExportTeachersExcel} className="rounded-xl h-10 px-4 font-bold border-2">
                      <FileDown className="mr-2 h-4 w-4" /> Xuất danh sách GV
                    </Button>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 h-10 bg-muted/30 px-4 rounded-xl border border-border/50">
                          <Checkbox 
                              id="select-all-teachers"
                              checked={selectedTeachers.length > 0 && allTeachers.length > 0 && selectedTeachers.length === allTeachers.length} 
                              onCheckedChange={(checked) => setSelectedTeachers(checked ? allTeachers.map((t) => t.id) : [])}
                          />
                          <Label htmlFor="select-all-teachers" className="text-xs font-bold cursor-pointer whitespace-nowrap">Chọn tất cả</Label>
                      </div>
                      {selectedTeachers.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleBulkDeleteTeachers} className="rounded-xl h-10 px-4 font-bold">
                          <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedTeachers.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="h-[500px] w-full rounded-2xl border border-border/50 bg-muted/10 p-4">
                    <div className="grid grid-cols-1 gap-4">
                      {allTeachers.map(user => (
                        <div key={user.id} className={`group relative p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center gap-4 ${selectedTeachers.includes(user.id) ? 'bg-primary/5 border-primary shadow-md' : 'bg-card border-transparent hover:border-primary/20 hover:shadow-sm'}`}>
                          <div className="absolute top-4 right-4 md:static md:order-last z-10">
                            <Checkbox 
                                checked={selectedTeachers.includes(user.id)} 
                                onCheckedChange={() => handleToggleTeacherSelection(user.id)} 
                            />
                          </div>
                          
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary flex-shrink-0">
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-foreground truncate leading-tight text-lg">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground/70 truncate">@{user.username}</p>
                                {user.passwordUpdatedAt && (
                                  <p className="text-[10px] text-muted-foreground/60 flex items-center mt-1">
                                    <Clock className="w-2.5 h-2.5 mr-1" />
                                    MK cập nhật: {format(parseISO(user.passwordUpdatedAt), "HH:mm, dd/MM/yyyy", { locale: vi })}
                                  </p>
                                )}
                            </div>
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 flex justify-between">
                              <span>Thông tin đăng nhập</span>
                              <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleCopyCredentials(user)} title="Sao chép tài khoản">
                                <Copy className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-xl text-xs flex justify-between items-center gap-4 border border-border/30">
                                <span className="font-mono text-foreground/80 truncate">TK: {user.username}</span>
                                <span className="font-black text-primary flex-shrink-0">MK: {user.password}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-border/50">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenEditUserModal(user)} 
                                className="flex-1 md:flex-none h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:text-primary"
                                title="Cấp lại mật khẩu cho giáo viên"
                            >
                                <KeyRound className="mr-1 h-3 w-3" /> Cấp lại
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onDeleteUser(user)} 
                                className="flex-1 md:flex-none h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-tighter text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="mr-1 h-3 w-3" /> Xóa
                            </Button>
                          </div>
                        </div>
                      ))}
                      {allTeachers.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <LayoutGrid className="h-12 w-12 opacity-10 mb-4" />
                            <p className="italic font-medium">Không có giáo viên nào trong mục này.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="admins" className="mt-6">
                  <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Tên quản trị viên</TableHead>
                                <TableHead className="px-6 py-4 text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {admins.map(user => (
                            <TableRow key={user.id} className="hover:bg-primary/5 transition-colors">
                            <TableCell className="px-6 py-4">
                                <div className="font-bold text-lg">{user.fullName}</div>
                                <div className="text-xs text-muted-foreground mt-1">@{user.username}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditUserModal(user)} className="rounded-full hover:bg-primary/10 hover:text-primary"><Pencil className="h-4 w-4" /></Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
           <Card className="rounded-3xl shadow-lg shadow-primary/5 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Danh sách Lớp học</CardTitle>
                <CardDescription>{classes.length} lớp học đang được quản lý.</CardDescription>
              </div>
               <Dialog open={isClassModalOpen} onOpenChange={setClassModalOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" className="rounded-full h-12 w-12 shadow-lg shadow-primary/20"><Plus /></Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader><DialogTitle>Thêm lớp học mới</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddClass} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Tên lớp học</Label>
                        <Input placeholder="Ví dụ: 8A1, 9A2..." value={className} onChange={e => setClassName(e.target.value)} required className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Giáo viên quản lý</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full h-12 justify-between rounded-xl">
                            <span className="truncate">{teacherIds.length > 0 ? getTeachersText(teacherIds) : "Chọn giáo viên..."}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto rounded-xl">
                          {allTeachers.map(t => (
                            <DropdownMenuCheckboxItem key={t.id} checked={teacherIds.includes(t.id)} onCheckedChange={checked => setTeacherIds(prev => checked ? [...prev, t.id] : prev.filter(id => id !== t.id))} onSelect={e => e.preventDefault()}>
                              {t.fullName}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold mt-2 shadow-lg shadow-primary/10">Tạo lớp học mới</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
               <div className="mb-4 flex items-center gap-2 h-14 bg-muted/30 px-4 rounded-2xl border border-border/50">
                    <Checkbox 
                        id="select-all-classes"
                        checked={selectedClasses.length > 0 && classes.length > 0 && selectedClasses.length === classes.length} 
                        onCheckedChange={(checked) => setSelectedClasses(checked ? classes.map((c) => c.id) : [])}
                    />
                    <Label htmlFor="select-all-classes" className="text-xs font-bold cursor-pointer whitespace-nowrap">Chọn tất cả</Label>
                    
                    {selectedClasses.length > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="ml-auto rounded-xl h-10 px-4 font-bold">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa ({selectedClasses.length})
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa lớp học</AlertDialogTitle>
                              <AlertDialogDescription>Bạn chắc chắn muốn xóa {selectedClasses.length} lớp học đã chọn? Các học sinh thuộc lớp này sẽ trở về trạng thái "Chưa phân lớp".</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={handleBulkDeleteClasses} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Xóa vĩnh viễn</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                </div>

                <ScrollArea className="h-[500px] w-full rounded-2xl border border-border/50 bg-muted/10 p-4">
                    <div className="grid grid-cols-1 gap-4">
                      {classes.map(cls => (
                        <div key={cls.id} className={`group relative p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center gap-4 ${selectedClasses.includes(cls.id) ? 'bg-primary/5 border-primary shadow-md' : 'bg-card border-transparent hover:border-primary/20 hover:shadow-sm'}`}>
                          <div className="absolute top-4 right-4 md:static md:order-last z-10">
                            <Checkbox 
                                checked={selectedClasses.includes(cls.id)} 
                                onCheckedChange={() => handleToggleClassSelection(cls.id)} 
                            />
                          </div>
                          
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl flex-shrink-0">
                                {cls.name.substring(0, 2)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-foreground truncate leading-tight text-2xl text-primary">{cls.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">Sĩ số: {studentsByClass[cls.id]?.length || 0} học sinh</p>
                            </div>
                          </div>

                          <div className="space-y-1 flex-[2]">
                            <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Giáo viên quản lý</div>
                            <div className="bg-muted/50 p-2 rounded-xl text-sm font-medium text-foreground/80">
                                {getTeachersText(cls.teacherIds || [])}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-border/50">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenEditClassModal(cls)} 
                                className="flex-1 md:flex-none h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:text-primary"
                            >
                                <Pencil className="mr-1 h-3 w-3" /> Sửa
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onDeleteClasses([cls.id])} 
                                className="flex-1 md:flex-none h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-tighter text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="mr-1 h-3 w-3" /> Xóa
                            </Button>
                          </div>
                        </div>
                      ))}
                      {classes.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <LayoutGrid className="h-12 w-12 opacity-10 mb-4" />
                            <p className="italic font-medium">Chưa có lớp học nào được tạo.</p>
                        </div>
                      )}
                    </div>
                </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-card p-6 rounded-3xl border border-primary/10 shadow-lg shadow-primary/5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-black text-lg">Lọc báo cáo theo thời gian</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Xem hiệu quả giảng dạy theo giai đoạn</p>
                </div>
              </div>
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="w-[220px] h-12 rounded-xl border-2 border-primary/10 font-bold bg-background">
                  <SelectValue placeholder="Chọn khoảng thời gian" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả thời gian</SelectItem>
                  <SelectItem value="month">30 ngày qua</SelectItem>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="rounded-3xl shadow-xl border-primary/10 lg:col-span-1 overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="text-primary w-6 h-6" />
                    <div>
                        <CardTitle className="text-lg">Thống kê Giáo viên</CardTitle>
                        <CardDescription className="text-xs">Xếp hạng theo số lượng bài tập.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-1 gap-4">
                      {teacherStats.map((stat, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/20 transition-all space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold flex items-center gap-2 text-base">
                                <span className="text-[10px] w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-black">{i + 1}</span>
                                {stat.name}
                            </span>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black px-3 py-1">
                                {stat.count} bài tập
                            </Badge>
                          </div>
                          <Progress value={stat.count > 0 ? (stat.count / Math.max(...teacherStats.map(s => s.count), 1)) * 100 : 0} className="h-2 rounded-full bg-muted" />
                        </div>
                      ))}
                      {teacherStats.length === 0 && <p className="text-center text-muted-foreground py-12 italic">Chưa có dữ liệu bài tập trong giai đoạn này.</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-xl border-primary/10 lg:col-span-2 overflow-hidden">
                <CardHeader className="bg-accent/5 border-b border-accent/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-accent w-6 h-6" />
                    <div>
                        <CardTitle className="text-lg">Hiệu suất Làm bài theo Lớp</CardTitle>
                        <CardDescription className="text-xs">Theo dõi tỉ lệ hoàn thành mục tiêu.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-1 gap-4">
                      {classStats.map((stat) => (
                        <div key={stat.id} className="p-5 rounded-2xl bg-muted/30 border border-border/50 hover:border-accent/20 transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center font-black text-accent text-lg">
                                {stat.name.substring(0, 2)}
                              </div>
                              <div>
                                <h4 className="font-black text-xl text-foreground">{stat.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                  <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {stat.studentCount} HS</span>
                                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3"/> {stat.assignmentCount} bài</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-2xl font-black ${stat.completionRate >= 80 ? 'text-accent' : stat.completionRate >= 50 ? 'text-primary' : 'text-muted-foreground'}`}>
                                {stat.completionRate}%
                              </span>
                              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Hoàn thành</p>
                            </div>
                          </div>
                          <Progress value={stat.completionRate} className={`h-2.5 rounded-full ${stat.completionRate >= 80 ? '[&>div]:bg-accent' : ''}`} />
                        </div>
                      ))}
                      {classStats.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                          <CheckCircle2 className="h-12 w-12 opacity-10 mb-4" />
                          <p className="italic font-medium text-center">Chưa có dữ liệu thống kê cho các lớp học.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Chỉnh sửa & Cấp lại tài khoản</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label>Họ và tên</Label>
                <Input placeholder="Họ và tên" value={editFullName} onChange={e => setEditFullName(e.target.value)} required className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
                <Label>Tên đăng nhập</Label>
                <Input placeholder="Tên đăng nhập" value={editUsername} onChange={e => setEditUsername(e.target.value)} required className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
                <Label className="text-primary font-black flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Mật khẩu mới
                </Label>
                <Input type="text" placeholder="Nhập mật khẩu mới để cấp lại" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="rounded-xl h-12 border-primary/30" />
                <p className="text-[10px] text-muted-foreground italic">Thay đổi mật khẩu tại đây nếu người dùng quên.</p>
            </div>
            <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select onValueChange={(v) => setEditRole(v as UserRole)} value={editRole}>
                    <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value={UserRole.ADMIN}>Quản trị viên</SelectItem>
                        <SelectItem value={UserRole.TEACHER}>Giáo viên</SelectItem>
                        <SelectItem value={UserRole.STUDENT}>Học sinh</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setEditUserModalOpen(false)} className="rounded-xl">Hủy</Button>
                <Button type="submit" className="rounded-xl font-bold px-8 shadow-lg shadow-primary/10">Lưu thay đổi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Class Modal */}
      <Dialog open={isClassEditModalOpen} onOpenChange={setClassEditModalOpen}>
          <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Chỉnh sửa lớp học</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdateClass} className="space-y-4 pt-4">
                  <div className="space-y-2">
                      <Label>Tên lớp học</Label>
                      <Input placeholder="Ví dụ: 8A1..." value={editClassName} onChange={e => setEditClassName(e.target.value)} required className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                      <Label>Giáo viên quản lý</Label>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full h-12 justify-between rounded-xl">
                                  <span className="truncate">{editTeacherIds.length > 0 ? getTeachersText(editTeacherIds) : "Chọn giáo viên..."}</span>
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto rounded-xl">
                              {allTeachers.map(t => (
                                  <DropdownMenuCheckboxItem key={t.id} checked={editTeacherIds.includes(t.id)} onCheckedChange={checked => setEditTeacherIds(prev => checked ? [...prev, t.id] : prev.filter(id => id !== t.id))} onSelect={e => e.preventDefault()}>
                                      {t.fullName}
                                  </DropdownMenuCheckboxItem>
                              ))}
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                  <DialogFooter className="pt-4">
                      <Button type="button" variant="ghost" onClick={() => setClassEditModalOpen(false)} className="rounded-xl">Hủy</Button>
                      <Button type="submit" className="rounded-xl font-bold px-8">Cập nhật lớp</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
