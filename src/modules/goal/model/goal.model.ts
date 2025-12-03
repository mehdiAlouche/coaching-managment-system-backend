import { Schema, model, Document, Types, Model } from 'mongoose';

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface IGoalMilestone {
  title: string;
  status: GoalStatus;
  targetDate?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface IGoalCollaborator {
  userId: Types.ObjectId;
  role?: string;
  addedAt: Date;
}

export interface IGoalComment {
  userId: Types.ObjectId;
  comment: string;
  createdAt: Date;
}

export interface IGoalUpdateLog {
  updatedBy: Types.ObjectId;
  updateType: string;
  message?: string;
  changes?: Record<string, unknown>;
  updatedAt: Date;
}

export interface IGoal extends Document {
  organizationId: Types.ObjectId;
  entrepreneurId: Types.ObjectId;
  coachId: Types.ObjectId;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: GoalPriority;
  progress: number;
  targetDate?: Date;
  isArchived: boolean;
  milestones: IGoalMilestone[];
  linkedSessions: Types.ObjectId[];
  collaborators: IGoalCollaborator[];
  comments: IGoalComment[];
  updateLog: IGoalUpdateLog[];
}

export interface IGoalModel extends Model<IGoal> {
  updateProgressFromMilestones(goalId: Types.ObjectId | string): Promise<void>;
}

const MilestoneSchema = new Schema<IGoalMilestone>(
  {
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'blocked'],
      default: 'not_started',
    },
    targetDate: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: false }
);

const CollaboratorSchema = new Schema<IGoalCollaborator>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CommentSchema = new Schema<IGoalComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UpdateLogSchema = new Schema<IGoalUpdateLog>(
  {
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updateType: { type: String, required: true },
    message: { type: String },
    changes: { type: Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GoalSchema = new Schema<IGoal, IGoalModel>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    entrepreneurId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'blocked'],
      default: 'not_started',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    targetDate: { type: Date },
    isArchived: { type: Boolean, default: false },
    milestones: { type: [MilestoneSchema], default: [] },
    linkedSessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
    collaborators: { type: [CollaboratorSchema], default: [] },
    comments: { type: [CommentSchema], default: [] },
    updateLog: { type: [UpdateLogSchema], default: [] },
  },
  { timestamps: true }
);

GoalSchema.index({ organizationId: 1, entrepreneurId: 1 });
GoalSchema.index({ status: 1, priority: 1 });
GoalSchema.index({ targetDate: 1 });
GoalSchema.index({ isArchived: 1, status: 1 });

GoalSchema.statics.updateProgressFromMilestones = async function (goalId) {
  const goal = await this.findById(goalId).select('milestones progress status');
  if (!goal) return;

  if (!goal.milestones.length) {
    return;
  }

  const completed = goal.milestones.filter((milestone) => milestone.status === 'completed').length;
  const newProgress = Math.round((completed / goal.milestones.length) * 100);

  goal.progress = newProgress;
  if (newProgress >= 100) {
    goal.status = 'completed';
  }

  await goal.save();
};

GoalSchema.pre('save', function (this: IGoal, next) {
  if (this.progress >= 100) {
    this.progress = 100;
    this.status = 'completed';
  }

  if (this.progress < 0) {
    this.progress = 0;
  }

  next();
});

export const GoalModel = model<IGoal, IGoalModel>('Goal', GoalSchema);
