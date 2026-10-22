export type Role = 'TEACHER' | 'STUDENT' | 'ADMIN'

/** Role of a user inside one classroom. */
export type ClassRole = 'TEACHER' | 'STUDENT'

export interface User {
  id: number
  fullName: string
  email: string
  role: Role
  avatarUrl: string | null
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

