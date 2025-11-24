import { Router } from 'express';
import routes from './routes';
import markPaidRouter from './mark-paid';
import invoiceRouter from './invoice';
import sendRouter from './send';

const router = Router({ mergeParams: true });

// Subresources
router.use('/mark-paid', markPaidRouter);
router.use('/invoice', invoiceRouter);
router.use('/send', sendRouter);

// Base routes (GET, PATCH)
router.use('/', routes);

export default router;
