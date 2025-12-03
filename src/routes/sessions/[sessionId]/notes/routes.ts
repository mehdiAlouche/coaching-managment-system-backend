import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { SessionModel } from '../../../../modules/session/model/session.model';

const router = Router({ mergeParams: true });

// PATCH /sessions/:sessionId/notes - Add role-based notes
router.patch(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach', 'entrepreneur'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const userId = authReq.user?.userId || authReq.user?._id;
      const userRole = authReq.user?.role;
      const { sessionId } = req.params;
      const { role, notes } = req.body;

      // Validation
      if (!role || !['coach', 'entrepreneur', 'manager'].includes(role)) {
        return res.status(400).json({ 
          message: 'Invalid role. Must be one of: coach, entrepreneur, manager' 
        });
      }

      if (!notes || typeof notes !== 'string') {
        return res.status(400).json({ 
          message: 'Notes content is required and must be a string' 
        });
      }

      // Find session
      const session = await SessionModel.findOne({ 
        _id: sessionId, 
        organizationId: orgId 
      });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Authorization: Users can only add notes for their role
      // Exception: Admin can add any role's notes
      if (userRole !== 'admin') {
        if (role !== userRole) {
          return res.status(403).json({ 
            message: `You can only add ${userRole} notes` 
          });
        }

        // Additional check: user must be part of this session
        const userIdStr = userId?.toString();
        const isCoach = session.coachId.toString() === userIdStr;
        const isEntrepreneur = session.entrepreneurId.toString() === userIdStr;
        const isManager = session.managerId.toString() === userIdStr;

        if (!isCoach && !isEntrepreneur && !isManager) {
          return res.status(403).json({ 
            message: 'You are not associated with this session' 
          });
        }

        // Role-specific validation
        if (role === 'coach' && !isCoach) {
          return res.status(403).json({ 
            message: 'Only the assigned coach can add coach notes' 
          });
        }
        if (role === 'entrepreneur' && !isEntrepreneur) {
          return res.status(403).json({ 
            message: 'Only the assigned entrepreneur can add entrepreneur notes' 
          });
        }
        if (role === 'manager' && !isManager) {
          return res.status(403).json({ 
            message: 'Only the assigned manager can add manager notes' 
          });
        }
      }

      // Update the appropriate notes field
      if (!session.notes) {
        session.notes = {};
      }

      switch (role) {
        case 'coach':
          session.notes.coachNotes = notes;
          break;
        case 'entrepreneur':
          session.notes.entrepreneurNotes = notes;
          break;
        case 'manager':
          session.notes.managerNotes = notes;
          break;
      }

      // Mark notes as modified to ensure Mongoose saves it
      session.markModified('notes');
      await session.save();

      // Return updated session
      const updatedSession = await SessionModel.findById(session._id)
        .populate('coachId', 'firstName lastName email')
        .populate('entrepreneurId', 'firstName lastName email startupName')
        .populate('managerId', 'firstName lastName email')
        .lean()
        .then((session: any) => ({
          ...session,
          entrepreneur: session.entrepreneurId,
          manager: session.managerId,
          entrepreneurId: undefined,
          managerId: undefined,
        }));

      res.json({
        success: true,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} notes added successfully`,
        data: updatedSession,
      });
    } catch (err) {
      console.error('Add session notes error:', err);
      res.status(500).json({ message: 'Failed to add session notes' });
    }
  }
);

export default router;
