/** Inline client names with commas that do not wrap alone. */
export default function LeaseBrokerClientList({ clients, onOpen }) {
  if (!clients?.length) return '—'
  return (
    <span className="lb-client-run">
      {clients.map((d, i) => (
        <span key={d.id} className="lb-client-item">
          {i > 0 ? ', ' : ''}
          <button type="button" className="lb-link-btn" onClick={() => onOpen(d.id)}>
            {d.client.name}
          </button>
        </span>
      ))}
    </span>
  )
}
