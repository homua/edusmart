"use client";

import type { User, Assignment, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, FileText } from 'lucide-react';

interface StudentPortalProps {
  currentUser: User;
  assignments: Assignment[];
  submissions: Submission[];
  onStart: (assignment: Assignment) => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  assignments,
  submissions,
  onStart,
}) => {

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions.find(s => s.assignmentId === assignmentId);
    if (submission) {
      return { submitted: true, score: submission.score };
    }
    return { submitted: false, score: null };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-foreground">Chào mừng, {currentUser.fullName}!</h1>
        <p className="text-muted-foreground">Đây là danh sách các bài tập của bạn.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length > 0 ? assignments.map(assignment => {
          const { submitted, score } = getSubmissionStatus(assignment.id);
          const totalPoints = assignment.questions.reduce((sum, q) => sum + q.points, 0);

          return (
            <Card key={assignment.id} className="rounded-3xl shadow-lg shadow-primary/5 flex flex-col">
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {assignment.questions.length} câu hỏi
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 {submitted ? (
                  <div className='p-4 rounded-xl bg-accent/20 text-accent-foreground'>
                    <div className="flex items-center gap-2 font-bold"><CheckCircle /> Đã nộp bài</div>
                    <p className="mt-2 text-sm">Điểm số của bạn: <span className="font-black text-xl">{score} / {totalPoints}</span></p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Bạn chưa nộp bài tập này.</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <Badge variant={submitted ? "default" : "secondary"} className={submitted ? "bg-accent text-accent-foreground" : ""}>
                  {submitted ? 'Đã hoàn thành' : 'Chưa làm'}
                </Badge>
                {!submitted && (
                  <Button onClick={() => onStart(assignment)} className="rounded-full">
                    <PlayCircle className="mr-2" /> Làm bài
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        }) : (
           <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-muted/50 rounded-3xl">
            <h3 className="text-xl font-bold text-muted-foreground">Tuyệt vời!</h3>
            <p className="text-muted-foreground">Bạn đã hoàn thành tất cả bài tập.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortal;
