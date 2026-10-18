/**
 * Verbatim sample rows for Closeout Explosion — assembled from the provided DATA object.
 * All dashboard totals are computed in closeoutExplosionCompute.js.
 */
import L2041 from './lots/L-2041.json'
import L2044 from './lots/L-2044.json'
import L2047 from './lots/L-2047.json'
import L2049 from './lots/L-2049.json'
import L2050 from './lots/L-2050.json'
import L2052 from './lots/L-2052.json'
import L2053 from './lots/L-2053.json'
import L2056 from './lots/L-2056.json'
import L2061 from './lots/L-2061.json'
import L2063 from './lots/L-2063.json'

const DATA = {
  asOf: '2026-10-17',
  lots: [L2041, L2044, L2047, L2049, L2050, L2052, L2053, L2056, L2061, L2063],
  buyers: [
    { name: 'Corner Quick Mart', type: 'c-store chain', termsDays: 30 },
    { name: 'Valley Discount Grocers', type: 'grocery chain', termsDays: 30 },
    { name: 'Summit Surplus Distributors', type: 'distributor', termsDays: 15 },
    { name: 'Bargain Outlet Stores', type: 'discount store', termsDays: 30 },
    { name: 'Elm Street Family Grocery', type: 'independent grocery', termsDays: 15 },
    { name: 'Brightway Dollar Stores', type: 'dollar store chain', termsDays: 30 },
    { name: 'Wexley Regional Supply', type: 'regional distributor', termsDays: 30 },
    { name: 'Fairlane Convenience Group', type: 'c-store group', termsDays: 30 },
  ],
  pnl: {
    thisLabel: 'Oct 1–17',
    priorLabel: 'Sep 1–17',
    thisFrom: '2026-10-01',
    thisTo: '2026-10-17',
    priorFrom: '2026-09-01',
    priorTo: '2026-09-17',
    expenses: [
      { name: 'Warehouse rent', this: 1400, prior: 1400 },
      { name: 'Warehouse labor', this: 2180, prior: 1960 },
      { name: 'Outbound trucking', this: 870, prior: 1040 },
      { name: 'Forklift and equipment', this: 210, prior: 165 },
      { name: 'Insurance', this: 260, prior: 260 },
      { name: 'Phone and software', this: 140, prior: 140 },
    ],
  },
}

export default DATA
