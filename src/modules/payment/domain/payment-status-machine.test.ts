import { PaymentStatus } from '@prisma/client';
import { isValidPaymentTransition } from './payment-status-machine';

describe('payment-status-machine', () => {
  describe('isValidPaymentTransition', () => {
    describe('valid transitions', () => {
      it('PENDING -> COMPLETED', () => {
        expect(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.COMPLETED)).toBe(true);
      });

      it('PENDING -> FAILED', () => {
        expect(isValidPaymentTransition(PaymentStatus.PENDING, PaymentStatus.FAILED)).toBe(true);
      });

      it('COMPLETED -> REFUNDED', () => {
        expect(isValidPaymentTransition(PaymentStatus.COMPLETED, PaymentStatus.REFUNDED)).toBe(
          true,
        );
      });
    });

    describe('invalid transitions', () => {
      it('REFUNDED -> COMPLETED', () => {
        expect(isValidPaymentTransition(PaymentStatus.REFUNDED, PaymentStatus.COMPLETED)).toBe(
          false,
        );
      });

      it('FAILED -> PENDING', () => {
        expect(isValidPaymentTransition(PaymentStatus.FAILED, PaymentStatus.PENDING)).toBe(false);
      });

      it('COMPLETED -> PENDING', () => {
        expect(isValidPaymentTransition(PaymentStatus.COMPLETED, PaymentStatus.PENDING)).toBe(
          false,
        );
      });

      it('REFUNDED -> PENDING', () => {
        expect(isValidPaymentTransition(PaymentStatus.REFUNDED, PaymentStatus.PENDING)).toBe(false);
      });
    });
  });
});
