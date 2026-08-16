import { z } from "zod"
import { BUSINESS_TYPES, COMPANY_ROLES, INDUSTRIES } from "@/lib/constants"

const companyRoleValues = COMPANY_ROLES.map((r) => r.value) as [
  "supplier",
  "buyer",
  "both",
]

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(120, "Full name is too long"),
    email: z.string().trim().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    companyName: z
      .string()
      .trim()
      .min(2, "Company name must be at least 2 characters")
      .max(200, "Company name is too long"),
    businessType: z.enum(BUSINESS_TYPES, {
      message: "Select a business type",
    }),
    industry: z.enum(INDUSTRIES, {
      message: "Select an industry",
    }),
    role: z.enum(companyRoleValues, {
      message: "Select a role",
    }),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(20, "Phone number is too long")
      .regex(/^[\d\s+\-()]+$/, "Enter a valid phone number"),
    city: z
      .string()
      .trim()
      .min(2, "City is required")
      .max(100, "City name is too long"),
    state: z
      .string()
      .trim()
      .min(2, "State is required")
      .max(100, "State name is too long"),
    country: z
      .string()
      .trim()
      .min(2, "Country is required")
      .max(100, "Country name is too long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name is too long"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(/^[\d\s+\-()]+$/, "Enter a valid phone number"),
  companyName: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name is too long"),
  businessType: z.enum(BUSINESS_TYPES, {
    message: "Select a business type",
  }),
  industry: z.enum(INDUSTRIES, {
    message: "Select an industry",
  }),
  role: z.enum(companyRoleValues, {
    message: "Select a role",
  }),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100, "City name is too long"),
  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(100, "State name is too long"),
  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(100, "Country name is too long"),
  description: z.string().trim().max(2000, "Description is too long").optional(),
  website: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^https?:\/\/.+/i.test(val),
      "Enter a valid URL (include https://)",
    )
    .optional(),
  address: z.string().trim().max(300, "Address is too long").optional(),
  postalCode: z.string().trim().max(20, "Postal code is too long").optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>

export interface BusinessProfileInput {
  fullName: string
  phone: string
  companyName: string
  businessType: string
  industry: string
  role: "supplier" | "buyer" | "both"
  city: string
  state: string
  country: string
  description?: string
  website?: string
  address?: string
  postalCode?: string
}
