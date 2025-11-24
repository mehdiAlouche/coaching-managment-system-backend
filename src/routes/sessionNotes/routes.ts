import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { sessionNoteSchema } from '../../modules/validation/schemas';
import { SessionModel } from '../../modules/session/model/session.model';
import { SessionNoteModel } from '../../modules/sessionNote/model/sessionNote.model';

const router = Router({ mergeParams: true });

router.use(requireAuth, requireSameOrganization);

async function ensureSessionAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { sessionId } = req.params;
    const session = await SessionModel.findOne({
      _id: sessionId,
      organizationId: authReq.user?.organizationId,
    }).lean();

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    (req as Request & { sessionDoc?: typeof session }).sessionDoc = session;
    next();
  } catch (err) {
    console.error('Session access check failed:', err);
    res.status(500).json({ message: 'Failed to validate session access' });
  }
}

router.get(
  '/',
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  ensureSessionAccess,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const session = (req as Request & { sessionDoc?: any }).sessionDoc;
      const query: Record<string, unknown> = {
        sessionId: session._id,
        organizationId: authReq.user?.organizationId,
      };

      const userId = authReq.user?.userId || authReq.user?._id;
      const userRole = authReq.user?.role;

      if (userRole === 'coach' && session.coachId.toString() !== userId?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (userRole === 'entrepreneur') {
        if (session.entrepreneurId.toString() !== userId?.toString()) {
          return res.status(403).json({ message: 'Access denied' });
        }
        query.visibility = 'shared';
      }

      const notes = await SessionNoteModel.find(query).sort({ createdAt: -1 }).lean();

      res.json({ data: notes, count: notes.length });
    } catch (err) {
      console.error('Get session notes error:', err);
      res.status(500).json({ message: 'Failed to fetch session notes' });
    }
  }
);

router.post(
  '/',
  requireRole('admin', 'manager', 'coach'),
  validate(sessionNoteSchema),
  ensureSessionAccess,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const session = (req as Request & { sessionDoc?: any }).sessionDoc;
      const userId = authReq.user?.userId || authReq.user?._id;

      if (authReq.user?.role === 'coach' && session.coachId.toString() !== userId?.toString()) {
        return res.status(403).json({ message: 'Coaches can only write notes for their sessions' });
      }

      const payload = req.body;
      const note = await SessionNoteModel.create({
        sessionId: session._id,
        organizationId: authReq.user?.organizationId,
        authorId: userId,
        summary: payload.summary,
        details: payload.details,
        visibility: payload.visibility || 'internal',
        followUpTasks: (payload.followUpTasks || []).map((task: any) => ({
          description: task.description,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completed: task.completed ?? false,
        })),
        attendance: payload.attendance
          ? {
              present: payload.attendance.present,
              notes: payload.attendance.notes,
            }
          : undefined,
      });

      res.status(201).json(note);
    } catch (err) {
      console.error('Create session note error:', err);
      res.status(500).json({ message: 'Failed to create session note' });
    }
  }
);

export default router;

