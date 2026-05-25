
"use client";

import type { User, Assignment, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, FileText, Search, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';

interface StudentPortalProps {
  currentUser: User;
  assignments: Assignment[];
  submissions: Submission[];
  onStart: (assignment: Assignment) => void;
  onReview: (assignment: Assignment, submission: Submission) => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  assignments,
  submissions,
  onStart,
  onReview,
}) => {

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions.find(s => s.assignmentId === assignmentId);
    if (submission) {
      return { submitted: true, submission };
    }
    return { submitted: false, submission: null };
  };

  const getTimeStatus = (assignment: Assignment) => {
    const now = new Date();
    const start = assignment.startDate ? parseISO(assignment.startDate) : null;
    const end = assignment.endDate ? parseISO(assignment.endDate) : null;

    if (start && isBefore(now, start)) {
      return { status: 'NOT_STARTED', message: `Bắt đầu: ${format(start, "HH:mm, dd/MM", { locale: vi })}` };
    }
    if (end && isAfter(now, end)) {
      return { status: 'EXPIRED', message: `Đã hết hạn: ${format(end, "HH:mm, dd/MM", { locale: vi })}` };
    }
    return { status: 'ACTIVE', message: end ? `Hết hạn: ${format(end, "HH:mm, dd/MM", { locale: vi })}` : 'Không giới hạn thời gian' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-foreground">Chào mừng, {currentUser.fullName}!</h1>
        <p className="text-muted-foreground">Đây là danh sách các bài tập của bạn.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length > 0 ? assignments.map(assignment => {
          const { submitted, submission } = getSubmissionStatus(assignment.id);
          const { status, message } = getTimeStatus(assignment);
          const totalPoints = assignment.questions.reduce((sum, q) => sum + q.points, 0);

          return (
            <Card key={assignment.id} className="rounded-3xl shadow-lg shadow-primary/5 flex flex-col overflow-hidden border-primary/10">
              <CardHeader>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-tighter font-black">
                    Môn: {assignment.subject}
                  </Badge>
                  {submitted ? (
                    <Badge className="bg-accent text-accent-foreground text-[10px] uppercase font-black">Hoàn thành</Badge>
                  ) : status === 'NOT_STARTED' ? (
                    <Badge variant="secondary" className="text-[10px] uppercase font-black">Chưa đến giờ</Badge>
                  ) : status === 'EXPIRED' ? (
                    <Badge variant="destructive" className="text-[10px] uppercase font-black">Đã kết thúc</Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px] uppercase font-black">Đang diễn ra</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{assignment.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-primary" /> {assignment.questions.length} câu
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" /> {message}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 {submitted ? (
                  <div className='p-4 rounded-2xl bg-accent/10 border border-accent/20 text-accent-foreground'>
                    <div className="flex items-center gap-2 font-bold text-sm"><CheckCircle className="w-4 h-4" /> Đã nộp bài</div>
                    {submission?.isGraded ? (
                      <p className="mt-2 text-xs font-medium opacity-80">Điểm số: <span className="text-lg font-black">{submission?.score} / {totalPoints}</span></p>
                    ) : (
                      <p className="mt-2 text-xs font-medium opacity-80 italic">Đây là câu hỏi tự luận, vì vậy hãy chờ giáo viên chấm</p>
                    )}
                  </div>
                ) : status === 'NOT_STARTED' ? (
                  <div className='p-4 rounded-2xl bg-muted text-muted-foreground flex items-center gap-2'>
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs font-medium">Bài tập chưa đến giờ làm. Vui lòng quay lại sau.</p>
                  </div>
                ) : status === 'EXPIRED' ? (
                   <div className='p-4 rounded-2xl bg-destructive/5 text-destructive flex items-center gap-2 border border-destructive/10'>
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs font-medium">Đã quá thời gian nộp bài.</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-medium px-1">Bạn chưa nộp bài tập này. Hãy hoàn thành đúng hạn nhé!</p>
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 flex justify-end">
                {submitted ? (
                   <Button onClick={() => onReview(assignment, submission!)} variant="outline" className="rounded-xl w-full">
                    <Search className="mr-2 w-4 h-4" /> Xem lại bài
                  </Button>
                ) : (
                  <Button 
                    onClick={() => onStart(assignment)} 
                    className="rounded-xl w-full font-bold"
                    disabled={status !== 'ACTIVE'}
                  >
                    <PlayCircle className="mr-2 w-4 h-4" /> 
                    {status === 'NOT_STARTED' ? 'Chưa bắt đầu' : status === 'EXPIRED' ? 'Đã hết hạn' : 'Bắt đầu làm bài'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        }) : (
           <div className="md:col-span-2 lg:col-span-3 text-center py-24 bg-muted/30 rounded-3xl border-2 border-dashed border-muted-foreground/20">
            <h3 className="text-xl font-bold text-muted-foreground">Chưa có bài tập nào</h3>
            <p className="text-muted-foreground mt-1">Chúc mừng! Bạn đã hoàn thành mọi thứ được giao.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortal;
