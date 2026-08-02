export default function AboutPage() {
  return (
    <main className="page-fade">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        <div className="text-center py-12 md:py-20 pb-8 md:pb-12">
          <div className="font-cinzel text-camelDeep text-xs tracking-[0.24em] uppercase mb-4">The House Of D Vero</div>
          <h1 className="font-oswald text-3xl sm:text-4xl md:text-6xl uppercase max-w-[16ch] mx-auto">Formalwear Built To Move.</h1>
        </div>

        <div className="grid md:grid-cols-[0.65fr_1.35fr] gap-8 md:gap-14 py-6 md:py-8 pb-12 md:pb-20">
          <div className="font-cinzel text-camelDeep text-3xl sm:text-4xl md:text-5xl leading-none">Vero.</div>
          <div>
            <p className="text-lg leading-relaxed text-mute mb-5 max-w-[58ch]">Italian for <b className="text-ink font-medium">true</b>. Not the loudest word in the language, but the most load-bearing one.</p>
            <p className="text-lg leading-relaxed text-mute mb-5 max-w-[58ch]">We started D'VERO because formalwear stopped listening to the people actually wearing it — boardroom cuts made for boardrooms nobody under thirty sits in anymore, fabric that performs for photographs and not for a fourteen-hour day that starts at a desk and ends somewhere else entirely.</p>
            <p className="text-lg leading-relaxed text-mute mb-5 max-w-[58ch]">So we cut differently. <b className="text-ink font-medium">Shoulders that move. Waists that breathe.</b> Four trouser fits instead of one, because no two people stand the same way in a room. This is formalwear that behaves the way you actually do.</p>
            <div className="flex gap-10 mt-9 flex-wrap">
              {[['06', 'Pieces in Drop 01'], ['100%', 'Designed in Jaipur'], ['2026', 'First Collection']].map(([n, l]) => (
                <div key={l}><b className="font-oswald text-3xl block">{n}</b><span className="font-oswald text-xs tracking-wider uppercase text-mute">{l}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-oswald text-3xl uppercase">The D Vero Standard</h2>
          <p className="text-mute text-sm mt-2">Three things every piece has to pass before it earns a tag.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-line border border-line rounded-md overflow-hidden mb-24">
          {[
            ['01', 'Built To Move', 'Shoulders and waists with real room in them, so nothing fights back when you actually live in your clothes.'],
            ['02', 'Fabric That Breathes', 'No stiff, photograph-only cloth. Every fabric is chosen for a real Indian day, heat and long hours included.'],
            ['03', 'One Fit, Every Room', 'Sharp enough for the boardroom, easy enough for everything after. No outfit change required.']
          ].map(([num, title, desc]) => (
            <div key={num} className="bg-panel p-11 hover:bg-panel2 transition-colors">
              <div className="font-oswald text-camelDeep text-xs tracking-wider">{num}</div>
              <h3 className="font-oswald text-xl mt-3 mb-3">{title}</h3>
              <p className="text-sm text-mute leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
