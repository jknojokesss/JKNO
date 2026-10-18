import { useState } from 'react'
import Link from 'next/link'
import { Outfit } from 'next/font/google'
import { OPS_SAMPLE } from '../../data/ops-center-sample.js'
import BankBalances from './BankBalances'
import LiabilitiesDesk from './LiabilitiesDesk'
import { FixedObligations, RentalBuildings } from './SimpleSections'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export default function OpsCenterDesk() {
  const [cashTotal, setCashTotal] = useState(
    () => OPS_SAMPLE.banks.reduce((s, b) => s + b.balance, 0),
  )

  return (
    <div className={`ops-center-root ${outfit.className}`} style={{ fontFamily: 'var(--font-outfit), Outfit, sans-serif' }}>
      <style>{`
        .ops-center-root {
          --ops-bg: #f4f7f9;
          --ops-ink: #2f4049;
          --ops-muted: #5c7280;
          --ops-border: #c5d0d6;
          --ops-primary: #4a6270;
          background: var(--ops-bg);
          color: var(--ops-ink);
          min-height: calc(100vh - 52px);
          font-variant-numeric: tabular-nums lining-nums;
          overflow-x: hidden;
          max-width: 100%;
        }
        .ops-center-root .ops-heading { font-family: inherit; font-weight: 600; letter-spacing: -0.02em; }
        .ops-center-root .ops-eyebrow-navy {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
        }
        .ops-center-root .ops-card {
          border-radius: 0.75rem;
          background: #fff;
          box-shadow: 0 1px 2px rgba(47,64,73,0.05);
          outline: 1px solid rgba(47,64,73,0.1);
        }
        .ops-center-root .ops-input {
          border-radius: 0.5rem;
          border: 1px solid rgba(197,208,214,0.8);
          background: #fff;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--ops-ink);
          box-shadow: 0 1px 2px rgba(47,64,73,0.04);
        }
        .ops-center-root .ops-btn-primary {
          background: var(--ops-primary);
          color: #fff;
          border: none;
          border-radius: 0.375rem;
          padding: 0.375rem 0.875rem;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
        }
        .ops-center-root .ops-btn-primary:disabled { opacity: 0.6; cursor: default; }
        .ops-center-root .ops-btn-outline {
          display: inline-flex;
          align-items: center;
          border-radius: 0.375rem;
          border: 1px solid var(--ops-border);
          background: #fff;
          padding: 0.5rem 0.875rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ops-ink);
          text-decoration: none;
          flex-shrink: 0;
        }
        .ops-center-root .ops-text-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          border: none;
          background: none;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
          padding: 0;
        }
        .ops-center-root .ops-select {
          border-radius: 0.375rem;
          border: 1px solid var(--ops-border);
          background: #fff;
          padding: 0.35rem 0.5rem;
          color: var(--ops-ink);
        }
        .ops-center-root .ops-ghost-btn {
          border: 1px solid var(--ops-border);
          background: #fff;
          border-radius: 0.375rem;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          color: var(--ops-ink);
        }
        .ops-center-root .ops-th {
          padding: 0.5rem 0.75rem;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.85);
          white-space: nowrap;
        }
        .ops-center-root .ops-td {
          padding: 0.5rem 0.75rem;
          font-size: 11px;
          border-bottom: 1px solid rgba(47,64,73,0.07);
          color: var(--ops-ink);
        }
        @keyframes ops-spin-keyframes { to { transform: rotate(360deg); } }
        .ops-center-root .ops-spin { animation: ops-spin-keyframes 0.6s linear; }
      `}</style>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="ops-heading text-2xl tracking-tight sm:text-3xl">Operations Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5c7280]">
              Sample — fictitious numbers · as of {OPS_SAMPLE.asOf}
            </p>
          </div>
          <Link href="/operations-portal" className="ops-btn-outline">Owner Portal</Link>
        </header>

        <BankBalances onTotalChange={setCashTotal} />
        <LiabilitiesDesk cashTotal={cashTotal} />
        <FixedObligations />
        <RentalBuildings />
      </main>
    </div>
  )
}
