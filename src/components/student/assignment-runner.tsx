
"use client";

import React, { useState } from 'react';
import type { Assignment, Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssignmentRunnerProps {
  assignment: Assignment;
  studentId: string;
  studentName: string;
  onSubmit: (submission: Submission) => Promise<void>;
  onCancel: () => void;
}

const AssignmentRunner: React.FC<AssignmentRunnerProps> = ({
  assignment,
  studentId,
  studentName,
  onSubmit,
  onCancel,
}) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const totalQuestions = assignment.questions.length;
  const currentQuestion = assignment.questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (Object.keys(answers).length < totalQuestions) {
      if (!window.confirm("Bạn chưa trả lời hết các câu hỏi. Bạn có chắc chắn muốn nộp bài không?")) {
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      let score = 0;
      const submissionAnswers = assignment.questions.map(q => {
        const studentAnswer = answers[q.id] || '';
        // Basic grading for multiple choice
        if (q.type === 'MULTIPLE_CHOICE') {
          if (studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            score += q.points;
          }
        } else {
          // For text, we can't auto-grade perfectly, but we'll assign points if it's not empty for now
          // or rely on exact match if available. MVP logic: exact match.
          if (studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            score += q.points;
          }
        }
        return { questionId: q.id, answer: studentAnswer };
      });

      const submissionId = `sub_${assignment.id}_${studentId}`;
      const newSubmission: Submission = {
        id: submissionId,
        assignmentId: assignment.id,
        studentId,
        studentName,
        answers: submissionAnswers,
        score: parseFloat(score.toFixed(2)),
        isGraded: true,
        submittedAt: new Date().toISOString(),
      };

      await onSubmit(newSubmission);
      
      toast({ 
        title: 'Nộp bài thành công!', 
        description: `Bạn đã hoàn thành bài tập. Điểm số: ${newSubmission.score}` 
      });
    } catch (error) {
      // Error is already emitted by non-blocking-updates, but we need to reset state
      setIsSubmitting(false);
    }
  };
  
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="text-center">
        <h1 className="text-3xl font-black text-foreground">{assignment.title}</h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-2">
          Môn: {assignment.subject} • Câu {currentQuestionIndex + 1} / {totalQuestions}
        </p>
      </div>

      <Progress value={progress} className="h-3" />

      <Card className="rounded-3xl shadow-lg shadow-primary/5 min-h-[350px] border-primary/10">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl leading-relaxed">{currentQuestion.text}</CardTitle>
            <Badge variant="secondary" className="ml-4 whitespace-nowrap">{currentQuestion.points} điểm</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === 'MULTIPLE_CHOICE' ? (
            <RadioGroup
              value={answers[currentQuestion.id]}
              onValueChange={(val) => handleAnswerChange(currentQuestion.id, val)}
              className="grid gap-3"
            >
              {currentQuestion.options?.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2 p-4 rounded-2xl border-2 border-muted hover:border-primary/30 has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value={opt} id={`q${currentQuestion.id}-opt${i}`} />
                  <Label htmlFor={`q${currentQuestion.id}-opt${i}`} className="text-base flex-grow cursor-pointer font-medium">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Nhập câu trả lời của bạn tại đây..."
              className="min-h-[180px] rounded-2xl text-lg p-6 bg-muted/30 border-2 focus:border-primary transition-all"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center bg-background/80 backdrop-blur-sm p-4 rounded-3xl border border-primary/10 shadow-lg">
        <Button onClick={onCancel} variant="ghost" className="rounded-full px-6" disabled={isSubmitting}>
          Thoát
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrev} variant="outline" disabled={currentQuestionIndex === 0 || isSubmitting} className="rounded-full px-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Câu trước
          </Button>
          
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button onClick={handleNext} className="rounded-full px-8 font-bold" disabled={isSubmitting}>
              Câu sau <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-10 font-black shadow-lg shadow-accent/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang nộp...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Nộp bài
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentRunner;
