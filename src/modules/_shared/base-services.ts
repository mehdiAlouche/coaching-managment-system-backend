import { Model, Document } from 'mongoose';

/**
 * Shared base service providing standard CRUD helpers for Mongoose models.
 */
export class BaseService<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  create(data: Partial<T>) {
    return this.model.create(data as any);
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  find(filter: Record<string, unknown> = {}) {
    return this.model.find(filter as any).exec();
  }

  findOne(filter: Record<string, unknown>) {
    return this.model.findOne(filter as any).exec();
  }

  update(id: string, update: Partial<T>) {
    return this.model.findByIdAndUpdate(id, update as any, { new: true }).exec();
  }

  delete(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }
}
