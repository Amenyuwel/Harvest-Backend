import { BaseDocument, ObjectId } from './base';

export interface Report extends BaseDocument {
  title: string;
  description?: string;
  type: string;
  data: Record<string, unknown>;
  createdBy: ObjectId;
}
