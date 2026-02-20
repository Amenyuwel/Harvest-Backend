// MongoDB ObjectId type
export type ObjectId = string;

// Base model interface
export interface BaseDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
