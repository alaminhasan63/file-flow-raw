import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms of service'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const businessBasicsSchema = z.object({
  state: z.string().min(2, 'Please select a state'),
  entityType: z.enum(['LLC', 'CORP', 'NONPROFIT', 'OTHER']),
  legalName: z.string().min(2, 'Legal name is required'),
  dba: z.string().optional(),
  needsRegisteredAgent: z.boolean().default(false),
})

export const applicantInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(5, 'ZIP code is required'),
  }),
})

export const memberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  ownershipPercent: z.number().min(0).max(100, 'Ownership must be between 0-100%'),
  isManager: z.boolean().default(false),
})

export const membersManagersSchema = z.object({
  members: z.array(memberSchema).min(1, 'At least one member is required'),
})

export const packageSelectionSchema = z.object({
  packageId: z.string().min(1, 'Please select a package'),
  addons: z.array(z.string()).default([]),
})

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
})

export type SignInForm = z.infer<typeof signInSchema>
export type SignUpForm = z.infer<typeof signUpSchema>
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>
export type BusinessBasicsForm = z.infer<typeof businessBasicsSchema>
export type ApplicantInfoForm = z.infer<typeof applicantInfoSchema>
export type MembersManagersForm = z.infer<typeof membersManagersSchema>
export type PackageSelectionForm = z.infer<typeof packageSelectionSchema>
export type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>