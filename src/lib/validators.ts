import { z } from "zod/v4";

// ─── Auth ───
export const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Onboarding ───
export const onboardingStep1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  timezone: z.string().min(1, "Timezone is required"),
});

export const onboardingStep2Schema = z.object({
  skillsOffered: z.array(z.string().min(1)).min(1, "Add at least one skill you offer"),
});

export const onboardingStep3Schema = z.object({
  skillsWanted: z.array(z.string().min(1)).min(1, "Add at least one skill you want"),
});

export const completeOnboardingSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema);

// ─── Skill Listing ───
export const categories = [
  "Programming",
  "Design",
  "Music",
  "Languages",
  "Cooking",
  "Fitness",
  "Business",
  "Arts & Crafts",
  "Photography",
  "Writing",
  "Mathematics",
  "Science",
  "Other",
] as const;

export type Category = (typeof categories)[number];

export const createListingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  category: z.enum(categories),
  tags: z.array(z.string().min(1)).max(10, "Maximum 10 tags"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  creditCost: z.number().int().min(1, "Minimum 1 credit").max(500, "Maximum 500 credits"),
  availability: z.enum(["WEEKDAYS", "WEEKENDS", "BOTH", "FLEXIBLE"]),
});

export const updateListingSchema = createListingSchema.partial();

export const listingQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  minCredits: z.coerce.number().int().optional(),
  maxCredits: z.coerce.number().int().optional(),
  sort: z.enum(["newest", "highest_rated", "lowest_cost"]).default("newest"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// ─── Session ───
export const createSessionSchema = z.object({
  listingId: z.string().min(1),
  scheduledAt: z.string().datetime("Invalid datetime"),
  durationMinutes: z.number().int().min(15).max(480).default(60),
});

export const updateSessionStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
});

// ─── Review ───
export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Minimum 1 star").max(5, "Maximum 5 stars"),
  comment: z.string().max(1000, "Comment must be under 1000 characters").optional(),
});

// ─── Transaction ───
export const transactionQuerySchema = z.object({
  type: z.enum(["EARN", "SPEND", "REFUND"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─── Notification ───
export const notificationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─── API Response ───
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});

// ─── Types ───
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingQueryInput = z.infer<typeof listingQuerySchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionStatusInput = z.infer<typeof updateSessionStatusSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
