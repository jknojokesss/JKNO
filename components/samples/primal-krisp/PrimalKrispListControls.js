import { BORDER, INK, MUTED, UI } from '../primalKrispUtils'

const btnBase = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  fontFamily: UI,
  fontSize: 12,
  lineHeight: 1.35,
  cursor: 'pointer',
  color: MUTED,
}

/**
 * Plain-text sort row + optional search. sortOptions: { key, labels: { asc, desc } }.
 * sort: { key, dir: 'asc'|'desc' }. Shows "Sort: " prefix on first control only.
 */
export default function PrimalKrispListControls({
  sortOptions,
  sort,
  onSortChange,
  search,
  onSearchChange,
  rowCount = 0,
  searchThreshold = 12,
}) {
  const showSearch = rowCount > searchThreshold && onSearchChange

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px 10px',
        marginBottom: 10,
        fontFamily: UI,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, fontSize: 12, color: MUTED }}>
        <span style={{ fontWeight: 600, marginRight: 2 }}>Sort:</span>
        {sortOptions.map((opt, i) => {
          const active = sort.key === opt.key
          const label = active ? opt.labels[sort.dir] || opt.labels.desc : opt.labels.desc
          return (
            <span key={opt.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {i > 0 ? <span aria-hidden style={{ color: BORDER }}>|</span> : null}
              <button
                type="button"
                onClick={() =>
                  onSortChange({
                    key: opt.key,
                    dir: active && sort.dir === 'desc' ? 'asc' : 'desc',
                  })
                }
                style={{
                  ...btnBase,
                  color: active ? INK : MUTED,
                  fontWeight: active ? 700 : 500,
                  textDecoration: active ? 'underline' : 'none',
                  textUnderlineOffset: 3,
                }}
              >
                {label}
              </button>
            </span>
          )
        })}
      </div>
      {showSearch ? (
        <input
          type="search"
          value={search || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          style={{
            flex: '1 1 120px',
            minWidth: 0,
            maxWidth: '100%',
            padding: '6px 10px',
            fontSize: 12,
            border: `1px solid ${BORDER}`,
            borderRadius: 2,
            fontFamily: UI,
          }}
        />
      ) : null}
    </div>
  )
}
