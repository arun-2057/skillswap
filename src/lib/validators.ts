import { z } from 'zod';

const nonEmptyString = (message: string) => z.string().trim().min(1, message);

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().trim().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: nonEmptyString('Name must be at least 2 characters').min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().trim().min(6, 'Password must be at least 6 characters'),
});

export const emailSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
});

export const createReviewSchema = z.object({
  sessionId: nonEmptyString('Session ID is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional(),
});

export const categories = [
  'Technology',
  'Language',
  'Music',
  'Art',
  'Sports',
  'Cooking',
  'Business',
  'Science',
  'Mathematics',
  'Writing',
  'Photography',
  'Design',
  'Programming',
  'Marketing',
  'Fitness',
  'Yoga',
  'Meditation',
  'Other',
] as const;

export const categorySchema = z.enum(categories);

export const createListingSchema = z.object({
  title: nonEmptyString('Title is required'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  category: categorySchema,
  tags: z.array(z.string()).optional(),
  availability: nonEmptyString('Availability is required'),
});

export const completeOnboardingSchema = z.object({
  name: nonEmptyString('Name must be at least 2 characters').min(2, 'Name must be at least 2 characters'),
  bio: z.string().trim().min(10, 'Bio must be at least 10 characters').optional(),
  timezone: nonEmptyString('Timezone is required'),
  skillsOffered: z.array(z.string()).min(1, 'At least one skill you offer is required'),
  skillsWanted: z.array(z.string()).min(1, 'At least one skill you want is required'),
});

export const swapProposalSchema = z.object({
  receiverId: z.string().trim().uuid('Invalid user ID'),
  proposerSkillId: z.string().trim().uuid('Please select one of your skills to offer'),
  receiverSkillId: z.string().trim().uuid('Invalid target skill'),
  proposedTime: z.string().trim().datetime({ message: 'Please select a valid date and time' }),
  duration: z.number().min(15, 'Minimum swap duration is 15 minutes'),
});

export type SwapProposalInput = z.infer<typeof swapProposalSchema>;