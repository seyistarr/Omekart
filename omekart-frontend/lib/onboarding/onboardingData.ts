export interface HubItem {
  id: string;
  name: string;
  img: string;
}

export const HUB_MATRIX_DATA: HubItem[] = [
  {
    id: 'h1',
    name: 'Electronics & Tech',
    img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'h2',
    name: 'Apparel & Fashion',
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'h3',
    name: 'Restaurant Food',
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'h4',
    name: 'Handymen Matrix',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'h5',
    name: 'Beauty Care',
    img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'h6',
    name: 'Supermarket',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=240&q=80',
  },
];

export const SIMULATED_CAMERA_ASSETS = [
  '/onboarding/image_4.jpg',
  '/onboarding/image_5.jpg',
  '/onboarding/image_6.jpg',
  '/onboarding/image_7.jpg',
  '/onboarding/image_8.jpg',
  '/onboarding/image_9.jpg',
  '/onboarding/image_10.jpg',
];

export const DEFAULT_LAT_LNG: [number, number] = [6.5244, 3.3792];
