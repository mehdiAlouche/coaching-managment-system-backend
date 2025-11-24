import { BaseService } from '../../_shared/base-services';
import { RoleModel, IRole } from '../model';

export class RoleService extends BaseService<IRole> {
  constructor() {
    super(RoleModel);
  }
}

export const roleService = new RoleService();
