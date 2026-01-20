"use client";

import React, { useState } from 'react';
import type { Class, Question, QuestionType, Assignment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssignmentFormProps {
  teacherId: string;
  classes: Class[];
  onSave: (assignment: Assignment) => Promise<void>;
  onCancel: () => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ teacherId, classes, onSave, onCancel }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [classIds, setClassIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'TEXT' as QuestionType.TEXT,
      options: [],
      correctAnswer: '',
      points: 10,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedField: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updatedField };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };
  
  const handleSave = async () => {
    if (!title || classIds.length === 0 || questions.length === 0) {
      toast({ variant: 'destructive', description: 'Vui lòng điền tiêu đề, chọn lớp và thêm ít nhất một câu hỏi.' });
      return;
    }
    const newAssignment: Assignment = {
      id: `asg_${Date.now()}`,
      title,
      teacherId,
      classIds,
      questions,
      createdAt: new Date().toISOString(),
    };
    await onSave(newAssignment);
    toast({ title: "Thành công!", description: "Đã tạo bài tập mới." });
  };

  const selectedClassesText = classIds.length > 0
    ? classes
        .filter(c => classIds.includes(c.id))
        .map(c => c.name)
        .join(', ')
    : "Chọn một hoặc nhiều lớp...";

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button onClick={onCancel} variant="outline" size="icon" className="h-12 w-12 rounded-full"><ArrowLeft /></Button>
        <div>
          <h1 className="text-3xl font-black text-foreground">Tạo bài tập mới</h1>
          <p className="text-muted-foreground">Soạn câu hỏi và giao bài cho lớp của bạn.</p>
        </div>
      </div>

      <Card className="rounded-3xl shadow-lg shadow-primary/5">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-lg font-bold">Tiêu đề bài tập</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Bài kiểm tra giữa kỳ" className="py-6 text-lg rounded-xl"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="classes" className="text-lg font-bold">Giao cho lớp</Label>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button id="classes" variant="outline" className="py-6 text-lg rounded-xl w-full justify-between font-normal text-left">
                         <span className="truncate">{selectedClassesText}</span>
                         <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {classes.map(c => (
                        <DropdownMenuCheckboxItem
                            key={c.id}
                            checked={classIds.includes(c.id)}
                            onCheckedChange={checked => {
                                setClassIds(currentIds => 
                                    checked 
                                    ? [...currentIds, c.id]
                                    : currentIds.filter(id => id !== c.id)
                                )
                            }}
                            onSelect={e => e.preventDefault()}
                        >
                            {c.name}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {questions.map((q, index) => (
        <Card key={q.id} className="rounded-3xl shadow-lg shadow-primary/5 relative">
          <CardHeader className="flex flex-row justify-between items-start">
             <CardTitle>Câu hỏi {index + 1}</CardTitle>
             <Button variant="ghost" size="icon" onClick={() => removeQuestion(index)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"><Trash2 /></Button>
          </CardHeader>
          <CardContent className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 col-span-2">
              <Label>Nội dung câu hỏi</Label>
              <Textarea value={q.text} onChange={e => updateQuestion(index, { text: e.target.value })} placeholder="Nhập nội dung câu hỏi ở đây..." className="min-h-[120px] rounded-xl"/>
            </div>
            <div className="space-y-2">
                <Label>Loại câu hỏi</Label>
                <Select value={q.type} onValueChange={(v) => updateQuestion(index, { type: v as QuestionType })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TEXT">Trả lời ngắn</SelectItem>
                        <SelectItem value="MULTIPLE_CHOICE">Trắc nghiệm</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>Điểm</Label>
                <Input type="number" value={q.points} onChange={e => updateQuestion(index, { points: parseInt(e.target.value) || 0 })} className="rounded-xl"/>
             </div>
            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-4 col-span-2">
                <Label>Các lựa chọn</Label>
                {q.options?.map((opt, optIndex) => (
                  <Input key={optIndex} value={opt} onChange={e => {
                      const newOptions = [...(q.options || [])];
                      newOptions[optIndex] = e.target.value;
                      updateQuestion(index, { options: newOptions });
                  }} placeholder={`Lựa chọn ${optIndex + 1}`} className="rounded-xl" />
                ))}
                 <Button variant="outline" size="sm" onClick={() => updateQuestion(index, { options: [...(q.options || []), ''] })}>Thêm lựa chọn</Button>
              </div>
            )}
            <div className="space-y-2 col-span-2">
                <Label>Đáp án đúng</Label>
                {q.type === 'MULTIPLE_CHOICE' ? (
                     <Select value={q.correctAnswer} onValueChange={v => updateQuestion(index, { correctAnswer: v })}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn đáp án đúng" /></SelectTrigger>
                        <SelectContent>
                            {q.options?.map((opt, optIndex) => opt && <SelectItem key={optIndex} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input value={q.correctAnswer} onChange={e => updateQuestion(index, { correctAnswer: e.target.value })} placeholder="Nhập đáp án đúng" className="rounded-xl"/>
                )}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between items-center">
        <Button onClick={addQuestion} variant="outline" className="rounded-full py-6"><Plus className="mr-2" /> Thêm câu hỏi</Button>
        <div className="flex gap-4">
            <Button onClick={onCancel} variant="ghost" className="rounded-full py-6">Hủy</Button>
            <Button onClick={handleSave} className="rounded-full py-6 px-8 text-lg font-bold">Lưu bài tập</Button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentForm;
