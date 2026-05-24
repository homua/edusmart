
"use client";

import React from 'react';
import type { Assignment, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SubmissionReviewProps {
  assignment: Assignment;
  submission: Submission;
  onBack: () => void;
}

const SubmissionReview: React.FC<SubmissionReviewProps> = ({ assignment, submission, onBack }) => {
  const totalPoints = assignment.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" className="rounded-full py-6 px-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <div className="flex-grow text-right">
          <h1 className="text-3xl font-black text-foreground">Xem lại bài: {assignment.title}</h1>
          <p className="text-muted-foreground font-bold">Điểm số: <span className="text-primary text-xl">{submission.score} / {totalPoints}</span></p>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)] w-full rounded-3xl pr-4">
        <div className="space-y-6 pb-10">
          {assignment.questions.map((q, index) => {
            const studentAnswer = submission.answers.find(a => a.questionId === q.id);
            const isCorrect = studentAnswer?.answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
            
            return (
              <Card key={q.id} className="rounded-3xl shadow-lg shadow-primary/5 border-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Câu {index + 1}: {q.text}</CardTitle>
                  <CardDescription className="font-bold text-primary">{q.points} điểm</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-accent/10 border-accent/20' : 'bg-destructive/5 border-destructive/10'}`}>
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-widest">Câu trả lời của bạn</p>
                      <div className="flex items-center gap-2">
                        {isCorrect ? <CheckCircle className="text-accent h-5 w-5" /> : <XCircle className="text-destructive h-5 w-5" />}
                        <p className={`font-black ${isCorrect ? 'text-accent' : 'text-destructive'}`}>
                          {studentAnswer?.answer || '(Chưa trả lời)'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-primary/60 mb-2 tracking-widest">Đáp án đúng</p>
                      <p className="font-black text-primary">{q.correctAnswer}</p>
                    </div>
                  </div>
                  {q.type === 'MULTIPLE_CHOICE' && q.options && q.options.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {q.options?.map((opt, i) => (
                        <div 
                          key={i} 
                          className={`px-3 py-1 rounded-full text-[10px] border font-bold uppercase tracking-tighter ${
                            opt === q.correctAnswer 
                              ? 'bg-primary/10 border-primary text-primary' 
                              : opt === studentAnswer?.answer 
                                ? 'bg-destructive/10 border-destructive text-destructive' 
                                : 'bg-muted border-transparent text-muted-foreground'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SubmissionReview;
