import { describe, it, expect } from 'vitest';
import { applyFiltering } from '../../src/routes/filtering.js';
import { applySorting } from '../../src/routes/sorting.js';
import { applySearching } from '../../src/routes/searching.js';
import { applyPagination } from '../../src/routes/pagination.js';

describe('Query Routes Utilities', () => {
  const dataset = [
    { id: 1, name: 'Apple iPhone', price: 999, category: 'tech', inStock: true },
    { id: 2, name: 'Google Pixel', price: 799, category: 'tech', inStock: false },
    { id: 3, name: 'Coffee Mug', price: 15, category: 'kitchen', inStock: true },
    { id: 4, name: 'Desk Lamp', price: 45, category: 'furniture', inStock: true }
  ];

  it('filters by exact match and operators (_gt, _lte, _in, _ne)', () => {
    expect(applyFiltering(dataset, { category: 'tech' })).toHaveLength(2);
    expect(applyFiltering(dataset, { price_gt: 50 })).toHaveLength(2);
    expect(applyFiltering(dataset, { price_lte: 45 })).toHaveLength(2);
    expect(applyFiltering(dataset, { category_in: 'tech,kitchen' })).toHaveLength(3);
    expect(applyFiltering(dataset, { inStock: 'false' })).toHaveLength(1);
    expect(applyFiltering(dataset, { category_ne: 'tech' })).toHaveLength(2);
  });

  it('sorts ascending and descending', () => {
    const asc = applySorting(dataset, 'price', 'asc');
    expect(asc[0].price).toBe(15);
    expect(asc[3].price).toBe(999);

    const desc = applySorting(dataset, 'price', 'desc');
    expect(desc[0].price).toBe(999);
    expect(desc[3].price).toBe(15);
  });

  it('searches across fields with case-insensitivity', () => {
    const found = applySearching(dataset, 'pixel', ['name', 'category']);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('Google Pixel');

    const techFound = applySearching(dataset, 'tech', ['category']);
    expect(techFound).toHaveLength(2);
  });

  it('paginates items with metadata', () => {
    const result = applyPagination(dataset, 1, 2);
    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.total).toBe(4);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPreviousPage).toBe(false);
  });
});
