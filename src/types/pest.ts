import { BaseDocument } from './base';

export interface Pest extends BaseDocument {
  pestId: string;
  pestName: string;
  pestType?: string;
}
