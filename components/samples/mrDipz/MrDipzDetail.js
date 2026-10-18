import { money, moneySigned, pct1, pctOf, fmtInt, fmtD, deltaColor, BUCKETS, GREEN, MUTED } from './mrDipzUtils'
import { Card, Stat, MdTable, Tag, PreviewFields } from './MrDipzKit'

const sumBy = (arr, f) => arr.reduce((t, x) => t + f(x), 0)

function Frame({ title, sub, depth, back, close, children }) {
  return (
    <>
      <div className="md-back">
        <button type="button" className="md-backbtn" onClick={back}>
          ‹ Back
        </button>
        {depth > 1 ? (
          <button type="button" className="md-backbtn" onClick={close}>
            Close
          </button>
        ) : null}
      </div>
      <div className="md-dtitle">{title}</div>
      <div className="md-dsub">{sub}</div>
      {children}
    </>
  )
}

function AreaDetail({ model, id, open }) {
  const a = model.areaById[id]
  const stores = a.storeIds.map((sid) => model.storeById[sid])
  return {
    title: a.name,
    sub: 'Area · September',
    body: (
      <>
        <div className="md-stats">
          <Stat k="Sales" v={money(a.sales)} />
          <Stat k="Credits" v={money(a.credits)} />
          <Stat k="Credit %" v={pct1(a.pct)} />
          <Stat k="Net" v={money(a.net)} />
          <Stat k="Owed" v={money(a.owed)} />
        </div>
        <Card title="Stores">
          <MdTable
            columns={['Store', 'Sales', 'Credits', 'Credit %', 'Net']}
            rows={[
              ...stores.map((s) => ({
                key: s.id,
                name: s.name,
                cells: [money(s.sales), money(s.credits), pct1(s.pct), money(s.net)],
                onClick: () => open({ type: 'store', id: s.id }),
              })),
              { key: 'total', kind: 'total', name: 'Total', cells: [money(a.sales), money(a.credits), pct1(a.pct), money(a.net)] },
            ]}
          />
        </Card>
        <Card title="Credits by product">
          <MdTable
            columns={['Product', 'Expired', 'Credits']}
            rows={[
              ...[...a.creditsByProduct]
                .sort((x, y) => y.credits - x.credits)
                .map((r) => ({
                  key: r.productId,
                  name: r.name,
                  cells: [fmtInt(r.expUnits), money(r.credits)],
                  onClick: () => open({ type: 'productCredit', id: r.productId }),
                })),
              {
                key: 'total',
                kind: 'total',
                name: 'Total',
                cells: [fmtInt(sumBy(a.creditsByProduct, (r) => r.expUnits)), money(a.credits)],
              },
            ]}
          />
        </Card>
        <Card title="Credits by week">
          <MdTable
            columns={['Week', 'Expired', 'Credits']}
            rows={[
              ...a.byWeek.map((w) => ({
                key: w.weekId,
                name: w.label,
                cells: [fmtInt(w.expUnits), money(w.credits)],
                onClick: () => open({ type: 'week', id: w.weekId }),
              })),
              { key: 'total', kind: 'total', name: 'Total', cells: [fmtInt(sumBy(a.byWeek, (w) => w.expUnits)), money(a.credits)] },
            ]}
          />
        </Card>
      </>
    ),
  }
}

function StoreDetail({ model, id, open }) {
  const s = model.storeById[id]
  const area = model.areaById[s.areaId]
  const paidSep = s.paidInvoices.filter((i) => i.weekId)
  return {
    title: s.name,
    sub: `${area.name} · September`,
    body: (
      <>
        <div className="md-stats">
          <Stat k="Sales" v={money(s.sales)} />
          <Stat k="Credits" v={money(s.credits)} onClick={() => open({ type: 'storeCredit', id: s.id })} />
          <Stat k="Credit %" v={pct1(s.pct)} />
          <Stat k="Net" v={money(s.net)} />
          <Stat k="Owed" v={money(s.owed)} onClick={() => open({ type: 'storeInvoices', id: s.id })} />
        </div>
        <Card title="By product">
          <MdTable
            columns={['Product', 'Delivered', 'Sales', 'Expired', 'Credits']}
            rows={[
              ...s.byProduct.map((r) => ({
                key: r.productId,
                name: r.name,
                cells: [fmtInt(r.units), money(r.sales), fmtInt(r.expUnits), money(r.credits)],
                onClick: () => open({ type: 'storeProduct', storeId: s.id, productId: r.productId }),
              })),
              {
                key: 'total',
                kind: 'total',
                name: 'Total',
                cells: [fmtInt(s.units), money(s.sales), fmtInt(s.expUnits), money(s.credits)],
              },
            ]}
          />
        </Card>
        <Card title="By week">
          <MdTable
            columns={['Week', 'Sales', 'Credits', 'Net']}
            rows={[
              ...s.byWeek.map((w) => ({
                key: w.weekId,
                name: w.label,
                cells: [money(w.sales), money(w.credits), money(w.net)],
                onClick: () => open({ type: 'storeInvoices', id: s.id }),
              })),
              { key: 'total', kind: 'total', name: 'Total', cells: [money(s.sales), money(s.credits), money(s.net)] },
            ]}
          />
        </Card>
        <Card title="Expired product">
          <MdTable
            columns={['Product', 'Units', 'Amount']}
            rows={[
              ...s.expiredEntries.map((e) => ({
                key: `${e.weekId}-${e.productId}`,
                name: e.name,
                sub: e.weekLabel,
                cells: [fmtInt(e.units), money(e.amount)],
                onClick: () => open({ type: 'storeProduct', storeId: s.id, productId: e.productId }),
              })),
              { key: 'total', kind: 'total', name: 'Total', cells: [fmtInt(s.expUnits), money(s.credits)] },
            ]}
          />
        </Card>
        <Card title="Invoices">
          <MdTable
            columns={['', 'Count', 'Amount']}
            rows={[
              {
                key: 'open',
                name: 'Open',
                cells: [fmtInt(s.openInvoices.length), money(s.owed)],
                onClick: () => open({ type: 'storeInvoices', id: s.id }),
              },
              {
                key: 'paid',
                name: 'Paid in September',
                cells: [fmtInt(paidSep.length), money(sumBy(paidSep, (i) => i.amount))],
                onClick: () => open({ type: 'storeInvoices', id: s.id }),
              },
            ]}
          />
        </Card>
      </>
    ),
  }
}

function StoreProductDetail({ model, storeId, productId, open }) {
  const s = model.storeById[storeId]
  const r = s.byProduct.find((x) => x.productId === productId)
  return {
    title: `${r.name} · ${s.name}`,
    sub: 'September',
    body: (
      <>
        <div className="md-stats">
          <Stat k="Delivered" v={fmtInt(r.units)} />
          <Stat k="Expired" v={fmtInt(r.expUnits)} />
          <Stat k="Sales" v={money(r.sales)} />
          <Stat k="Credits" v={money(r.credits)} />
        </div>
        <Card title="By week">
          <MdTable
            columns={['Week', 'Delivered', 'Expired', 'Sales', 'Credits']}
            rows={[
              ...model.weeks.map((w, i) => ({
                key: w.id,
                name: w.label,
                cells: [fmtInt(r.delivered[i]), fmtInt(r.expired[i]), money(r.salesW[i]), money(r.creditsW[i])],
                onClick: () => open({ type: 'week', id: w.id }),
              })),
              {
                key: 'total',
                kind: 'total',
                name: 'Total',
                cells: [fmtInt(r.units), fmtInt(r.expUnits), money(r.sales), money(r.credits)],
              },
            ]}
          />
        </Card>
      </>
    ),
  }
}

function StoreCreditDetail({ model, id, open }) {
  const s = model.storeById[id]
  const d = Math.round(s.pct * 10) - Math.round(s.priorPct * 10)
  return {
    title: `Credits · ${s.name}`,
    sub: 'Expired product pulled back in September',
    body: (
      <>
        <div className="md-stats">
          <Stat k="Credits" v={money(s.credits)} />
          <Stat k="Credit %" v={pct1(s.pct)} color={deltaColor(d, { cost: true })} />
          <Stat k="Last month %" v={pct1(s.priorPct)} />
          <Stat k="Net after credits" v={money(s.net)} onClick={() => open({ type: 'store', id: s.id })} />
        </div>
        <Card title="Expired product">
          <MdTable
            columns={['Product', 'Units', 'Amount']}
            rows={[
              ...s.expiredEntries.map((e) => ({
                key: `${e.weekId}-${e.productId}`,
                name: e.name,
                sub: e.weekLabel,
                cells: [fmtInt(e.units), money(e.amount)],
                onClick: () => open({ type: 'storeProduct', storeId: s.id, productId: e.productId }),
              })),
              { key: 'total', kind: 'total', name: 'Total', cells: [fmtInt(s.expUnits), money(s.credits)] },
            ]}
          />
        </Card>
      </>
    ),
  }
}

function ProductDetail({ model, id, open, credit }) {
  const p = model.productAgg[id]
  const stats = credit
    ? [
        ['Credits', money(p.credits)],
        ['Expired', fmtInt(p.expUnits)],
        ['% of sales', pct1(p.pct)],
        ['Sales', money(p.sales)],
      ]
    : [
        ['Delivered', fmtInt(p.units)],
        ['Sales', money(p.sales)],
        ['Expired', fmtInt(p.expUnits)],
        ['Credits', money(p.credits)],
        ['Credit %', pct1(p.pct)],
        ['Net', money(p.net)],
      ]
  return {
    title: credit ? `Credits · ${p.name}` : p.name,
    sub: `${p.type} · ${p.size} · ${money(p.priceC)} · September`,
    body: (
      <>
        <div className="md-stats">
          {stats.map(([k, v]) => (
            <Stat key={k} k={k} v={v} />
          ))}
        </div>
        <Card title="By area">
          <MdTable
            columns={['Area', 'Delivered', 'Expired', 'Sales', 'Credits']}
            rows={[
              ...p.byArea.map((r) => ({
                key: r.areaId,
                name: r.name,
                cells: [fmtInt(r.units), fmtInt(r.expUnits), money(r.sales), money(r.credits)],
                onClick: () => open({ type: 'area', id: r.areaId }),
              })),
              {
                key: 'total',
                kind: 'total',
                name: 'Total',
                cells: [fmtInt(p.units), fmtInt(p.expUnits), money(p.sales), money(p.credits)],
              },
            ]}
          />
        </Card>
        <Card title="By week">
          <MdTable
            columns={['Week', 'Delivered', 'Expired', 'Sales', 'Credits']}
            rows={[
              ...p.byWeek.map((w) => ({
                key: w.weekId,
                name: w.label,
                cells: [fmtInt(w.units), fmtInt(w.expUnits), money(w.sales), money(w.credits)],
                onClick: () => open({ type: 'week', id: w.weekId }),
              })),
              {
                key: 'total',
                kind: 'total',
                name: 'Total',
                cells: [fmtInt(p.units), fmtInt(p.expUnits), money(p.sales), money(p.credits)],
              },
            ]}
          />
        </Card>
        <Card title="Most expired">
          <MdTable
            columns={['Store', 'Expired', 'Credits']}
            rows={p.topStores.map((r) => ({
              key: r.storeId,
              name: r.storeName,
              cells: [fmtInt(r.expUnits), money(r.credits)],
              onClick: () => open({ type: 'store', id: r.storeId }),
            }))}
          />
        </Card>
      </>
    ),
  }
}

function ProductGroupDetail({ model, id, open }) {
  const list = model.products.filter((p) => p.type === id)
  const sales = sumBy(list, (p) => p.sales)
  const credits = sumBy(list, (p) => p.credits)
  return {
    title: id === 'Dip' ? 'Dips' : 'Dressings',
    sub: 'September',
    body: (
      <Card title="Products">
        <MdTable
          columns={['Product', 'Sales', 'Credits', 'Credit %', 'Net']}
          rows={[
            ...list.map((p) => ({
              key: p.id,
              name: p.name,
              cells: [money(p.sales), money(p.credits), pct1(p.pct), money(p.net)],
              onClick: () => open({ type: 'product', id: p.id }),
            })),
            {
              key: 'total',
              kind: 'total',
              name: 'Total',
              cells: [money(sales), money(credits), pct1(pctOf(credits, sales)), money(sales - credits)],
            },
          ]}
        />
      </Card>
    ),
  }
}

function WeekDetail({ model, id, open }) {
  const w = model.weekById[id]
  return {
    title: w.label,
    sub: 'Credits for expired product',
    body: (
      <>
        <div className="md-stats">
          <Stat k="Credits" v={money(w.credits)} />
          <Stat k="Expired" v={fmtInt(w.expUnits)} />
          <Stat k="Sales" v={money(w.sales)} />
          <Stat k="Credit %" v={pct1(w.pct)} />
        </div>
        <Card title="By store">
          <MdTable
            columns={['Store', 'Expired', 'Credits']}
            rows={[
              ...w.byStore.map((r) => ({
                key: r.storeId,
                name: r.name,
                cells: [fmtInt(r.expUnits), money(r.credits)],
                onClick: () => open({ type: 'store', id: r.storeId }),
              })),
              { key: 'total', kind: 'total', name: 'Total', cells: [fmtInt(w.expUnits), money(w.credits)] },
            ]}
          />
        </Card>
        <Card title="By product">
          <MdTable
            columns={['Product', 'Expired', 'Credits']}
            rows={[
              ...w.byProduct.map((r) => ({
                key: r.productId,
                name: r.name,
                cells: [fmtInt(r.expUnits), money(r.credits)],
                onClick: () => open({ type: 'productCredit', id: r.productId }),
              })),
              { key: 'total', kind: 'total', name: 'Total', cells: [fmtInt(w.expUnits), money(w.credits)] },
            ]}
          />
        </Card>
      </>
    ),
  }
}

function StoreInvoicesDetail({ model, id, open }) {
  const s = model.storeById[id]
  const paidSep = s.paidInvoices.filter((i) => i.weekId)
  const openRows = [...s.openInvoices].sort((a, b) => a.date.localeCompare(b.date))
  const split = (i) => (i.weekId ? [money(i.weekSales), money(i.weekCredits)] : ['—', '—'])
  return {
    title: `Invoices · ${s.name}`,
    sub: 'Open balance and September invoices',
    body: (
      <>
        <div className="md-stats">
          <Stat k="Owed" v={money(s.owed)} />
          {BUCKETS.filter((b) => s.aging[b.id]).map((b) => (
            <Stat key={b.id} k={b.label} v={money(s.aging[b.id])} />
          ))}
        </div>
        <Card title="Open">
          <MdTable
            columns={['Invoice', 'Days', 'Sales', 'Credits', 'Amount']}
            rows={[
              ...openRows.map((i) => ({
                key: i.no,
                name: `#${i.no}`,
                sub: `${fmtD(i.date)}${i.weekLabel ? ` · week of ${i.weekLabel}` : ''}`,
                cells: [fmtInt(i.days), ...split(i), money(i.amount)],
                onClick: () => open({ type: 'invoice', storeId: s.id, no: i.no }),
              })),
              { key: 'total', kind: 'total', name: 'Total', cells: ['', '', '', money(s.owed)] },
            ]}
          />
        </Card>
        {paidSep.length ? (
          <Card title="Paid · September">
            <MdTable
              columns={['Invoice', 'Sales', 'Credits', 'Amount']}
              rows={[
                ...paidSep.map((i) => ({
                  key: i.no,
                  name: `#${i.no}`,
                  tag: <Tag color={GREEN}>Paid</Tag>,
                  sub: `${fmtD(i.date)} · week of ${i.weekLabel}`,
                  cells: [...split(i), money(i.amount)],
                  onClick: () => open({ type: 'invoice', storeId: s.id, no: i.no }),
                })),
                {
                  key: 'total',
                  kind: 'total',
                  name: 'Total',
                  cells: [
                    money(sumBy(paidSep, (i) => i.weekSales)),
                    money(sumBy(paidSep, (i) => i.weekCredits)),
                    money(sumBy(paidSep, (i) => i.amount)),
                  ],
                },
              ]}
            />
          </Card>
        ) : null}
      </>
    ),
  }
}

function InvoiceDetail({ model, storeId, no, open }) {
  const s = model.storeById[storeId]
  const inv = s.invoices.find((i) => i.no === no)
  const isPriorWeek = inv.weekId && String(inv.weekId).startsWith('pw')
  const wi = inv.weekId && !isPriorWeek ? model.weeks.findIndex((w) => w.id === inv.weekId) : -1
  const lines = wi >= 0 ? s.byProduct.filter((r) => r.delivered[wi] || r.expired[wi]) : []
  return {
    title: `Invoice #${inv.no}`,
    sub: `${s.name} · ${fmtD(inv.date)}`,
    body: (
      <>
        <div className="md-stats">
          {inv.weekSales != null ? <Stat k="Sales" v={money(inv.weekSales)} /> : null}
          {inv.weekCredits != null ? <Stat k="Credits" v={money(inv.weekCredits)} /> : null}
          <Stat k="Invoice" v={money(inv.amount)} />
          <Stat k="Status" v={inv.status === 'paid' ? 'Paid' : 'Open'} color={inv.status === 'paid' ? GREEN : undefined} />
          {inv.status === 'open' ? <Stat k="Days" v={fmtInt(inv.days)} /> : null}
        </div>
        {wi >= 0 ? (
          <Card title={`Week of ${inv.weekLabel}`}>
            <MdTable
              columns={['Product', 'Delivered', 'Sales', 'Expired', 'Credits']}
              rows={[
                ...lines.map((r) => ({
                  key: r.productId,
                  name: r.name,
                  cells: [fmtInt(r.delivered[wi]), money(r.salesW[wi]), fmtInt(r.expired[wi]), money(r.creditsW[wi])],
                  onClick: () => open({ type: 'storeProduct', storeId: s.id, productId: r.productId }),
                })),
                {
                  key: 'total',
                  kind: 'total',
                  name: 'Total',
                  cells: [
                    fmtInt(sumBy(lines, (r) => r.delivered[wi])),
                    money(inv.weekSales),
                    fmtInt(sumBy(lines, (r) => r.expired[wi])),
                    money(inv.weekCredits),
                  ],
                },
              ]}
            />
          </Card>
        ) : isPriorWeek && inv.weekLabel ? (
          <Card title={`Week of ${inv.weekLabel}`}>
            <MdTable
              columns={['', 'Sales', 'Credits', 'Open on invoice']}
              rows={[
                {
                  key: 'week',
                  name: 'August delivery week',
                  cells: [money(inv.weekSales), money(inv.weekCredits), money(inv.amount)],
                },
              ]}
            />
          </Card>
        ) : (
          <Card title="Store">
            <MdTable
              columns={['', 'Owed']}
              rows={[{ key: 'store', name: s.name, cells: [money(s.owed)], onClick: () => open({ type: 'store', id: s.id }) }]}
            />
          </Card>
        )}
      </>
    ),
  }
}

function BucketDetail({ model, id, open }) {
  const b = BUCKETS.find((x) => x.id === id)
  const list = id === 'all' ? model.openInvoices : model.openInvoices.filter((i) => i.bucket === id)
  const total = sumBy(list, (i) => i.amount)
  return {
    title: b ? b.label : 'All open invoices',
    sub: `${fmtInt(list.length)} open invoices`,
    body: (
      <Card title="Open invoices">
        <MdTable
          columns={['Store', 'Days', 'Amount']}
          rows={[
            ...list.map((i) => ({
              key: `${i.storeId}-${i.no}`,
              name: i.storeName,
              sub: `#${i.no} · ${fmtD(i.date)}`,
              cells: [fmtInt(i.days), money(i.amount)],
              onClick: () => open({ type: 'storeInvoices', id: i.storeId }),
            })),
            { key: 'total', kind: 'total', name: 'Total', cells: ['', money(total)] },
          ]}
        />
      </Card>
    ),
  }
}

function compareRows(rows, total, { cost = false } = {}) {
  const line = (r) => ({
    key: r.key,
    name: r.name,
    kind: r.kind,
    cells: [money(r.cur), money(r.prior), moneySigned(r.cur - r.prior)],
    colors: [null, MUTED, deltaColor(r.cur - r.prior, { cost: r.cost ?? cost })],
    onClick: r.onClick,
  })
  return [...rows.map(line), ...(total ? [line({ ...total, kind: 'total' })] : [])]
}

function PnlDetail({ model, id, open }) {
  const { sep, aug, cogsLines, opexLines } = model.pnl
  const cols = ['', 'September', 'August', 'Change']

  if (id === 'gross' || id === 'credits' || id === 'netSales') {
    const pick = {
      gross: (a) => [a.sales, a.priorSales],
      credits: (a) => [-a.credits, -a.priorCredits],
      netSales: (a) => [a.sales - a.credits, a.priorSales - a.priorCredits],
    }[id]
    const title = { gross: 'Gross sales', credits: 'Less credits for expired product', netSales: 'Net sales' }[id]
    const tot = { gross: [sep.gross, aug.gross], credits: [sep.credits, aug.credits], netSales: [sep.netSales, aug.netSales] }[id]
    return {
      title,
      sub: 'By area · September vs August',
      body: (
        <Card title="By area">
          <MdTable
            columns={['Area', 'September', 'August', 'Change']}
            rows={compareRows(
              model.areas.map((a) => {
                const [cur, prior] = pick(a)
                return { key: a.id, name: a.name, cur, prior, onClick: () => open({ type: 'area', id: a.id }) }
              }),
              { key: 'total', name: 'Total', cur: tot[0], prior: tot[1] },
            )}
          />
        </Card>
      ),
    }
  }

  if (id.startsWith('line:')) {
    const lid = id.slice(5)
    const cur = sep.lines[lid]
    const prior = aug.lines[lid]
    const entries = (l, label) => (
      <Card title={label}>
        <MdTable
          columns={['Entry', 'Amount']}
          rows={[
            ...l.entries.map((e, i) => ({ key: `${i}`, name: e.description, cells: [money(e.amount)] })),
            { key: 'total', kind: 'total', name: 'Total', cells: [money(l.amount)] },
          ]}
        />
      </Card>
    )
    return {
      title: cur.label,
      sub: `${cur.group === 'cogs' ? 'Cost of goods' : 'Operating expenses'} · September vs August`,
      body: (
        <>
          <div className="md-stats">
            <Stat k="September" v={money(cur.amount)} />
            <Stat k="August" v={money(prior.amount)} />
            <Stat k="Change" v={moneySigned(cur.amount - prior.amount)} color={deltaColor(cur.amount - prior.amount, { cost: true })} />
          </div>
          {entries(cur, 'September')}
          {entries(prior, 'August')}
        </>
      ),
    }
  }

  if (id === 'cogs' || id === 'opex') {
    const lines = id === 'cogs' ? cogsLines : opexLines
    return {
      title: id === 'cogs' ? 'Total cost of goods' : 'Total operating expenses',
      sub: 'September vs August',
      body: (
        <Card title="Lines">
          <MdTable
            columns={cols}
            rows={compareRows(
              lines.map((l) => ({
                key: l.id,
                name: l.label,
                cur: sep.lines[l.id].amount,
                prior: aug.lines[l.id].amount,
                onClick: () => open({ type: 'pnl', id: `line:${l.id}` }),
              })),
              { key: 'total', name: 'Total', cur: sep[id], prior: aug[id] },
              { cost: true },
            )}
          />
        </Card>
      ),
    }
  }

  const gp = id === 'grossProfit'
  const rows = gp
    ? [
        { key: 'ns', name: 'Net sales', cur: sep.netSales, prior: aug.netSales, onClick: () => open({ type: 'pnl', id: 'netSales' }) },
        { key: 'cogs', name: 'Less total cost of goods', cur: -sep.cogs, prior: -aug.cogs, onClick: () => open({ type: 'pnl', id: 'cogs' }) },
      ]
    : [
        { key: 'gp', name: 'Gross profit', cur: sep.grossProfit, prior: aug.grossProfit, onClick: () => open({ type: 'pnl', id: 'grossProfit' }) },
        { key: 'opex', name: 'Less total operating expenses', cur: -sep.opex, prior: -aug.opex, onClick: () => open({ type: 'pnl', id: 'opex' }) },
      ]
  const total = gp
    ? { key: 'total', name: 'Gross profit', cur: sep.grossProfit, prior: aug.grossProfit }
    : { key: 'total', name: 'Net profit', cur: sep.netProfit, prior: aug.netProfit }
  return {
    title: gp ? 'Gross profit' : 'Net profit',
    sub: 'September vs August',
    body: (
      <Card title={gp ? 'Net sales − cost of goods' : 'Gross profit − operating expenses'}>
        <MdTable columns={cols} rows={compareRows(rows, total)} />
      </Card>
    ),
  }
}

function ActionBtn({ children, onClick }) {
  return (
    <button type="button" className="md-backbtn" onClick={onClick} style={{ marginTop: 12, marginRight: 8 }}>
      {children}
    </button>
  )
}

function DeductionDetail({ model, id, open }) {
  const r = model.deductions.byId[id]
  const showMemo = r.status === 'matched' || r.code === 'Expired'
  const showDispute = r.status === 'dispute' || r.code === 'Unknown'
  return {
    title: r.ref,
    sub: `Distributor · remit ${fmtD(r.remittanceDate)}`,
    body: (
      <>
        <div className="md-stats">
          <Stat k="Invoice" v={`#${r.invoiceNo}`} />
          <Stat k="Invoice date" v={fmtD(r.invoiceDate)} />
          <Stat k="Invoice amount" v={money(r.invoiceAmount)} />
          <Stat k="Paid amount" v={money(r.paidAmount)} />
          <Stat k="Deduction" v={money(r.amount)} />
          <Stat k="Code" v={r.code} />
          <Stat k="Days left to dispute" v={fmtInt(r.daysLeft)} />
          <Stat k="Status" v={r.statusLabel} />
        </div>
        {showMemo ? <ActionBtn onClick={() => open({ type: 'deductionCreditMemo', id })}>Create credit memo</ActionBtn> : null}
        {showDispute ? <ActionBtn onClick={() => open({ type: 'deductionDispute', id })}>Dispute</ActionBtn> : null}
      </>
    ),
  }
}

function DeductionCreditMemoPreview({ model, id, close }) {
  const r = model.deductions.byId[id]
  const lineDesc = r.memoProductName || r.memoDesc
  const priceC = r.memoProductId ? model.productAgg[r.memoProductId]?.priceC : 0
  const qty = r.memoProductId && priceC ? fmtInt(Math.round(r.amount / priceC)) : '1'
  const line = `${lineDesc} · qty ${qty} · ${money(r.amount)}`
  return {
    title: 'Credit memo preview',
    sub: 'Not sent',
    body: (
      <div className="md-preview-panel">
        <Card title="Credit memo">
          <PreviewFields
            rows={[
              { key: 'cust', label: 'Customer', value: 'Distributor' },
              { key: 'date', label: 'Date', value: fmtD(r.remittanceDate) },
              { key: 'line', label: 'Line', value: line },
              { key: 'total', label: 'Total', value: money(r.amount), total: true },
            ]}
          />
        </Card>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 4, overflowWrap: 'anywhere' }}>
          Goes into QuickBooks as a credit memo
        </div>
        <ActionBtn onClick={close}>Close</ActionBtn>
      </div>
    ),
  }
}

function DeductionDisputePreview({ model, id, close }) {
  const r = model.deductions.byId[id]
  const reason =
    r.code === 'Unknown'
      ? `Dispute unlabeled deduction on invoice #${r.invoiceNo}.`
      : r.code === 'Shortage'
        ? `Dispute ${r.code.toLowerCase()} on invoice #${r.invoiceNo}.`
        : `Dispute ${r.code.toLowerCase()} deduction on invoice #${r.invoiceNo}.`
  return {
    title: 'Dispute note preview',
    sub: 'Not sent',
    body: (
      <div className="md-preview-panel">
        <Card title="Note">
          <PreviewFields
            rows={[
              { key: 'ref', label: 'Ref', value: r.ref },
              { key: 'inv', label: 'Invoice', value: `#${r.invoiceNo} · ${fmtD(r.invoiceDate)}` },
              { key: 'amt', label: 'Amount', value: money(r.amount) },
              { key: 'reason', label: 'Reason', value: reason },
              { key: 'backup', label: 'Backup', value: r.backup || '—' },
            ]}
          />
        </Card>
        <ActionBtn onClick={close}>Close</ActionBtn>
      </div>
    ),
  }
}

const VIEWS = {
  area: AreaDetail,
  store: StoreDetail,
  storeProduct: StoreProductDetail,
  storeCredit: StoreCreditDetail,
  product: (p) => ProductDetail({ ...p, credit: false }),
  productCredit: (p) => ProductDetail({ ...p, credit: true }),
  productGroup: ProductGroupDetail,
  week: WeekDetail,
  storeInvoices: StoreInvoicesDetail,
  invoice: InvoiceDetail,
  bucket: BucketDetail,
  pnl: PnlDetail,
  deduction: DeductionDetail,
  deductionCreditMemo: DeductionCreditMemoPreview,
  deductionDispute: DeductionDisputePreview,
}

export default function MrDipzDetail({ model, detail, depth, open, back, close }) {
  const view = VIEWS[detail.type]
  if (!view) return null
  const { title, sub, body } = view({ model, open, close, back, ...detail })
  return (
    <Frame title={title} sub={sub} depth={depth} back={back} close={close}>
      <div className="md-detail-body">{body}</div>
    </Frame>
  )
}
