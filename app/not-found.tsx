import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 120, color: 'var(--faint)', lineHeight: 1 }}>
        404
      </div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--text)', marginTop: 8, letterSpacing: '.04em' }}>
        PÁGINA NO ENCONTRADA
      </div>
      <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 12, marginBottom: 32 }}>
        Esta URL no existe en la Copa Mundial 2026.
      </div>
      <Link href="/" style={{
        background: 'var(--green)', color: '#fff', borderRadius: 10,
        padding: '12px 28px', fontSize: 14, fontWeight: 600,
        textDecoration: 'none',
      }}>
        Volver al inicio
      </Link>
    </div>
  )
}
