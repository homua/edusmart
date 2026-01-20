"use client";

import React, { useState, useEffect } from 'react';
import { db, collections } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, deleteDoc, query } from 'firebase/firestore';

import type { View, Assignment, Submission, Question, QuestionType, User, UserRole, Class } from '@/lib/types';
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

const MainApp: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [view, setView] = useState<View>('HOME');
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);

  // Helper functions for data operations
  const saveData = async (collectionName: string, id: string, data: any) => {
    try {
      await setDoc(doc(db, collectionName, id), data, { merge: true });
    } catch (error) {
      console.error("Error saving data: ", error);
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu dữ liệu vào Cloud." });
    }
  };

  const deleteData = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error("Error deleting data: ", error);
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa dữ liệu từ Cloud." });
    }
  };

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    const collectionsToLoad = [collections.USERS, collections.CLASSES, collections.ASSIGNMENTS, collections.SUBMISSIONS];
    let loadedCount = 0;

    const onDataLoaded = () => {
      loadedCount++;
      if (loadedCount >= collectionsToLoad.length) {
        setIsLoading(false);
      }
    };
    
    const setupSubscription = (
      collectionName: string,
      setter: React.Dispatch<React.SetStateAction<any[]>>
    ) => {
      const q = query(collection(db, collectionName));
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (collectionName === collections.USERS && querySnapshot.empty) {
          const adminId = 'admin-001';
          const adminUser: User = { id: adminId, username: 'admin', password: 'admin123', fullName: 'Quản trị viên', role: UserRole.ADMIN };
          await saveData(collections.USERS, adminUser.id, adminUser);
          // Listener will re-trigger with the new user, so we don't call setter here.
          // We call onDataLoaded in the re-triggered snapshot.
        } else {
          setter(list);
          onDataLoaded();
        }
      }, (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        toast({ variant: 'destructive', title: `Lỗi đồng bộ ${collectionName}`, description: 'Vui lòng kiểm tra kết nối mạng và cấu hình Firebase.' });
        onDataLoaded(); // Mark as loaded even on error to prevent getting stuck
      });
      return unsubscribe;
    };

    unsubscribes.push(setupSubscription(collections.USERS, setUsers));
    unsubscribes.push(setupSubscription(collections.CLASSES, setClasses));
    unsubscribes.push(setupSubscription(collections.ASSIGNMENTS, setAssignments));
    unsubscribes.push(setupSubscription(collections.SUBMISSIONS, setSubmissions));
    
    try {
      const savedUser = localStorage.getItem('edu_session_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Could not parse user from localStorage", e);
      localStorage.removeItem('edu_session_user');
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [toast]);
  

  useEffect(() => {
    if (!currentUser) {
      setView('HOME');
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
    const userWithSanitizedPassword = { ...user };
    delete userWithSanitizedPassword.password;
    setCurrentUser(userWithSanitizedPassword);
  };
  const handleLogout = () => setCurrentUser(null);
  
  const navigate = (newView: View, data?: any) => {
    if (data) {
        if (newView === 'VIEW_REPORT' || newView === 'DO_ASSIGNMENT') {
            setCurrentAssignment(data);
        }
    }
    setView(newView);
  }

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
          setIsLoading(true);
          if (data.users) for (const u of data.users) await saveData(collections.USERS, u.id, u);
          if (data.classes) for (const c of data.classes) await saveData(collections.CLASSES, c.id, c);
          if (data.assignments) for (const a of data.assignments) await saveData(collections.ASSIGNMENTS, a.id, a);
          if (data.submissions) for (const s of data.submissions) await saveData(collections.SUBMISSIONS, s.id, s);
          toast({ title: "Thành công", description: "Khôi phục dữ liệu từ file hoàn tất!" });
          setIsLoading(false);
        }
      } catch (err) { 
        alert("Lỗi đọc file. File không hợp lệ hoặc bị hỏng.");
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteUser = async (id: string) => {
    if (currentUser?.id === id) {
      toast({ variant: "destructive", title: "Lỗi", description: "Bạn không thể tự xóa tài khoản của mình."});
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này? Thao tác này không thể hoàn tác.")) {
      await deleteData(collections.USERS, id);
      toast({ description: "Đã xóa người dùng." });
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
                onAddUser={async (u) => await saveData(collections.USERS, u.id, u)}
                onDeleteUser={handleDeleteUser}
                onAddClass={async (c) => await saveData(collections.CLASSES, c.id, c)}
                onDeleteClass={async (id) => await deleteData(collections.CLASSES, id)}
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
                  onDelete={async (id) => await deleteData(collections.ASSIGNMENTS, id)}
                  onViewRoster={() => navigate('CLASS_ROSTER')}
                />
              );
            case 'CREATE_ASSIGNMENT':
              return (
                <AssignmentForm
                  teacherId={currentUser.id}
                  classes={classes.filter(c => c.teacherId === currentUser.id)}
                  onSave={async (a) => {
                    await saveData(collections.ASSIGNMENTS, a.id, a);
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
                  onUpdateSubmission={async (updated) => await saveData(collections.SUBMISSIONS, updated.id, updated)}
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
                      await saveData(collections.USERS, studentId, newStudent);
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
                    await saveData(collections.SUBMISSIONS, s.id, s);
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

  if (isLoading) {
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
