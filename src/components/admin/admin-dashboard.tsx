
"use client";

import React, { useState, useEffect } from 'react';
import type { User, Class, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Upload, Download, UserPlus, Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface AdminDashboardProps {
  users: User[];
  classes: Class[];
  onAddUser: (user: User) => Promise<void>;
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
  onAddUser,
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
  const [isClassModalOpen, setClassModalOpen] = useState(false);
  const [isClassEditModalOpen, setClassEditModalOpen] = useState(false);

  // User form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT' as UserRole);

  // Class form state
  const [className, setClassName] = useState('');
  const [teacherId, setTeacherId] = useState('');

  // Edit Class state
  const [classToEdit, setClassToEdit] = useState<Class | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');

  // Student list state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  // Teacher selection state
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  
  // Class selection state
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);


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
    };

    if (teacherId) {
      newClass.teacherId = teacherId;
    }
    
    await onAddClass(newClass);
    toast({ description: 'Đã thêm lớp học mới.' });
    setClassName('');
    setTeacherId('');
    setClassModalOpen(false);
  };
  
  const handleOpenEditClassModal = (cls: Class) => {
    setClassToEdit(cls);
    setEditClassName(cls.name);
    setEditTeacherId(cls.teacherId || 'none');
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
      teacherId: editTeacherId === 'none' ? undefined : editTeacherId,
    };
    await onUpdateClass(updatedClass);
    toast({ description: 'Đã cập nhật lớp học.' });
    setClassEditModalOpen(false);
    setClassToEdit(null);
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

  // Data processing for user roles
  const admins = users.filter(u => u.role === 'ADMIN');
  const allTeachers = users.filter(u => u.role === 'TEACHER');
  
  const headTeacherIds = new Set(classes.map(c => c.teacherId).filter(Boolean));
  const headTeachers = allTeachers.filter(u => headTeacherIds.has(u.id!));
  const subjectTeachers = allTeachers.filter(u => !headTeacherIds.has(u.id!));
  
  const studentsByClass = classes.reduce((acc, cls) => {
    acc[cls.id] = users.filter(s => s.role === 'STUDENT' && s.classId === cls.id);
    return acc;
  }, {} as Record<string, User[]>);
  const unassignedStudents = users.filter(s => s.role === 'STUDENT' && (!s.classId || !classes.some(c => c.id === s.classId)));

  useEffect(() => {
    const selectionIsValid = classes.some(c => c.id === selectedClassId);

    if (!selectionIsValid && selectedClassId !== 'unassigned') {
      if (classes.length > 0) {
        setSelectedClassId(classes[0].id);
      } else {
        setSelectedClassId('unassigned');
      }
    }
  }, [classes, selectedClassId]);

  const UserTable: React.FC<{ users: User[]; onDeleteUser: (user: User) => Promise<void>; canDelete?: boolean; }> = ({ users, onDeleteUser, canDelete = true }) => (
    <Table>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="font-medium">{user.fullName}</div>
              <div className="text-xs text-muted-foreground">@{user.username}</div>
              {user.password && (
                <div className="text-xs text-muted-foreground font-mono mt-1">Mật khẩu: <span className="font-bold text-foreground">{user.password}</span></div>
              )}
            </TableCell>
            {canDelete && <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onDeleteUser(user)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>}
          </TableRow>
        ))}
        {users.length === 0 && (
          <TableRow><TableCell colSpan={canDelete ? 2 : 1} className="h-24 text-center text-muted-foreground">Không có người dùng trong danh sách này.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

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
                
                {selectedClassId && (
                  <UserTable 
                    users={selectedClassId === 'unassigned' ? unassignedStudents : studentsByClass[selectedClassId] || []} 
                    onDeleteUser={onDeleteUser}
                    canDelete={true}
                  />
                )}
              </TabsContent>
              <TabsContent value="teachers" className="mt-4 space-y-4">
                 <div className="flex items-center justify-end gap-2">
                    {selectedTeachers.length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa đã chọn ({selectedTeachers.length})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bạn chắc chắn muốn xóa {selectedTeachers.length} giáo viên đã chọn?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Nếu trong số này có giáo viên chủ nhiệm, họ sẽ bị gỡ khỏi lớp. Thao tác này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDeleteTeachers} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  {allTeachers.length > 0 && (
                    <div className="flex items-center p-4 border-b rounded-t-lg">
                      <Checkbox
                        id="select-all-teachers"
                        checked={selectedTeachers.length > 0 && selectedTeachers.length === allTeachers.length}
                        onCheckedChange={(checked) =>
                          setSelectedTeachers(checked ? allTeachers.map((t) => t.id) : [])
                        }
                      />
                      <label
                        htmlFor="select-all-teachers"
                        className="ml-3 text-sm font-medium cursor-pointer"
                      >
                        Chọn tất cả ({allTeachers.length} giáo viên)
                      </label>
                    </div>
                  )}
                 <div>
                    <h4 className="font-bold mb-2 px-1 text-primary">Giáo viên Chủ nhiệm ({headTeachers.length})</h4>
                    <Table>
                      <TableBody>
                        {headTeachers.map(user => (
                          <TableRow key={user.id} data-state={selectedTeachers.includes(user.id) ? 'selected' : ''}>
                             <TableCell className="w-12">
                              <Checkbox
                                checked={selectedTeachers.includes(user.id)}
                                onCheckedChange={() => handleToggleTeacherSelection(user.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                              {user.password && (
                                <div className="text-xs text-muted-foreground font-mono mt-1">Mật khẩu: <span className="font-bold text-foreground">{user.password}</span></div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                         {headTeachers.length === 0 && (
                          <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Không có giáo viên chủ nhiệm.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                 </div>
                 <Separator />
                 <div>
                    <h4 className="font-bold mb-2 px-1">Giáo viên Bộ môn ({subjectTeachers.length})</h4>
                    <Table>
                      <TableBody>
                        {subjectTeachers.map(user => (
                          <TableRow key={user.id} data-state={selectedTeachers.includes(user.id) ? 'selected' : ''}>
                            <TableCell className="w-12">
                              <Checkbox
                                checked={selectedTeachers.includes(user.id)}
                                onCheckedChange={() => handleToggleTeacherSelection(user.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                              {user.password && (
                                <div className="text-xs text-muted-foreground font-mono mt-1">Mật khẩu: <span className="font-bold text-foreground">{user.password}</span></div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                         {subjectTeachers.length === 0 && (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Không có giáo viên bộ môn.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                 </div>
              </TabsContent>
              <TabsContent value="admins" className="mt-4">
                <UserTable users={admins} onDeleteUser={onDeleteUser} />
              </TabsContent>
            </Tabs>
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
                    <SelectTrigger><SelectValue placeholder="Chọn giáo viên chủ nhiệm (tùy chọn)" /></SelectTrigger>
                    <SelectContent>
                      {allTeachers.map(t => <SelectItem key={t.id} value={t.id!}>{t.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full">Thêm lớp học</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              {selectedClasses.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa đã chọn ({selectedClasses.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bạn chắc chắn muốn xóa {selectedClasses.length} lớp đã chọn?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Thao tác này sẽ xóa vĩnh viễn các lớp đã chọn và gỡ liên kết của tất cả học sinh trong các lớp đó. Thao tác này không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDeleteClasses} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
             <Table>
              <TableHeader>
                <TableRow>
                   <TableHead className="w-12">
                     <Checkbox
                        id="select-all-classes"
                        checked={selectedClasses.length > 0 && selectedClasses.length === classes.length}
                        onCheckedChange={(checked) =>
                          setSelectedClasses(checked ? classes.map((c) => c.id) : [])
                        }
                        aria-label="Chọn tất cả lớp học"
                      />
                  </TableHead>
                  <TableHead>Tên lớp</TableHead>
                  <TableHead>Giáo viên</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map(cls => (
                  <TableRow key={cls.id} data-state={selectedClasses.includes(cls.id) ? 'selected' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedClasses.includes(cls.id)}
                        onCheckedChange={() => handleToggleClassSelection(cls.id)}
                        aria-label={`Chọn lớp ${cls.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{users.find(u => u.id === cls.teacherId)?.fullName || 'Chưa gán'}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditClassModal(cls)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
                              <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Bạn chắc chắn muốn xóa lớp "{cls.name}"?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Thao tác này sẽ xóa vĩnh viễn lớp học và gỡ liên kết của tất cả học sinh trong lớp. Thao tác này không thể hoàn tác.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDeleteClasses([cls.id])} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
                 {classes.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Không có lớp học nào.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <Dialog open={isClassEditModalOpen} onOpenChange={setClassEditModalOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>Chỉnh sửa lớp học</DialogTitle></DialogHeader>
                <form onSubmit={handleUpdateClass} className="space-y-4">
                  <Input placeholder="Tên lớp học" value={editClassName} onChange={e => setEditClassName(e.target.value)} required />
                  <Select onValueChange={setEditTeacherId} value={editTeacherId}>
                    <SelectTrigger><SelectValue placeholder="Chọn giáo viên chủ nhiệm (tùy chọn)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không gán</SelectItem>
                      {allTeachers.map(t => <SelectItem key={t.id} value={t.id!}>{t.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full">Lưu thay đổi</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

    