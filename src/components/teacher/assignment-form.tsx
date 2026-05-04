
"use client";

import React, { useState, useEffect } from 'react';
import { QuestionType, type Class, type Question, type Assignment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft, ChevronDown, Bot, AlertCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { generateQuestionsAI, type GenerateQuestionsInput } from '@/ai/flows/generate-questions-flow';

interface AssignmentFormProps {
  teacherId: string;
  classes: Class[];
  onSave: (assignment: Assignment) => Promise<void>;
  onCancel: () => void;
  assignmentToEdit?: Assignment | null;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ teacherId, classes, onSave, onCancel, assignmentToEdit }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classIds, setClassIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // AI Generation State
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Trung bình');
  const [aiQuestionType, setAiQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [aiQuestionCount, setAiQuestionCount] = useState(3);

  useEffect(() => {
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title);
      setSubject(assignmentToEdit.subject);
      setClassIds(assignmentToEdit.classIds);
      setQuestions(assignmentToEdit.questions);
      setStartDate(assignmentToEdit.startDate ? assignmentToEdit.startDate.slice(0, 16) : '');
      setEndDate(assignmentToEdit.endDate ? assignmentToEdit.endDate.slice(0, 16) : '');
    }
  }, [assignmentToEdit]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: QuestionType.TEXT,
      options: [],
      correctAnswer: '',
      points: 1,
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
  
  const validateAndGetIsoDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString();
  };

  const handleSave = async () => {
    if (!title || !subject || classIds.length === 0 || questions.length === 0) {
      toast({ variant: 'destructive', description: 'Vui lòng điền nội dung bài tập, môn học, chọn lớp và thêm ít nhất một câu hỏi.' });
      return;
    }
    
    const formattedStartDate = validateAndGetIsoDate(startDate);
    const formattedEndDate = validateAndGetIsoDate(endDate);

    const assignmentData: Assignment = {
      id: assignmentToEdit ? assignmentToEdit.id : `asg_${Date.now()}`,
      title,
      subject,
      teacherId,
      classIds,
      questions,
      createdAt: assignmentToEdit ? assignmentToEdit.createdAt : new Date().toISOString(),
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    };
    
    try {
      await onSave(assignmentData);
      toast({ title: "Thành công!", description: assignmentToEdit ? "Đã cập nhật bài tập." : "Đã tạo bài tập mới." });
    } catch (error) {
      // Errors are handled by the non-blocking infrastructure
    }
  };
  
  const handleGenerateQuestions = async () => {
    if (!title || !subject) {
      toast({ variant: 'destructive', description: 'Vui lòng nhập nội dung bài tập và môn học trước khi tạo bằng AI.' });
      return;
    }
    setIsGenerating(true);
    try {
      const input: GenerateQuestionsInput = {
        title: title,
        subject: subject,
        difficulty: aiDifficulty,
        questionType: aiQuestionType,
        count: aiQuestionCount,
      };
      const newQuestions = await generateQuestionsAI(input);
      setQuestions(prev => [...prev, ...newQuestions]);
      toast({ 
        title: 'Thành công!', 
        description: `Đã tạo ${newQuestions.length} câu hỏi bằng AI.` 
      });
      setAiModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tạo câu hỏi bằng AI.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedClassesText = classIds.length > 0
    ? classes
        .filter(c => classIds.includes(c.id))
        .map(c => c.name)
        .join(', ')
    : "Chọn một hoặc nhiều lớp...";

  const pointOptions = [0.25, 0.5, 1, 2, 3, 4, 5];

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Button onClick={onCancel} variant="outline" size="icon" className="h-12 w-12 rounded-full"><ArrowLeft /></Button>
        <div>
          <h1 className="text-3xl font-black text-foreground">{assignmentToEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}</h1>
          <p className="text-muted-foreground">{assignmentToEdit ? 'Cập nhật câu hỏi và chi tiết bài tập.' : 'Soạn câu hỏi và giao bài cho lớp của bạn.'}</p>
        </div>
      </div>

      <Card className="rounded-3xl shadow-lg shadow-primary/5">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-lg font-bold">Nội dung bài tập</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Phân tích nhân vật Dế Mèn" className="py-6 text-lg rounded-xl"/>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-lg font-bold">Môn học</Label>
              <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="subject" className="py-6 text-lg rounded-xl">
                      <SelectValue placeholder="Chọn môn học" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Toán">Toán</SelectItem>
                      <SelectItem value="Văn">Văn</SelectItem>
                      <SelectItem value="Tiếng Anh">Tiếng Anh</SelectItem>
                      <SelectItem value="Khoa học Tự nhiên">Khoa học Tự nhiên</SelectItem>
                      <SelectItem value="Lịch sử và Địa lí">Lịch sử và Địa lí</SelectItem>
                      <SelectItem value="Giáo dục công dân">Giáo dục công dân</SelectItem>
                      <SelectItem value="Công nghệ">Công nghệ</SelectItem>
                      <SelectItem value="Tin học">Tin học</SelectItem>
                      <SelectItem value="Âm nhạc">Âm nhạc</SelectItem>
                  </SelectContent>
              </Select>
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
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/20 rounded-3xl border border-border/50">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold"><Calendar className="w-4 h-4 text-primary"/> Thời gian bắt đầu</Label>
              <Input 
                type="datetime-local" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground italic">Để trống nếu muốn bắt đầu ngay lập tức</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold"><Calendar className="w-4 h-4 text-destructive"/> Thời gian kết thúc</Label>
              <Input 
                type="datetime-local" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground italic">Để trống nếu không giới hạn thời gian</p>
            </div>
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
              <Textarea value={q.text} onChange={e => updateQuestion(index, { text: e.target.value })} placeholder="Nhập nội dung câu hỏi..." className="min-h-[120px] rounded-xl"/>
            </div>
            <div className="space-y-2">
                <Label>Loại câu hỏi</Label>
                <Select value={q.type} onValueChange={(v) => updateQuestion(index, { type: v as QuestionType })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TEXT">Tự luận</SelectItem>
                        <SelectItem value="MULTIPLE_CHOICE">Trắc nghiệm</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>Điểm</Label>
                <Select 
                  value={q.points.toString()} 
                  onValueChange={(v) => updateQuestion(index, { points: parseFloat(v) })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Chọn mức điểm" />
                  </SelectTrigger>
                  <SelectContent>
                    {pointOptions.map(p => (
                      <SelectItem key={p} value={p.toString()}>{p.toString().replace('.', ',')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-4 col-span-2">
                <Label>Các lựa chọn</Label>
                {q.options?.map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <Input value={opt} onChange={e => {
                        const newOptions = [...(q.options || [])];
                        newOptions[optIndex] = e.target.value;
                        updateQuestion(index, { options: newOptions });
                    }} placeholder={`Lựa chọn ${optIndex + 1}`} className="rounded-xl" />
                     <Button variant="ghost" size="icon" onClick={() => {
                        const newOptions = [...(q.options || [])];
                        newOptions.splice(optIndex, 1);
                        updateQuestion(index, { options: newOptions });
                     }} className="text-muted-foreground hover:text-destructive rounded-full"><Trash2 className="w-4 h-4" /></Button>
                  </div>
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
        <div className="flex gap-2">
          <Button onClick={addQuestion} variant="outline" className="rounded-full py-6"><Plus className="mr-2" /> Thêm câu hỏi</Button>
          <Dialog open={isAiModalOpen} onOpenChange={setAiModalOpen}>
              <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full py-6"><Bot className="mr-2" /> Soạn bằng AI</Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Soạn câu hỏi bằng AI</DialogTitle>
                      <DialogDescription>AI sẽ tự động tạo câu hỏi dựa trên tiêu đề bài tập.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                      <div className="space-y-2">
                          <Label>Độ khó</Label>
                          <Select value={aiDifficulty} onValueChange={(v) => setAiDifficulty(v as any)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Dễ">Dễ</SelectItem>
                                  <SelectItem value="Trung bình">Trung bình</SelectItem>
                                  <SelectItem value="Khó">Khó</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label>Số lượng</Label>
                          <Input type="number" value={aiQuestionCount} onChange={e => setAiQuestionCount(parseInt(e.target.value) || 1)} min="1" max="10"/>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button variant="ghost" onClick={() => setAiModalOpen(false)}>Hủy</Button>
                      <Button onClick={handleGenerateQuestions} disabled={isGenerating || !subject || !title}>
                          {isGenerating ? "Đang tạo..." : "Tạo ngay"}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        </div>
        <div className="flex gap-4">
            <Button onClick={onCancel} variant="ghost" className="rounded-full py-6">Hủy</Button>
            <Button onClick={handleSave} className="rounded-full py-6 px-8 text-lg font-bold">Lưu bài tập</Button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentForm;
