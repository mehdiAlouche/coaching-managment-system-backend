import { BaseService } from '../../_shared/base-services';
import { OrganizationModel, IOrganization } from '../model';

export class OrganizationService extends BaseService<IOrganization> {
  constructor() {
    super(OrganizationModel);
  }
}

export const organizationService = new OrganizationService();
