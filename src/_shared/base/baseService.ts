import { Model, Document } from 'mongoose';

export class BaseService<T extends Document> {
  constructor(protected model: Model<T>) {}

  async create(data: Partial<T>) {
    return this.model.create(data as any);
  }

  async findById(id: string) {
    return this.model.findById(id).exec();
  }

  async find(filter = {}) {
    return this.model.find(filter as any).exec();
  }

  async update(id: string, update: Partial<T>) {
    return this.model.findByIdAndUpdate(id, update as any, { new: true }).exec();
  }

  async delete(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }
}
