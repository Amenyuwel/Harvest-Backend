import { BaseDocument } from '@/types/base';

export interface Barangay extends BaseDocument {
  barangayId: string;
  barangayName: string;
}
