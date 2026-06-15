export interface PublicUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export type RegisterResponse = PublicUser;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface AuthErrorResponse {
  code: string;
  message: string;
}
