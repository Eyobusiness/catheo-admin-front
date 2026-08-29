export interface User {
  id: string | number;
  name: string;
  nom?: string;
  prenoms?: string;
  email: string;
  telephone?: string;
  role?: string;
  role_nom?: string;
  profil_id?: string | number;
  profil?: { id?: string | number; nom?: string; code?: string; libelle?: string };
  profil_nom?: string;
  paroisse_id?: string | number;
  paroisse?: { id?: string | number; nom?: string; ville?: string; diocese?: string };
  paroisse_nom?: string;
  statut?: string;
  is_active?: boolean;
  avatar?: string;
  dernier_login_at?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
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
