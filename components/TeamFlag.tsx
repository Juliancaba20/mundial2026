// TeamFlag — banderas SVG servidas localmente desde /public/flags/
// Fuente: paquete flag-icons (npm), copiadas a public/flags/ en build time.
//
// Render circular: el SVG original es 4:3, así que usamos un recuadro
// cuadrado con `object-fit: cover` y `border-radius: 50%`. Esto recorta la
// bandera a un círculo perfecto sin deformarla. Un borde sutil (box-shadow
// outset) ayuda a distinguir banderas claras sobre el fondo oscuro del sitio.
//
// `borderRadius` se fuerza a 50% DESPUÉS del spread de `style` a propósito:
// ningún caller puede volver la bandera rectangular por error.
//
// No necesita 'use client' — es un componente de servidor puro.

interface TeamFlagProps {
  code: string          // flagCode ISO: "ar", "us", "gb-sct", "gb-eng"
  name: string          // para atributo alt
  size?: number         // diámetro del círculo en px (ancho = alto = size)
  className?: string
  style?: React.CSSProperties
}

export function TeamFlag({ code, name, size = 20, className, style }: TeamFlagProps) {
  return (
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt={name}
      width={size}
      height={size}
      style={{
        display: 'block',
        objectFit: 'cover',
        flexShrink: 0,
        ...style,
        // ── Forma circular autoritativa (no sobreescribible) ──
        borderRadius: '50%',
        // Borde sutil 1px: outset box-shadow no roba píxeles del layout
        // y se ve nítido sobre --bg (#0D1117) y --surface (#161B22).
        boxShadow: '0 0 0 1px rgba(255,255,255,0.18)',
      }}
      className={className}
    />
  )
}
