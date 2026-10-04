import { contentSchema, WELCOME_PRESETS, type Invite } from './schema'

/** The showcase invitation — illustrative names, shown only as a preview. */
export const SAMPLE_INVITE: Invite = {
  v: 1,
  t: 'kohbar',
  c: contentSchema.parse({
    couple: { brideName: 'मुस्कान', groomName: 'अंकित', nickname: 'MuskanKeAnkit', brideAbout: 'Daughter of Smt. Sunita & Shri Ramesh Jha', groomAbout: 'Son of Smt. Rekha & Shri Mohan Mishra' },
    wedding: { date: '2026-11-25', time: '19:30', venueName: 'Shyama Mandir Parisar', venueAddress: 'Darbhanga, Bihar 846004' },
    message: { language: 'mai', text: WELCOME_PRESETS.mai },
    story: { text: 'Two families from Mithila, one pothi of horoscopes, and a cup of tea that lasted three hours.' },
    events: [
      { id: 't', name: 'तिलक', icon: 'tilak', date: '2026-11-21', time: '11:00', venue: 'Madhubani' },
      { id: 'm', name: 'मटकोर', icon: 'matkor', date: '2026-11-23', time: '16:00' },
      { id: 'h', name: 'हल्दी', icon: 'haldi', date: '2026-11-24', time: '10:00' },
      { id: 'v', name: 'विवाह', icon: 'vivah', date: '2026-11-25', time: '19:30', venue: 'Shyama Mandir Parisar' },
      { id: 'd', name: 'विदाई', icon: 'vidai', date: '2026-11-26', time: '09:00' },
    ],
    mithila: {
      enabled: true,
      bride: { gram: { value: 'Sarisab-Pahi' }, jila: { value: 'Madhubani' }, gotra: { value: 'Shandilya' } },
      groom: { gram: { value: 'Mangrauni' }, jila: { value: 'Darbhanga' }, gotra: { value: 'Kashyap' } },
    },
    family: { message: 'आपके आगमन की प्रतीक्षा में — समस्त परिवार' },
    rsvp: { enabled: true, phone: '', contactName: '' },
  }),
}
