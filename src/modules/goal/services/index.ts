import { Types } from 'mongoose';
import { BaseService } from '../../_shared/base-services';
import { GoalModel, IGoal } from '../model';

export class GoalService extends BaseService<IGoal> {
  constructor() {
    super(GoalModel);
  }

  updateProgressFromMilestones(goalId: Types.ObjectId | string) {
    return GoalModel.updateProgressFromMilestones(goalId);
  }
}

export const goalService = new GoalService();
