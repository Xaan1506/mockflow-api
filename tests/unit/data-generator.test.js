import { describe, it, expect } from 'vitest';
import { generateDataset } from '../../src/generators/data-generator.js';
import { generateFieldValue } from '../../src/generators/field-generator.js';
import { validateSchema } from '../../src/core/schema.js';

describe('Data Generator', () => {
  it('generates expected count of items and supported field types', () => {
    const schema = validateSchema({
      users: {
        count: 10,
        fields: {
          name: 'fullName',
          email: 'email',
          age: { type: 'integer', min: 18, max: 40 },
          role: { type: 'string', values: ['admin', 'member'] }
        }
      }
    });

    const data = generateDataset(schema, { seed: 42 });
    expect(data.users).toHaveLength(10);
    expect(typeof data.users[0].name).toBe('string');
    expect(typeof data.users[0].email).toBe('string');
    expect(data.users[0].email).toContain('@');
    expect(data.users[0].age).toBeGreaterThanOrEqual(18);
    expect(data.users[0].age).toBeLessThanOrEqual(40);
    expect(['admin', 'member']).toContain(data.users[0].role);
  });

  it('supports custom field generators', () => {
    const customGenerators = {
      customCode: () => 'CODE_999'
    };

    const val = generateFieldValue({ type: 'customCode' }, customGenerators);
    expect(val).toBe('CODE_999');
  });

  it('generates deterministic data with identical seed', () => {
    const schema = validateSchema({
      items: {
        count: 3,
        fields: { name: 'productName' }
      }
    });

    const dataset1 = generateDataset(schema, { seed: 999 });
    const dataset2 = generateDataset(schema, { seed: 999 });

    expect(dataset1.items).toEqual(dataset2.items);
  });
});
