import { useState } from 'react'
import { INK, UI } from './leaseBrokerUtils'
import DATA from '../../../data/lease-broker-crm.json'

function Modal({ title, onClose, children }) {
  return (
    <div className="lb-modal-back" role="presentation" onClick={onClose}>
      <div
        className="lb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lb-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="lb-modal-title" style={{ fontFamily: UI, fontSize: 18, fontWeight: 700, marginBottom: 14, color: INK }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

const fieldStyle = { marginBottom: 12 }
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.5px' }

export function AddDealModal({ referrers, onClose, onSave, initialClient, initialReferrerId }) {
  const [client, setClient] = useState(
    initialClient || { name: '', phone: '', email: '' }
  )
  const [vehicle, setVehicle] = useState({
    make: '',
    model: '',
    trim: '',
    miles_per_year: 10000,
    term_months: 36,
    down: 0,
  })
  const [referrerId, setReferrerId] = useState(initialReferrerId || referrers[0]?.id || '')

  const submit = (e) => {
    e.preventDefault()
    if (!client.name.trim() || !vehicle.make.trim() || !vehicle.model.trim()) return
    onSave({ client, vehicle, referrerId })
    onClose()
  }

  return (
    <Modal title="Add deal" onClose={onClose}>
      <form onSubmit={submit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Client name</label>
          <input className="lb-inp" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} required />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Phone</label>
          <input className="lb-inp" type="tel" value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Email</label>
          <input className="lb-inp" type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Referrer</label>
          <select className="lb-inp" value={referrerId} onChange={(e) => setReferrerId(e.target.value)}>
            {referrers.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Make</label>
            <input className="lb-inp" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Model</label>
            <input className="lb-inp" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} required />
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Trim</label>
          <input className="lb-inp" value={vehicle.trim} onChange={(e) => setVehicle({ ...vehicle, trim: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Miles/yr</label>
            <input className="lb-inp" type="number" value={vehicle.miles_per_year} onChange={(e) => setVehicle({ ...vehicle, miles_per_year: e.target.value })} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Term (mo)</label>
            <input className="lb-inp" type="number" value={vehicle.term_months} onChange={(e) => setVehicle({ ...vehicle, term_months: e.target.value })} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Down</label>
            <input className="lb-inp" type="number" value={vehicle.down} onChange={(e) => setVehicle({ ...vehicle, down: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" className="lb-btn lb-btn--primary" style={{ flex: 1 }}>Save deal</button>
          <button type="button" className="lb-btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

export function AddQuoteModal({ dealers, dealId, onClose, onSave }) {
  const today = DATA.meta.as_of
  const [dealerId, setDealerId] = useState(dealers[0]?.id || '')
  const [form, setForm] = useState({
    monthly: '',
    due_at_signing: '',
    money_factor: '0.00180',
    residual_pct: '58',
    rebates: '0',
    quote_date: today,
  })

  const submit = (e) => {
    e.preventDefault()
    if (!dealerId) return
    onSave({
      dealId,
      quote: { dealer_id: dealerId, ...form },
    })
    onClose()
  }

  return (
    <Modal title="Add dealer quote" onClose={onClose}>
      <form onSubmit={submit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Dealer</label>
          <select className="lb-inp" value={dealerId} onChange={(e) => setDealerId(e.target.value)} required>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Monthly</label>
            <input className="lb-inp" type="number" required value={form.monthly} onChange={(e) => setForm({ ...form, monthly: e.target.value })} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Due at signing</label>
            <input className="lb-inp" type="number" required value={form.due_at_signing} onChange={(e) => setForm({ ...form, due_at_signing: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Money factor</label>
            <input className="lb-inp" value={form.money_factor} onChange={(e) => setForm({ ...form, money_factor: e.target.value })} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Residual %</label>
            <input className="lb-inp" type="number" value={form.residual_pct} onChange={(e) => setForm({ ...form, residual_pct: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Rebates</label>
            <input className="lb-inp" type="number" value={form.rebates} onChange={(e) => setForm({ ...form, rebates: e.target.value })} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Quote date</label>
            <input className="lb-inp" type="date" value={form.quote_date} onChange={(e) => setForm({ ...form, quote_date: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" className="lb-btn lb-btn--primary" style={{ flex: 1 }}>Save quote</button>
          <button type="button" className="lb-btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

export function AddDealerModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [salesperson, setSalesperson] = useState('')
  const [phone, setPhone] = useState('')
  const [brands, setBrands] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name,
      salesperson,
      phone,
      brands: brands.split(',').map((s) => s.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <Modal title="Add dealer" onClose={onClose}>
      <form onSubmit={submit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Dealer name</label>
          <input className="lb-inp" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Salesperson</label>
          <input className="lb-inp" value={salesperson} onChange={(e) => setSalesperson(e.target.value)} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Phone</label>
          <input className="lb-inp" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Brands (comma-separated)</label>
          <input className="lb-inp" placeholder="BMW, MINI" value={brands} onChange={(e) => setBrands(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" className="lb-btn lb-btn--primary" style={{ flex: 1 }}>Save dealer</button>
          <button type="button" className="lb-btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

export function MarkFeePaidModal({ clientName, amount, asOf, onClose, onSave }) {
  const [paidDate, setPaidDate] = useState(asOf)

  return (
    <Modal title="Mark fee paid" onClose={onClose}>
      <p style={{ fontSize: 14, marginBottom: 14, color: INK }}>
        {clientName} — broker fee {amount != null ? `$${amount}` : ''}
      </p>
      <div style={fieldStyle}>
        <label style={labelStyle}>Date paid</label>
        <input className="lb-inp" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="lb-btn lb-btn--primary"
          style={{ flex: 1 }}
          onClick={() => {
            onSave(paidDate)
            onClose()
          }}
        >
          Confirm paid
        </button>
        <button type="button" className="lb-btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  )
}
