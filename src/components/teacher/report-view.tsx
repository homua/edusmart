
"use client";

import type { Assignment, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ReportViewProps {
  assignment: Assignment;
  submissions: Submission[];
  onBack: () => void;
  onUpdateSubmission: (submission: Submission) => Promise<void>;
}

const ReportView: React.FC<ReportViewProps> = ({ assignment, submissions, onBack }) => {
  const totalPoints = assignment.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" className="rounded-full py-6 px-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-black text-foreground">Báo cáo: {assignment.title}</h1>
          <p className="text-muted-foreground">Tổng điểm: {totalPoints}. Có {submissions.length} bài nộp.</p>
        </div>
      </div>

      <Card className="rounded-3xl shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Kết quả của học sinh</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học sinh</TableHead>
                <TableHead>Ngày nộp</TableHead>
                <TableHead className="text-right">Điểm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.studentName}</TableCell>
                  <TableCell>{format(parseISO(sub.submittedAt), "HH:mm, dd/MM/yyyy", { locale: vi })}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{sub.score} / {totalPoints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card className="rounded-3xl shadow-lg shadow-primary/5">
         <CardHeader>
          <CardTitle>Xem chi tiết từng bài</CardTitle>
          <CardDescription>Mở rộng để xem câu trả lời của mỗi học sinh.</CardDescription>
        </CardHeader>
        <CardContent>
           <Accordion type="single" collapsible className="w-full">
            {submissions.map(sub => (
              <AccordionItem value={sub.id} key={sub.id}>
                <AccordionTrigger className="font-bold text-lg">{sub.studentName} - {sub.score} điểm</AccordionTrigger>
                <AccordionContent className="space-y-4 p-4 bg-muted/20 rounded-2xl">
                  {assignment.questions.map((q, index) => {
                    const studentAnswer = sub.answers.find(a => a.questionId === q.id);
                    const isCorrect = studentAnswer?.answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                    return (
                        <div key={q.id} className="p-5 bg-card rounded-2xl shadow-sm border border-border/50">
                            <p className="font-black text-foreground mb-4">{index + 1}. {q.text} <span className="text-muted-foreground font-normal ml-2">({q.points} điểm)</span></p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-3 bg-muted/30 rounded-xl border border-border/30">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Đáp án đúng</p>
                                <p className="font-bold text-primary">{q.correctAnswer}</p>
                              </div>
                              
                              <div className={`p-3 rounded-xl border ${isCorrect ? 'bg-accent/10 border-accent/20' : 'bg-destructive/5 border-destructive/10'}`}>
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest flex items-center justify-between">
                                  Học sinh trả lời
                                  {isCorrect ? <CheckCircle className="h-3 w-3 text-accent" /> : <XCircle className="h-3 w-3 text-destructive" />}
                                </p>
                                <p className={`font-black ${isCorrect ? 'text-accent' : 'text-destructive'}`}>
                                  {studentAnswer?.answer || 'Chưa trả lời'}
                                </p>
                              </div>
                            </div>
                        </div>
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportView;
