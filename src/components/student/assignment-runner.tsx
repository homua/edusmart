"use client";

import React, { useState } from 'react';
import type { Assignment, Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
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

  const handleSubmit = () => {
    if(Object.keys(answers).length !== totalQuestions){
        if(!window.confirm("Bạn chưa trả lời hết câu hỏi. Bạn có chắc muốn nộp bài không?")) {
            return;
        }
    }
    
    let score = 0;
    const submissionAnswers = assignment.questions.map(q => {
      const studentAnswer = answers[q.id] || '';
      if (studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        score += q.points;
      }
      return { questionId: q.id, answer: studentAnswer };
    });

    const newSubmission: Submission = {
      id: `sub_${assignment.id}_${studentId}`,
      assignmentId: assignment.id,
      studentId,
      studentName,
      answers: submissionAnswers,
      score,
      isGraded: true, // Auto-graded
      submittedAt: new Date().toISOString(),
    };

    onSubmit(newSubmission);
    toast({ title: 'Nộp bài thành công!', description: `Điểm của bạn là ${score}.` });
  };
  
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-black text-foreground">{assignment.title}</h1>
        <p className="text-muted-foreground">Câu {currentQuestionIndex + 1} / {totalQuestions}</p>
      </div>

      <Progress value={progress} />

      <Card className="rounded-3xl shadow-lg shadow-primary/5 min-h-[300px]">
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
          <CardDescription>{currentQuestion.points} điểm</CardDescription>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === 'MULTIPLE_CHOICE' ? (
            <RadioGroup
              value={answers[currentQuestion.id]}
              onValueChange={(val) => handleAnswerChange(currentQuestion.id, val)}
              className="space-y-2"
            >
              {currentQuestion.options?.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2 p-4 rounded-lg border has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                  <RadioGroupItem value={opt} id={`q${currentQuestion.id}-opt${i}`} />
                  <Label htmlFor={`q${currentQuestion.id}-opt${i}`} className="text-base flex-grow cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Nhập câu trả lời của bạn..."
              className="min-h-[150px] rounded-xl text-lg"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button onClick={onCancel} variant="ghost" className="rounded-full">Thoát</Button>
        <div className="flex gap-2">
          <Button onClick={handlePrev} variant="outline" disabled={currentQuestionIndex === 0} className="rounded-full">
            <ArrowLeft className="mr-2" /> Câu trước
          </Button>
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button onClick={handleNext} className="rounded-full">
              Câu sau <ArrowRight className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
              <Check className="mr-2" /> Nộp bài
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentRunner;
