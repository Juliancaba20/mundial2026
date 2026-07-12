'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  matchId: string
}

export function MatchAnalysisClient({ matchId }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState(0) // used to trigger re-fetch and animation

  useEffect(() => {
    let active = true

    async function fetchAnalysis() {
      try {
        const res = await fetch(`/api/partidos/${matchId}/analysis`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al generar el análisis')
        }
        const data = await res.json()
        if (active) {
          setAnalysis(data.analysis)
          setLoading(false)
        }
      } catch (err: unknown) {
        if (active) {
          const errMsg = err instanceof Error ? err.message : 'Ocurrió un error inesperado al conectar con el motor de IA.'
          setError(errMsg)
          setLoading(false)
        }
      }
    }

    fetchAnalysis()

    return () => {
      active = false
    }
  }, [matchId, key])

  const handleRegenerate = () => {
    setLoading(true)
    setError(null)
    setKey(prev => prev + 1)
  }

  return (
    <div className="match-analysis-container" id="gemini-analysis">
      <div className="analysis-card-header">
        <div className="ach-title-area">
          <div className="ach-spark">
            <span className="spark-dot" />
            <span className="spark-pulse" />
          </div>
          <span className="ach-title">SISTEMA DE ANÁLISIS GEMINI</span>
          <span className="ach-badge">IA ACTIVA</span>
        </div>
        {!loading && !error && (
          <button onClick={handleRegenerate} className="ach-reload-btn" title="Regenerar análisis">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Actualizar Análisis
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="analysis-loading-pane"
          >
            <div className="loading-pulse-container">
              <div className="radar-circle" />
              <span className="loading-status-text">Procesando pizarras tácticas, estadísticas históricas de FIFA y planteles oficiales...</span>
            </div>

            <div className="skeleton-rows">
              <div className="skeleton-row skeleton-title" />
              <div className="skeleton-row" style={{ width: '92%' }} />
              <div className="skeleton-row" style={{ width: '85%' }} />
              <div className="skeleton-row" style={{ width: '89%' }} />
              <div className="skeleton-row skeleton-title" style={{ marginTop: 24 }} />
              <div className="skeleton-row" style={{ width: '90%' }} />
              <div className="skeleton-row" style={{ width: '80%' }} />
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="analysis-error-pane"
          >
            <div className="error-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="error-details">
              <h4>No se pudo cargar el análisis táctico</h4>
              <p>{error}</p>
              <button onClick={handleRegenerate} className="error-retry-btn">
                Reintentar generación
              </button>
            </div>
          </motion.div>
        )}

        {!loading && !error && analysis && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="analysis-content-pane"
          >
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysis}
              </ReactMarkdown>
            </div>
            
            <div className="analysis-footer">
              <span className="footer-tag">Desarrollado por Gemini 3.5 Flash · Análisis en tiempo real</span>
              <span className="footer-disclaimer">Las predicciones y análisis tácticos son simulaciones algorítmicas basadas en datos deportivos.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .match-analysis-container {
          background: #161B22;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          margin-top: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .analysis-card-header {
          background: #1C2330;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ach-title-area {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ach-spark {
          position: relative;
          width: 10px;
          height: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spark-dot {
          width: 6px;
          height: 6px;
          background: #00A86B;
          border-radius: 50%;
          display: block;
          z-index: 2;
        }

        .spark-pulse {
          position: absolute;
          width: 10px;
          height: 10px;
          background: rgba(0, 168, 107, 0.4);
          border-radius: 50%;
          animation: pulse-ring 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
          display: block;
          z-index: 1;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .ach-title {
          font-family: 'Bebas Neue', Impact, sans-serif;
          font-size: 16px;
          letter-spacing: 0.07em;
          color: #E6EDF3;
        }

        .ach-badge {
          background: rgba(0, 168, 107, 0.12);
          border: 1px solid rgba(0, 168, 107, 0.3);
          color: #00A86B;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .ach-reload-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #7D8590;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .ach-reload-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: #E6EDF3;
        }

        .analysis-loading-pane {
          padding: 32px 24px;
        }

        .loading-pulse-container {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .radar-circle {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0, 168, 107, 0.25);
          border-top-color: #00A86B;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-status-text {
          font-size: 13px;
          color: #7D8590;
          line-height: 1.4;
        }

        .skeleton-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-row {
          height: 12px;
          background: linear-gradient(90deg, #1C2330 25%, #252D3D 50%, #1C2330 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: loading-shimmer 1.5s infinite;
        }

        .skeleton-title {
          height: 18px;
          width: 180px;
          background-size: 200% 100%;
          border-radius: 4px;
        }

        @keyframes loading-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .analysis-error-pane {
          padding: 36px 24px;
          display: flex;
          gap: 16px;
          background: rgba(232, 0, 61, 0.03);
        }

        .error-icon-box {
          color: #E8003D;
          flex-shrink: 0;
        }

        .error-details h4 {
          font-size: 15px;
          font-weight: 600;
          color: #E6EDF3;
          margin-bottom: 6px;
        }

        .error-details p {
          font-size: 13px;
          color: #7D8590;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .error-retry-btn {
          background: rgba(232, 0, 61, 0.12);
          border: 1px solid rgba(232, 0, 61, 0.25);
          color: #E8003D;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .error-retry-btn:hover {
          background: rgba(232, 0, 61, 0.2);
          border-color: rgba(232, 0, 61, 0.4);
        }

        .analysis-content-pane {
          padding: 24px;
        }

        .markdown-body {
          color: #E6EDF3;
          font-size: 14.5px;
          line-height: 1.7;
        }

        .markdown-body h3 {
          font-family: 'Bebas Neue', Impact, sans-serif;
          font-size: 20px;
          letter-spacing: 0.05em;
          color: #00A86B;
          margin-top: 24px;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .markdown-body h3:first-of-type {
          margin-top: 0;
        }

        .markdown-body p {
          margin-bottom: 16px;
        }

        .markdown-body ul {
          margin-bottom: 18px;
          padding-left: 20px;
          list-style-type: square;
        }

        .markdown-body li {
          margin-bottom: 8px;
        }

        .markdown-body strong {
          color: #FFFFFF;
          font-weight: 600;
        }

        .analysis-footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .footer-tag {
          font-size: 11px;
          font-weight: 600;
          color: #00A86B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .footer-disclaimer {
          font-size: 10.5px;
          color: #7D8590;
          font-style: italic;
        }

        @media (max-width: 640px) {
          .analysis-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  )
}
