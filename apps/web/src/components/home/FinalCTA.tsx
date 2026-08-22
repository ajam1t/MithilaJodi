import Link from 'next/link'

export function FinalCTA() {
  return (
    <section className="relative bg-maroon overflow-hidden py-20" aria-label="Create your profile — call to action">
      {/* Madhubani lotus decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          {/* Large background lotuses */}
          {[[100,150,60,'#9B2233'],[400,220,45,'#9B2233'],[700,100,55,'#9B2233'],[1050,180,50,'#9B2233'],[220,60,35,'#9B2233'],[880,240,40,'#9B2233']].map(([lx,ly,lr,lc],i) => (
            <g key={i} opacity="0.25">
              {[0,45,90,135,180,225,270,315].map((a,ai) => {
                const rad=(a*Math.PI)/180
                const r = lr as number
                return <ellipse key={ai} cx={(lx as number)+(r*0.7)*Math.cos(rad)} cy={(ly as number)+(r*0.7)*Math.sin(rad)} rx={r*0.4} ry={r*0.65} fill={lc as string} stroke="#E4C572" strokeWidth="0.8" transform={`rotate(${a} ${(lx as number)+(r*0.7)*Math.cos(rad)} ${(ly as number)+(r*0.7)*Math.sin(rad)})`} />
              })}
              <circle cx={lx as number} cy={ly as number} r={(lr as number)*0.3} fill="#E4C572" opacity="0.4" />
            </g>
          ))}
          {/* Gold fish motifs */}
          {[[300,70],[600,230],[900,80],[150,210],[1050,50]].map(([fx,fy],i) => (
            <g key={i} opacity="0.2">
              <ellipse cx={fx as number} cy={fy as number} rx="28" ry="18" fill="#E4C572" />
              <path d={`M ${(fx as number)+28} ${fy} L ${(fx as number)+40} ${(fy as number)-9} L ${(fx as number)+40} ${(fy as number)+9} Z`} fill="#E4C572" />
              <circle cx={(fx as number)-8} cy={(fy as number)-4} r="4" fill="#7A1220" />
            </g>
          ))}
        </svg>
      </div>

      {/* Gold top border */}
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-maroon-deep via-gold-lt to-maroon-deep" aria-hidden="true" />

      <div className="wrap relative z-10 text-center max-w-3xl mx-auto">
        {/* Devanagari tagline */}
        <p className="font-deva text-3xl text-gold-lt mb-2" lang="hi">
          मिथिला जोड़ी — जहाँ परम्परा मिले, प्रेम से
        </p>
        <p className="font-serif text-[15px] text-paper-3 italic mb-8">
          Mithila Jodi — Where tradition meets love.
        </p>

        <h2 className="font-serif text-display-md text-paper leading-snug mb-6">
          Begin Your Family&apos;s Next Chapter
        </h2>

        <p className="text-paper-2 text-[17px] leading-relaxed mb-10 max-w-xl mx-auto">
          Create a verified biodata, connect with Maithili families across India, and let
          Mithila Jodi support your family through every step of the journey — with respect,
          privacy, and deep cultural understanding.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn bg-gold-lt text-maroon-deep text-base px-10 py-4 font-semibold hover:-translate-y-0.5 hover:shadow-mj transition-all">
            Create Your Biodata
          </Link>
          <Link href="/login" className="btn bg-transparent border-2 border-gold-lt text-gold-lt text-base px-10 py-4 hover:bg-gold-lt hover:text-maroon-deep transition-all">
            Sign In
          </Link>
        </div>

        {/* Legal micro-links */}
        <p className="mt-8 text-[12px] text-paper-3 opacity-60">
          By registering you agree to our{' '}
          <a href="/legal/terms" className="underline hover:text-gold-lt transition-colors">Terms of Service</a>
          {' '}and{' '}
          <a href="/legal/privacy" className="underline hover:text-gold-lt transition-colors">Privacy Policy</a>.
        </p>
      </div>

      {/* Gold bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-maroon-deep via-gold-lt to-maroon-deep" aria-hidden="true" />
    </section>
  )
}
