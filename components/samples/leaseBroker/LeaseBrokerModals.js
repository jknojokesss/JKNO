import { useState } from 'react'
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
        <h2 id="lb-modal-title" className="lb-modal-title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="lb-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

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
        <Field label="Client name">
          <input className="lb-inp" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} required />
        </Field>
        <Field label="Phone">
          <input className="lb-inp" type="tel" value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <input className="lb-inp" type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
        </Field>
        <Field label="Referrer">
          <select className="lb-inp" value={referrerId} onChange={(e) => setReferrerId(e.target.value)}>
            {referrers.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Make">
            <input className="lb-inp" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} required />
          </Field>
          <Field label="Model">
            <input className="lb-inp" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} required />
          </Field>
        </div>
        <Field label="Trim">
          <input className="lb-inp" value={vehicle.trim} onChange={(e) => setVehicle({ ...vehicle, trim: e.target.value })} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Field label="Miles per year">
            <input className="lb-inp" type="number" value={vehicle.miles_per_year} onChange={(e) => setVehicle({ ...vehicle, miles_per_year: e.target.value })} />
          </Field>
          <Field label="Term (months)">
            <input className="lb-inp" type="number" value={vehicle.term_months} onChange={(e) => setVehicle({ ...vehicle, term_months: e.target.value })} />
          </Field>
          <Field label="Down">
            <input className="lb-inp" type="number" value={vehicle.down} onChange={(e) => setVehicle({ ...vehicle, down: e.target.value })} />
          </Field>
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
        <Field label="Dealer">
          <select className="lb-inp" value={dealerId} onChange={(e) => setDealerId(e.target.value)} required>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Monthly">
            <input className="lb-inp" type="number" required value={form.monthly} onChange={(e) => setForm({ ...form, monthly: e.target.value })} />
          </Field>
          <Field label="Due at signing">
            <input className="lb-inp" type="number" required value={form.due_at_signing} onChange={(e) => setForm({ ...form, due_at_signing: e.target.value })} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Money factor">
            <input className="lb-inp" value={form.money_factor} onChange={(e) => setForm({ ...form, money_factor: e.target.value })} />
          </Field>
          <Field label="Residual %">
            <input className="lb-inp" type="number" value={form.residual_pct} onChange={(e) => setForm({ ...form, residual_pct: e.target.value })} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Rebates">
            <input className="lb-inp" type="number" value={form.rebates} onChange={(e) => setForm({ ...form, rebates: e.target.value })} />
          </Field>
          <Field label="Quote date">
            <input className="lb-inp" type="date" value={form.quote_date} onChange={(e) => setForm({ ...form, quote_date: e.target.value })} />
          </Field>
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
        <Field label="Dealer name">
          <input className="lb-inp" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Salesperson">
          <input className="lb-inp" value={salesperson} onChange={(e) => setSalesperson(e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="lb-inp" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Brands">
          <input className="lb-inp" placeholder="BMW, MINI" value={brands} onChange={(e) => setBrands(e.target.value)} />
        </Field>
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
      <p style={{ marginBottom: 16 }}>
        {clientName} — broker fee {amount != null ? `$${amount}` : ''}
      </p>
      <Field label="Date paid">
        <input className="lb-inp" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
      </Field>
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
