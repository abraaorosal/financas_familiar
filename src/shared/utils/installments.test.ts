import { describe, expect, it } from 'vitest';
import { splitInstallmentsInCents } from './installments';

describe('splitInstallmentsInCents', () => {
  it('splits total evenly when divisible', () => {
    expect(splitInstallmentsInCents(9000, 3)).toEqual([3000, 3000, 3000]);
  });

  it('distributes remainder across first installments', () => {
    expect(splitInstallmentsInCents(1000, 3)).toEqual([334, 333, 333]);
  });

  it('throws for invalid parameters', () => {
    expect(() => splitInstallmentsInCents(0, 2)).toThrow();
    expect(() => splitInstallmentsInCents(1000, 0)).toThrow();
  });
});
