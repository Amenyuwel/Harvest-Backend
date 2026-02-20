import { BaseDocument, ObjectId } from './base';

export interface User extends BaseDocument {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  middleName?: string;
  username: string;
  role: 'user' | 'admin';
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  middleName?: string;
  username: string;
  role?: 'user' | 'admin';
}

export interface LoginDto {
  email: string;
  password: string;
}
