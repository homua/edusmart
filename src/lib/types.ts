export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  username: string;
  password?: string; // Password should not be stored long-term or passed to client after auth
  fullName: string;
  role: UserRole;
  classId?: string;
}

export interface Class {
  id: string;
  name: string;
  teacherId?: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT = 'TEXT',
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  teacherId: string;
  classIds: string[];
  questions: Question[];
  createdAt: string; // ISO date string
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  answers: { questionId: string; answer: string }[];
  score: number;
  submittedAt: string; // ISO date string
  isGraded: boolean;
  feedback?: string;
}

export type View =
  | 'HOME'
  | 'AUTH'
  | 'ADMIN_DASHBOARD'
  | 'TEACHER_DASHBOARD'
  | 'CREATE_ASSIGNMENT'
  | 'VIEW_REPORT'
  | 'CLASS_ROSTER'
  | 'STUDENT_PORTAL'
  | 'DO_ASSIGNMENT';
