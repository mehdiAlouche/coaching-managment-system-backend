import { loadEnv } from '../config/env';
import { connectDB } from '../config/db';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { OrganizationModel } from '../modules/organization/model/organization.model';
import { UserModel, IUser } from '../modules/user/model/user.model';
import { GoalModel } from '../modules/goal/model/goal.model';
import { SessionModel } from '../modules/session/model/session.model';
import { PaymentModel } from '../modules/payment/model/payment.model';

// Load env and connect
loadEnv();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || '';

if (!MONGO_URI) {
  console.error('MONGO_URI is not set. Set it in your environment or .env file.');
  process.exit(1);
}

async function seed() {
  await connectDB(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clean existing collections used by the seeder to produce repeatable results
  const models = [OrganizationModel, UserModel, GoalModel, SessionModel, PaymentModel];
  for (const m of models) {
    try {
      // Use the underlying collection to avoid TypeScript overload union issues
      if (m && (m as any).collection && typeof (m as any).collection.deleteMany === 'function') {
        await (m as any).collection.deleteMany({});
      } else if (typeof (m as any).deleteMany === 'function') {
        await (m as any).deleteMany({});
      }
    } catch (err) {
      // ignore
    }
  }

  // Create two organizations
  const orgs = await OrganizationModel.create([
    {
      name: 'Riverbank Startup Hub',
      slug: 'riverbank-hub',
      isActive: true,
      settings: { timezone: 'America/New_York', locale: 'en-US' },
      subscriptionPlan: 'standard',
      subscriptionStatus: 'active',
      billingEmail: 'billing@riverbank.example',
      maxUsers: 100,
    },
    {
      name: 'Northside Accelerator',
      slug: 'northside-accelerator',
      isActive: true,
      settings: { timezone: 'Europe/London', locale: 'en-GB' },
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      billingEmail: 'accounts@northside.example',
      maxUsers: 250,
    },
  ]);

  console.log(`Created ${orgs.length} organizations`);

  // Helper to create a user with hashed password
  async function createUser(u: Partial<IUser> & { email: string; password?: string }) {
    const hashed = bcrypt.hashSync(u.password || 'Password123!', 10);
    const doc = new UserModel({ ...u, password: hashed });
    await doc.save();
    return doc;
  }

  // Create users for org1
  const org1 = orgs[0];
  const org2 = orgs[1];

  const manager1 = await createUser({
    email: 'alice.manager@riverbank.example',
    password: 'ManagerPass1!',
    role: 'manager',
    organizationId: org1._id,
    firstName: 'Alice',
    lastName: 'Morgan',
  });

  const coach1 = await createUser({
    email: 'ben.coach@riverbank.example',
    password: 'CoachPass1!',
    role: 'coach',
    organizationId: org1._id,
    firstName: 'Ben',
    lastName: 'Collins',
    hourlyRate: 120,
    phone: '+1-555-0132',
    timezone: 'America/New_York',
  });

  const entrepreneur1 = await createUser({
    email: 'cara.startup@riverbank.example',
    password: 'Entrepreneur1!',
    role: 'entrepreneur',
    organizationId: org1._id,
    firstName: 'Cara',
    lastName: 'Nguyen',
    startupName: 'BrightLeaf Technologies',
    phone: '+1-555-0199',
  });

  // Org2 users
  const manager2 = await createUser({
    email: 'david.manager@northside.example',
    password: 'ManagerPass2!',
    role: 'manager',
    organizationId: org2._id,
    firstName: 'David',
    lastName: 'Harris',
  });

  const coach2 = await createUser({
    email: 'emma.coach@northside.example',
    password: 'CoachPass2!',
    role: 'coach',
    organizationId: org2._id,
    firstName: 'Emma',
    lastName: 'Gomez',
    hourlyRate: 150,
    timezone: 'Europe/London',
  });

  const entrepreneur2 = await createUser({
    email: 'felix.startup@northside.example',
    password: 'Entrepreneur2!',
    role: 'entrepreneur',
    organizationId: org2._id,
    firstName: 'Felix',
    lastName: 'Khan',
    startupName: 'GreenMetrics',
    phone: '+44-20-5555-1234',
  });

  console.log('Created sample users (managers, coaches, entrepreneurs)');

  // Create goals for entrepreneur1
  const goal1 = await GoalModel.create({
    organizationId: org1._id,
    entrepreneurId: entrepreneur1._id,
    coachId: coach1._id,
    title: 'Launch MVP',
    description: 'Complete MVP for early adopters',
    status: 'in_progress',
    priority: 'high',
    progress: 40,
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    milestones: [
      { title: 'Design prototype', status: 'completed', targetDate: new Date(), completedAt: new Date() },
      { title: 'Implement core features', status: 'in_progress', targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10) },
      { title: 'Beta testing', status: 'not_started', targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20) },
    ],
    collaborators: [{ userId: coach1._id, role: 'coach', addedAt: new Date() }],
    comments: [{ userId: coach1._id, comment: 'Focus on validating the core hypothesis', createdAt: new Date() }],
  });

  // Create a goal for entrepreneur2 completed
  const goal2 = await GoalModel.create({
    organizationId: org2._id,
    entrepreneurId: entrepreneur2._id,
    coachId: coach2._id,
    title: 'Pilot with 3 customers',
    description: 'Sign 3 pilot customers and gather feedback',
    status: 'not_started',
    priority: 'medium',
    progress: 0,
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
    milestones: [],
  });

  console.log('Created sample goals');

  // Create sessions for entrepreneur1 with payment
  const now = new Date();
  const session1Start = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2); // 2 days from now
  const session1 = await SessionModel.create({
    organizationId: org1._id,
    coachId: coach1._id,
    entrepreneurId: entrepreneur1._id,
    managerId: manager1._id,
    scheduledAt: session1Start,
    duration: 60,
    endTime: new Date(session1Start.getTime() + 60 * 60000),
    status: 'scheduled',
    agendaItems: [{ title: 'MVP roadmap', description: 'Discuss milestones and deliverables', duration: 45 }],
    notes: { summary: 'Plan next steps', actionItems: ['Define scope', 'Assign dev tasks'] },
    location: 'Zoom',
  });

  // Create payment for that session
  const amount = coach1.hourlyRate ? coach1.hourlyRate * (session1.duration / 60) : 100;
  const invoiceNumber1 = `INV-${Date.now()}-R1`;
  const payment1 = await PaymentModel.create({
    organizationId: org1._id,
    coachId: coach1._id,
    sessionIds: [session1._id],
    lineItems: [
      {
        sessionId: session1._id,
        description: 'Coaching session (60m)',
        duration: session1.duration,
        rate: coach1.hourlyRate ?? 100,
        amount,
      },
    ],
    amount,
    taxAmount: Math.round(amount * 0.08 * 100) / 100,
    totalAmount: amount + Math.round(amount * 0.08 * 100) / 100,
    currency: 'USD',
    status: 'pending',
    invoiceNumber: invoiceNumber1,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
  });

  // Link payment to session
  session1.paymentId = payment1._id;
  await session1.save();

  // Create a completed session and payment for org2
  const session2Start = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7); // 7 days ago
  const session2 = await SessionModel.create({
    organizationId: org2._id,
    coachId: coach2._id,
    entrepreneurId: entrepreneur2._id,
    managerId: manager2._id,
    scheduledAt: session2Start,
    duration: 90,
    endTime: new Date(session2Start.getTime() + 90 * 60000),
    status: 'completed',
    agendaItems: [{ title: 'Customer pipeline review', duration: 60 }],
    notes: { summary: 'Refined outreach plan', actionItems: ['Email 50 prospects'] },
    location: 'In-person',
  });

  const amount2 = coach2.hourlyRate ? coach2.hourlyRate * (session2.duration / 60) : 225;
  const invoiceNumber2 = `INV-${Date.now()}-N1`;
  const payment2 = await PaymentModel.create({
    organizationId: org2._id,
    coachId: coach2._id,
    sessionIds: [session2._id],
    lineItems: [
      {
        sessionId: session2._id,
        description: 'Coaching session (90m)',
        duration: session2.duration,
        rate: coach2.hourlyRate ?? 150,
        amount: amount2,
      },
    ],
    amount: amount2,
    taxAmount: Math.round(amount2 * 0.2 * 100) / 100,
    totalAmount: amount2 + Math.round(amount2 * 0.2 * 100) / 100,
    currency: 'GBP',
    status: 'paid',
    paidAt: new Date(),
    invoiceNumber: invoiceNumber2,
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
  });

  session2.paymentId = payment2._id;
  await session2.save();

  console.log('Created sample sessions and payments');

  console.log('Seeding complete.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeder error:', err);
  process.exit(1);
});
