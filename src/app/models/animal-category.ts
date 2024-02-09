export interface AnimalCategory {
  name: string;
  value: AnimalCategoryType;
}

export type AnimalCategoryType = 'cat' | 'dog' | 'bird' | 'person';

export const availablePets: AnimalCategory[] = [
  { name: 'Cat', value: 'cat' },
  { name: 'Dog', value: 'dog' },
  { name: 'Bird', value: 'bird' },
  { name: 'Person', value: 'person' },
];
