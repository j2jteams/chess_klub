import { 
  Music, 
  Utensils, 
  GraduationCap, 
  Film, 
  Users, 
  Trophy, 
  Palette,
  Building
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon?: React.ReactNode;
  description?: string;
}

// Main event categories used across the application
export const EVENT_CATEGORIES: Category[] = [
  { 
    id: 'music', 
    name: 'Music', 
    icon: <Music className="h-4 w-4" />,
    description: 'Concerts, festivals, live performances'
  },
  { 
    id: 'food-drink', 
    name: 'Food & Drink', 
    icon: <Utensils className="h-4 w-4" />,
    description: 'Restaurants, bars, food festivals, wine tastings'
  },
  { 
    id: 'education', 
    name: 'Education', 
    icon: <GraduationCap className="h-4 w-4" />,
    description: 'Workshops, seminars, courses, conferences'
  },
  { 
    id: 'entertainment', 
    name: 'Entertainment', 
    icon: <Film className="h-4 w-4" />,
    description: 'Movies, theater, comedy shows, events'
  },
  { 
    id: 'community', 
    name: 'Community', 
    icon: <Users className="h-4 w-4" />,
    description: 'Local gatherings, meetups, volunteer activities'
  },
  { 
    id: 'sports', 
    name: 'Sports', 
    icon: <Trophy className="h-4 w-4" />,
    description: 'Games, fitness, outdoor activities'
  },
  { 
    id: 'arts-culture', 
    name: 'Arts & Culture', 
    icon: <Palette className="h-4 w-4" />,
    description: 'Museums, galleries, cultural events'
  },
  { 
    id: 'business', 
    name: 'Business', 
    icon: <Building className="h-4 w-4" />,
    description: 'Networking, conferences, professional development'
  }
];


// Legacy categories for backward compatibility
export const LEGACY_CATEGORIES = [
  { id: 'all', name: 'All Events' },
  ...EVENT_CATEGORIES
];

// Helper functions
export const getCategoryById = (id: string): Category | undefined => {
  return EVENT_CATEGORIES.find(category => category.id === id);
};

export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category?.name || 'Unknown Category';
};

export const getCategoryIcon = (id: string): React.ReactNode => {
  const category = getCategoryById(id);
  return category?.icon || null;
};

// Map old category IDs to new ones for migration
export const CATEGORY_ID_MAP: Record<string, string> = {
  'food': 'food-drink',
  'arts': 'arts-culture',
  'charity': 'community',
  'health': 'health-wellness'
};