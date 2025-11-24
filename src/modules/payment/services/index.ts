import { BaseService } from '../../_shared/base-services';
import { PaymentModel, IPayment } from '../model';

export class PaymentService extends BaseService<IPayment> {
  constructor() {
    super(PaymentModel);
  }
}

export const paymentService = new PaymentService();
