import { describe, expect, it } from 'vitest';
import { calculateInvoiceByPurchaseDate } from './cardCycle';

describe('calculateInvoiceByPurchaseDate', () => {
  it('keeps purchase before closure in current invoice', () => {
    const result = calculateInvoiceByPurchaseDate('2026-03-05', 10, 17);
    expect(result.invoiceMonth).toBe('2026-03');
    expect(result.dueDate).toBe('2026-03-17');
  });

  it('moves purchase after closure to next invoice', () => {
    const result = calculateInvoiceByPurchaseDate('2026-03-25', 10, 17);
    expect(result.invoiceMonth).toBe('2026-04');
    expect(result.dueDate).toBe('2026-04-17');
  });

  it('handles due date in following month when due day <= closure day', () => {
    const result = calculateInvoiceByPurchaseDate('2026-03-05', 25, 5);
    expect(result.invoiceMonth).toBe('2026-04');
    expect(result.dueDate).toBe('2026-04-05');
  });
});
