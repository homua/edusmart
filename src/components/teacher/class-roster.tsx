"use client";

import React, { useState } from 'react';
import type { User, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Sparkles, Trash2, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ClassRosterProps {
  currentUser: User;
  classes: Class[];
  students: User[];
  onBack: () => void;
  onAddStudents: (names: string[]) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onParseStudents: (bulkInput: string) => Promise<string[]>;
}

const ClassRoster: React.FC<ClassRosterProps> = ({
  currentUser,
  classes,
  students,
  onBack,
  onAddStudents,
  onDeleteStudent,
  onParseStudents,
}) => {
  const { toast } = useToast();
  const currentClass = classes.find(c => c.id === currentUser.classId);
  const [newStudentName, setNewStudentName] = useState('');
  
  // Bulk import state
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [parsedNames, setParsedNames] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" className="rounded-full py-6 px-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <div className="text-right flex-grow">
          <h1 className="text-3xl font-black text-foreground">Quản lý lớp: {currentClass?.name}</h1>
          <p className="text-muted-foreground">{students.length} học sinh</p>
        </div>
      </div>
      
      <Card className="rounded-3xl shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Thêm học sinh</CardTitle>
          <CardDescription>Thêm thủ công từng em hoặc nhập hàng loạt bằng AI.</CardDescription>
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
                <DialogDescription>Dán danh sách học sinh từ Excel, Word hoặc văn bản. AI sẽ tự động bóc tách tên.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {parsedNames.length === 0 ? (
                  <Textarea
                    value={bulkInput}
                    onChange={e => setBulkInput(e.target.value)}
                    placeholder="Nguyễn Văn A - Lớp 10A1&#10;Trần Thị B&#10;Lê Văn C, Nam, 15 tuổi"
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
                    <Button onClick={confirmBulkImport} className="bg-accent text-accent-foreground hover:bg-accent/90">Xác nhận thêm vào lớp</Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-lg shadow-primary/5">
        <CardHeader><CardTitle>Danh sách lớp</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(s => (
            <div key={s.id} className="p-4 bg-background rounded-2xl flex justify-between items-center group transition-all border-2 border-transparent hover:border-primary/20 hover:shadow-md">
              <div className="flex items-center gap-4">
                <Avatar><AvatarFallback><UserIcon /></AvatarFallback></Avatar>
                <div>
                  <h4 className="font-bold text-foreground">{s.fullName}</h4>
                  <span className="text-xs text-muted-foreground font-mono">@{s.username}</span>
                </div>
              </div>
              <Button onClick={() => onDeleteStudent(s.id)} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {students.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">Chưa có học sinh nào trong lớp.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassRoster;
