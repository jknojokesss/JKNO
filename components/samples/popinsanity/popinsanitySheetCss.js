import { MUTED, BORDER, UI, MONO } from './popinsanityUtils'

/** Shared P&L / sales compare grid (desktop + phone). */
export const COMPARE_SHEET_CSS = `
.pop-pnl-wrap,.pop-compare-wrap{
  --pop-pnl-c1:5.5rem;--pop-pnl-c2:5.5rem;--pop-pnl-c3:5.5rem;--pop-pnl-gap:6px;
  --pop-pnl-fs:12px;--pop-pnl-fs-cur:13px;--pop-pnl-fs-head:10px;
  max-width:100%;box-sizing:border-box;
}
@media(max-width:480px){
  .pop-pnl-wrap,.pop-compare-wrap{
    --pop-pnl-c1:5.1rem;--pop-pnl-c2:5.1rem;--pop-pnl-c3:5.1rem;--pop-pnl-gap:6px;
    --pop-pnl-fs:11px;--pop-pnl-fs-cur:11px;--pop-pnl-fs-head:9px;
    padding:12px!important;
  }
  .pop-pnl-label,.pop-compare-label{font-size:12px;line-height:1.35;word-break:break-word;overflow-wrap:anywhere;white-space:normal}
  .pop-pnl-head,.pop-pnl-line,.pop-compare-head,.pop-compare-line{padding-right:0}
  .pop-pnl-line,.pop-compare-line{align-items:start}
  .pop-pnl-num,.pop-pnl-num--cur{font-size:11px}
  .pop-compare-pct{display:block;font-size:10px;line-height:1.25;margin-top:1px}
  .pop-sales-table-wrap{display:none!important}
  .pop-channel-table-wrap.pop-wholesale-desktop{display:none!important}
  .pop-wholesale-mobile{display:block!important}
  .pop-compare-mobile{display:block!important}
}
.pop-compare-mobile{display:none}
.pop-wholesale-mobile{display:none}
.pop-pnl-head,.pop-pnl-line,.pop-compare-head,.pop-compare-line{
  display:grid;grid-template-columns:minmax(0,1fr) var(--pop-pnl-c1) var(--pop-pnl-c2) var(--pop-pnl-c3);
  column-gap:var(--pop-pnl-gap);align-items:center;padding-right:6px;box-sizing:border-box;
}
.pop-pnl-head,.pop-compare-head{padding:0 6px 8px;font-size:var(--pop-pnl-fs-head);color:${MUTED};text-transform:uppercase;letter-spacing:.6px}
.pop-pnl-line,.pop-compare-line{padding:8px 6px;border-radius:2px}
.pop-pnl-line--indent .pop-pnl-label,.pop-compare-line--indent .pop-compare-label{padding-left:20px}
.pop-pnl-line--sub,.pop-compare-line--sub{border-top:1px solid ${BORDER}}
.pop-pnl-label,.pop-compare-label{min-width:0;font-size:13px;line-height:1.35}
.pop-pnl-num,.pop-compare-num{
  font-family:${MONO};font-size:var(--pop-pnl-fs);text-align:right;justify-self:stretch;
  width:100%;max-width:100%;box-sizing:border-box;white-space:nowrap;overflow:hidden;
  font-variant-numeric:tabular-nums;
}
.pop-pnl-num--cur{font-size:var(--pop-pnl-fs-cur)}
.pop-pnl-head .pop-pnl-num,.pop-compare-head .pop-compare-num{font-size:var(--pop-pnl-fs-head);font-family:${UI};font-weight:600;overflow:visible;white-space:normal}
`
