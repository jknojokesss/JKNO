import { BORDER, CARDBG, INK, MUTED, UI } from '../primalKrispUtils'

/**
 * Plain-text sort pills + optional search. sortOptions: { key, labels: { asc, desc } }.
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
    <div style={{ marginBottom: 10, fontFamily: UI, width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>Sort</span>
        {sortOptions.map((opt) => {
          const active = sort.key === opt.key
          const label = active ? opt.labels[sort.dir] || opt.labels.desc : opt.labels.desc
          return (
            <button
              key={opt.key}
              type="button"
              className="pk-sort-pill"
              onClick={() =>
                onSortChange({
                  key: opt.key,
                  dir: active && sort.dir === 'desc' ? 'asc' : 'desc',
                })
              }
              style={{
                fontFamily: UI,
                fontSize: 12,
                lineHeight: 1,
                minHeight: 0,
                height: 28,
                padding: '4px 8px',
                borderRadius: 4,
                border: `1px solid ${active ? INK : BORDER}`,
                background: active ? CARDBG : 'transparent',
                color: active ? INK : MUTED,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
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
            width: '100%',
            marginTop: 8,
            boxSizing: 'border-box',
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
