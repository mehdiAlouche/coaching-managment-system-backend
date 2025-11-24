import { Types } from 'mongoose';
import { BaseService } from '../../_shared/base-services';
import { SessionModel, ISession } from '../model';

export class SessionService extends BaseService<ISession> {
  constructor() {
    super(SessionModel);
  }

  checkConflict(
    coachId: Types.ObjectId | string,
    scheduledAt: Date,
    endTime: Date,
    excludeSessionId?: Types.ObjectId | string
  ) {
    return SessionModel.checkConflict(coachId, scheduledAt, endTime, excludeSessionId);
  }
}

export const sessionService = new SessionService();
