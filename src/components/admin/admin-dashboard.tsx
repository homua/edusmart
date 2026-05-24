
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
import { Plus, Trash2, Upload, Download, UserPlus, Pencil, FileDown, ChevronDown, BarChart3, Users, BookOpen, CheckCircle2, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import * as XLSX from 'xlsx';
import { subDays, isAfter, parseISO } from 'date-fns';

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

  // Stats time range filter
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');

  // User form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  // Edit User state
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.STUDENT);

  // Class form state
  const [className, setClassName] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);

  // Edit Class state
  const [classToEdit, setClassToEdit] = useState<Class | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editTeacherIds, setEditTeacherIds] = useState<string[]>([]);

  // Selection states
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
    const updatedUser: User = {
      ...userToEdit,
      fullName: editFullName,
      username: editUsername,
      password: editPassword,
      role: editRole,
    };
    await onUpdateUser(updatedUser);
    toast({ description: 'Đã cập nhật thông tin người dùng.' });
    setEditUserModalOpen(false);
    setUserToEdit(null);
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

  const allTeachers = users.filter(u => u.role === UserRole.TEACHER);

  const getTeachersText = (ids: string[]) => {
    if (!ids || ids.length === 0) return "Chưa gán";
    return ids.map(id => users.find(u => u.id === id)?.fullName || 'Không xác định').join(', ');
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
      'Vai trò': 'Giáo viên'
    }));
    const ws = XLSX.utils.json_to_sheet(teachersToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sach Giao vien");
    XLSX.writeFile(wb, `Danh_sach_Giao_vien_${new Date().getTime()}.xlsx`);
    toast({ title: "Thành công", description: "Đã xuất danh sách giáo viên." });
  };

  const admins = users.filter(u => u.role === UserRole.ADMIN);
  const studentsByClass = classes.reduce((acc, cls) => {
    acc[cls.id] = users.filter(s => s.role === UserRole.STUDENT && s.classId === cls.id);
    return acc;
  }, {} as Record<string, User[]>);
  const unassignedStudents = users.filter(s => s.role === UserRole.STUDENT && (!s.classId || !classes.some(c => c.id === s.classId)));

  useEffect(() => {
    if (!classes.some(c => c.id === selectedClassId) && selectedClassId !== 'unassigned') {
      if (classes.length > 0) setSelectedClassId(classes[0].id);
      else setSelectedClassId('unassigned');
    }
  }, [classes, selectedClassId]);

  const currentStudentList = selectedClassId ? (selectedClassId === 'unassigned' ? unassignedStudents : studentsByClass[selectedClassId] || []) : [];

  // Statistics Calculation with time filtering
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
  }, [assignments, submissions, users, classes, timeRange]);

  const { teacherStats, classStats } = statsData;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black text-foreground">Bảng điều khiển Quản trị viên</h1>
          <p className="text-muted-foreground">Quản lý người dùng, lớp học và dữ liệu hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={onExport} variant="outline" title="Xuất toàn bộ dữ liệu ra file Excel (.xlsx)">
              <Download className="mr-2" />
              Xuất dữ liệu
           </Button>
           <Label htmlFor="import-file" className="cursor-pointer">
            <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                <Upload className="mr-2" />
                Nhập dữ liệu
            </div>
             <Input id="import-file" type="file" accept=".xlsx, .xls" className="hidden" onChange={onImport} />
           </Label>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="users" className="py-3 text-base font-bold">Quản lý Người dùng</TabsTrigger>
          <TabsTrigger value="classes" className="py-3 text-base font-bold">Quản lý Lớp học</TabsTrigger>
          <TabsTrigger value="stats" className="py-3 text-base font-bold">Thống kê & Báo cáo</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="rounded-3xl shadow-lg shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Người dùng Hệ thống</CardTitle>
                <CardDescription>{users.length} người dùng đang hoạt động.</CardDescription>
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
                        <SelectItem value={UserRole.ADMIN}>Quản trị viên</SelectItem>
                        <SelectItem value={UserRole.TEACHER}>Giáo viên</SelectItem>
                        <SelectItem value={UserRole.STUDENT}>Học sinh</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" className="w-full">Thêm người dùng</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="students">Học sinh</TabsTrigger>
                  <TabsTrigger value="teachers">Giáo viên</TabsTrigger>
                  <TabsTrigger value="admins">Quản trị viên</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="mt-4 space-y-4">
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn một lớp..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({studentsByClass[cls.id]?.length || 0} học sinh)
                        </SelectItem>
                      ))}
                      {(unassignedStudents.length > 0 || classes.length === 0) && (
                         <SelectItem value="unassigned">
                           Chưa phân lớp ({unassignedStudents.length} học sinh)
                         </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-end gap-2">
                      {selectedStudents.length > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa đã chọn ({selectedStudents.length})
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Bạn chắc chắn muốn xóa {selectedStudents.length} học sinh đã chọn?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={handleBulkDeleteStudents} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                  </div>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-12"><Checkbox checked={selectedStudents.length > 0 && currentStudentList.length > 0 && selectedStudents.length === currentStudentList.length} onCheckedChange={(checked) => setSelectedStudents(checked ? currentStudentList.map((s) => s.id) : [])}/></TableHead>
                              <TableHead>Học sinh</TableHead>
                              <TableHead className="text-right">Hành động</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {currentStudentList.map(user => (
                              <TableRow key={user.id} data-state={selectedStudents.includes(user.id) ? 'selected' : ''}>
                                  <TableCell><Checkbox checked={selectedStudents.includes(user.id)} onCheckedChange={() => handleToggleStudentSelection(user.id)}/></TableCell>
                                  <TableCell>
                                      <div className="font-medium">{user.fullName}</div>
                                      <div className="text-xs text-muted-foreground">@{user.username} | {user.password}</div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditUserModal(user)} className="rounded-full"><Pencil className="h-4 w-4" /></Button>
                                          <Button variant="ghost" size="icon" onClick={() => onDeleteUser(user)} className="text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                      </div>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="teachers" className="mt-4 space-y-4">
                   <div className="flex items-center justify-between gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportTeachersExcel}><FileDown className="mr-2 h-4 w-4" /> Xuất danh sách GV</Button>
                      {selectedTeachers.length > 0 && <Button variant="destructive" size="sm" onClick={handleBulkDeleteTeachers}><Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedTeachers.length})</Button>}
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"><Checkbox checked={selectedTeachers.length > 0 && selectedTeachers.length === allTeachers.length} onCheckedChange={(checked) => setSelectedTeachers(checked ? allTeachers.map(t => t.id) : [])}/></TableHead>
                                <TableHead>Giáo viên</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allTeachers.map(user => (
                            <TableRow key={user.id}>
                               <TableCell><Checkbox checked={selectedTeachers.includes(user.id)} onCheckedChange={() => handleToggleTeacherSelection(user.id)} /></TableCell>
                              <TableCell>
                                <div className="font-medium">{user.fullName}</div>
                                <div className="text-xs text-muted-foreground">@{user.username} | {user.password}</div>
                              </TableCell>
                              <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditUserModal(user)} className="rounded-full"><Pencil className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" onClick={() => onDeleteUser(user)} className="text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                </TabsContent>
                <TabsContent value="admins" className="mt-4">
                  <Table>
                    <TableBody>
                      {admins.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" onClick={() => handleOpenEditUserModal(user)} className="rounded-full"><Pencil className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
           <Card className="rounded-3xl shadow-lg shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Danh sách Lớp học</CardTitle>
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
                    <div className="space-y-2">
                      <Label>Giáo viên quản lý</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <span className="truncate">{teacherIds.length > 0 ? getTeachersText(teacherIds) : "Chọn giáo viên..."}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto">
                          {allTeachers.map(t => (
                            <DropdownMenuCheckboxItem key={t.id} checked={teacherIds.includes(t.id)} onCheckedChange={checked => setTeacherIds(prev => checked ? [...prev, t.id] : prev.filter(id => id !== t.id))} onSelect={e => e.preventDefault()}>
                              {t.fullName}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Button type="submit" className="w-full">Thêm lớp học</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead className="w-12"><Checkbox checked={selectedClasses.length > 0 && selectedClasses.length === classes.length} onCheckedChange={(checked) => setSelectedClasses(checked ? classes.map(c => c.id) : [])} /></TableHead>
                    <TableHead>Tên lớp</TableHead>
                    <TableHead>Giáo viên quản lý</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map(cls => (
                    <TableRow key={cls.id}>
                      <TableCell><Checkbox checked={selectedClasses.includes(cls.id)} onCheckedChange={() => handleToggleClassSelection(cls.id)} /></TableCell>
                      <TableCell className="font-bold">{cls.name}</TableCell>
                      <TableCell className="text-sm">{getTeachersText(cls.teacherIds || [])}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditClassModal(cls)} className="rounded-full"><Pencil className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" onClick={() => onDeleteClasses([cls.id])} className="text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="h-4 w-4"/></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-bold">Lọc báo cáo theo thời gian</span>
              </div>
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue placeholder="Chọn khoảng thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thời gian</SelectItem>
                  <SelectItem value="month">30 ngày qua</SelectItem>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="rounded-3xl shadow-lg border-primary/10 lg:col-span-1">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-primary w-5 h-5" />
                    <CardTitle>Thống kê Giáo viên</CardTitle>
                  </div>
                  <CardDescription>Số lượng bài tập đã giao theo thời gian lọc.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {teacherStats.map((stat, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold">{stat.name}</span>
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-black">{stat.count} bài</span>
                        </div>
                        <Progress value={stat.count > 0 ? (stat.count / Math.max(...teacherStats.map(s => s.count), 1)) * 100 : 0} className="h-2" />
                      </div>
                    ))}
                    {teacherStats.length === 0 && <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu giáo viên.</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-lg border-primary/10 lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-accent w-5 h-5" />
                    <CardTitle>Tình hình Làm bài theo Lớp</CardTitle>
                  </div>
                  <CardDescription>Tỉ lệ hoàn thành bài tập của học sinh trong thời gian lọc.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lớp học</TableHead>
                        <TableHead className="text-center">Sĩ số</TableHead>
                        <TableHead className="text-center">Số bài đã giao</TableHead>
                        <TableHead className="text-right">Tỉ lệ hoàn thành</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classStats.map((stat) => (
                        <TableRow key={stat.id}>
                          <TableCell className="font-black text-lg">{stat.name}</TableCell>
                          <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 font-medium">
                                  <Users className="w-3.5 h-3.5 opacity-50" /> {stat.studentCount}
                              </div>
                          </TableCell>
                          <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 font-medium">
                                  <BookOpen className="w-3.5 h-3.5 opacity-50" /> {stat.assignmentCount}
                              </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-sm font-black ${stat.completionRate >= 80 ? 'text-accent' : stat.completionRate >= 50 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {stat.completionRate}%
                              </span>
                              <div className="w-24">
                                  <Progress value={stat.completionRate} className={`h-1.5 ${stat.completionRate >= 80 ? '[&>div]:bg-accent' : ''}`} />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {classStats.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Chưa có dữ liệu lớp học.</TableCell>
                          </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chỉnh sửa người dùng</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
                <Label>Họ và tên</Label>
                <Input placeholder="Họ và tên" value={editFullName} onChange={e => setEditFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label>Tên đăng nhập</Label>
                <Input placeholder="Tên đăng nhập" value={editUsername} onChange={e => setEditUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label>Mật khẩu</Label>
                <Input type="text" placeholder="Mật khẩu" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select onValueChange={(v) => setEditRole(v as UserRole)} value={editRole}>
                    <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={UserRole.ADMIN}>Quản trị viên</SelectItem>
                        <SelectItem value={UserRole.TEACHER}>Giáo viên</SelectItem>
                        <SelectItem value={UserRole.STUDENT}>Học sinh</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditUserModalOpen(false)}>Hủy</Button>
                <Button type="submit">Lưu thay đổi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
