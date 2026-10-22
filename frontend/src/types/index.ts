export type Role = 'TEACHER' | 'STUDENT' | 'ADMIN'

/** Role of a user inside one classroom. */
export type ClassRole = 'TEACHER' | 'STUDENT'

export interface User {
  id: number
  fullName: string
  email: string
  role: Role
  avatarUrl: string | null
  active: boolean
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: User
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface Classroom {
  id: number
  name: string
  section: string | null
  subject: string | null
  room: string | null
  description: string | null
  classCode: string
  bannerColor: string
  archived: boolean
  createdAt: string
  ownerId: number
  ownerName: string
  myRole: ClassRole
}

export interface ClassroomMember {
  userId: number
  fullName: string
  email: string
  avatarUrl: string | null
  roleInClass: ClassRole
  joinedAt: string
}

export interface CreateClassroomRequest {
  name: string
  section?: string
  subject?: string
  room?: string
  description?: string
  bannerColor?: string
}

export type UpdateClassroomRequest = CreateClassroomRequest

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}


export interface FileResponse {
  id: number
  originalName: string
  contentType: string | null
  sizeBytes: number
  createdAt: string
}

export interface Topic {
  id: number
  classroomId: number
  name: string
  sortOrder: number
  createdAt: string
}

export interface TopicRequest {
  name: string
  sortOrder?: number
}

export interface Comment {
  id: number
  authorId: number
  authorName: string
  body: string
  createdAt: string
}

export interface Announcement {
  id: number
  classroomId: number
  authorId: number
  authorName: string
  body: string
  pinned: boolean
  attachments: FileResponse[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

export interface AnnouncementRequest {
  body: string
  fileIds?: number[]
  pinned?: boolean
}

export interface MaterialRequest {
  title: string
  description?: string
  topicId?: number | null
  fileIds: number[]
}

export interface Material {
  id: number
  classroomId: number
  topicId: number | null
  topicName: string | null
  title: string
  description: string | null
  createdById: number
  createdByName: string
  files: FileResponse[]
  createdAt: string
  updatedAt: string
}

export type SubmissionStatus = 'ASSIGNED' | 'SUBMITTED' | 'LATE' | 'MISSING' | 'GRADED' | 'RETURNED'

export interface AssignmentRequest {
  title: string
  instructions?: string
  topicId?: number | null
  maxPoints: number
  dueAt?: string | null
  allowLate?: boolean
  fileIds?: number[]
}

export interface Assignment {
  id: number
  classroomId: number
  classroomName: string
  topicId: number | null
  topicName: string | null
  title: string
  instructions: string | null
  maxPoints: number
  dueAt: string | null
  allowLate: boolean
  createdById: number
  createdByName: string
  attachments: FileResponse[]
  /** Only populated for students. */
  mySubmissionStatus: SubmissionStatus | null
  createdAt: string
  updatedAt: string
}

export interface Submission {
  /** Null when the student has not started working yet. */
  id: number | null
  assignmentId: number
  studentId: number
  studentName: string
  studentEmail: string
  textAnswer: string | null
  status: SubmissionStatus
  submittedAt: string | null
  grade: number | null
  feedback: string | null
  gradedById: number | null
  gradedByName: string | null
  gradedAt: string | null
  returnedAt: string | null
  files: FileResponse[]
}

export interface SubmissionSummary {
  assigned: number
  submitted: number
  graded: number
  missing: number
  submissions: Submission[]
}

export interface SubmitRequest {
  textAnswer?: string
  fileIds?: number[]
}

export interface GradeRequest {
  grade: number
  feedback?: string
  returnWork: boolean
}

export interface TodoItem {
  assignmentId: number
  classroomId: number
  classroomName: string
  title: string
  dueAt: string | null
  maxPoints: number
  status: SubmissionStatus
}

/* ---------- Notifications ---------- */

export type NotificationType = 'ANNOUNCEMENT' | 'ASSIGNMENT' | 'MATERIAL' | 'GRADED' | 'DUE_TOMORROW'

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  classroomId: number | null
  classroomName?: string | null
  read: boolean
  createdAt: string
}

/* ---------- Grades ---------- */

export interface GradebookAssignment {
  id: number
  title: string
  maxPoints: number
  dueAt: string | null
  averagePercent: number | null
}

export interface GradebookCell {
  assignmentId: number
  status: SubmissionStatus
  grade: number | null
  percent: number | null
}

export interface GradebookRow {
  studentId: number
  studentName: string
  studentEmail: string
  /** Same order as the gradebook's assignments. */
  cells: GradebookCell[]
  averagePercent: number | null
}

export interface Gradebook {
  classroomId: number
  classroomName: string
  assignments: GradebookAssignment[]
  rows: GradebookRow[]
  classAveragePercent: number | null
}

export interface StudentGradeItem {
  assignmentId: number
  title: string
  maxPoints: number
  dueAt: string | null
  status: SubmissionStatus
  grade: number | null
  percent: number | null
  feedback: string | null
}

export interface StudentGrades {
  classroomId: number
  classroomName: string
  items: StudentGradeItem[]
  gradedCount: number
  totalCount: number
  averagePercent: number | null
}

export interface AssignmentStat {
  assignmentId: number
  title: string
  totalStudents: number
  submitted: number
  graded: number
  missing: number
  /** Share of enrolled students who handed in, 0-100. */
  submissionRate: number
  averagePercent: number | null
}

export interface GradeBucket {
  label: string
  count: number
}

export interface ClassAnalytics {
  classroomId: number
  studentCount: number
  assignmentCount: number
  classAveragePercent: number | null
  assignments: AssignmentStat[]
  distribution: GradeBucket[]
}

/* ---------- Calendar ---------- */

export interface CalendarEvent {
  assignmentId: number
  classroomId: number
  classroomName: string
  title: string
  dueAt: string
  maxPoints: number
  /** Only set for students. */
  status: SubmissionStatus | null
  link: string
}

/* ---------- Search ---------- */

export type SearchResultType = 'CLASS' | 'ASSIGNMENT' | 'MATERIAL'

export interface SearchResult {
  type: SearchResultType
  id: number
  title: string
  subtitle: string | null
  classroomId: number | null
  link: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
}

/* ---------- Admin ---------- */

export interface AdminStats {
  totalUsers: number
  totalTeachers: number
  totalStudents: number
  totalAdmins: number
  totalClasses: number
  totalSubmissions: number
  storageBytes: number
}

export interface AdminClassroom {
  id: number
  name: string
  section: string | null
  subject: string | null
  classCode: string
  ownerId: number
  ownerName: string
  archived: boolean
  studentCount: number
  createdAt: string
}

export interface MessageResponse {
  message: string
}
