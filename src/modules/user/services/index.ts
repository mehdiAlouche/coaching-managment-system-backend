import type { FilterQuery } from 'mongoose';
import { BaseService } from '../../_shared/base-services';
import { UserModel, IUser } from '../model';

export class UserService extends BaseService<IUser> {
  constructor() {
    super(UserModel);
  }

  findOneByFilter(filter: FilterQuery<IUser>) {
    return this.model.findOne(filter).exec();
  }

  findActiveByOrganization(organizationId: string) {
    return this.model
      .find({ organizationId, isActive: true })
      .select('-password')
      .lean()
      .exec();
  }
}

export const userService = new UserService();
