import type { SharedProfile } from '@/lib/profileShare'

/**
 * The demo on /digital-profile. Amit Jha is FICTIONAL — written for the page,
 * not drawn from any member, and rendered through the same DigitalProfileView
 * a real shared link uses (in 'demo' mode, which labels it as a demonstration
 * and draws an illustrated portrait instead of a photograph).
 */
export const DEMO_PROFILE: SharedProfile = {
  displayName: 'Amit Jha',
  age: 32,
  gender: 'Male',
  heightCm: 183,
  maritalStatus: 'Never married',
  motherTongue: 'Maithili',
  profileFor: 'Self',
  photos: [],
  community: {
    religion: 'Hindu',
    caste: 'Maithil Brahmin',
    subCaste: null,
    selfGotra: 'Kashyapa',
    maternalGotra: 'Shandilya',
    mool: 'Sodarpur',
    gram: 'Rajnagar',
  },
  location: { current: 'Mumbai, Maharashtra', native: 'Madhubani', work: 'Mumbai' },
  education: {
    degree: 'B.Tech, MBA',
    specialization: 'Computer Science; Finance',
    institution: 'NIT Patna; JBIMS Mumbai',
    passingYear: 2019,
    detail: null,
  },
  career: {
    jobTitle: 'Senior Product Manager',
    employer: 'A fintech company in Mumbai',
    industry: 'Financial services',
    employmentType: 'Full time',
    workType: 'Hybrid',
    experienceYears: 10,
    detail: null,
  },
  lifestyle: { diet: 'Vegetarian', smoking: 'Never', drinking: 'Never', marriageTimeline: 'Within a year' },
  family: {
    type: 'Joint family',
    values: 'Traditional, with an open outlook',
    parents: 'Father — retired school principal · Mother — homemaker',
    siblings: 'One younger sister, married, in Bengaluru',
    about: 'Our family still spends Chhath and Sama-Chakeva in Rajnagar every year. My parents divide their time between Madhubani and Mumbai.',
    introduction: null,
  },
  about:
    'I grew up in Madhubani and have lived in Mumbai for ten years, where I build payment products for a fintech company. ' +
    'Weekdays are busy; weekends are for cricket, long walks by the sea and calling home. I still ask my mother for the ' +
    'recipe every time I try to make tilkor at home.\n\n' +
    'I am looking for a partner who is kind, curious and close to her family — someone who enjoys a Vidyapati geet as much ' +
    'as a new city.',
  horoscope: { rashi: 'Vrishabha (Taurus)', nakshatra: 'Rohini', manglik: 'No', birthTime: '6:40 AM', birthPlace: 'Madhubani, Bihar' },
  contact: null,
  preferences: {
    ageRange: '27 – 31 years',
    lookingFor: 'Bride',
    community: 'Maithil Brahmin',
    maritalStatus: 'Never married',
    education: 'Graduate or above',
    profession: 'Working or not — her choice',
    location: 'Any city in India',
    diet: 'Vegetarian preferred',
    marriageTimeline: 'Within a year',
    manglik: 'Non-manglik preferred',
    children: null,
    livingArrangement: 'Mumbai, close to both families',
    career: null,
    notes: 'Gotra-safe matches only.',
    gotraSafe: true,
  },
}
