
"use client";

import React, { useState } from 'react';
import type { Assignment, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Save, Loader2, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ReportViewProps {
  assignment: Assignment;
  submissions: Submission[];
  onBack: () => void;
  onUpdateSubmission: (submission: Submission) => Promise<void>;
}

const ReportView: React.FC<ReportViewProps> = ({ assignment, submissions, onBack, onUpdateSubmission }) => {
  const { toast } = useToast();
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const totalPoints = assignment.questions.reduce((sum, q) => sum + q.points, 0);

  const handleStartGrading = (sub: Submission) => {
    setGradingSubmission(JSON.parse(JSON.stringify(sub))); // Deep clone for local editing
  };

  const handlePointChange = (questionId: string, value: string) => {
    if (!gradingSubmission) return;
    
    const points = parseFloat(value) || 0;
    const updatedAnswers = gradingSubmission.answers.map(a => 
      a.questionId === questionId ? { ...a, awardedPoints: points } : a
    );
    
    // Recalculate total score
    const newTotalScore = updatedAnswers.reduce((sum, a) => sum + (a.awardedPoints || 0), 0);
    
    setGradingSubmission({
      ...gradingSubmission,
      answers: updatedAnswers,
      score: parseFloat(newTotalScore.toFixed(2))
    });
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission) return;
    setIsSaving(true);
    try {
      await onUpdateSubmission({
        ...gradingSubmission,
        isGraded: true
      });
      toast({ title: "Thành công", description: `Đã chấm điểm cho học sinh ${gradingSubmission.studentName}.` });
      setGradingSubmission(null);
    } catch (error) {
      toast({ variant: 'destructive', title: "Lỗi", description: "Không thể lưu điểm." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" className="rounded-full py-6 px-4 border-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-black text-foreground">Báo cáo: {assignment.title}</h1>
          <p className="text-muted-foreground font-medium">Môn: {assignment.subject} • Tổng: {totalPoints} điểm • {submissions.length} bài nộp</p>
        </div>
      </div>

      <Card className="rounded-3xl shadow-lg shadow-primary/5 border-primary/10 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-xl">Danh sách kết quả</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-6 font-bold uppercase tracking-widest text-[10px]">Học sinh</TableHead>
                <TableHead className="px-6 font-bold uppercase tracking-widest text-[10px]">Ngày nộp</TableHead>
                <TableHead className="px-6 font-bold uppercase tracking-widest text-[10px]">Trạng thái</TableHead>
                <TableHead className="px-6 text-right font-bold uppercase tracking-widest text-[10px]">Điểm số</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map(sub => (
                <TableRow key={sub.id} className="hover:bg-primary/5 transition-colors">
                  <TableCell className="px-6 py-4 font-black">{sub.studentName}</TableCell>
                  <TableCell className="px-6 py-4 text-xs font-medium text-muted-foreground">
                    {format(parseISO(sub.submittedAt), "HH:mm, dd/MM/yyyy", { locale: vi })}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {sub.isGraded ? (
                      <Badge className="bg-accent/10 text-accent border-none text-[10px] uppercase font-black">Đã chấm</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black">Chờ chấm điểm</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <span className="font-black text-lg text-primary">{sub.score}</span>
                    <span className="text-muted-foreground font-medium ml-1">/ {totalPoints}</span>
                  </TableCell>
                </TableRow>
              ))}
              {submissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">Chưa có học sinh nào nộp bài.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <div className="flex items-center gap-2">
           <Info className="w-5 h-5 text-primary" />
           <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Chi tiết bài làm & Chấm điểm</h3>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {submissions.map(sub => {
            const isEditing = gradingSubmission?.id === sub.id;
            const currentSub = isEditing ? gradingSubmission : sub;

            return (
              <AccordionItem value={sub.id} key={sub.id} className="border-2 rounded-3xl px-6 bg-card shadow-sm border-transparent hover:border-primary/20 transition-all data-[state=open]:border-primary data-[state=open]:shadow-md overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex justify-between items-center w-full pr-6 text-left">
                    <div>
                      <span className="font-black text-lg">{sub.studentName}</span>
                      <div className="flex gap-2 mt-1">
                        {!sub.isGraded && <Badge variant="secondary" className="text-[9px] uppercase font-black bg-primary/10 text-primary">Cần review tự luận</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-primary">{sub.score} / {totalPoints}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{sub.isGraded ? 'Đã hoàn thành' : 'Đang chấm điểm'}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-8 space-y-6 border-t pt-6">
                  {assignment.questions.map((q, index) => {
                    const studentAnswer = currentSub.answers.find(a => a.questionId === q.id);
                    const isCorrect = q.type === 'MULTIPLE_CHOICE' && studentAnswer?.answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                    
                    return (
                      <div key={q.id} className="p-6 bg-muted/20 rounded-2xl border border-border/50 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <p className="font-black text-foreground flex-1">
                            {index + 1}. {q.text}
                          </p>
                          <div className="flex flex-col items-end gap-2">
                             <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                               Tối đa: {q.points}đ
                             </Badge>
                             {isEditing ? (
                               <div className="flex items-center gap-2">
                                  <Label className="text-[10px] font-black uppercase">Điểm đạt:</Label>
                                  <Input 
                                    type="number" 
                                    step="0.25"
                                    max={q.points}
                                    min="0"
                                    className="w-20 h-8 rounded-lg font-black text-center"
                                    value={studentAnswer?.awardedPoints || 0}
                                    onChange={(e) => handlePointChange(q.id, e.target.value)}
                                  />
                               </div>
                             ) : (
                               <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-sm">
                                 {studentAnswer?.awardedPoints || 0}đ
                               </Badge>
                             )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-background/50 rounded-xl border border-border/30">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-widest">Đáp án đúng / Gợi ý</p>
                            <p className="font-bold text-primary leading-relaxed">{q.correctAnswer}</p>
                          </div>
                          
                          <div className={`p-4 rounded-xl border ${q.type === 'MULTIPLE_CHOICE' ? (isCorrect ? 'bg-accent/10 border-accent/20' : 'bg-destructive/5 border-destructive/10') : 'bg-primary/5 border-primary/10'}`}>
                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-widest flex items-center justify-between">
                              <span>Bài làm của học sinh</span>
                              {q.type === 'MULTIPLE_CHOICE' && (
                                isCorrect ? <CheckCircle className="h-4 w-4 text-accent" /> : <XCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                            <p className={`font-black text-foreground whitespace-pre-wrap leading-relaxed`}>
                              {studentAnswer?.answer || '(Không có câu trả lời)'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
                    <Label className="font-black text-primary uppercase tracking-widest text-[10px]">Nhận xét của giáo viên</Label>
                    {isEditing ? (
                      <Textarea 
                        placeholder="Nhập nhận xét cho học sinh..."
                        className="rounded-xl min-h-[100px] bg-background"
                        value={gradingSubmission.feedback || ''}
                        onChange={(e) => setGradingSubmission({ ...gradingSubmission, feedback: e.target.value })}
                      />
                    ) : (
                      <p className="italic text-muted-foreground font-medium p-4 bg-background/50 rounded-xl border border-border/30 min-h-[60px]">
                        {sub.feedback || "Chưa có nhận xét."}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 gap-3">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" className="rounded-xl px-8" onClick={() => setGradingSubmission(null)}>Hủy bỏ</Button>
                        <Button className="rounded-xl px-10 font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20" onClick={handleSaveGrade} disabled={isSaving}>
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Lưu kết quả chấm
                        </Button>
                      </>
                    ) : (
                      <Button className="rounded-xl px-10 font-bold shadow-lg shadow-primary/20" onClick={() => handleStartGrading(sub)}>
                        Chỉnh sửa / Chấm điểm
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
};

export default ReportView;
