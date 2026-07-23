# New UI Component Usage Guide

## Quick Start

### Import the ThemeProvider (Already done in main.tsx)
```typescript
import { ThemeProvider } from './theme/ThemeProvider';

// Wrap your app
<ThemeProvider>
  <App />
</ThemeProvider>
```

---

## Design System Colors

### Usage in JSX:
```typescript
import { colorPalette } from './theme/colors';

// Access colors
colorPalette.primary[500]        // #0ea5e9
colorPalette.student.main        // #3b82f6
colorPalette.teacher.gradient    // "from-green-400 to-green-600"
colorPalette.performance.gold    // #FFD700
```

---

## Animation Variants

### Pre-made Animations:
```typescript
import { animationVariants } from './theme/animations';

// Usage with motion components
<motion.div
  variants={animationVariants.slideInUp}
  initial="initial"
  animate="animate"
>
  Content
</motion.div>

// Available variants:
- fadeIn
- slideInUp / slideInDown / slideInLeft / slideInRight
- scaleIn
- staggerContainer / staggerItem
- hoverScale / hoverLift
```

---

## Reusable Components

### 1. Card Component
```typescript
import { Card } from './theme/components';

<Card 
  gradient={true}           // Add gradient background
  hover={true}              // Add hover lift effect
  role="admin"              // Sets gradient: purple
  noPadding={false}         // Remove padding
>
  Content here
</Card>

// Role options: 'admin' | 'student' | 'teacher'
```

### 2. Button Component
```typescript
import { Button } from './theme/components';

<Button
  variant="primary"         // Options: primary, secondary, ghost, danger, success
  size="md"                 // Options: sm, md, lg
  loading={false}           // Show loading spinner
  className="custom-class"
>
  Click Me
</Button>
```

### 3. StatCard Component
```typescript
import { StatCard } from './theme/components';

<StatCard
  icon={<Users className="w-5 h-5" />}
  label="Total Students"
  value={245}
  change={{ value: 12, isPositive: true }}
  gradient="from-blue-500 to-blue-600"
  role="student"            // Sets gradient automatically
/>
```

### 4. ProgressRing Component
```typescript
import { ProgressRing } from './theme/components';

<ProgressRing
  progress={75}             // 0-100
  size="md"                 // Options: sm, md, lg
  label="Progress"
  color="blue"              // Options: blue, green, orange, red, purple
/>
```

### 5. Badge Component
```typescript
import { Badge } from './theme/components';

<Badge 
  variant="success"         // Options: primary, success, warning, error, info
  size="md"                 // Options: sm, md
>
  Label
</Badge>
```

### 6. Alert Component
```typescript
import { Alert } from './theme/components';

<Alert
  variant="error"           // Options: info, success, warning, error
  title="Error Title"
  onClose={() => setError('')}
>
  Error message content
</Alert>
```

---

## Animation Components

### PageTransition
```typescript
import { PageTransition } from './theme/animations';

<PageTransition className="p-8">
  Page content with fade-in animation
</PageTransition>
```

### StaggerList (with StaggerItem)
```typescript
import { StaggerList, StaggerItem } from './theme/animations';

<StaggerList className="grid grid-cols-3 gap-4">
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card>{item.name}</Card>
    </StaggerItem>
  ))}
</StaggerList>
```

### HoverCard
```typescript
import { HoverCard } from './theme/animations';

<HoverCard className="p-4">
  Lifts on hover with smooth animation
</HoverCard>
```

### AnimatedProgressBar
```typescript
import { AnimatedProgressBar } from './theme/animations';

<AnimatedProgressBar 
  progress={65}
  className="mb-4"
/>
```

### SpinningLoader
```typescript
import { SpinningLoader } from './theme/animations';

<SpinningLoader 
  size="md"                 // Options: sm, md, lg
  className="mx-auto"
/>
```

---

## Dark Mode Usage

### Toggle Theme:
```typescript
import { useTheme } from './theme/ThemeProvider';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Dark Mode
    </button>
  );
}
```

### Auto Dark Mode Classes:
All Tailwind classes work with dark mode:
```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Automatically switches colors based on theme
</div>
```

---

## Tailwind CSS Custom Classes

### Custom Animations:
```css
/* In index.css */
.animate-gradient-flow     /* Flowing gradient animation */
.animate-float             /* Floating up/down animation */
.animate-pulse-glow        /* Glowing pulse effect */
```

### Custom Utilities:
```typescript
<div className="truncate-lines-2">          {/* 2-line ellipsis */}
<div className="glass-effect">              {/* Glassmorphism effect */}
<span className="gradient-text">Text</span> {/* Gradient text */}
```

---

## Common Patterns

### Page with Header + Stats
```typescript
<PageTransition>
  <div className="p-8">
    {/* Header */}
    <motion.div 
      variants={animationVariants.slideInDown}
      initial="initial"
      animate="animate"
      className="mb-8"
    >
      <h1 className="text-4xl font-bold">Page Title</h1>
    </motion.div>

    {/* Stats */}
    <StaggerList className="grid grid-cols-4 gap-6 mb-8">
      <StaggerItem>
        <StatCard ... />
      </StaggerItem>
      {/* More stats */}
    </StaggerList>

    {/* Content */}
    <Card>Content</Card>
  </div>
</PageTransition>
```

### Form with Validation
```typescript
import { Button, Alert } from './theme/components';

<form onSubmit={handleSubmit} className="space-y-4">
  {error && (
    <Alert 
      variant="error" 
      title="Error"
      onClose={() => setError('')}
    >
      {error}
    </Alert>
  )}
  
  <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
  
  <Button type="submit" variant="primary" loading={loading}>
    Submit
  </Button>
</form>
```

### Dashboard Grid
```typescript
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <Card gradient role="student" hover>
    Card 1
  </Card>
  <Card gradient role="admin" hover>
    Card 2
  </Card>
  <Card gradient role="teacher" hover>
    Card 3
  </Card>
</div>
```

---

## Tips & Best Practices

1. **Always use PageTransition** for page-level components
2. **Use StaggerList** for lists of items to create cascading animations
3. **Combine with motion** for more complex animations
4. **Test dark mode** while developing
5. **Use role props** on Cards/StatCards for automatic coloring
6. **Keep animations under 400ms** for better UX
7. **Use variant props** instead of writing custom CSS
8. **Check Recharts integration** for chart examples in dashboards

---

## File Locations

- **Theme System**: `src/theme/`
  - `colors.ts` - Color definitions
  - `ThemeProvider.tsx` - Dark mode provider
  - `animations.tsx` - Animation utilities
  - `components.tsx` - Component library

- **Dashboards**: `src/components/`
  - `admin/AdminQuizDashboardNew.tsx`
  - `StudentPortal.tsx`
  - `layouts/AdminLayout.tsx`
  - `layouts/TeacherLayoutNew.tsx`
  - `auth/StudentAuthNew.tsx`

---

## Import Examples

```typescript
// Colors
import { colorPalette } from '../theme/colors';

// Theme
import { useTheme } from '../theme/ThemeProvider';

// Animations
import { 
  animationVariants, 
  PageTransition, 
  StaggerList, 
  StaggerItem,
  HoverCard,
  AnimatedProgressBar,
  SpinningLoader
} from '../theme/animations';

// Components
import { 
  Card, 
  Button, 
  StatCard, 
  Badge, 
  Alert, 
  ProgressRing,
  SkeletonCard
} from '../theme/components';

// Framer Motion
import { motion } from 'framer-motion';
```

---

## Troubleshooting

### Dark mode not working?
- Ensure `<ThemeProvider>` wraps your app in `main.tsx`
- Check that `<html class="dark">` is set by next-themes

### Animations not smooth?
- Check browser console for performance issues
- Use Chrome DevTools Performance tab
- Reduce animation duration if needed

### Components not styled?
- Verify Tailwind CSS is imported in `index.css`
- Check dark mode classes are being applied
- Clear browser cache

---

**Last Updated**: June 8, 2026
**Status**: Ready for production
