
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import * as XLSX from 'xlsx';

import { UserRole, type View, type Assignment, type Submission, type User, type Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/lib/db';

import { parseStudentListAI } from '@/ai/flows/parse-student-list';
import { slugify } from '@/lib/utils';
import LoadingScreen from '@/components/loading-screen';
import Header from '@/components/header';
import LandingPage from '@/components/landing-page';
import AuthForm from '@/components/auth-form';
import AdminDashboard from '@/components/admin/admin-dashboard';
import TeacherDashboard from '@/components/teacher/teacher-dashboard';
import AssignmentForm from '@/components/teacher/assignment-form';
import ReportView from '@/components/teacher/report-view';
import ClassRoster from '@/components/teacher/class-roster';
import StudentPortal from '@/components/student/student-portal';
import AssignmentRunner from '@/components/student/assignment-runner';
import SubmissionReview from '@/components/student/submission-review';

const MainApp: React.FC = () => {
  const { firestore, auth } = useFirebase();
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);

  const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, COLLECTIONS.USERS) : null, [firestore]);
  const classesCollection = useMemoFirebase(() => firestore ? collection(firestore, COLLECTIONS.CLASSES) : null, [firestore]);
  const assignmentsCollection = useMemoFirebase(() => firestore ? collection(firestore, COLLECTIONS.ASSIGNMENTS) : null, [firestore]);
  const submissionsCollection = useMemoFirebase(() => firestore ? collection(firestore, COLLECTIONS.SUBMISSIONS) : null, [firestore]);

  const { data: usersData, isLoading: usersLoading } = useCollection<User>(usersCollection);
  const { data: classesData, isLoading: classesLoading } = useCollection<Class>(classesCollection);
  const { data: assignmentsData, isLoading: assignmentsLoading } = useCollection<Assignment>(assignmentsCollection);
  const { data: submissionsData, isLoading: submissionsLoading } = useCollection<Submission>(submissionsCollection);
  
  const users = usersData || [];
  const classes = classesData || [];
  const assignments = assignmentsData || [];
  const submissions = submissionsData || [];

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [view, setView] = useState<View>('HOME');
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  
  const isLoading = usersLoading || classesLoading || assignmentsLoading || submissionsLoading || isAuthUserLoading;

  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => setIsInitialLoad(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (auth && !auth.currentUser) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth]);
  
  const saveData = useCallback(async (collectionName: string, id: string, data: any) => {
    if (!firestore) return;
    const docRef = doc(firestore, collectionName, id);
    return setDocumentNonBlocking(docRef, data, { merge: true });
  }, [firestore]);

  // Initial Admin creation - only if needed and not already creating
  useEffect(() => {
    if (!usersLoading && !isAuthUserLoading && authUser && firestore && users.length === 0 && isInitialLoad) {
      const adminId = authUser.uid;
      const adminUser: User = { id: adminId, username: 'admin', password: 'admin123', fullName: 'Quản trị viên', role: UserRole.ADMIN };
      const docRef = doc(firestore, COLLECTIONS.USERS, adminId);
      setDocumentNonBlocking(docRef, adminUser, { merge: true });
    }
  }, [usersLoading, isAuthUserLoading, authUser, firestore, users.length, isInitialLoad]);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('edu_session_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      localStorage.removeItem('edu_session_user');
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      if (view !== 'AUTH' && view !== 'HOME') {
        setView('HOME');
      }
      localStorage.removeItem('edu_session_user');
    } else {
      localStorage.setItem('edu_session_user', JSON.stringify(currentUser));
      if (view === 'HOME' || view === 'AUTH') {
          if (currentUser.role === UserRole.ADMIN) setView('ADMIN_DASHBOARD');
          else if (currentUser.role === UserRole.TEACHER) setView('TEACHER_DASHBOARD');
          else setView('STUDENT_PORTAL');
      }
    }
  }, [currentUser, view]);

  const handleLogin = (user: User) => {
    const userForSession = { ...user };
    delete userForSession.password;
    setCurrentUser(userForSession);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('HOME');
  };
  
  const navigate = (newView: View, data?: any) => {
    if (newView === 'AUTH' && currentUser) return;
    if (newView === 'CREATE_ASSIGNMENT') {
      setCurrentAssignment(null);
    } else if (newView === 'VIEW_SUBMISSION' && data) {
      setCurrentAssignment(data.assignment);
      setCurrentSubmission(data.submission);
    } else if (data) {
      setCurrentAssignment(data);
    }
    setView(newView);
  }

  const handleExportData = () => {
    const wb = XLSX.utils.book_new();
    const usersExport = users.map(u => ({ ...u }));
    const classesExport = classes.map(c => ({ 
      ...c, 
      teacherIds: JSON.stringify(c.teacherIds || []) 
    }));
    const assignmentsExport = assignments.map(a => ({
      ...a,
      classIds: JSON.stringify(a.classIds),
      questions: JSON.stringify(a.questions)
    }));
    const submissionsExport = submissions.map(s => ({
      ...s,
      answers: JSON.stringify(s.answers)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersExport), "Users");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classesExport), "Classes");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assignmentsExport), "Assignments");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(submissionsExport), "Submissions");
    XLSX.writeFile(wb, `EduSmart_Backup_${new Date().getTime()}.xlsx`);
    toast({ title: "Thành công", description: "Đã xuất dữ liệu ra file Excel." });
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dataArray = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataArray, { type: 'array' });
        if (workbook.SheetNames.length > 0) {
          if (window.confirm("CẢNH BÁO: Thao tác này sẽ ghi đè dữ liệu Cloud. Bạn có chắc chắn?")) {
            const sheets = ["Users", "Classes", "Assignments", "Submissions"];
            for (const sheetName of sheets) {
              const sheet = workbook.Sheets[sheetName];
              if (!sheet) continue;
              const json: any[] = XLSX.utils.sheet_to_json(sheet);
              const collectionName = sheetName.toLowerCase();
              for (const item of json) {
                let formatted = { ...item };
                if (collectionName === 'classes') {
                  formatted.teacherIds = typeof item.teacherIds === 'string' ? JSON.parse(item.teacherIds) : item.teacherIds;
                } else if (collectionName === 'assignments') {
                  formatted.classIds = typeof item.classIds === 'string' ? JSON.parse(item.classIds) : item.classIds;
                  formatted.questions = typeof item.questions === 'string' ? JSON.parse(item.questions) : item.questions;
                } else if (collectionName === 'submissions') {
                  formatted.answers = typeof item.answers === 'string' ? JSON.parse(item.answers) : item.answers;
                }
                saveData(collectionName, item.id, formatted);
              }
            }
            toast({ title: "Thành công", description: "Khôi phục dữ liệu hoàn tất!" });
          }
        }
      } catch (err) { 
        toast({ variant: 'destructive', title: 'Lỗi', description: 'File không hợp lệ.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteUser = (userToDelete: User) => {
    if (!firestore || currentUser?.id === userToDelete.id) return;
    if (window.confirm(`Xóa người dùng ${userToDelete.fullName}?`)) {
        const batch = writeBatch(firestore);
        if (userToDelete.role === UserRole.TEACHER) {
          classes.filter(c => c.teacherIds?.includes(userToDelete.id)).forEach(c => {
            const updatedIds = (c.teacherIds || []).filter(id => id !== userToDelete.id);
            batch.update(doc(firestore, COLLECTIONS.CLASSES, c.id), { teacherIds: updatedIds });
          });
        }
        batch.delete(doc(firestore, COLLECTIONS.USERS, userToDelete.id));
        batch.commit().then(() => toast({ description: `Đã xóa người dùng.` }));
    }
  };

  const handleDeleteUsers = (ids: string[]) => {
    if (!firestore) return;
    const filteredIds = ids.filter(id => id !== currentUser?.id);
    const batch = writeBatch(firestore);
    filteredIds.forEach(id => {
      batch.delete(doc(firestore, COLLECTIONS.USERS, id));
    });
    batch.commit().then(() => toast({ description: `Đã xóa ${filteredIds.length} người dùng.` }));
  };

  const handleDeleteClasses = (ids: string[]) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    ids.forEach(id => {
        batch.delete(doc(firestore, COLLECTIONS.CLASSES, id));
    });
    batch.commit().then(() => toast({ description: `Đã xóa lớp học.` }));
  };

  const handleDeleteAssignment = (id: string) => {
    if (!firestore) return;
    if (window.confirm(`Xóa bài tập này?`)) {
        const docRef = doc(firestore, COLLECTIONS.ASSIGNMENTS, id);
        deleteDocumentNonBlocking(docRef).then(() => toast({ description: 'Đã xóa bài tập.'}));
    }
  };

  const handleUpdateSelf = (updatedUser: User) => {
    saveData(COLLECTIONS.USERS, updatedUser.id, updatedUser);
    const userForSession = { ...updatedUser };
    delete userForSession.password;
    setCurrentUser(userForSession);
  };

  const renderContent = () => {
    if (view === 'HOME' && !currentUser) return <LandingPage onNavigate={() => navigate('AUTH')} />;
    if (view === 'AUTH') return <AuthForm existingUsers={users} onLogin={handleLogin} />;
    
    if (currentUser) {
      switch (currentUser.role) {
        case UserRole.ADMIN:
          if (view === 'ADMIN_DASHBOARD') {
            return (
              <AdminDashboard
                users={users}
                classes={classes}
                assignments={assignments}
                submissions={submissions}
                onAddUser={async (u) => saveData(COLLECTIONS.USERS, u.id, u)}
                onUpdateUser={async (u) => saveData(COLLECTIONS.USERS, u.id, u)}
                onDeleteUser={handleDeleteUser}
                onDeleteUsers={async (ids) => handleDeleteUsers(ids)}
                onAddClass={async (c) => saveData(COLLECTIONS.CLASSES, c.id, c)}
                onUpdateClass={async (c) => saveData(COLLECTIONS.CLASSES, c.id, c)}
                onDeleteClasses={async (ids) => handleDeleteClasses(ids)}
                onExport={handleExportData}
                onImport={handleImportData}
              />
            );
          }
          break;
        case UserRole.TEACHER:
          const managedClasses = classes.filter(c => c.teacherIds?.includes(currentUser.id));
          switch (view) {
            case 'TEACHER_DASHBOARD':
              return (
                <TeacherDashboard
                  assignments={assignments.filter(a => a.teacherId === currentUser.id)}
                  submissions={submissions}
                  currentUser={currentUser}
                  classes={classes}
                  students={users.filter(u => u.role === UserRole.STUDENT)}
                  onCreateNew={() => navigate('CREATE_ASSIGNMENT')}
                  onViewReport={(a) => navigate('VIEW_REPORT', a)}
                  onEdit={(a) => navigate('EDIT_ASSIGNMENT', a)}
                  onDelete={async (id) => handleDeleteAssignment(id)}
                  onViewRoster={() => navigate('CLASS_ROSTER')}
                  onUpdateUser={handleUpdateSelf}
                />
              );
            case 'CREATE_ASSIGNMENT':
            case 'EDIT_ASSIGNMENT':
              return (
                <AssignmentForm
                  teacherId={currentUser.id}
                  classes={classes}
                  assignmentToEdit={currentAssignment}
                  onSave={async (a) => {
                    await saveData(COLLECTIONS.ASSIGNMENTS, a.id, a);
                    navigate('TEACHER_DASHBOARD');
                  }}
                  onCancel={() => navigate('TEACHER_DASHBOARD')}
                />
              );
            case 'VIEW_REPORT':
              return currentAssignment ? (
                <ReportView
                  assignment={currentAssignment}
                  submissions={submissions.filter(s => s.assignmentId === currentAssignment.id)}
                  onBack={() => navigate('TEACHER_DASHBOARD')}
                  onUpdateSubmission={async (updated) => saveData(COLLECTIONS.SUBMISSIONS, updated.id, updated)}
                />
              ) : null;
            case 'CLASS_ROSTER':
              return (
                <ClassRoster
                  currentUser={currentUser}
                  classes={classes}
                  students={users.filter(u => u.role === UserRole.STUDENT && managedClasses.some(c => c.id === u.classId))}
                  onBack={() => navigate('TEACHER_DASHBOARD')}
                  onDeleteStudents={async (ids) => handleDeleteUsers(ids)}
                  onAddStudents={async (names) => {
                    if (managedClasses.length === 0) return;
                    const primaryClass = managedClasses[0];
                    for (const name of names) {
                      const studentId = Math.random().toString(36).substring(2, 11);
                      const newStudent: User = {
                        id: studentId,
                        fullName: name.trim(),
                        username: slugify(name) + Math.floor(100 + Math.random() * 900),
                        password: Math.random().toString(36).slice(-6).toUpperCase(),
                        role: UserRole.STUDENT,
                        classId: primaryClass.id
                      };
                      saveData(COLLECTIONS.USERS, studentId, newStudent);
                    }
                  }}
                  onParseStudents={parseStudentListAI}
                />
              );
          }
          break;
        case UserRole.STUDENT:
          switch (view) {
            case 'STUDENT_PORTAL':
              return (
                <StudentPortal
                  assignments={assignments.filter(a => a.classIds.includes(currentUser.classId || ''))}
                  submissions={submissions.filter(s => s.studentId === currentUser.id)}
                  currentUser={currentUser}
                  onStart={(a) => navigate('DO_ASSIGNMENT', a)}
                  onReview={(assignment, submission) => navigate('VIEW_SUBMISSION', { assignment, submission })}
                />
              );
            case 'DO_ASSIGNMENT':
              return currentAssignment ? (
                <AssignmentRunner
                  assignment={currentAssignment}
                  studentId={currentUser.id}
                  studentName={currentUser.fullName}
                  onSubmit={async (s) => {
                    await saveData(COLLECTIONS.SUBMISSIONS, s.id, s);
                    navigate('STUDENT_PORTAL');
                  }}
                  onCancel={() => navigate('STUDENT_PORTAL')}
                />
              ) : null;
            case 'VIEW_SUBMISSION':
              return currentAssignment && currentSubmission ? (
                <SubmissionReview
                  assignment={currentAssignment}
                  submission={currentSubmission}
                  onBack={() => navigate('STUDENT_PORTAL')}
                />
              ) : null;
          }
          break;
      }
    }
    return <LandingPage onNavigate={() => navigate('AUTH')} />;
  };

  if (!isClient || (isInitialLoad && isLoading)) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onLogoClick={() => navigate(currentUser ? (currentUser.role === 'ADMIN' ? 'ADMIN_DASHBOARD' : currentUser.role === 'TEACHER' ? 'TEACHER_DASHBOARD' : 'STUDENT_PORTAL') : 'HOME')}
      />
      <main className="max-w-7xl mx-auto px-6 py-6 md:py-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default MainApp;
