'use client'

import { useState } from 'react'

interface TeamFlagProps {
  code: string    // flagCode: "ar", "gb-sct", "us", etc.
  name: string    // para alt text
  size?: number   // altura en px (la imagen tendrá relación 4:3)
  className?: string
  style?: React.CSSProperties
}

// flagcdn.com soporta códigos con guión: "gb-sct", "gb-eng"
// URL pattern: https://flagcdn.com/h{height}/{code}.png
// Usamos h{size} (por altura) para mantener proporciones consistentes 4:3

export function TeamFlag({ code, name, size = 20, className, style }: TeamFlagProps) {
  const [error, setError] = useState(false)

  const height = size
  const width = Math.round(size * 1.333) // relación 4:3

  if (error) {
    return (
      <span
        style={{
          display: 'inline-block',
          width,
          height,
          background: 'var(--faint)',
          borderRadius: 2,
          flexShrink: 0,
          ...style,
        }}
        className={className}
        aria-label={name}
      />
    )
  }

  return (
    <img
      src={`https://flagcdn.com/h${height * 2}/${code.toLowerCase()}.png`}
      alt={name}
      width={width}
      height={height}
      style={{
        objectFit: 'cover',
        borderRadius: 2,
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
      className={className}
      onError={() => setError(true)}
    />
  )
}
