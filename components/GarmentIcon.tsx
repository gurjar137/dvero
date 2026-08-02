export function GarmentIcon({ type, mirror, className }: { type: 'shirt' | 'trouser'; mirror?: boolean; className?: string }) {
  const paths: Record<string, string> = {
    shirt: 'M50 8 L34 16 L14 8 L6 26 L20 34 L26 30 L26 92 L74 92 L74 30 L80 34 L94 26 L86 8 L66 16 Z',
    trouser: 'M35 10 L65 10 L68 20 L58 20 L60 90 L52 90 L50 40 L48 90 L40 90 L42 20 L32 20 Z'
  };
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className}>
      <g transform={mirror ? 'scale(-1,1) translate(-100,0)' : undefined}>
        <path d={paths[type]} stroke="currentColor" strokeWidth={1.6} />
      </g>
    </svg>
  );
}

export function ProductVisual({ image, type, mirror, className }: { image?: string | null; type: 'shirt' | 'trouser'; mirror?: boolean; className?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={`w-full h-full object-cover ${className || ''}`} />;
  }
  return <GarmentIcon type={type} mirror={mirror} className={`w-3/5 h-3/5 text-camelDeep mx-auto ${className || ''}`} />;
}
