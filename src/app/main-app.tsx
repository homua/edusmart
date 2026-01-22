
"use client";

import React, { useState, useEffect } from 'react';
import { useUser, useCollection, useFirebase, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

import { UserRole, type View, type Assignment, type Submission, type User, type Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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

const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
};

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
  
  const isLoading = usersLoading || classesLoading || assignmentsLoading || submissionsLoading || isAuthUserLoading;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (auth && !auth.currentUser) {
      signInAnonymously(auth).catch(error => {
        console.error("Anonymous sign-in failed", error);
        toast({ variant: 'destructive', title: 'Lỗi kết nối', description: 'Không thể kết nối đến máy chủ xác thực.' });
      });
    }
  }, [auth, toast]);

  useEffect(() => {
    if (!usersLoading && !isAuthUserLoading && authUser && firestore && users.length === 0 && isInitialLoad) {
      const adminId = authUser.uid; // Use the actual auth UID
      const adminUser: User = { id: adminId, username: 'admin', password: 'admin123', fullName: 'Quản trị viên', role: UserRole.ADMIN };
      const userDocRef = doc(firestore, COLLECTIONS.USERS, adminId);
      setDocumentNonBlocking(userDocRef, adminUser, { merge: true });
    }
    if (!usersLoading && !isAuthUserLoading) {
      setIsInitialLoad(false);
    }
  }, [usersLoading, isAuthUserLoading, authUser, firestore, users, isInitialLoad]);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('edu_session_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Could not parse user from localStorage", e);
      localStorage.removeItem('edu_session_user');
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      if (view !== 'AUTH') {
        setView('HOME');
      }
      localStorage.removeItem('edu_session_user');
    } else {
      try {
        localStorage.setItem('edu_session_user', JSON.stringify(currentUser));
        if (view === 'HOME' || view === 'AUTH') {
           if (currentUser.role === UserRole.ADMIN) setView('ADMIN_DASHBOARD');
           else if (currentUser.role === UserRole.TEACHER) setView('TEACHER_DASHBOARD');
           else setView('STUDENT_PORTAL');
        }
      } catch (e) {
        console.error("Could not save user to localStorage", e);
      }
    }
  }, [currentUser, view]);

  const handleLogin = (user: User) => {
    const userForSession = { ...user };
    delete userForSession.password;

    if (userForSession.role === UserRole.TEACHER) {
      const assignedClass = classes.find(c => c.teacherId === userForSession.id);
      if (assignedClass) {
        userForSession.classId = assignedClass.id;
      }
    }
    
    setCurrentUser(userForSession);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('HOME');
  };
  
  const navigate = (newView: View, data?: any) => {
    if (newView === 'AUTH') {
      if (currentUser) {
        return;
      }
    }
    
    if (newView === 'CREATE_ASSIGNMENT') {
        setCurrentAssignment(null);
    } else if (data) {
        if (newView === 'VIEW_REPORT' || newView === 'DO_ASSIGNMENT' || newView === 'EDIT_ASSIGNMENT') {
            setCurrentAssignment(data);
        }
    }
    setView(newView);
  }
  
  const saveData = (collectionName: string, id: string, data: any): Promise<void> => {
    if (!firestore) {
       toast({
            variant: 'destructive',
            title: 'Lỗi hệ thống',
            description: 'Không thể kết nối tới cơ sở dữ liệu. Vui lòng tải lại trang.'
        });
       return Promise.reject(new Error("Firestore service not available."));
    }
    const docRef = doc(firestore, collectionName, id);
    return setDocumentNonBlocking(docRef, data, { merge: true });
  };

  const deleteData = (collectionName: string, id: string): Promise<void> => {
    if (!firestore) {
       toast({
            variant: 'destructive',
            title: 'Lỗi hệ thống',
            description: 'Không thể kết nối tới cơ sở dữ liệu. Vui lòng tải lại trang.'
        });
      return Promise.reject(new Error('Firestore service not available.'));
    }
    const docRef = doc(firestore, collectionName, id);
    return deleteDocumentNonBlocking(docRef);
  };

  const handleExportData = () => {
    const fullData = { users, classes, assignments, submissions, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduSmart_Cloud_Backup_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (window.confirm("CẢNH BÁO: Thao tác này sẽ ghi đè toàn bộ dữ liệu trên Cloud bằng dữ liệu từ file sao lưu. Bạn có chắc chắn muốn tiếp tục không?")) {
          
          if (data.users) for (const u of data.users) await saveData(COLLECTIONS.USERS, u.id, u);
          if (data.classes) for (const c of data.classes) await saveData(COLLECTIONS.CLASSES, c.id, c);
          if (data.assignments) for (const a of data.assignments) await saveData(COLLECTIONS.ASSIGNMENTS, a.id, a);
          if (data.submissions) for (const s of data.submissions) await saveData(COLLECTIONS.SUBMISSIONS, s.id, s);
          toast({ title: "Thành công", description: "Khôi phục dữ liệu từ file hoàn tất!" });
          
        }
      } catch (err) { 
        alert("Lỗi đọc file. File không hợp lệ hoặc bị hỏng.");
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteUser = async (userToDelete: User) => {
    const { id, role } = userToDelete;

    if (currentUser?.id === id) {
      toast({ variant: "destructive", title: "Lỗi", description: "Bạn không thể tự xóa tài khoản của mình."});
      return;
    }
    
    if (role === UserRole.TEACHER) {
      const isHeadTeacher = classes.some(c => c.teacherId === id);
      if (isHeadTeacher) {
        toast({ variant: "destructive", title: "Không thể xóa", description: "Giáo viên này đang là chủ nhiệm một lớp. Vui lòng bỏ gán chủ nhiệm trước khi xóa."});
        return;
      }
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${userToDelete.fullName}"? Thao tác này không thể hoàn tác.`)) {
      try {
        await deleteData(COLLECTIONS.USERS, id);
        toast({ description: `Đã xóa người dùng ${userToDelete.fullName}.` });
      } catch (error) {
        console.error(`Error deleting user: ${id}`, error);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: `Không thể xóa người dùng "${userToDelete.fullName}". Vui lòng thử lại.`
        });
      }
    }
  };

  const handleDeleteStudents = async (ids: string[]) => {
    try {
      const deletePromises = ids.map(id => deleteData(COLLECTIONS.USERS, id));
      await Promise.all(deletePromises);
      toast({ description: `Đã xóa ${ids.length} học sinh.` });
    } catch(error) {
      console.error('Failed to delete students:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi xóa học sinh. Vui lòng thử lại.'
      });
      throw error; // Re-throw to notify caller
    }
  };

  const renderContent = () => {
    if (view === 'HOME' && !currentUser) {
      return <LandingPage onNavigate={() => navigate('AUTH')} />;
    }
    if (view === 'AUTH') {
      return <AuthForm existingUsers={users} onLogin={handleLogin} />;
    }
    if (currentUser) {
      switch (currentUser.role) {
        case UserRole.ADMIN:
          if (view === 'ADMIN_DASHBOARD') {
            return (
              <AdminDashboard
                users={users}
                classes={classes}
                onAddUser={async (u) => await saveData(COLLECTIONS.USERS, u.id, u)}
                onDeleteUser={handleDeleteUser}
                onAddClass={async (c) => await saveData(COLLECTIONS.CLASSES, c.id, c)}
                onUpdateClass={async (c) => await saveData(COLLECTIONS.CLASSES, c.id, c)}
                onDeleteClass={async (id) => await deleteData(COLLECTIONS.CLASSES, id)}
                onExport={handleExportData}
                onImport={handleImportData}
              />
            );
          }
          break;
        case UserRole.TEACHER:
          switch (view) {
            case 'TEACHER_DASHBOARD':
              return (
                <TeacherDashboard
                  assignments={assignments.filter(a => a.teacherId === currentUser.id)}
                  submissions={submissions}
                  currentUser={currentUser}
                  classes={classes}
                  students={users.filter(u => u.role === UserRole.STUDENT && u.classId === currentUser.classId)}
                  onCreateNew={() => navigate('CREATE_ASSIGNMENT')}
                  onViewReport={(a) => navigate('VIEW_REPORT', a)}
                  onEdit={(a) => navigate('EDIT_ASSIGNMENT', a)}
                  onDelete={async (id) => await deleteData(COLLECTIONS.ASSIGNMENTS, id)}
                  onViewRoster={() => navigate('CLASS_ROSTER')}
                />
              );
            case 'CREATE_ASSIGNMENT':
            case 'EDIT_ASSIGNMENT':
              return (
                <AssignmentForm
                  teacherId={currentUser.id}
                  classes={classes.filter(c => c.teacherId === currentUser.id)}
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
                  onUpdateSubmission={async (updated) => await saveData(COLLECTIONS.SUBMISSIONS, updated.id, updated)}
                />
              ) : null;
            case 'CLASS_ROSTER':
              return (
                <ClassRoster
                  currentUser={currentUser}
                  classes={classes}
                  students={users.filter(u => u.role === UserRole.STUDENT && u.classId === currentUser.classId)}
                  onBack={() => navigate('TEACHER_DASHBOARD')}
                  onDeleteStudent={handleDeleteUser}
                  onDeleteStudents={handleDeleteStudents}
                  onAddStudents={async (names) => {
                    if (!currentUser?.classId) return;
                    for (const name of names) {
                      const baseUser = slugify(name);
                      const randomSuffix = Math.floor(100 + Math.random() * 900);
                      const studentId = Math.random().toString(36).substring(2, 11);
                      const newStudent: User = {
                        id: studentId,
                        fullName: name.trim(),
                        username: baseUser + randomSuffix,
                        password: Math.random().toString(36).slice(-6).toUpperCase(),
                        role: UserRole.STUDENT,
                        classId: currentUser.classId
                      };
                      await saveData(COLLECTIONS.USERS, studentId, newStudent);
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
          }
          break;
      }
    }
    // Fallback view if state is inconsistent
    return <LandingPage onNavigate={() => navigate('AUTH')} />;
  };

  if (!isClient || (isInitialLoad && isLoading)) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onLogoClick={() => navigate(currentUser ? (currentUser.role === 'ADMIN' ? 'ADMIN_DASHBOARD' : currentUser.role === 'TEACHER' ? 'TEACHER_DASHBOARD' : 'STUDENT_PORTAL') : 'HOME')}
      />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default MainApp;

    