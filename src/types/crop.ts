import { BaseDocument } from './base';

export interface Crop extends BaseDocument {
  cropId: string;
  cropName: string;
  cropType?: string;
}
