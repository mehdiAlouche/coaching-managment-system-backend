import { BaseService } from '../../_shared/base-services';
import { SessionNoteModel, ISessionNote } from '../model';

export class SessionNoteService extends BaseService<ISessionNote> {
  constructor() {
    super(SessionNoteModel);
  }
}

export const sessionNoteService = new SessionNoteService();
