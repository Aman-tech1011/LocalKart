// Runtime validation coverage for category product filtering and missing product photos.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/axios';
import HomePage from './HomePage';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
  getAssetUrl: (assetPath) => assetPath,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

const products = [
  {
    id: 'buds',
    title: 'Realme Buds T310',
    category: 'Audio',
    price: 1700,
    condition: 'Like New',
    description: 'Wireless earbuds in great working condition.',
    location: 'Ansh Hostel',
    status: 'active',
    isDemo: true,
    createdAt: '2027-01-01T00:00:00.000Z',
    images: [],
    seller: { name: 'Abhay' },
  },
  {
    id: 'headphones',
    title: 'Wireless Headphones',
    category: 'Audio',
    price: 2200,
    condition: 'Good',
    description: 'Comfortable headphones for classes and music.',
    location: 'Library Road',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    images: [],
    seller: { name: 'Maya' },
  },
  {
    id: 'textbook',
    title: 'Data Structures Textbook',
    category: 'Books',
    price: 450,
    condition: 'Good',
    description: 'A clean copy of the course textbook.',
    location: 'Academic Block',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    images: [],
    seller: { name: 'Ravi' },
  },
];

let container;
let root;

const renderHomePage = async (listings = products, initialEntry = '/') => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  vi.mocked(api.get).mockResolvedValue({ data: listings });

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <HomePage />
      </MemoryRouter>
    );
    await Promise.resolve();
  });
};

describe('homepage product browser', () => {
  beforeEach(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    if (root) act(() => root.unmount());
    container?.remove();
    delete HTMLElement.prototype.scrollIntoView;
    root = null;
    container = null;
    vi.clearAllMocks();
  });

  it('renders separate category rails and scrolls to the selected category', async () => {
    await renderHomePage();

    expect(container.querySelectorAll('.category-product-rail')).toHaveLength(2);
    expect(container.querySelectorAll('.product-card-rail')).toHaveLength(3);
    expect(container.querySelector('.product-grid')).toBeNull();
    expect(container.textContent).not.toContain('Buy from students near you');

    const booksTile = [...container.querySelectorAll('.category-tile')]
      .find((tile) => tile.textContent.includes('Books'));
    act(() => booksTile.click());

    expect(container.querySelectorAll('.category-product-rail')).toHaveLength(2);
    expect(container.querySelector('#category-books')).toBeTruthy();
    expect(container.querySelectorAll('.product-card-rail')).toHaveLength(3);
    expect(container.querySelector('[aria-label="Books listings"] .product-card-rail h3').textContent).toContain('Data Structures Textbook');
    expect(booksTile.getAttribute('aria-pressed')).toBe('true');
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('shows all categories by default and applies the max-price slider across their rails', async () => {
    await renderHomePage();

    expect(container.querySelectorAll('.category-product-rail')).toHaveLength(2);
    const booksTile = [...container.querySelectorAll('.category-tile')]
      .find((tile) => tile.textContent.includes('Books'));
    act(() => booksTile.click());

    act(() => container.querySelector('.category-heading .text-link').click());
    expect(container.querySelectorAll('.product-card-rail')).toHaveLength(3);
    expect(container.querySelector('.category-tile[aria-pressed="true"]')).toBeNull();
    expect(container.querySelector('.product-browser-heading h2').textContent).toBe('Campus marketplace');

    const priceRange = container.querySelector('#priceRange');
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(priceRange, '1500');
      priceRange.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(container.querySelectorAll('.category-product-rail')).toHaveLength(1);
    expect(container.querySelector('.category-product-rail h3').textContent).toContain('Data Structures Textbook');
  });

  it('scrolls to a category after switching away from a search with no matching rail', async () => {
    await renderHomePage(products, '/?search=headphones');

    expect(container.querySelectorAll('.category-product-rail')).toHaveLength(1);
    const booksTile = [...container.querySelectorAll('.category-tile')]
      .find((tile) => tile.textContent.includes('Books'));
    act(() => booksTile.click());

    expect(container.querySelector('#category-books')).toBeTruthy();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('scrolls each category rail independently from its arrow controls', async () => {
    await renderHomePage();

    const audioRail = container.querySelector('[aria-label="Audio listings"]');
    const booksRail = container.querySelector('[aria-label="Books listings"]');
    const scrollBy = vi.fn();
    Object.defineProperty(audioRail, 'clientWidth', { configurable: true, value: 1000 });
    audioRail.scrollBy = scrollBy;

    act(() => {
      container.querySelector('[aria-label="Scroll Audio products right"]').click();
    });

    expect(scrollBy).toHaveBeenCalledWith({ left: 800, behavior: 'smooth' });
    expect(booksRail.scrollBy).toBeUndefined();
  });

  it('puts seller listings before dummy listings in each category rail', async () => {
    await renderHomePage();

    const audioTitles = [...container.querySelectorAll('[aria-label="Audio listings"] .product-card-rail h3')]
      .map((heading) => heading.textContent);

    expect(audioTitles[0]).toBe('Wireless Headphones');
    expect(audioTitles[1]).toBe('Realme Buds T310');
  });

  it('limits each category rail to 20 listings', async () => {
    const audioListings = Array.from({ length: 25 }, (_, index) => ({
      ...products[1],
      id: `audio-${index}`,
      title: `Audio listing ${index}`,
      createdAt: new Date(2026, 0, index + 1).toISOString(),
    }));
    await renderHomePage(audioListings);

    expect(container.querySelectorAll('[aria-label="Audio listings"] .product-card-rail')).toHaveLength(20);
  });

  it('shows a real earbuds photo when a Buds listing has no uploaded image', async () => {
    await renderHomePage();

    const budsImage = container.querySelector('[aria-label="Audio listings"] img[alt="Realme Buds T310"]');

    expect(budsImage.getAttribute('src')).toContain('images.unsplash.com/photo-1606220945770-b5b6c2c55bf1');
  });
});
