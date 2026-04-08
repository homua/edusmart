
"use client";

import React, { useState } from 'react';
import type { User, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Sparkles, Trash2, User as UserIcon, FileDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';

interface ClassRosterProps {
  currentUser: User;
  classes: Class[];
  students: User[];
  onBack: () => void;
  onAddStudents: (names: string[]) => Promise<void>;
  onDeleteStudents: (ids: string[]) => Promise<void>;
  onParseStudents: (bulkInput: string) => Promise<string[]>;
}

const ClassRoster: React.FC<ClassRosterProps> = ({
  currentUser,
  classes,
  students,
  onBack,
  onAddStudents,
  onDeleteStudents,
  onParseStudents,
}) => {
  const { toast } = useToast();
  // Find managed classes where current user is one of the teachers
  const managedClasses = classes.filter(c => c.teacherIds?.includes(currentUser.id));
  const classNamesText = managedClasses.map(c => c.name).join(', ');

  const [newStudentName, setNewStudentName] = useState('');
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [parsedNames, setParsedNames] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || managedClasses.length === 0) return;
    await onAddStudents([newStudentName]);
    toast({ description: `Đã thêm học sinh ${newStudentName}.` });
    setNewStudentName('');
  };

  const handleStartBulkParse = async () => {
    if (!bulkInput.trim()) return;
    setIsParsing(true);
    try {
      const names = await onParseStudents(bulkInput);
      setParsedNames(names);
      toast({ title: 'AI đã bóc tách xong!', description: `Tìm thấy ${names.length} học sinh.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi AI', description: 'Không thể xử lý danh sách. Vui lòng thử lại.' });
    } finally {
      setIsParsing(false);
    }
  };

  const confirmBulkImport = async () => {
    if (managedClasses.length === 0) return;
    await onAddStudents(parsedNames);
    toast({ description: `Đã thêm ${parsedNames.length} học sinh vào lớp.` });
    setBulkInput('');
    setParsedNames([]);
    setBulkModalOpen(false);
  };
  
  const resetBulkModal = () => {
    setBulkInput('');
    setParsedNames([]);
    setIsParsing(false);
  }

  const handleConfirmBulkDelete = async () => {
    try {
      await onDeleteStudents(selectedStudents);
      setSelectedStudents([]);
    } catch(error) {
      console.error("Bulk delete failed:", error);
    }
  };

  const handleExportStudentsExcel = () => {
    if (students.length === 0) {
      toast({ variant: 'destructive', title: "Thông báo", description: "Danh sách học sinh đang trống." });
      return;
    }
    const studentsToExport = students.map(s => ({
      'Họ và tên': s.fullName,
      'Lớp': managedClasses.find(c => c.id === s.classId)?.name || 'Khác',
      'Tên đăng nhập': s.username,
      'Mật khẩu': s.password,
    }));
    const ws = XLSX.utils.json_to_sheet(studentsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sach Hoc sinh");
    XLSX.writeFile(wb, `Danh_sach_Hoc_sinh_Lop_${classNamesText.replace(', ', '_')}_${new Date().getTime()}.xlsx`);
    toast({ title: "Thành công", description: "Đã xuất danh sách tài khoản học sinh." });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" className="rounded-full py-6 px-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <div className="text-right flex-grow">
          <h1 className="text-3xl font-black text-foreground">Quản lý lớp: {classNamesText || 'Chưa gán'}</h1>
          <p className="text-muted-foreground">{students.length} học sinh</p>
        </div>
      </div>
      
      {managedClasses.length > 0 && (
        <Card className="rounded-3xl shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Thêm học sinh</CardTitle>
            <CardDescription>Thêm thủ công hoặc nhập hàng loạt bằng AI vào lớp quản lý.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleAddSingleStudent} className="flex-1 flex gap-4">
              <Input
                type="text"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                placeholder="Nhập tên học sinh..."
                className="flex-1 px-6 py-7 bg-background border-2 rounded-2xl text-lg"
              />
              <Button type="submit" className="px-6 py-7 rounded-2xl text-lg font-bold"><Plus /></Button>
            </form>
            <Dialog open={isBulkModalOpen} onOpenChange={(isOpen) => { if(!isOpen) resetBulkModal(); setBulkModalOpen(isOpen);}}>
              <DialogTrigger asChild>
                <Button variant="outline" className="px-6 py-7 rounded-2xl text-lg font-bold">
                  <Sparkles className="mr-2" /> Nhập AI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Nhập danh sách bằng AI</DialogTitle>
                  <DialogDescription>Dán danh sách học sinh, AI sẽ tự động bóc tách tên.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {parsedNames.length === 0 ? (
                    <Textarea
                      value={bulkInput}
                      onChange={e => setBulkInput(e.target.value)}
                      placeholder="Dán danh sách tại đây..."
                      className="w-full h-64 rounded-xl resize-none"
                      disabled={isParsing}
                    />
                  ) : (
                    <div className="max-h-64 overflow-y-auto rounded-xl bg-muted p-4">
                      <p className="font-bold mb-2">AI đã nhận dạng các tên sau:</p>
                      <div className="flex flex-wrap gap-2">
                        {parsedNames.map((name, i) => (
                          <Badge key={i} variant="default" className="bg-accent text-accent-foreground">{name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {parsedNames.length === 0 ? (
                    <Button onClick={handleStartBulkParse} disabled={isParsing} className="w-full">
                      {isParsing ? "AI đang phân tích..." : "Bóc tách danh sách"}
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={resetBulkModal}>Thử lại</Button>
                      <Button onClick={confirmBulkImport} className="bg-accent text-accent-foreground hover:bg-accent/90">Xác nhận thêm</Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl shadow-lg shadow-primary/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách lớp</CardTitle>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportStudentsExcel} className="rounded-xl">
                  <FileDown className="mr-2 h-4 w-4" /> Xuất danh sách HS
                </Button>
                {selectedStudents.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="rounded-xl">
                                <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedStudents.length})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Xóa học sinh đã chọn?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {students.length > 0 && (
            <div className="flex items-center p-4 border-b">
              <Checkbox
                id="select-all"
                checked={selectedStudents.length > 0 && selectedStudents.length === students.length}
                onCheckedChange={(checked) => setSelectedStudents(checked ? students.map((s) => s.id) : [])}
              />
              <label htmlFor="select-all" className="ml-3 text-sm font-medium">Chọn tất cả ({students.length} học sinh)</label>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {students.map(s => (
              <div key={s.id} className="p-4 bg-background rounded-2xl flex justify-between items-center group transition-all border-2 border-transparent hover:border-primary/20 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`student-${s.id}`}
                    checked={selectedStudents.includes(s.id)}
                    onCheckedChange={(checked) => setSelectedStudents(prev => checked ? [...prev, s.id] : prev.filter(id => id !== s.id))}
                  />
                  <label htmlFor={`student-${s.id}`} className="flex items-center gap-4 cursor-pointer">
                    <Avatar><AvatarFallback><UserIcon /></AvatarFallback></Avatar>
                    <div>
                      <h4 className="font-bold text-foreground">{s.fullName}</h4>
                      <span className="text-xs text-muted-foreground font-mono">@{s.username}</span>
                      <div className="text-xs text-muted-foreground font-mono">Mật khẩu: <b>{s.password}</b></div>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassRoster;
