import type { SharedProfile } from '@/lib/profileShare'

/** Where every "View Sample Profile" button leads. */
export const SAMPLE_PROFILE_PATH = '/digital-profile/sample'

/**
 * The sample Digital Profile. Muskan Jha is FICTIONAL — written for the
 * landing page, not drawn from any member, and rendered through the same
 * DigitalProfileView a real shared link uses (in 'demo' mode, which marks it
 * as a sample). Kept out of the database on purpose, so she can never appear
 * in member search or be contacted.
 */
export const DEMO_PROFILE: SharedProfile = {
  displayName: 'Muskan Jha',
  age: 22,
  gender: 'Female',
  heightCm: 160,
  maritalStatus: 'Never married',
  motherTongue: 'Maithili',
  profileFor: 'Daughter',
  // Five looks of the same fictional person; more than one photo gives the 3D photo deck.
  photos: [1, 2, 3, 4, 5].map(n => `/sample/muskan-${n}.webp`),
  community: {
    religion: 'Hindu',
    caste: 'Maithil Brahmin',
    subCaste: null,
    selfGotra: 'Kashyapa',
    maternalGotra: 'Vatsa',
    mool: 'Sarisab',
    gram: 'Sarisab-Pahi',
  },
  location: { current: 'Gautam Buddha Nagar', native: 'Madhubani', work: 'Noida' },
  education: {
    degree: 'B.A. (Hons) Economics',
    specialization: null,
    institution: 'University of Delhi',
    passingYear: 2025,
    detail: null,
  },
  career: {
    jobTitle: 'Analyst',
    employer: 'A consulting firm in Noida',
    industry: 'Consulting',
    employmentType: 'Full time',
    workType: 'Hybrid',
    experienceYears: 1,
    detail: null,
  },
  lifestyle: { diet: 'Vegetarian', smoking: 'Never', drinking: 'Never', marriageTimeline: 'Within two years' },
  family: {
    type: 'Nuclear family',
    values: 'Traditional, with an open outlook',
    parents: 'Father — bank manager · Mother — school teacher',
    siblings: 'One younger brother, in college',
    about: 'Our roots are in Sarisab-Pahi, Madhubani. The family settled in Noida twelve years ago and still goes home for Chhath every year.',
    introduction: null,
  },
  about:
    'I grew up between Madhubani and Noida, and work as an analyst at a consulting firm. I love Madhubani painting, ' +
    'Vidyapati geet my grandmother sings, and long evening walks.\n\n' +
    'I am looking for someone kind and grounded, who respects both families and enjoys building a life together.',
  horoscope: { rashi: 'Kanya (Virgo)', nakshatra: 'Hasta', manglik: 'No', birthTime: '9:15 AM', birthPlace: 'Madhubani, Bihar' },
  contact: null,
  preferences: {
    ageRange: '25 – 30 years',
    lookingFor: 'Groom',
    community: 'Maithil Brahmin',
    maritalStatus: 'Never married',
    education: 'Graduate or above',
    profession: 'Working professional',
    location: 'Delhi NCR or Bihar',
    diet: 'Vegetarian preferred',
    marriageTimeline: 'Within two years',
    manglik: 'Non-manglik preferred',
    children: null,
    livingArrangement: 'Close to both families',
    career: 'Supportive of her career',
    notes: 'Gotra-safe matches only.',
    gotraSafe: true,
  },
}
