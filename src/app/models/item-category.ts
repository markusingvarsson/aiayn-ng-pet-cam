export interface ItemCategory {
  name: string;
  value: ItemCategoryType;
}

export type ItemCategoryType =
  | 'bed'
  | 'bowl'
  | 'chair'
  | 'couch'
  | 'laptop'
  | 'oven'
  | 'refrigerator'
  | 'television'
  | 'toilet'
  | 'cell phone';

export const availableItems: ItemCategory[] = [
  { name: 'Bed', value: 'bed' },
  { name: 'Bowl', value: 'bowl' },
  { name: 'Chair', value: 'chair' },
  { name: 'Couch', value: 'couch' },
  { name: 'Laptop', value: 'laptop' },
  { name: 'Oven', value: 'oven' },
  { name: 'Refrigerator', value: 'refrigerator' },
  { name: 'Television', value: 'television' },
  { name: 'Toilet', value: 'toilet' },
  { name: 'Cell Phone', value: 'cell phone' },
];
