'use client';

import { cn } from '@/lib/utils';

interface SkillLevelIndicatorProps {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const levelConfig = {
  beginner: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '🟢',
    label: 'Beginner',
    description: 'Perfect for those new to this skill'
  },
  intermediate: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '🔵',
    label: 'Intermediate',
    description: 'Some experience recommended'
  },
  advanced: {
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: '🟣',
    label: 'Advanced',
    description: 'Solid foundation required'
  },
  expert: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: '🟠',
    label: 'Expert',
    description: 'For experienced practitioners'
  }
};

export function SkillLevelIndicator({ level, size = 'md', showIcon = true }: SkillLevelIndicatorProps) {
  const config = levelConfig[level] || levelConfig.beginner;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold',
        size === 'sm' ? 'text-xs' : 'text-sm',
        config.color
      )}
    >
      {showIcon && (
        <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>
          {config.icon}
        </span>
      )}
      {config.label}
    </span>
  );
}

// Optional: Component for displaying level with more details
export function SkillLevelCard({ level, description }: { level: SkillLevelIndicatorProps['level']; description?: string }) {
  const config = levelConfig[level];
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border">
      <SkillLevelIndicator level={level} size="sm" />
      <div className="text-xs text-muted-foreground">
        {description || config.description}
      </div>
    </div>
  );
}

// Optional: Progress bar for learning progress
export function SkillProgressIndicator({ progress, level }: { progress: number; level: SkillLevelIndicatorProps['level'] }) {
  const config = levelConfig[level];
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={config.color}>{config.label}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div 
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            config.color
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}