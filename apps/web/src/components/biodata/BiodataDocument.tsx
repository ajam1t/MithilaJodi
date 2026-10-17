import type { BiodataData, BiodataLanguage } from '@/lib/biodata'
import { BIODATA_LABELS } from '@/lib/biodata'
import { resolveBiodataTemplate, type BiodataPalette, type BiodataTemplate } from '@/lib/biodataTemplates'
import { CornerFlourish, LotusMotif, VineDivider } from './BiodataMotifs'

/**
 * The printed biodata itself — one A4 page, inline styles only.
 *
 * Inline styles rather than Tailwind classes on purpose: this is the one
 * component in the app whose output is a physical piece of paper. Print
 * stylesheets and `window.print()` are far more predictable when every rule is
 * on the element, and a member emailing the printed PDF should not depend on a
 * utility class surviving a future Tailwind purge.
 *
 * Presentational and dependency-free, so both the member tool (server-rendered
 * from a saved profile) and the public maker (client-rendered from a form) can
 * render exactly the same document. `templateSlug` picks a design from
 * lib/biodataTemplates — the same registry both tools read, so the preview a
 * visitor builds and the PDF they download are the same configuration.
 */

function Row({ label, value, t }: { label: string; value: string | null | undefined; t: BiodataPalette }) {
  if (!value) return null
  return (
    <tr>
      <td style={{ width: '38%', padding: '4px 12px 4px 0', color: t.inkSoft, fontWeight: 500, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
        {label}
      </td>
      <td style={{ padding: '4px 0', color: t.ink, verticalAlign: 'top' }}>
        {value}
      </td>
    </tr>
  )
}

/** The heading portion of a section — appearance depends on the template's sectionStyle. */
function SectionHeading({ title, template }: { title: string; template: BiodataTemplate }) {
  const p = template.palette
  switch (template.sectionStyle) {
    case 'band':
      return (
        <div style={{
          backgroundColor: p.heading, color: '#fff',
          padding: '4px 10px', fontSize: '12px', fontWeight: 600,
          letterSpacing: '0.05em', textTransform: 'uppercase',
          marginBottom: '8px', borderRadius: '2px',
        }}>
          {title}
        </div>
      )
    case 'rule':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '9px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: p.gold, flexShrink: 0 }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '14.5px', color: p.heading, fontWeight: 'bold', letterSpacing: '0.03em' }}>{title}</span>
          <span style={{ flex: 1, height: '1px', background: `linear-gradient(to right, ${p.gold}, transparent)`, opacity: 0.6 }} />
        </div>
      )
    case 'underline':
      return (
        <div style={{ marginBottom: '9px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.heading }}>{title}</span>
          <div style={{ width: '34px', height: '1.5px', background: p.gold, marginTop: '4px', opacity: 0.8 }} />
        </div>
      )
    case 'tab':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '9px' }}>
          <span style={{ width: '4px', height: '14px', background: p.gold, borderRadius: '1px', flexShrink: 0 }} />
          <span style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: p.heading }}>{title}</span>
        </div>
      )
  }
}

function Section({ title, children, template, i = 0 }: { title: string; children: React.ReactNode; template: BiodataTemplate; i?: number }) {
  return (
    <div style={{ marginBottom: '18px', breakInside: 'avoid' }} data-section-index={i}>
      <SectionHeading title={title} template={template} />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/** True when at least one of the named fields has a value. */
function any(data: BiodataData, keys: Array<keyof BiodataData>): boolean {
  return keys.some(k => {
    const v = data[k]
    return v != null && String(v).trim() !== ''
  })
}

/** The outer frame around the page — thickness, colour and corner motifs vary by template. */
function frameStyle(template: BiodataTemplate): React.CSSProperties {
  const p = template.palette
  switch (template.frameStyle) {
    case 'ornate':
      return { border: `10px solid ${p.frame}`, boxShadow: `inset 0 0 0 2px ${p.gold}, inset 0 0 0 7px ${p.paper}, 0 2px 20px rgba(0,0,0,0.12)` }
    case 'wrap':
      return { border: `7mm solid ${p.frame}`, boxShadow: `inset 0 0 0 3px ${p.gold}, 0 2px 20px rgba(0,0,0,0.14)` }
    case 'hairline':
      return { border: `1px solid ${p.frame}`, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }
    case 'band':
      return { borderTop: `6px solid ${p.frame}`, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }
  }
}

export function BiodataDocument({
  data,
  language = 'en',
  photoUrl = null,
  templateSlug,
}: {
  data: BiodataData
  language?: BiodataLanguage
  /** Either a signed profile-photo URL or a local object URL from a file input. */
  photoUrl?: string | null
  templateSlug?: string | null
}) {
  const L = BIODATA_LABELS[language] ?? BIODATA_LABELS.en
  const template = resolveBiodataTemplate(templateSlug)
  const p = template.palette
  const sidebar = template.layout === 'sidebar'

  const CORNER_POSITIONS = [
    { top: 10, left: 12 }, { top: 10, right: 12 },
    { bottom: 10, left: 12 }, { bottom: 10, right: 12 },
  ] as const

  const identityBlock = (
    <>
      {data.full_name && (
        <div style={{ fontFamily: 'Georgia, serif', fontSize: sidebar ? '19px' : '20px', color: p.heading, marginBottom: '8px' }}>
          {data.full_name}
        </div>
      )}
      <table style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
        <tbody>
          <Row label={L.age} value={data.age ? `${data.age} ${L.years}` : null} t={p} />
          <Row label={L.gender} value={data.gender} t={p} />
          <Row label={L.religion} value={data.religion} t={p} />
          <Row label={L.caste} value={data.caste} t={p} />
        </tbody>
      </table>
    </>
  )

  const photoBlock = photoUrl && (
    <div style={{ flexShrink: 0, padding: '5px', border: `2px solid ${p.gold}`, background: p.paper, boxShadow: `0 2px 0 ${p.heading}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt={data.full_name ?? ''}
        style={{ width: '112px', height: '145px', objectFit: 'cover', border: `1px solid ${p.heading}`, display: 'block' }}
      />
    </div>
  )

  return (
    <div
      className="biodata-page"
      data-template={template.id}
      style={{
        fontFamily: "'Times New Roman', Georgia, serif",
        width: '210mm',
        maxWidth: '100%',
        minHeight: '297mm',
        boxSizing: 'border-box',
        margin: '0 auto',
        background: p.paper,
        padding: template.frameStyle === 'wrap' ? '22mm' : '20mm',
        color: p.ink,
        position: 'relative',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        ...frameStyle(template),
      }}
    >
      {/* Ornate templates get a dashed gold inset rule; others skip it. */}
      {template.frameStyle === 'ornate' && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: '7px', border: `2px dashed ${p.gold}`, pointerEvents: 'none' }} />
      )}

      {/* Corner motifs — intensity set by the template. */}
      {template.motif === 'bold' && CORNER_POSITIONS.map((pos, i) => (
        <div key={i} aria-hidden="true" style={{ position: 'absolute', ...pos, zIndex: 1 }}>
          <LotusMotif size={26} color={p.gold} />
        </div>
      ))}
      {template.motif === 'soft' && CORNER_POSITIONS.map((pos, i) => (
        <div key={i} aria-hidden="true" style={{ position: 'absolute', ...pos, zIndex: 1, opacity: 0.55 }}>
          <CornerFlourish size={24} color={p.gold} rotate={i * 90} />
        </div>
      ))}
      {template.motif === 'single' && (
        <div aria-hidden="true" style={{ position: 'absolute', top: 10, right: 12, zIndex: 1, opacity: 0.8 }}>
          <CornerFlourish size={30} color={p.gold} rotate={90} />
        </div>
      )}

      {/* Header */}
      <div style={{
        textAlign: 'center', borderBottom: `2px solid ${p.heading}`, paddingBottom: sidebar ? '10px' : '14px',
        marginBottom: sidebar ? '16px' : '20px', position: 'relative', zIndex: 2,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png" alt="Mithila Jodi"
          style={{ width: sidebar ? '46px' : '64px', height: sidebar ? '42px' : '59px', objectFit: 'contain', margin: '0 auto 5px', display: 'block' }}
        />
        <div style={{ fontSize: '12px', color: p.gold, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '5px' }}>Mithila Jodi</div>
        {/* Not an <h1>. This document is embedded inside /marriage-biodata,
            whose own heading is the page's H1 — two competing H1s made the
            public page ambiguous to a crawler. Styling is unchanged, and the
            standalone print view at /biodata/preview/[id] is noindex, so
            nothing loses a heading that mattered for search. */}
        <p style={{ fontFamily: 'Georgia, serif', fontSize: sidebar ? '19px' : '22px', color: p.heading, fontWeight: 'normal', letterSpacing: '0.04em' }}>
          {L.title}
        </p>
        {template.motif === 'minimal' && <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}><VineDivider width={120} color={p.gold} /></div>}
      </div>

      {/* Photo + name row — a boxed sidebar for the Contemporary layout, a plain row for the rest. */}
      {sidebar ? (
        <div style={{ display: 'flex', gap: '18px', marginBottom: '22px', alignItems: 'stretch', position: 'relative', zIndex: 2 }}>
          <div style={{ flexShrink: 0, width: '150px', background: '#FBF3E3', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {photoBlock}
            <div style={{ textAlign: 'center' }}>{identityBlock}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {data.about_me && (
              <p style={{ fontSize: '13px', lineHeight: '1.75', color: p.ink, whiteSpace: 'pre-wrap', margin: 0 }}>{data.about_me}</p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '22px', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          {photoBlock}
          <div style={{ flex: 1 }}>{identityBlock}</div>
        </div>
      )}

      {any(data, ['sub_caste', 'self_gotra', 'maternal_gotra', 'mool', 'gram']) && (
        <Section title={L.community} template={template} i={0}>
          <Row label={L.sub_caste} value={data.sub_caste} t={p} />
          <Row label={L.self_gotra} value={data.self_gotra} t={p} />
          <Row label={L.maternal_gotra} value={data.maternal_gotra} t={p} />
          <Row label={L.mool} value={data.mool} t={p} />
          <Row label={L.gram} value={data.gram} t={p} />
        </Section>
      )}

      {any(data, ['marital_status', 'mother_tongue', 'dob', 'height', 'complexion', 'blood_group', 'diet', 'smoking', 'drinking']) && (
        <Section title={L.personal} template={template} i={1}>
          <Row label={L.marital_status} value={data.marital_status} t={p} />
          <Row label={L.mother_tongue} value={data.mother_tongue} t={p} />
          <Row label={L.dob} value={data.dob} t={p} />
          <Row label={L.height} value={data.height} t={p} />
          <Row label={L.complexion} value={data.complexion} t={p} />
          <Row label={L.blood_group} value={data.blood_group} t={p} />
          <Row label={L.diet} value={data.diet} t={p} />
          <Row label={L.smoking} value={data.smoking} t={p} />
          <Row label={L.drinking} value={data.drinking} t={p} />
        </Section>
      )}

      {any(data, ['education', 'profession', 'employer', 'income']) && (
        <Section title={L.career} template={template} i={2}>
          <Row label={L.education} value={data.education} t={p} />
          <Row label={L.profession} value={data.profession} t={p} />
          <Row label={L.employer} value={data.employer} t={p} />
          <Row label={L.income} value={data.income} t={p} />
        </Section>
      )}

      {any(data, ['current_location', 'native_place']) && (
        <Section title={L.location} template={template} i={3}>
          <Row label={L.current_location} value={data.current_location} t={p} />
          <Row label={L.native_place} value={data.native_place} t={p} />
        </Section>
      )}

      {/* In the sidebar layout, "About me" already sits beside the photo above. */}
      {!sidebar && data.about_me && (
        <div style={{ marginBottom: '18px', breakInside: 'avoid' }}>
          <SectionHeading title={L.about} template={template} />
          <p style={{ fontSize: '13px', lineHeight: '1.8', color: p.ink, whiteSpace: 'pre-wrap' }}>{data.about_me}</p>
        </div>
      )}

      {any(data, ['father_name', 'mother_name', 'family_type', 'managed_by', 'family_values', 'parents', 'siblings', 'expectations', 'family_about', 'family_introduction']) && (
        <Section title={L.family} template={template} i={4}>
          <Row label={L.father_name} value={data.father_name} t={p} />
          <Row label={L.mother_name} value={data.mother_name} t={p} />
          <Row label={L.family_type} value={data.family_type} t={p} />
          <Row label={L.managed_by} value={data.managed_by} t={p} />
          <Row label={L.family_values} value={data.family_values} t={p} />
          <Row label={L.parents} value={data.parents} t={p} />
          <Row label={L.siblings} value={data.siblings} t={p} />
          <Row label={L.expectations} value={data.expectations} t={p} />
          <Row label={L.family} value={data.family_about} t={p} />
          <Row label={L.family_introduction} value={data.family_introduction} t={p} />
        </Section>
      )}

      {any(data, ['rashi', 'nakshatra', 'mangalik', 'birth_time', 'birth_place', 'kundli']) && (
        <Section title={L.astrology} template={template} i={5}>
          <Row label={L.rashi} value={data.rashi} t={p} />
          <Row label={L.nakshatra} value={data.nakshatra} t={p} />
          <Row label={L.mangalik} value={data.mangalik} t={p} />
          <Row label={L.birth_time} value={data.birth_time} t={p} />
          <Row label={L.birth_place} value={data.birth_place} t={p} />
          <Row label={L.kundli} value={data.kundli} t={p} />
        </Section>
      )}

      {any(data, ['mobile', 'email', 'address']) && (
        <Section title={L.contact} template={template} i={6}>
          <Row label={L.mobile} value={data.mobile} t={p} />
          <Row label={L.email} value={data.email} t={p} />
          <Row label={L.address} value={data.address} t={p} />
        </Section>
      )}

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${p.gold}`, marginTop: '32px', paddingTop: '9px', textAlign: 'center', fontSize: '11px', color: p.heading, letterSpacing: '0.02em', breakInside: 'avoid' }}>
        Made with <span aria-hidden="true">♥</span> on <strong>Mithila Jodi</strong> · mithilajodi.com
      </div>
    </div>
  )
}

export default BiodataDocument
