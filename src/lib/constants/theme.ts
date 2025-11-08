// Chess Klub Theme Configuration
// This file contains the centralized theme configuration for consistent styling

export const THEME_CONFIG = {
  // Current Theme: Chess Klub - Deep Blue
  name: 'chess-klub',
  
  // Tailwind classes that use theme colors - use these for consistent styling
  classes: {
    // Primary button styling
    primaryButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
    primaryButtonOutline: 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground',
    
    // Secondary button styling  
    secondaryButton: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    
    // Accent button styling
    accentButton: 'bg-accent text-accent-foreground hover:bg-accent/90',
    
    // Link styling
    link: 'text-primary hover:text-primary/80 hover:underline',
    
    // Input field styling
    input: 'border-input bg-background text-foreground focus:ring-primary focus:border-primary',
    
    // Card styling
    card: 'bg-card text-card-foreground border',
    
    // Badge/tag styling
    badge: 'bg-primary/10 text-primary border-primary/20',
    
    // Focus ring
    focusRing: 'focus:ring-2 focus:ring-primary focus:ring-offset-2',
  },
} as const;