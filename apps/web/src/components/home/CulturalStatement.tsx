export function CulturalStatement() {
  return (
    <section
      className="relative bg-maroon overflow-hidden py-8"
      aria-label="Mithila Jodi cultural statement"
    >
      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-maroon-deep via-gold-lt to-maroon-deep" aria-hidden="true" />

      <div className="wrap relative z-10 flex items-center justify-center gap-6 flex-wrap text-center">
        {/* Left lotus */}
        <svg width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 opacity-70 hidden sm:block" aria-hidden="true">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
            const r = (a * Math.PI) / 180
            return <ellipse key={i} cx={24 + 12 * Math.cos(r)} cy={24 + 12 * Math.sin(r)} rx={4} ry={7} fill={i % 2 === 0 ? '#E4C572' : '#B98A2E'} stroke="#B98A2E" strokeWidth="0.5" transform={`rotate(${a} ${24 + 12 * Math.cos(r)} ${24 + 12 * Math.sin(r)})`} />
          })}
          <circle cx="24" cy="24" r="5" fill="#E4C572" />
          <circle cx="24" cy="24" r="2" fill="#7A1220" />
        </svg>

        {/* Text */}
        <div>
          <p className="font-deva text-2xl sm:text-3xl text-gold-lt leading-tight" lang="mai">
            मिथिला जोड़ी — परम्परा आ प्रेमक संगम
          </p>
          <p className="font-serif text-[14px] text-paper-3 italic mt-1">
            Mithila Jodi — where tradition and love meet
          </p>
        </div>

        {/* Right lotus */}
        <svg width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 opacity-70 hidden sm:block" aria-hidden="true">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
            const r = (a * Math.PI) / 180
            return <ellipse key={i} cx={24 + 12 * Math.cos(r)} cy={24 + 12 * Math.sin(r)} rx={4} ry={7} fill={i % 2 === 0 ? '#E4C572' : '#B98A2E'} stroke="#B98A2E" strokeWidth="0.5" transform={`rotate(${a} ${24 + 12 * Math.cos(r)} ${24 + 12 * Math.sin(r)})`} />
          })}
          <circle cx="24" cy="24" r="5" fill="#E4C572" />
          <circle cx="24" cy="24" r="2" fill="#7A1220" />
        </svg>
      </div>

      {/* Bottom gold line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-maroon-deep via-gold-lt to-maroon-deep" aria-hidden="true" />
    </section>
  )
}
