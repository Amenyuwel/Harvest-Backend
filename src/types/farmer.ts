import { BaseDocument } from '@/types/base';

export interface Farmer extends BaseDocument {
  rsbsaNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  crop: string;
  area: number;
  barangay: string;
  contact: string;
}

export interface CreateFarmerDto {
  rsbsaNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  crop: string;
  area: number;
  barangay: string;
  contact: string;
  fullName?: string;
}
