/**
 * Input validation for Kundli Match — shared by the form (instant feedback)
 * and the API (authoritative). Client-safe.
 */
import { z } from 'zod'
import { isRealCalendarDate, isValidTimeZone } from './time/localTime'

export const MIN_BIRTH_YEAR = 1900

const name = z
  .string({ required_error: 'Please enter a name.' })
  .trim()
  .min(1, 'Please enter a name.')
  .max(60, 'Please keep the name under 60 characters.')
  .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u, 'Please use letters only.')

const dateOfBirth = z
  .string({ required_error: 'Please enter the date of birth.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter the date of birth.')
  .refine(s => {
    const [y, m, d] = s.split('-').map(Number)
    return isRealCalendarDate(y, m, d)
  }, 'This date does not exist — please check the day and month.')
  .refine(s => Number(s.slice(0, 4)) >= MIN_BIRTH_YEAR, `Please enter a date from ${MIN_BIRTH_YEAR} onwards.`)

const timeOfBirth = z
  .string({ required_error: 'Please enter the birth time, or tick “Birth time unknown”.' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Please enter a time between 00:00 and 23:59.')
  .nullable()

export const placeSchema = z.object({
  label: z.string().trim().min(2, 'Please choose the birthplace.').max(160),
  latitude: z.number({ invalid_type_error: 'Latitude must be a number.' }).finite().min(-90, 'Latitude must be between −90 and 90.').max(90, 'Latitude must be between −90 and 90.'),
  longitude: z.number({ invalid_type_error: 'Longitude must be a number.' }).finite().min(-180, 'Longitude must be between −180 and 180.').max(180, 'Longitude must be between −180 and 180.'),
  timezone: z.string().refine(isValidTimeZone, 'Please choose a valid time zone.'),
  source: z.enum(['mithila-jodi', 'openstreetmap', 'manual']),
})

export const personSchema = z.object({
  name,
  dateOfBirth,
  timeOfBirth,
  place: z.object(placeSchema.shape, { required_error: 'Please choose the place of birth.', invalid_type_error: 'Please choose the place of birth.' }),
  moonSegment: z.union([z.number().int().min(0).max(8), z.literal('all')]).optional(),
  repeatedTime: z.enum(['earlier', 'later']).optional(),
})

export const kundliMatchRequestSchema = z.object({ bride: personSchema, groom: personSchema })

/** One person's birth details — Janam Kundli, Nakshatra and the other single-chart tools. */
export const singlePersonRequestSchema = z.object({ person: personSchema })
export const janamKundliRequestSchema = singlePersonRequestSchema

export const shareRequestSchema = z.object({
  request: kundliMatchRequestSchema,
  includeNames: z.boolean(),
  /** Which scenario to share when the result had several possibilities. */
  scenario: z.object({ brideSegment: z.number().int().min(0).max(8).nullable(), groomSegment: z.number().int().min(0).max(8).nullable() }).optional(),
})

const rashiIndex = z.number().int().min(0).max(11).nullable().optional()

export const vivahMuhuratRequestSchema = z.object({
  place: z.object(placeSchema.shape, { required_error: 'Please choose the place of the wedding.', invalid_type_error: 'Please choose the place of the wedding.' }),
  from: z.string().regex(/^(20[0-9]{2})-(0[1-9]|1[0-2])$/, 'Please choose a month between 2000 and 2099.'),
  months: z.number().int().min(1).max(12),
  brideRashi: rashiIndex,
  groomRashi: rashiIndex,
})

export type FieldErrors = Record<string, string>

/** Flatten zod issues to `bride.place.timezone` → message, first message wins. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
