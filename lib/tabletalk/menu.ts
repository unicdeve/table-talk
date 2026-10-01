export const categories = ['Mains', 'Sides', 'Drinks'] as const;

export type Category = (typeof categories)[number];

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  vegetarian: boolean;
  available: boolean;
};

export const menu: MenuItem[] = [
  {
    id: 'jollof',
    name: 'Smoky jollof rice',
    description: 'Party-style tomato rice, charred peppers and a little heat.',
    price: 4500,
    category: 'Mains',
    vegetarian: true,
    available: true,
  },
  {
    id: 'chicken',
    name: 'Suya grilled chicken',
    description: 'Flame-grilled chicken with a rich, nutty suya spice rub.',
    price: 6500,
    category: 'Mains',
    vegetarian: false,
    available: true,
  },
  {
    id: 'beans',
    name: 'Ewa agoyin bowl',
    description: 'Soft beans, slow-cooked pepper sauce and golden plantain.',
    price: 5000,
    category: 'Mains',
    vegetarian: true,
    available: true,
  },
  {
    id: 'fish',
    name: 'Peppered grilled fish',
    description: 'Grilled fish finished with our house pepper sauce.',
    price: 9000,
    category: 'Mains',
    vegetarian: false,
    available: false,
  },
  {
    id: 'plantain',
    name: 'Golden plantain',
    description: 'Sweet ripe plantain, fried until the edges turn golden.',
    price: 2000,
    category: 'Sides',
    vegetarian: true,
    available: true,
  },
  {
    id: 'salad',
    name: 'Garden salad',
    description: 'Cucumber, tomato and crunchy greens with citrus dressing.',
    price: 2500,
    category: 'Sides',
    vegetarian: true,
    available: true,
  },
  {
    id: 'moi-moi',
    name: 'Steamed moi moi',
    description: 'A soft steamed bean pudding with peppers. No egg or fish.',
    price: 2500,
    category: 'Sides',
    vegetarian: true,
    available: true,
  },
  {
    id: 'zobo',
    name: 'Hibiscus zobo',
    description: 'Chilled hibiscus, pineapple and a bright ginger finish.',
    price: 1500,
    category: 'Drinks',
    vegetarian: true,
    available: true,
  },
  {
    id: 'lemonade',
    name: 'Fresh lemonade',
    description: 'Fresh lemon, a little sugar and plenty of ice.',
    price: 2000,
    category: 'Drinks',
    vegetarian: true,
    available: true,
  },
];

export type MenuFilters = {
  query?: string;
  category?: Category;
  vegetarian?: boolean;
  maxPrice?: number;
};

export function searchMenu(filters: MenuFilters) {
  const query = filters.query?.toLowerCase().trim() ?? '';
  
  return menu.filter(
    (item) =>
      (!query || `${item.name} ${item.description}`.toLowerCase().includes(query)) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.vegetarian || item.vegetarian) &&
      (filters.maxPrice === undefined || item.price <= filters.maxPrice),
  );
}

export function isMenuItemId(id: string) {
  return menu.some((item) => item.id === id);
}

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export const money = (value: number) => nairaFormatter.format(value);
