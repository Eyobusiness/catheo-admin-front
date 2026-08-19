export interface User {
  id: string;
  name: string;
  nom?: string;
  prenoms?: string;
  email: string;
  telephone?: string;
  statut: string;
  dernier_login_at?: string;
  created_at?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  user: User;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyCodeDto {
  email: string;
  code: string;
}

export interface ResetPasswordDto {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
  device_name?: string;
}

export interface ChangePasswordDto {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ApiErrorResponse {
  status: string;
  message: string;
  errors?: Record<string, string[]>;
}
