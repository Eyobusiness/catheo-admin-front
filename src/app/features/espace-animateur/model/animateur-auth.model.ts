export interface AnimateurProfile {
  id?: string | number;
  uuid?: string;
  nom?: string;
  prenoms?: string;
  nom_complet?: string;
  telephone: string;
  email?: string;
  statut?: 'actif' | 'inactif' | string;
  dernier_login_at?: string | null;
  paroisse_configuration_id?: number | string;
}

export interface AnimateurLoginDto {
  telephone: string;
  password: string;
}

export interface AnimateurLoginResponse {
  token?: string;
  access_token?: string;
  data?: {
    token?: string;
    access_token?: string;
    animateur?: AnimateurProfile;
    user?: any;
    annee_courante?: any;
    menus?: any[];
  };
  animateur?: AnimateurProfile;
  user?: any;
  annee_courante?: any;
  menus?: any[];
  message?: string;
}

export interface AnimateurMeResponse {
  data?: {
    animateur?: AnimateurProfile;
    user?: any;
    annee_courante?: any;
    menus?: any[];
  };
  animateur?: AnimateurProfile;
  user?: any;
  annee_courante?: any;
  menus?: any[];
}

export interface AnimateurChangePasswordDto {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface AnimateurForgotPasswordDto {
  email: string;
}

export interface AnimateurVerifyCodeDto {
  email: string;
  code: string;
}

export interface AnimateurResetPasswordDto {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}
