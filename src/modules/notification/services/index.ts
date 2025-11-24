import { BaseService } from '../../_shared/base-services';
import { NotificationModel, INotification } from '../model';

export class NotificationService extends BaseService<INotification> {
  constructor() {
    super(NotificationModel);
  }
}

export const notificationService = new NotificationService();
