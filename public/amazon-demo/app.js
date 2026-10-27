(function(){
'use strict';
var D=window.PORTAL_DATA;
var F={};D.fields.forEach(function(f,i){F[f]=i;});
var NDAYS=D.days.length, NWEEKS=Math.floor(NDAYS/7), NSKU=D.skus.length;
var DAY=86400000;
function pd(iso){var p=iso.split('-');return Date.UTC(+p[0],+p[1]-1,+p[2]);}
var T0=pd(D.start);
function idx(iso){return Math.round((pd(iso)-T0)/DAY);}
function isoOf(i){return new Date(T0+i*DAY).toISOString().slice(0,10);}
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function dObj(i){return new Date(T0+i*DAY);}
function fd(i,opt){var d=dObj(i);var s=MON[d.getUTCMonth()]+' '+d.getUTCDate();if(opt&&opt.y)s+=', '+d.getUTCFullYear();if(opt&&opt.wd)s=WD[d.getUTCDay()]+', '+s;return s;}
function fdIso(iso,opt){return fd(idx(iso),opt);}
function frange(a,b){var da=dObj(a),db=dObj(b);if(a===b)return fd(a,{y:1});
  if(da.getUTCMonth()===db.getUTCMonth())return MON[da.getUTCMonth()]+' '+da.getUTCDate()+' - '+db.getUTCDate()+', '+db.getUTCFullYear();
  return fd(a)+' - '+fd(b,{y:1});}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function money(c,dec){var neg=c<0;var v=Math.abs(c)/100;var s=dec?v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):Math.round(v).toLocaleString('en-US');if(!dec&&Math.round(v)===0)neg=false;return (neg?'-$':'$')+s;}
function paren(c){var s=money(Math.abs(c));return (c<0&&s!=='$0')?'('+s+')':s;}
function num(n){return Math.round(n).toLocaleString('en-US');}
function pct(x,d){if(!isFinite(x))return '-';return (x*100).toFixed(d==null?1:d)+'%';}
function chg(cur,prev,invert){if(prev==null||prev===0||!isFinite(prev))return '';var r=(cur-prev)/Math.abs(prev);var cls=Math.abs(r)<0.005?'flat':((r>0)!==(!!invert)?'up':'down');return '<span class="chg '+cls+'">'+(r>0?'+':'')+(r*100).toFixed(1)+'%</span>';}
function ceilTo(q,c){return Math.ceil(q/c)*c;}
var skuIx={};D.skus.forEach(function(s,i){skuIx[s.sku]=i;});
/* Product photos: in production, imageUrl is the Amazon listing main image from Seller Central / catalog API. */
function skuImageUrl(s){return s.imageUrl||('/amazon-demo/img/'+s.sku+'.webp');}
function prodImgHtml(s,opt){var lg=opt&&opt.lg,sz=lg?96:40;return '<span class="prod-img-wrap'+(lg?' prod-img-wrap-lg':'')+'"><img class="prod-img" src="'+esc(skuImageUrl(s))+'" alt="" width="'+sz+'" height="'+sz+'" loading="lazy" decoding="async" onerror="this.classList.add(\'hide\');this.nextElementSibling.classList.add(\'on\')"><span class="prod-img-ph" aria-hidden="true"></span></span>';}
function prodNameCell(s,title){return '<span class="prod-row-name">'+prodImgHtml(s)+'<span class="prod-row-text"><span class="pn">'+esc(title==null?s.name:title)+'</span><span class="ps">'+s.sku+'</span></span></span>';}

/* ---------- aggregation ---------- */
function agg(a,b,k){var o={};D.fields.forEach(function(f){o[f]=0;});
  for(var i=Math.max(0,a);i<=Math.min(b,NDAYS-1);i++){var day=D.days[i];
    for(var s=0;s<NSKU;s++){if(k!=null&&s!==k)continue;var r=day[s];for(var j=0;j<r.length;j++)o[D.fields[j]]+=r[j];}}
  return derive(o);}
function derive(o){o.fees=o.referral+o.fba+o.placement+o.storage;
  o.amzProfit=o.sales-o.refunds-o.fees-o.ads-o.cogs-o.loss+o.reimb;
  o.margin=o.sales?o.amzProfit/o.sales:0;o.acos=o.adsales?o.ads/o.adsales:NaN;o.tacos=o.sales?o.ads/o.sales:NaN;return o;}
var EXP=D.expenses.map(function(e){e.i=idx(e.date);return e;});
var BANK=D.bank.map(function(b){b.i=idx(b.date);return b;});
var CATS=[];EXP.forEach(function(e){if(CATS.indexOf(e.cat)<0)CATS.push(e.cat);});
CATS.sort(function(a,b){var ta=0,tb=0;EXP.forEach(function(e){if(e.cat===a)ta+=e.amt;if(e.cat===b)tb+=e.amt;});return tb-ta;});
function other(a,b){var t=0,by={};CATS.forEach(function(c){by[c]=0;});EXP.forEach(function(e){if(e.i>=a&&e.i<=b){t+=e.amt;by[e.cat]+=e.amt;}});return {total:t,by:by};}
function full(a,b){var o=agg(a,b);var x=other(a,b);o.other=x.total;o.otherBy=x.by;o.net=o.amzProfit-o.other;o.netMargin=o.sales?o.net/o.sales:0;return o;}
var CASH=(function(){var ck=D.opening.checking,sv=D.opening.savings,ax=D.opening.amex,out=[];
  for(var i=0;i<NDAYS;i++){EXP.forEach(function(e){if(e.i===i){if(e.cat==='Interest & finance charges'&&e.acct===D.accounts.checking)return;if(e.acct===D.accounts.checking)ck-=e.amt;else if(e.acct===D.accounts.amex)ax+=e.amt;}});
    BANK.forEach(function(b){if(b.i===i){if(b.acct===D.accounts.checking)ck+=b.amt;else sv+=b.amt;if(b.type==='Card payment')ax+=b.amt;}});
    out.push({checking:ck,savings:sv,amex:ax,cash:ck+sv});}
  return out;})();
function cashAt(i){if(i<0)return {checking:D.opening.checking,savings:D.opening.savings,amex:D.opening.amex,cash:D.opening.checking+D.opening.savings};return CASH[Math.min(i,NDAYS-1)];}
function cashFlow(a,b){var o={payouts:0,opex:0,card:0,inventory:0,owner:0,transfers:0};
  EXP.forEach(function(e){if(e.i>=a&&e.i<=b&&e.acct===D.accounts.checking)o.opex-=e.amt;});
  BANK.forEach(function(x){if(x.i<a||x.i>b)return;if(x.type==='Amazon payout')o.payouts+=x.amt;else if(x.type==='Card payment')o.card+=x.amt;else if(x.type==='Inventory purchase')o.inventory+=x.amt;else if(x.type==='Owner distribution')o.owner+=x.amt;else o.transfers+=x.amt;});
  o.net=o.payouts+o.opex+o.card+o.inventory+o.owner+o.transfers;return o;}
/* Per-SKU FBA split of Sellerboard available units: [reserved, stuck, unfulfillable, researching, stranded]. Inbound stays in stock[][1]. */
var INV_SPLIT=[[7,3,1,0,2],[39,5,2,0,3],[8,9,0,9,0],[10,7,0,7,0],[7,2,1,0,1],[21,4,2,0,2],[5,2,0,2,0],[12,8,0,3,5],[21,3,2,0,1],[10,3,2,0,1]];
function invCostSnapshot(i){i=i==null?NDAYS-1:i;var row=D.stock[i],o={available:0,inbound:0,reserved:0,stuck:0,availableCents:0,inboundCents:0,reservedCents:0,stuckCents:0,totalCents:0,stuckParts:{unfulfillable:0,researching:0,stranded:0},stuckPartCents:{unfulfillable:0,researching:0,stranded:0}};
  for(var k=0;k<NSKU;k++){var sku=D.skus[k],av=row[k][0],ib=row[k][1],sp=INV_SPLIT[k],rs=sp[0],st=sp[1],avail=av-rs-st,c=sku.cost;
    o.available+=avail;o.inbound+=ib;o.reserved+=rs;o.stuck+=st;o.stuckParts.unfulfillable+=sp[2];o.stuckParts.researching+=sp[3];o.stuckParts.stranded+=sp[4];
    o.stuckPartCents.unfulfillable+=sp[2]*c;o.stuckPartCents.researching+=sp[3]*c;o.stuckPartCents.stranded+=sp[4]*c;
    o.availableCents+=avail*c;o.inboundCents+=ib*c;o.reservedCents+=rs*c;o.stuckCents+=st*c;o.totalCents+=(avail+ib+rs+st)*c;}
  return o;}
function invCostRows(i){i=i==null?NDAYS-1:i;var row=D.stock[i];return D.skus.map(function(s,k){var av=row[k][0],ib=row[k][1],sp=INV_SPLIT[k],rs=sp[0],st=sp[1],avail=av-rs-st,c=s.cost;
  return {k:k,sku:s.sku,name:s.name,cost:c,available:avail,inbound:ib,reserved:rs,stuck:st,stuckParts:{unfulfillable:sp[2],researching:sp[3],stranded:sp[4]},atCost:(avail+ib+rs+st)*c};});}
function stuckClaimOverlap(){var u=0,cents=0;D.claims.forEach(function(cl){if(cl.status!=='Pending'&&cl.status!=='Not filed')return;var ix=skuIx[cl.sku];if(ix==null)return;u+=cl.units;cents+=cl.units*D.skus[ix].cost;});return {units:u,cents:cents};}
function invValue(i){return invCostSnapshot(i).totalCents;}
function velocity(s){var u=0;for(var i=NDAYS-30;i<NDAYS;i++)u+=D.days[i][s][F.units];return u/30;}
function onOrder(sku){var t=0;D.purchaseOrders.forEach(function(p){if(p.sku===sku)t+=p.units;});return t;}
function invRows(){var last=D.stock[NDAYS-1];return D.skus.map(function(s,k){var av=last[k][0],ib=last[k][1],oo=onOrder(s.sku),v=velocity(k),cover=(av+ib+oo)/v;
  var st=cover<s.lead?'Reorder now':(cover<s.lead+14?'Reorder soon':(cover>150?'Overstocked':'Healthy'));
  var sug=st.indexOf('Reorder')===0?ceilTo(v*(s.lead+60)-(av+ib+oo),s.casePack):0;
  return {k:k,sku:s.sku,name:s.name,av:av,ib:ib,oo:oo,v:v,cover:cover,lead:s.lead,status:st,sug:sug,value:(av+ib)*s.cost,cost:s.cost};});}
var SHIPS=D.shipments.map(function(s){s.units=0;s.recv=0;s.lines.forEach(function(l){s.units+=l.shipped;s.recv+=l.received;});s.diff=s.recv-s.units;s.closedFlag=s.status==='Closed';return s;});
function claimFor(shipId,sku){for(var i=0;i<D.claims.length;i++){var c=D.claims[i];if(c.shipment===shipId&&c.sku===sku)return c;}return null;}
function claimTotals(){var t={claimed:0,pending:0,reimbursed:0,notfiled:0,potential:0};D.claims.forEach(function(c){if(c.status!=='Not filed')t.claimed+=c.amount;if(c.status==='Pending')t.pending+=c.amount;if(c.status==='Reimbursed')t.reimbursed+=c.amount;if(c.status==='Not filed')t.notfiled+=c.amount;if(c.status==='Pending'||c.status==='Not filed')t.potential+=c.amount;});return t;}
var LIAB=D.liabilities||null;
function liabApAsOf(){return idx(LIAB&&LIAB.asOf?LIAB.asOf:D.end);}
function apBillBucket(daysPast){if(daysPast<=0)return 'current';if(daysPast<=30)return 'd1_30';if(daysPast<=60)return 'd31_60';return 'd60plus';}
function apAgingFromBills(){var o={current:0,d1_30:0,d31_60:0,d60plus:0},asOf=liabApAsOf();if(!LIAB)return o;
  LIAB.accountsPayable.bills.forEach(function(b){var daysPast=asOf-idx(b.dueDate);o[apBillBucket(daysPast)]+=b.amount;});return o;}
function liabApBillTotal(){if(!LIAB)return 0;var t=0;LIAB.accountsPayable.bills.forEach(function(b){t+=b.amount;});return t;}
function liabApTotal(){return liabApBillTotal();}
function liabApMetrics(){if(!LIAB)return {dueWeek:0,overdue:0};var t=liabApAsOf(),dueWeek=0,overdue=0;LIAB.accountsPayable.bills.forEach(function(b){var d=idx(b.dueDate);if(d<t)overdue+=b.amount;else if(d<=t+6)dueWeek+=b.amount;});return {dueWeek:dueWeek,overdue:overdue};}
function liabFinanceCharges(){var o={amex:0,ink:0,amazonLoan:0,loc:0,total:0};if(!LIAB)return o;
  EXP.forEach(function(e){if(e.cat!=='Interest & finance charges')return;if(e.acct===D.accounts.amex)o.amex+=e.amt;else if(e.acct.indexOf('Ink')>=0)o.ink+=e.amt;else if(e.vendor==='Amazon Lending')o.amazonLoan+=e.amt;else if((e.memo||'').indexOf('LOC')>=0)o.loc+=e.amt;});
  o.total=o.amex+o.ink+o.amazonLoan+o.loc;return o;}
function liabCardBalance(card){if(card.name.indexOf('Amex')>=0)return cashAt(NDAYS-1).amex;return card.balance;}
function liabCcTotal(){if(!LIAB)return 0;var t=0;LIAB.creditCards.forEach(function(c){t+=liabCardBalance(c);});return t;}
function liabLoanTotal(){if(!LIAB)return 0;var t=0;LIAB.loans.forEach(function(l){t+=l.balance;});return t;}
function liabSections(){if(!LIAB)return null;var ap=liabApTotal(),cc=liabCcTotal(),lo=liabLoanTotal(),tax=LIAB.salesTax.balance,pr=LIAB.payroll.balance;
  return {ap:ap,cc:cc,loans:lo,tax:tax,payroll:pr,total:ap+cc+lo+tax+pr};}
function liabDueIn30(){if(!LIAB)return {total:0,ap:0,cc:0,loans:0,tax:0,payroll:0};var t=liabApAsOf(),cut=t+30,ap=0;
  LIAB.accountsPayable.bills.forEach(function(b){if(idx(b.dueDate)<=cut)ap+=b.amount;});
  var cc=0;LIAB.creditCards.forEach(function(c){if(idx(c.statementDue)<=cut)cc+=c.amountDue;});
  var lo=0;LIAB.loans.forEach(function(l){if(idx(l.nextDate)<=cut)lo+=l.nextPayment;});
  var tax=idx(LIAB.salesTax.dueDate)<=cut?LIAB.salesTax.balance:0,pr=LIAB.payroll.balance;
  return {ap:ap,cc:cc,loans:lo,tax:tax,payroll:pr,total:ap+cc+lo+tax+pr};}
function balanceSheetSnap(){var last=NDAYS-1,c=cashAt(last),inv=invValue(last),nx=D.settlements[D.settlements.length-1],pre=(D.balanceSheet&&D.balanceSheet.prepaid)||0;
  var assets={cash:c.cash,inventory:inv,reserve:nx.amount,prepaid:pre,total:c.cash+inv+nx.amount+pre};
  var sec=liabSections(),liab=sec?sec.total:0,equity=assets.total-liab;
  return {assets:assets,liabilities:liab,liabilitySections:sec,equity:equity,amex:c.amex};}
function shipClaimAmount(s){var t=0;if(!s.closedFlag||s.diff>=0)return t;s.lines.forEach(function(l){var d=l.shipped-l.received;if(d<=0)return;var c=claimFor(s.id,l.sku);if(c)t+=c.amount;});return t;}
function breakdownParts(o){return [['Refunds',o.refunds],['Amazon fees',o.fees],['Ad spend',o.ads],['COGS',o.cogs],['Write-offs less reimbursements',o.loss-o.reimb],['Other expenses',o.other],['True net profit',o.net]];}
function breakdownSum(o){var s=0;breakdownParts(o).forEach(function(x){s+=x[1];});return s;}

/* ---------- state ---------- */
var LASTW=NWEEKS-1;
var monthStart=(function(){var d=dObj(NDAYS-1);return idx(d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-01');})();
var state={range:'week',ca:NDAYS-28,cb:NDAYS-1,chartMetric:'net',prodSort:{key:'amzProfit',dir:-1},prodQ:'',shipFilter:'all',shipQ:'',shipSort:{key:'shipped',dir:-1},
  expQ:'',expCat:'',expAcct:'',expAll:false,expSort:{key:'date',dir:-1},invSort:{key:'atCost',dir:-1},reportWeek:LASTW,claimFilter:'all',prodShowAll:false,backTo:null};
function pageLead(){return state.backTo?backBar(state.backTo,'Overview'):'';}
function drawerBack(page,label){return backBar(state.backTo||('#/'+page),state.backTo?'Overview':label);}
function isMob(){return window.innerWidth<640;}
function showMoreBtn(id,label){return '<p class="show-more-wrap"><button type="button" class="show-more" data-expand="'+id+'" aria-expanded="false">'+label+'</button></p>';}
function mobCollapse(id,inner){return inner;}
function panelHead(title,href,wrapLink){var all=href?(wrapLink?'<span class="note">All</span>':'<a class="note tap-card" href="'+href+'">All</a>'):'';return '<div class="panel-h"><h2>'+title+'</h2>'+all+'</div>';}
function mobPanelCard(href,title,allHref,body){return '<section class="card panel mob-sec"><a class="mob-panel-link tap-card" href="'+href+'">'+panelHead(title,allHref,true)+'<div class="mob-panel-body">'+body+'</div></a></section>';}
function ovProdRows(prods){return '<ul class="ov-prod-list">'+prods.map(function(x){return '<li><a class="tap-card ov-prod-item" href="#/products/'+x.s.sku+'">'+prodImgHtml(x.s)+'<span class="ov-prod-body"><span class="ov-prod-name">'+esc(x.s.name)+'</span><span class="ov-prod-line2"><span class="ov-prod-amt">'+money(x.amzProfit)+'</span><span aria-hidden="true"> · </span><span>'+pct(x.margin)+'</span><span aria-hidden="true"> · </span><span class="ov-prod-sku">'+x.s.sku+'</span></span></span></a></li>';}).join('')+'</ul>';}
function backBar(href,label){return '<a class="back-bar tap-card" href="'+href+'"><span class="back-ic" aria-hidden="true">←</span>'+esc(label||'Back')+'</a>';}
function ovBoxLink(href,lbl,val,meta,wide){return '<a class="ov-box tap-card'+(wide?' ov-wide':'')+'" href="'+href+'"><p class="ov-box-lbl">'+lbl+'</p><p class="ov-box-val">'+val+'</p><div class="ov-box-meta">'+meta+'</div></a>';}
function blistHtml(o){var parts=[['Refunds',o.refunds],['Amazon fees',o.fees],['Ad spend',o.ads],['COGS',o.cogs],['Write-offs less reimbursements',o.loss-o.reimb],['Other expenses',o.other],['True net profit',o.net]];
  var h='<ul class="blist">';h+='<li class="tot"><span class="sw" style="background:transparent"></span><span class="nm">Amazon sales</span><span class="pc">100%</span><span class="am">'+money(o.sales)+'</span></li>';
  parts.forEach(function(x){if(x[0]==='Other expenses')h+='<li class="sub"><span class="sw" style="background:var(--accent-mid)"></span><span class="nm">Amazon profit</span><span class="pc">'+pct(o.amzProfit/o.sales)+'</span><span class="am">'+money(o.amzProfit)+'</span></li>';
    h+='<li'+(x[0]==='True net profit'?' class="tot"':'')+'><span class="sw" style="background:var(--accent)"></span><span class="nm">'+x[0]+'</span><span class="pc">'+pct(x[1]/o.sales)+'</span><span class="am">'+money(x[1])+'</span></li>';});
  return h+'</ul>';}
function openSettlement(){return D.settlements[D.settlements.length-1];}
function settlementBreakdown(s){s=s||openSettlement();var a=idx(s.start),b=Math.min(idx(s.through||s.end),NDAYS-1),o=agg(a,b),net=s.amount,reserve=o.sales-o.refunds-o.fees-o.ads+o.reimb-net;return {settlement:s,a:a,b:b,sales:o.sales,refunds:o.refunds,fees:o.fees,ads:o.ads,reimb:o.reimb,reserve:reserve,net:net};}
function mobRowCard(title,rows,href){var h='<a class="data-card tap-card'+(href?' has-link':'')+'"'+(href?' href="'+href+'"':'')+'><div class="data-card-t">'+esc(title)+'</div><dl class="data-card-rows">';
  rows.forEach(function(r){h+='<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>';});return h+'</dl></a>';}
function mobBillCards(bills){return '<div class="mob-card-list">'+bills.map(function(b){return mobRowCard(b.vendor,[['Bill',fdIso(b.billDate)],['Due',fdIso(b.dueDate)],['Amount',money(b.amount,1)]],null);}).join('')+'</div>';}
function mobCcCards(cards,sec){return '<div class="mob-card-list">'+cards.map(function(c){var bal=liabCardBalance(c);return mobRowCard(c.name,[['Balance',money(bal,1)],['Due',fdIso(c.statementDue)],['Payment',money(c.amountDue,1)]],null);}).join('')+'<div class="mob-card-tot"><span>Total</span><strong>'+money(sec,1)+'</strong></div></div>';}
function mobLoanCards(loans,sec){return '<div class="mob-card-list">'+loans.map(function(l){return mobRowCard(l.name,[['Balance',money(l.balance,1)],['Next',money(l.nextPayment,1)+' · '+fdIso(l.nextDate)],['Rate',pct(l.rate,1)]],null);}).join('')+'<div class="mob-card-tot"><span>Total</span><strong>'+money(sec,1)+'</strong></div></div>';}
function rangeAB(){var e=NDAYS-1;switch(state.range){case 'week':return [e-6,e];case 'last':return [e-13,e-7];case 'mtd':return [monthStart,e];default:return [Math.min(state.ca,state.cb),Math.max(state.ca,state.cb)];}}
function prevAB(a,b){if(state.range==='mtd'){var d=dObj(a);var pm=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-1,1);var pa=Math.round((pm-T0)/DAY);return pa>=0?[pa,pa+(b-a)]:null;}
  var len=b-a+1;return a-len>=0?[a-len,a-1]:null;}
function prevLabel(){return {week:'vs prior week',last:'vs week before',mtd:'vs same days last month',custom:'vs prior period'}[state.range];}

/* ---------- helpers ---------- */
var $=function(s,el){return (el||document).querySelector(s);};
function kpi(label,val,meta,hl){return '<div class="card kpi'+(hl?' hl':'')+'"><div class="lbl">'+label+'</div><div class="val">'+val+'</div><div class="meta">'+(meta||'&nbsp;')+'</div></div>';}
function statStrip(items){return statGrid(items);}
function statGrid(items){return '<dl class="stat-grid">'+items.map(function(it){var dd=it[1]+(it[2]?'<small>'+it[2]+'</small>':'');if(it[3])return '<div><dt>'+it[0]+'</dt><dd><a class="stat-dd-link tap-card" href="'+it[3]+'">'+dd+'</a></dd></div>';return '<div><dt>'+it[0]+'</dt><dd>'+dd+'</dd></div>';}).join('')+'</dl>';}
function kvRows(rows){var h='<div class="kv-rows">';rows.forEach(function(r){if(r[2])h+='<a class="kv-row tap-card" href="'+r[2]+'"><span>'+r[0]+'</span><strong>'+r[1]+'</strong></a>';else h+='<div class="kv-row static"><span>'+r[0]+'</span><strong>'+r[1]+'</strong></div>';});return h+'</div>';}
function overviewHero(o,p,pl,c,b,nx){var netM='<span>'+pct(o.netMargin)+' margin</span>'+(p?'<span>'+chg(o.net,p.net)+' '+pl+'</span>':'');
  var cashM='<span>'+fd(b)+'</span>';
  var salM='<span>'+num(o.units)+' units</span>'+(p?'<span>'+chg(o.sales,p.sales)+' '+pl+'</span>':'');
  var payM='<span>'+fdIso(nx.deposit,{wd:1})+'</span>';
  return '<div class="ov-kpi-grid">'+ovBoxLink('#/report','True net',money(o.net),netM)+ovBoxLink('#/products','Sales',money(o.sales),salM)+ovBoxLink('#/cash','Cash',money(c.cash),cashM)+ovBoxLink('#/payout','Next payout',money(nx.amount),payM)+'</div>';}
var NAV_LINKS=[['overview','Overview'],['report','Weekly report'],['products','Products'],['shipments','FBA shipments'],['expenses','Expenses'],['inventory','Inventory'],['cash','Cash'],['payables','Payables'],['sources','Data sources']];
var MOB_MAIN=[['overview','Overview'],['report','Weekly'],['products','Products'],['cash','Cash']];
var MOB_MORE=[['expenses','Expenses'],['inventory','Inventory'],['payables','Payables'],['shipments','Shipments'],['sources','Sources']];
var MORE_PAGES={shipments:1,expenses:1,inventory:1,payables:1,sources:1};
function closeMobMore(){var s=$('#mobMoreSheet');if(s){s.hidden=true;s.setAttribute('aria-hidden','true');}var b=$('#mobMoreBtn');if(b)b.setAttribute('aria-expanded','false');}
function openMobMore(){var s=$('#mobMoreSheet');if(s){s.hidden=false;s.setAttribute('aria-hidden','false');}var b=$('#mobMoreBtn');if(b){b.setAttribute('aria-expanded','true');b.focus();}}
function navGroupLinks(items,page){return items.map(function(t){return '<a href="#/'+t[0]+'" data-page="'+t[0]+'"'+(page===t[0]?' class="on" aria-current="page"':'')+'>'+t[1]+'</a>';}).join('');}
function renderSideNav(page){var nav=$('#nav');if(!nav)return;nav.innerHTML=navGroupLinks(NAV_LINKS,page);}
function renderMobTabs(page){var el=$('#mobTabs');if(!el)return;var moreOn=!!MORE_PAGES[page];
  el.innerHTML=MOB_MAIN.map(function(t){return '<a href="#/'+t[0]+'" data-page="'+t[0]+'"'+(page===t[0]?' class="on" aria-current="page"':'')+'>'+t[1]+'</a>';}).join('')+'<button type="button" class="mob-more-btn'+(moreOn?' on':'')+'" id="mobMoreBtn" aria-expanded="false" aria-controls="mobMorePanel">More</button>';
  var pan=$('#mobMorePanel');if(pan)pan.innerHTML=navGroupLinks(MOB_MORE,page);}
var SEARCH_SVG='<svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
function searchBox(id,val,ph){return '<label class="search">'+SEARCH_SVG+'<input type="search" id="'+id+'" value="'+esc(val)+'" placeholder="'+ph+'" aria-label="'+ph+'"></label>';}
function sortRows(rows,sort,cols){var c=cols.filter(function(x){return x.key===sort.key;})[0];var f=c&&c.sv?c.sv:function(r){return r[sort.key];};
  return rows.slice().sort(function(a,b){var x=f(a),y=f(b);if(typeof x==='string')return x.localeCompare(y)*sort.dir;if(isNaN(x))x=-Infinity;if(isNaN(y))y=-Infinity;return (x-y)*sort.dir;});}
function thead(cols,sort,tbl){return '<thead><tr>'+cols.map(function(c){var on=sort&&sort.key===c.key;var cl=[];if(c.l)cl.push('l');if(c.hm)cl.push('hide-m');var cls=cl.length?' class="'+cl.join(' ')+'"':'';
  if(c.nosort||!sort)return '<th'+cls+' scope="col">'+c.label+'</th>';
  return '<th'+cls+' scope="col"'+(on?' aria-sort="'+(sort.dir>0?'ascending':'descending')+'"':'')+'><button type="button" data-sort="'+c.key+'" data-tbl="'+tbl+'">'+c.label+'<span class="ar">'+(on?(sort.dir>0?'&#9650;':'&#9660;'):'&#9660;')+'</span></button></th>';}).join('')+'</tr></thead>';}
function cell(c,r){var v=c.f?c.f(r):r[c.key];var cls=[];if(c.l)cls.push('l');if(c.hm)cls.push('hide-m');return '<td'+(cls.length?' class="'+cls.join(' ')+'"':'')+'>'+v+'</td>';}

/* ---------- charts ---------- */
function niceMax(v){if(v<=0)return 1;var e=Math.pow(10,Math.floor(Math.log10(v)));var m=v/e;var n=m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10;return n*e;}
function short(c){var v=c/100,a=Math.abs(v),s=a>=1000?(a/1000).toFixed(a>=10000?0:1).replace(/\.0$/,'')+'k':Math.round(a).toString();return (v<0?'-$':'$')+s;}
function barChart(o){var MOB=window.innerWidth<640;var vals=o.values,W=MOB?360:(o.w||720),H=MOB?210:(o.h||220),pl=MOB?40:52,pr=8,pt=12,pb=26;
  var max=Math.max.apply(null,vals.concat([0])),min=Math.min.apply(null,vals.concat([0]));
  var stepV=niceMax((max-min)/4);var top=Math.ceil(max/stepV)*stepV;var bot=Math.floor(min/stepV)*stepV;if(top===bot)top=bot+stepV;
  var y=function(v){return pt+(top-v)/(top-bot)*(H-pt-pb);};var n=vals.length,bw=(W-pl-pr)/n;
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.label)+'">';
  for(var g=bot;g<=top+1e-6;g+=stepV){s+='<line class="grid-l" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(g).toFixed(1)+'" y2="'+y(g).toFixed(1)+'"/><text x="'+(pl-8)+'" y="'+(y(g)+4).toFixed(1)+'" text-anchor="end">'+short(g)+'</text>';}
  s+='<line class="zero" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(0)+'" y2="'+y(0)+'"/>';
  vals.forEach(function(v,i){var x=pl+i*bw+bw*0.18,w=bw*0.64,y0=y(Math.max(v,0)),h=Math.abs(y(v)-y(0));var inR=o.hi&&o.hi(i);var tip=o.tip(i);
    s+='<rect class="bar'+(v<0?' neg':'')+(inR?' in':'')+'" x="'+x.toFixed(1)+'" y="'+y0.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+Math.max(h,1).toFixed(1)+'" rx="3" data-tip="'+esc(tip)+'"></rect>';
    if(o.xl&&(n<=8||(MOB?(n-1-i)%3===0:i%2===(n-1)%2)))s+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle">'+o.xl(i)+'</text>';});
  return s+'</svg>';}
function lineChart(o){var MOB=window.innerWidth<640;var vals=o.values,W=MOB?360:(o.w||720),H=MOB?210:(o.h||220),pl=MOB?40:52,pr=14,pt=12,pb=26;
  var max=Math.max.apply(null,vals),min=Math.min.apply(null,vals);var stepV=niceMax((max-min)/3||1);var bot=Math.floor(min/stepV)*stepV-stepV;if(bot<0)bot=0;var top=Math.ceil(max/stepV)*stepV;if(top<=max)top+=stepV;
  var y=function(v){return pt+(top-v)/(top-bot)*(H-pt-pb);};var n=vals.length,x=function(i){return pl+10+i*(W-pl-pr-10)/(n-1);};
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.label)+'">';
  for(var g=bot;g<=top+1e-6;g+=stepV)s+='<line class="grid-l" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(g).toFixed(1)+'" y2="'+y(g).toFixed(1)+'"/><text x="'+(pl-8)+'" y="'+(y(g)+4).toFixed(1)+'" text-anchor="end">'+short(g)+'</text>';
  s+='<path class="lineA" d="'+vals.map(function(v,i){return (i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1);}).join('')+'"/>';
  vals.forEach(function(v,i){var tip=o.tip(i);s+='<circle class="ptA" cx="'+x(i).toFixed(1)+'" cy="'+y(v).toFixed(1)+'" r="4" data-tip="'+esc(tip)+'"></circle>';if(MOB?(n-1-i)%3===0:i%2===(n-1)%2)s+='<text x="'+x(i).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle">'+o.xl(i)+'</text>';});
  return s+'</svg>';}
function weekLabel(w){return fd(w*7);}

/* ---------- pages ---------- */
var PAGES={};
function overviewMob(o,a,b){var weeks=[];for(var w=0;w<NWEEKS;w++)weeks.push(full(w*7,w*7+6));var vals=weeks.map(function(x){return x.net;});
  var h='<h2 class="ov-sec-h">Profit</h2>';
  h+='<section class="card panel mob-sec">'+panelHead('Weekly trend','#/report')+barChart({values:vals,h:165,label:'True net by week',hi:function(i){return i*7+6>=a&&i*7<=b;},xl:weekLabel,tip:function(i){return fd(i*7)+': '+money(vals[i]);}})+'</section>';
  h+='<section class="card panel mob-sec">'+panelHead('Sales breakdown','#/report')+blistHtml(o)+'</section>';
  var prods=D.skus.map(function(s,k){var x=agg(a,b,k);x.s=s;return x;}).sort(function(x,y){return y.amzProfit-x.amzProfit;}).slice(0,3);
  h+='<section class="card panel mob-sec">'+panelHead('Top products','#/products')+ovProdRows(prods)+'</section>';
  return h;}
function overviewDesktop(o,p,a,b){var metrics={sales:['Sales',function(x){return x.sales;}],amz:['Amazon profit',function(x){return x.amzProfit;}],other:['Other expenses',function(x){return x.other;}],net:['True net',function(x){return x.net;}]};
  var weeks=[];for(var w=0;w<NWEEKS;w++)weeks.push(full(w*7,w*7+6));var m=metrics[state.chartMetric],vals=weeks.map(m[1]);
  var h='<h2 class="ov-sec-h desk">Profit</h2><div class="two sec"><section class="card panel"><div class="panel-h"><h2>Weekly trend</h2><div class="chips" role="group" aria-label="Chart metric">'+Object.keys(metrics).map(function(k){return '<button class="chip" type="button" data-metric="'+k+'" aria-pressed="'+(state.chartMetric===k)+'">'+metrics[k][0]+'</button>';}).join('')+'</div></div>';
  h+=barChart({values:vals,label:m[0]+' by week',hi:function(i){return i*7+6>=a&&i*7<=b;},xl:weekLabel,tip:function(i){return fd(i*7)+': '+money(vals[i]);}})+'</section>';
  h+='<section class="card panel">'+panelHead('Sales breakdown','#/report')+blistHtml(o)+'</section></div>';
  var prods=D.skus.map(function(s,k){var x=agg(a,b,k);x.s=s;return x;}).sort(function(x,y){return y.amzProfit-x.amzProfit;}).slice(0,5);
  h+='<section class="card panel sec"><div class="panel-h"><h2>Top products</h2><a class="note tap-card" href="#/products">All</a></div><div class="tbl-wrap"><table><thead><tr><th>Product</th><th>Units</th><th>Profit</th><th>Margin</th></tr></thead><tbody>';
  prods.forEach(function(x){h+='<tr class="click tap-row" data-go="#/products/'+x.s.sku+'" tabindex="0"><td class="l">'+prodNameCell(x.s)+'</td><td>'+num(x.units)+'</td><td>'+money(x.amzProfit)+'</td><td>'+pct(x.margin)+'</td></tr>';});
  h+='</tbody></table></div></section>';
  return h;}
PAGES.overview=function(){var ab=rangeAB(),a=ab[0],b=ab[1],o=full(a,b),pab=prevAB(a,b),p=pab?full(pab[0],pab[1]):null;var pl=prevLabel();
  var c=cashAt(b),nx=D.settlements[D.settlements.length-1];
  var h='<section class="sum-hero">'+overviewHero(o,p,pl,c,b,nx)+'</section>';
  if(!o.sales)return h+'<p class="empty">No sales</p>';
  h+=isMob()?overviewMob(o,a,b):overviewDesktop(o,p,a,b);
  return h;};
PAGES.payout=function(){var br=settlementBreakdown(),s=br.settlement;
  var h=backBar(state.backTo||'#/overview','Overview')+statGrid([['Next payout',money(br.net),''],['Deposit',fdIso(s.deposit,{wd:1}),''],['Settlement',fdIso(s.start)+' – '+fdIso(s.through||s.end),'']]);
  h+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Payout breakdown</h2><span class="note">Open settlement</span></div><ul class="payout-list">';
  var lines=[['Sales',money(br.sales,1)],['Refunds','-'+money(br.refunds,1).replace('$','')],['Amazon fees','-'+money(br.fees,1).replace('$','')],['Ad spend','-'+money(br.ads,1).replace('$','')],['Reimbursements',money(br.reimb,1)],['Reserve / hold',money(br.reserve,1)],['Net deposit',money(br.net,1)]];
  lines.forEach(function(l,i){h+='<li class="'+(i===lines.length-1?'tot':'')+'"><span>'+l[0]+'</span><strong>'+l[1]+'</strong></li>';});
  h+='</ul></section>';
  return h;};

/* weekly report */
function plRows(o){var r=[['h','Sellerboard'],
  ['sub','Gross sales',o.sales],['sub','Refunds',-o.refunds],
  ['sub','Referral fees',-o.referral],['sub','FBA fees',-o.fba],['sub','Placement',-o.placement],['sub','Storage',-o.storage],
  ['sub','Ads',-o.ads],['sub','COGS',-o.cogs],['sub','Write-offs',-o.loss],['sub','Reimbursements',o.reimb],
  ['t','Amazon profit',o.amzProfit],['h','QuickBooks']];
  CATS.forEach(function(c){r.push(['sub',c,-o.otherBy[c],'cat']);});
  r.push(['t','Total other expenses',-o.other]);r.push(['gt','True net profit',o.net]);r.push(['m','Net margin']);return r;}
function summaryLine(o){return money(o.net)+' · '+pct(o.netMargin)+' · '+money(o.sales);}
PAGES.report=function(){var w=state.reportWeek,a=w*7,b=a+6,o=full(a,b),p=w>0?full(a-7,b-7):null;
  var opts='';for(var i=NWEEKS-1;i>=0;i--)opts+='<option value="'+i+'"'+(i===w?' selected':'')+'>Week of '+frange(i*7,i*7+6)+'</option>';
  var h=pageLead()+'<div class="report-page"><div class="rep-bar"><label class="tools" style="width:auto"><span class="mut">Week</span><select class="sel" id="repWeek" aria-label="Report week">'+opts+'</select></label><button class="btn pri" type="button" id="printBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/></svg>Download PDF</button></div>';
  h+='<article class="card report" id="report"><div class="rep-head"><div><h2>Weekly profit report</h2><div class="who"><strong>'+esc(D.business.name)+'</strong> &middot; '+D.business.marketplace+'</div><div class="who">'+frange(a,b)+'</div></div><div class="by"><strong>Prepared by JK No Jokes Financials</strong>jknojokes.com &middot; 917-589-8455<br>Issued '+fd(b+1,{wd:1,y:1})+'</div></div>';
  h+='<p class="summary">'+esc(summaryLine(o))+'</p>';
  h+='<div class="rep-kpis"><div><span>Amazon sales</span><strong>'+money(o.sales)+'</strong></div><div><span>Amazon profit</span><strong>'+money(o.amzProfit)+'</strong></div><div><span>Other expenses</span><strong>'+money(o.other)+'</strong></div><div><span>True net profit</span><strong>'+money(o.net)+'</strong></div></div>';
  var repDetail='<div class="tbl-wrap" style="border-top:0"><table class="pl"><thead><tr><th>Profit and loss</th><th>This week</th><th>Prior week</th><th>Change</th><th class="hide-m">Change %</th></tr></thead><tbody>';
  var pr=p?plRows(p):null;
  plRows(o).forEach(function(r,i){if(r[0]==='h'){repDetail+='<tr class="h"><td colspan="5">'+r[1]+'</td></tr>';return;}
    if(r[0]==='m'){repDetail+='<tr class="sub"><td>Net margin</td><td>'+pct(o.netMargin)+'</td><td>'+(p?pct(p.netMargin):'-')+'</td><td>'+(p?(((o.netMargin-p.netMargin)*100)>0?'+':'')+((o.netMargin-p.netMargin)*100).toFixed(1)+' pts':'-')+'</td><td class="hide-m"></td></tr>';return;}
    var pv=pr?pr[i][2]:null;if(r[3]==='cat'&&!r[2]&&!pv)return;var d=pv==null?null:r[2]-pv;var dp=(pv&&Math.abs(pv)>=100)?d/Math.abs(pv):null;
    repDetail+='<tr class="'+r[0]+'"><td>'+r[1]+'</td><td>'+paren(r[2])+'</td><td>'+(pv==null?'-':paren(pv))+'</td><td class="'+(Math.round(d/100)>0?'pos':Math.round(d/100)<0?'neg':'mut')+'">'+(d==null?'-':(Math.round(d/100)>0?'+':'')+money(d))+'</td><td class="hide-m mut">'+(dp==null?'-':(dp>0?'+':'')+(dp*100).toFixed(1)+'%')+'</td></tr>';});
  repDetail+='</tbody></table></div>';
  var shipsClosed=SHIPS.filter(function(s){var ci=s.closed?idx(s.closed):null;return ci!=null&&ci>=a&&ci<=b;});
  var top=D.skus.map(function(s,k){var x=agg(a,b,k);x.s=s;return x;}).sort(function(x,y){return y.amzProfit-x.amzProfit;}).slice(0,3);
  var c=cashAt(b),nx=D.settlements.filter(function(s){return idx(s.deposit)>b;})[0];
  var repNotes='<div class="rep-notes"><div><h3>Top products this week</h3><ul>'+top.map(function(x){return '<li>'+esc(x.s.name)+': '+money(x.amzProfit)+' profit on '+num(x.units)+' units</li>';}).join('')+'</ul></div>';
  repNotes+='<div><h3>Cash and payouts</h3><ul><li>Cash on hand at week end: '+money(c.cash)+'</li><li>Amex balance: '+money(c.amex)+'</li>'+(nx?'<li>Next Amazon payout: '+money(nx.amount)+(nx.open?' (estimate)':'')+', '+fdIso(nx.deposit)+'</li>':'')+'</ul></div>';
  var ops=SHIPS.filter(function(s){return idx(s.shipped)<=b&&(!s.closed||idx(s.closed)>b);});
  repNotes+='<div><h3>FBA shipments</h3><ul>'+(shipsClosed.length?shipsClosed.map(function(s){return '<li>'+s.id+' closed at '+s.fc+': '+num(s.recv)+' of '+num(s.units)+' units received'+(s.diff<0?', '+(-s.diff)+' short, claim to file':'')+'</li>';}).join(''):'<li>No shipments closed this week</li>')+'<li>'+ops.length+' shipment'+(ops.length===1?'':'s')+' still open at week end</li></ul></div>';
  repNotes+='<div><h3>Books</h3><ul><li>Amazon summary entry JE-'+(D.jeStart+w)+' posted to QuickBooks '+fd(b+1)+'</li><li>Inventory asset trued up to Sellerboard: '+money(invValue(b))+'</li><li>Bank and card feeds reviewed through '+fd(b)+'</li></ul></div></div>';
  h+=mobCollapse('repExpand',repDetail+repNotes);
  h+='<div class="rep-foot"><span>Sellerboard + QuickBooks · Sample data</span></div></article></div>';
  return h;};

/* products */
var PCOLS=[
 {key:'name',label:'Product',l:1,sv:function(r){return r.s.name;},f:function(r){return prodNameCell(r.s);}},
 {key:'units',label:'Units',f:function(r){return num(r.units);}},
 {key:'sales',label:'Sales',f:function(r){return money(r.sales);}},
 {key:'refunds',label:'Refunds',hm:1,f:function(r){return money(r.refunds);}},
 {key:'fees',label:'Amazon fees',f:function(r){return money(r.fees);}},
 {key:'ads',label:'Ads',f:function(r){return money(r.ads);}},
 {key:'cogs',label:'COGS',f:function(r){return money(r.cogs);}},
 {key:'amzProfit',label:'Profit',f:function(r){return '<strong>'+money(r.amzProfit)+'</strong>';}},
 {key:'margin',label:'Margin',f:function(r){return pct(r.margin);}},
 {key:'acos',label:'Acos',f:function(r){return pct(r.acos);}},
 {key:'tacos',label:'Tacos',f:function(r){return pct(r.tacos);}}];
function prodData(){var ab=rangeAB();return D.skus.map(function(s,k){var x=agg(ab[0],ab[1],k);x.s=s;x.k=k;x.name=s.name;return x;});}
function prodRowsFiltered(){var all=prodData(),q=state.prodQ.trim().toLowerCase();return sortRows(all.filter(function(r){return !q||(r.s.name+' '+r.s.sku+' '+r.s.asin).toLowerCase().indexOf(q)>=0;}),state.prodSort,PCOLS);}
function prodBody(){var all=prodData(),rows=prodRowsFiltered(),ab=rangeAB();
  if(!rows.length)return '<tbody><tr><td colspan="11" class="empty">No products</td></tr></tbody>';
  var tot;if(rows.length===all.length)tot=agg(ab[0],ab[1]);else{tot={};D.fields.forEach(function(f){tot[f]=0;rows.forEach(function(r){tot[f]+=r[f];});});derive(tot);}
  return '<tbody>'+rows.map(function(r){return '<tr class="click" data-go="#/products/'+r.s.sku+'" tabindex="0">'+PCOLS.map(function(c){return cell(c,r);}).join('')+'</tr>';}).join('')+'</tbody><tfoot><tr>'+PCOLS.map(function(c,i){if(i===0)return '<td>'+(rows.length===all.length?'All products':rows.length+' shown')+'</td>';return '<td'+(c.hm?' class="hide-m"':'')+'>'+c.f(tot).replace(/<\/?strong>/g,'')+'</td>';}).join('')+'</tr></tfoot>';}
function prodCards(){var rows=prodRowsFiltered();if(!rows.length)return '<p class="empty">No products</p>';
  var lim=isMob()&&!state.prodShowAll?5:rows.length,show=rows.slice(0,lim);
  var h=show.map(function(r){return '<a class="prod-card" href="#/products/'+r.s.sku+'">'+prodImgHtml(r.s)+'<div class="prod-card-body"><div class="prod-card-name">'+esc(r.s.name)+'</div><div class="prod-card-line2"><span class="prod-card-profit">'+money(r.amzProfit)+'</span><span aria-hidden="true"> · </span><span class="prod-card-margin">'+pct(r.margin)+'</span><span aria-hidden="true"> · </span><span class="prod-card-sku">'+r.s.sku+'</span></div><div class="prod-card-meta"><span>'+num(r.units)+' units</span><span>'+money(r.sales)+' sales</span></div></div></a>';}).join('');
  if(isMob()&&!state.prodShowAll&&rows.length>5)h+='<button type="button" class="show-more full" data-prod-all="1">Show all ('+rows.length+' products)</button>';
  return h;}
PAGES.products=function(){
  return '<section class="card"><div class="panel panel-h" style="margin:0"><div class="tools">'+searchBox('prodQ',state.prodQ,'Search SKU')+'</div></div><div class="prod-cards" id="prodCards">'+prodCards()+'</div><div class="tbl-wrap sticky1 prod-table-wrap"><table id="prodTbl">'+thead(PCOLS,state.prodSort,'prod')+prodBody()+'</table></div></section>';};
function statusTag(s){if(s.indexOf('Reorder')===0)return '<span class="tag signal">'+s+'</span>';return '<span class="tag neu">'+s+'</span>';}
function productDrawer(sku){var k=skuIx[sku];if(k==null)return null;var s=D.skus[k],ab=rangeAB(),x=agg(ab[0],ab[1],k);var inv=invRows()[k];
  var h=drawerBack('products','Products')+'<div class="dr-h dr-h-prod"><div class="dr-h-prod-main">'+prodImgHtml(s,{lg:1})+'<div><h2 id="drawerTitle">'+esc(s.name)+'</h2><p>'+s.sku+' &middot; ASIN '+s.asin+'</p></div></div><button class="x" type="button" data-close aria-label="Close">&times;</button></div>';
  h+='<div class="mini"><div><span>Units</span><strong>'+num(x.units)+'</strong></div><div><span>Sales</span><strong>'+money(x.sales)+'</strong></div><div><span>Profit</span><strong>'+money(x.amzProfit)+'</strong></div><div><span>Margin</span><strong>'+pct(x.margin)+'</strong></div><div><span>ACOS</span><strong>'+pct(x.acos)+'</strong></div><div><span>TACOS</span><strong>'+pct(x.tacos)+'</strong></div></div>';
  var u=x.units||1;
  h+='<div class="dr-sec"><h3>Per unit, selected dates</h3><div class="kv"><div>Average sale price</div><div>'+money(x.sales/u,1)+'</div><div>Refunds</div><div>-'+money(x.refunds/u,1)+'</div><div>Referral fee</div><div>-'+money(x.referral/u,1)+'</div><div>FBA fulfillment fee</div><div>-'+money(x.fba/u,1)+'</div><div>Placement and storage</div><div>-'+money((x.placement+x.storage)/u,1)+'</div><div>Advertising</div><div>-'+money(x.ads/u,1)+'</div><div>Product cost (COGS)</div><div>-'+money(x.cogs/u,1)+'</div><div>Write-offs less reimbursements</div><div>'+money((x.reimb-x.loss)/u,1)+'</div><div><strong>Profit per unit</strong></div><div>'+money(x.amzProfit/u,1)+'</div></div></div>';
  var wv=[];for(var w=0;w<NWEEKS;w++)wv.push(agg(w*7,w*7+6,k).amzProfit);
  h+='<div class="dr-sec"><h3>Weekly profit</h3>'+barChart({values:wv,w:600,h:190,label:'Weekly profit',hi:function(i){return i*7+6>=ab[0]&&i*7<=ab[1];},xl:weekLabel,tip:function(i){return 'Week of '+fd(i*7)+': '+money(wv[i]);}})+'</div>';
  h+='<div class="dr-sec"><h3>Inventory</h3><div class="kv"><div>Available at FBA</div><div>'+num(inv.av)+'</div><div>Inbound to FBA</div><div>'+num(inv.ib)+'</div><div>On order from supplier</div><div>'+num(inv.oo)+'</div><div>Sold per day (30-day average)</div><div>'+inv.v.toFixed(1)+'</div><div>Days of cover</div><div>'+Math.round(inv.cover)+' days</div><div>Supplier lead time</div><div>'+inv.lead+' days</div><div>Status</div><div>'+statusTag(inv.status)+'</div></div></div>';
  var sh=SHIPS.filter(function(z){return z.lines.some(function(l){return l.sku===sku;});});
  h+='<div class="dr-sec"><h3>FBA shipments with this SKU</h3><div class="tbl-wrap"><table><thead><tr><th>Shipment</th><th>Shipped</th><th>Units</th><th>Received</th><th class="l">Status</th></tr></thead><tbody>'+sh.slice().reverse().map(function(z){var l=z.lines.filter(function(l){return l.sku===sku;})[0];return '<tr class="click" data-go="#/shipments/'+z.id+'" tabindex="0"><td>'+z.id+'</td><td>'+fdIso(z.shipped)+'</td><td>'+num(l.shipped)+'</td><td>'+num(l.received)+'</td><td class="l">'+shipTag(z)+'</td></tr>';}).join('')+'</tbody></table></div></div>';
  return h;}

/* shipments */
function shipTag(s){return '<span class="tag neu">'+s.status+'</span>';}
function devTag(s){if(!s.closedFlag)return '<span class="mut">—</span>';if(s.diff<0)return '<span class="tag signal">'+num(-s.diff)+' short</span>';if(s.diff>0)return '<span class="mut">+'+num(s.diff)+'</span>';return '<span class="mut">—</span>';}
function progress(s){var p=s.units?s.recv/s.units:0;return '<div class="prog"><span>'+pct(p,1)+'</span><span class="bar"><span style="width:'+Math.min(100,p*100).toFixed(1)+'%"></span></span></div>';}
function shipRowsFiltered(){var q=state.shipQ.trim().toLowerCase();return SHIPS.filter(function(s){if(state.shipFilter==='open'&&s.closedFlag)return false;if(state.shipFilter==='closed'&&!s.closedFlag)return false;if(state.shipFilter==='dev'&&!(s.closedFlag&&s.diff!==0))return false;
  if(!q)return true;return (s.id+' '+s.fc+' '+s.status+' '+s.name+' '+s.lines.map(function(l){return l.sku;}).join(' ')).toLowerCase().indexOf(q)>=0;});}
function shipCardHead(s){var amt=shipClaimAmount(s);if(amt)return money(amt,1);if(s.closedFlag&&s.diff<0)return num(-s.diff)+' short';if(!s.closedFlag){var en=s.units-s.recv;if(en)return num(en)+' en route';}return pct(s.recv/s.units,0);}
var SCOLS=[
 {key:'id',label:'Shipment',l:1,f:function(r){return '<span class="pn" style="min-width:0">'+r.id+'</span><span class="ps">'+esc(r.name)+'</span>';}},
 {key:'shipped',label:'Ship date',f:function(r){return fdIso(r.shipped);}},
 {key:'fc',label:'FC',f:function(r){return r.fc;}},
 {key:'status',label:'Status',f:shipTag},
 {key:'units',label:'Shipped',f:function(r){return num(r.units);}},
 {key:'recv',label:'Received',f:function(r){return num(r.recv);}},
 {key:'pr',label:'% received',sv:function(r){return r.recv/r.units;},f:progress},
 {key:'claim',label:'Claim',f:function(r){var a=shipClaimAmount(r);return a?money(a,1):'<span class="mut">—</span>';}},
 {key:'diff',label:'Shortfall',sv:function(r){return r.closedFlag?r.diff:1e9;},f:devTag}];
function shipBody(){var rows=sortRows(shipRowsFiltered(),state.shipSort,SCOLS);if(!rows.length)return '<tbody><tr><td colspan="9" class="empty">No shipments</td></tr></tbody>';
  var u=0,r=0,cl=0;rows.forEach(function(s){u+=s.units;r+=s.recv;cl+=shipClaimAmount(s);});
  return '<tbody>'+rows.map(function(s){return '<tr class="click" data-go="#/shipments/'+s.id+'" tabindex="0">'+SCOLS.map(function(c){return cell(c,s);}).join('')+'</tr>';}).join('')+'</tbody><tfoot><tr><td>'+rows.length+'</td><td></td><td></td><td></td><td>'+num(u)+'</td><td>'+num(r)+'</td><td>'+pct(r/u,1)+'</td><td>'+(cl?money(cl,1):'—')+'</td><td></td></tr></tfoot>';}
function claimRowsFiltered(){return D.claims.filter(function(c){return state.claimFilter==='all'||c.status===state.claimFilter;});}
function claimStatusTag(st){if(st==='Pending'||st==='Not filed')return '<span class="tag signal">'+st+'</span>';return '<span class="tag neu">'+st+'</span>';}
function claimCardsHtml(rows){if(!rows.length)return '<p class="empty">No claims</p>';
  return rows.map(function(c){return '<a class="claim-card" href="'+(c.shipment?'#/shipments/'+c.shipment:'#/shipments')+'"><div class="claim-card-top"><span class="claim-card-amt">'+money(c.amount,1)+'</span>'+claimStatusTag(c.status)+'</div><div class="claim-card-meta"><span>'+c.sku+'</span><span>'+num(c.units)+' units</span><span>'+esc(c.type)+'</span></div></a>';}).join('');}
function claimCards(){return claimCardsHtml(claimRowsFiltered().slice().reverse());}
function shipCardsHtml(rows){if(!rows.length)return '<p class="empty">No shipments</p>';
  return rows.map(function(s){var alert=shipClaimAmount(s)||(s.closedFlag&&s.diff<0)?' ship-card-alert':'';return '<a class="ship-card'+alert+'" href="#/shipments/'+s.id+'"><div class="ship-card-top"><span class="ship-card-amt">'+shipCardHead(s)+'</span><span class="ship-card-sub">'+num(s.recv)+' of '+num(s.units)+' received</span></div><div class="ship-card-id">'+s.id+'</div><div class="ship-card-meta"><span>'+s.fc+'</span><span>'+s.status+'</span></div></a>';}).join('');}
function shipCards(){return shipCardsHtml(sortRows(shipRowsFiltered(),state.shipSort,SCOLS));}
function shipMobLead(){var notFiled=D.claims.filter(function(c){return c.status==='Not filed';}).slice().reverse();
  var open=SHIPS.filter(function(s){return !s.closedFlag;});
  var h='<div class="mob-lead-block"><h2 class="mob-block-title">Not filed</h2><div class="claim-cards mob-lead-cards" id="shipLeadClaims">'+claimCardsHtml(notFiled)+'</div></div>';
  h+='<div class="mob-lead-block"><h2 class="mob-block-title">Open</h2><div class="ship-cards mob-lead-cards" id="shipLeadOpen">'+shipCardsHtml(open)+'</div></div>';
  return h;}
function refreshShipUi(){refreshBody('shipTbl',shipBody);var sc=$('#shipCards');if(sc)sc.innerHTML=shipCards();var cc=$('#claimCards');if(cc)cc.innerHTML=claimCards();var ct=$('#claimTbl');if(ct)ct.innerHTML=claimTable();
  if(isMob()){var nf=D.claims.filter(function(c){return c.status==='Not filed';}).slice().reverse();var lc=$('#shipLeadClaims');if(lc)lc.innerHTML=claimCardsHtml(nf);var open=SHIPS.filter(function(s){return !s.closedFlag;});var lo=$('#shipLeadOpen');if(lo)lo.innerHTML=shipCardsHtml(open);}}
var CLCOLS=[
 {key:'event',label:'Date',f:function(c){return fdIso(c.event);}},
 {key:'type',label:'Type',l:1,f:function(c){return c.type;}},
 {key:'ref',label:'Reference',l:1,f:function(c){return c.shipment?'<a href="#/shipments/'+c.shipment+'">'+c.shipment+'</a>':'<span class="mut">FBA warehouse</span>';}},
 {key:'sku',label:'SKU',l:1,f:function(c){return c.sku;}},
 {key:'units',label:'Units',f:function(c){return c.units;}},
 {key:'amount',label:'Amount',f:function(c){return money(c.amount,1);}},
 {key:'status',label:'Status',l:1,f:function(c){return claimStatusTag(c.status);}},
 {key:'case',label:'Case ID',l:1,f:function(c){return c.case||'<span class="mut">Not filed</span>';}},
 {key:'reimbursed',label:'Paid on',f:function(c){return c.reimbursed?fdIso(c.reimbursed):'<span class="mut">-</span>';}}];
function claimTable(){var rows=claimRowsFiltered().slice().reverse();var t={u:0,a:0};rows.forEach(function(c){t.u+=c.units;t.a+=c.amount;});
  return '<thead><tr>'+CLCOLS.map(function(c){return '<th'+(c.l?' class="l"':'')+' scope="col">'+c.label+'</th>';}).join('')+'</tr></thead><tbody>'+(rows.length?rows.map(function(c){return '<tr class="click" data-go="'+(c.shipment?'#/shipments/'+c.shipment:'#/shipments')+'" tabindex="0">'+CLCOLS.map(function(col){return cell(col,c);}).join('')+'</tr>';}).join(''):'<tr><td colspan="9" class="empty">No claims</td></tr>')+'</tbody><tfoot><tr><td>'+rows.length+'</td><td></td><td></td><td></td><td>'+t.u+'</td><td>'+money(t.a,1)+'</td><td></td><td></td><td></td></tr></tfoot>';}
PAGES.shipments=function(){var open=SHIPS.filter(function(s){return !s.closedFlag;});var onway=0,u=0,r=0;open.forEach(function(s){onway+=s.units-s.recv;});SHIPS.forEach(function(s){u+=s.units;r+=s.recv;});var ct=claimTotals();
  var summary=statGrid([['Received',pct(r/u,1),num(r)+' of '+num(u)],['In transit',num(onway),'units'],['Not filed',money(ct.notfiled,1),''],['Pending',money(ct.pending,1),''],['Reimbursed',money(ct.reimbursed,1),''],['Potential',money(ct.potential),'']]);
  var fl=[['all','All'],['open','Open'],['closed','Closed'],['dev','Shortfall']];
  var shipDetail='<section class="card sec"><div class="panel panel-h" style="margin:0"><div class="tools"><div class="chips" role="group" aria-label="Filter shipments">'+fl.map(function(f){return '<button class="chip" type="button" data-sf="'+f[0]+'" aria-pressed="'+(state.shipFilter===f[0])+'">'+f[1]+'</button>';}).join('')+'</div>'+searchBox('shipQ',state.shipQ,'Search')+'</div></div><div class="ship-cards ship-cards-all" id="shipCards">'+shipCards()+'</div><div class="tbl-wrap sticky1 ship-table-wrap"><table id="shipTbl">'+thead(SCOLS,state.shipSort,'ship')+shipBody()+'</table></div></section>';
  var cf=[['all','All'],['Not filed','Not filed'],['Pending','Pending'],['Reimbursed','Reimbursed']];
  shipDetail+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Claims</h2><div class="chips" role="group" aria-label="Filter claims">'+cf.map(function(f){return '<button class="chip" type="button" data-cf="'+f[0]+'" aria-pressed="'+(state.claimFilter===f[0])+'">'+f[1]+'</button>';}).join('')+'</div></div><div class="claim-cards claim-cards-all" id="claimCards">'+claimCards()+'</div><div class="tbl-wrap sticky1 claim-table-wrap"><table id="claimTbl">'+claimTable()+'</table></div></section>';
  if(isMob())return summary+shipMobLead()+mobCollapse('shipExpand',shipDetail);
  return summary+shipDetail;};
function shipmentDrawer(id){var s=SHIPS.filter(function(z){return z.id===id;})[0];if(!s)return null;
  var h=drawerBack('shipments','Shipments')+'<div class="dr-h"><div><h2 id="drawerTitle">'+s.id+'</h2><p>'+esc(s.name)+' &middot; to '+s.fc+'</p></div><button class="x" type="button" data-close aria-label="Close">&times;</button></div>';
  h+='<div class="mini"><div><span>Status</span><strong>'+s.status+'</strong></div><div><span>Shipped</span><strong>'+num(s.units)+'</strong></div><div><span>Received</span><strong>'+num(s.recv)+'</strong></div><div><span>% received</span><strong>'+pct(s.recv/s.units,1)+'</strong></div><div><span>Difference</span><strong class="'+(s.diff<0&&s.closedFlag?'neg':'')+'">'+(s.diff>0?'+':'')+num(s.diff)+'</strong></div><div><span>Cartons</span><strong>'+num(s.lines.reduce(function(t,l){return t+l.cartons;},0))+'</strong></div></div>';
  h+='<div class="kv"><div>Ship date</div><div>'+fdIso(s.shipped,{wd:1,y:1})+'</div><div>'+(s.delivered?'Delivered to FC':'Expected at FC')+'</div><div>'+fdIso(s.delivered||s.eta,{wd:1,y:1})+'</div><div>Closed by Amazon</div><div>'+(s.closed?fdIso(s.closed,{wd:1,y:1}):'Not yet')+'</div><div>Carrier</div><div>'+s.carrier+'</div><div>Inbound placement fee</div><div>'+(s.placement?money(s.placement,1)+' per unit':'None (Amazon-optimized split)')+'</div></div>';
  h+='<div class="dr-sec"><h3>Shipped vs received by SKU</h3><div class="tbl-wrap"><table><thead><tr><th>SKU</th><th>Shipped</th><th>Received</th><th>Difference</th><th class="l hide-m">Action</th></tr></thead><tbody>';
  s.lines.forEach(function(l){var d=l.received-l.shipped;var act;
    if(!s.closedFlag)act='<span class="mut">'+(s.status==='Receiving'?'Receiving in progress':'Waiting for check-in')+'</span>';
    else if(d<0){var c=claimFor(s.id,l.sku);act=(!c||c.status==='Not filed')?'<span class="tag signal">File claim</span> <span class="mut">'+(c?money(c.amount,1)+' est.':'')+'</span>':(c.status==='Reimbursed'?'<span class="tag neu">Reimbursed '+money(c.amount,1)+'</span>':'<span class="tag signal">Claim filed #'+c.case+'</span>');}
    else if(d>0)act='<span class="tag neu">Overage, no claim</span>';else act='<span class="tag neu">Matched</span>';
    h+='<tr><td><span class="pn" style="min-width:0">'+l.sku+'</span><span class="ps">'+esc(D.skus[skuIx[l.sku]].name)+'</span><span class="only-mb">'+act+'</span></td><td>'+num(l.shipped)+'</td><td>'+num(l.received)+'</td><td class="'+(d<0&&s.closedFlag?'neg':'')+'">'+(d>0?'+':'')+num(d)+'</td><td class="l hide-m">'+act+'</td></tr>';});
  h+='</tbody><tfoot><tr><td>Total</td><td>'+num(s.units)+'</td><td>'+num(s.recv)+'</td><td>'+(s.diff>0?'+':'')+num(s.diff)+'</td><td class="hide-m"></td></tr></tfoot></table></div></div>';
  return h;}

/* expenses */
var ECOLS=[
 {key:'date',label:'Date',sv:function(e){return e.i;},f:function(e){return fdIso(e.date);}},
 {key:'vendor',label:'Vendor',l:1,f:function(e){return '<span class="pn" style="min-width:140px">'+esc(e.vendor)+'</span><span class="ps">'+esc(e.memo)+'</span>';}},
 {key:'cat',label:'Category',l:1,f:function(e){return esc(e.cat);}},
 {key:'acct',label:'Account',l:1,hm:1,f:function(e){return esc(e.acct);}},
 {key:'amt',label:'Amount',f:function(e){return money(e.amt,1);}}];
function expRows(){var ab=rangeAB(),q=state.expQ.trim().toLowerCase();return EXP.filter(function(e){if(!state.expAll&&(e.i<ab[0]||e.i>ab[1]))return false;if(state.expCat&&e.cat!==state.expCat)return false;if(state.expAcct&&e.acct!==state.expAcct)return false;
  return !q||(e.vendor+' '+e.memo+' '+e.cat).toLowerCase().indexOf(q)>=0;});}
function expBody(){var rows=sortRows(expRows(),state.expSort,ECOLS);if(!rows.length)return '<tbody><tr><td colspan="5" class="empty">No transactions</td></tr></tbody>';var t=0;rows.forEach(function(e){t+=e.amt;});
  return '<tbody>'+rows.map(function(e){return '<tr>'+ECOLS.map(function(c){return cell(c,e);}).join('')+'</tr>';}).join('')+'</tbody><tfoot><tr><td>'+rows.length+' transactions</td><td></td><td></td><td class="hide-m"></td><td>'+money(t,1)+'</td></tr></tfoot>';}
PAGES.expenses=function(){var ab=rangeAB(),a=ab[0],b=ab[1],o=other(a,b),pab=prevAB(a,b),p=pab?other(pab[0],pab[1]):null;
  var cats=CATS.slice().sort(function(x,y){return o.by[y]-o.by[x];});
  var h='';
  if(isMob()){h=statGrid([['Other expenses',money(o.total,1),'QuickBooks']]);var top=cats.filter(function(c){return o.by[c];}).slice(0,4);
    if(top.length)h+='<ul class="mob-mini-list">'+top.map(function(c){return '<li><span>'+esc(c)+'</span><strong>'+money(o.by[c],1)+'</strong></li>';}).join('')+'</ul>';}
  var expDetail='<div class="two"><section class="card panel"><div class="panel-h"><h2>By category</h2></div><div class="tbl-wrap"><table><thead><tr><th>Category</th><th>Amount</th><th class="hide-m">Share</th><th>'+(p?'Prior':'')+'</th></tr></thead><tbody>';
  cats.forEach(function(c){var v=o.by[c];if(!v&&!(p&&p.by[c]))return;expDetail+='<tr class="click" data-cat="'+esc(c)+'" tabindex="0"><td>'+esc(c)+'</td><td>'+(v?money(v,1):'<span class="mut">-</span>')+'</td><td class="hide-m"><div class="prog"><span>'+pct(o.total?v/o.total:0,0)+'</span><span class="bar"><span style="width:'+(o.total?v/o.total*100:0).toFixed(1)+'%"></span></span></div></td><td class="mut">'+(p?(p.by[c]?money(p.by[c],1):'-'):'')+'</td></tr>';});
  expDetail+='</tbody><tfoot><tr><td>Total</td><td>'+money(o.total,1)+'</td><td class="hide-m"></td><td>'+(p?money(p.total,1):'')+'</td></tr></tfoot></table></div></section>';
  var wks=[];for(var w=0;w<NWEEKS;w++)wks.push(other(w*7,w*7+6).total);
  expDetail+='<section class="card panel"><div class="panel-h"><h2>Weekly</h2></div>'+barChart({values:wks,w:520,h:230,label:'Other expenses by week',hi:function(i){return i*7+6>=a&&i*7<=b;},xl:weekLabel,tip:function(i){return 'Week of '+fd(i*7)+': '+money(wks[i],1);}})+'</section></div>';
  var W8=[];for(var i=Math.max(0,NWEEKS-8);i<NWEEKS;i++)W8.push(i);var wd=W8.map(function(w){return other(w*7,w*7+6);});
  expDetail+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>By week</h2></div><div class="tbl-wrap sticky1"><table><thead><tr><th scope="col">Category</th>'+W8.map(function(w){return '<th scope="col">'+fd(w*7)+'</th>';}).join('')+'</tr></thead><tbody>';
  CATS.forEach(function(c){expDetail+='<tr><td>'+esc(c)+'</td>'+wd.map(function(x){return '<td'+(x.by[c]?'':' class="mut"')+'>'+(x.by[c]?money(x.by[c]):'-')+'</td>';}).join('')+'</tr>';});
  expDetail+='</tbody><tfoot><tr><td>Total</td>'+wd.map(function(x){return '<td>'+money(x.total)+'</td>';}).join('')+'</tr></tfoot></table></div></section>';
  var accts=[];EXP.forEach(function(e){if(accts.indexOf(e.acct)<0)accts.push(e.acct);});
  expDetail+='<section class="card sec"><div class="panel panel-h" style="margin:0"><div class="tools">'+searchBox('expQ',state.expQ,'Search')+'<select class="sel" id="expCat" aria-label="Category"><option value="">All categories</option>'+CATS.map(function(c){return '<option'+(state.expCat===c?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select><select class="sel" id="expAcct" aria-label="Account"><option value="">All accounts</option>'+accts.map(function(c){return '<option'+(state.expAcct===c?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select><select class="sel" id="expAll" aria-label="Dates"><option value="0"'+(state.expAll?'':' selected')+'>Selected dates</option><option value="1"'+(state.expAll?' selected':'')+'>All dates</option></select></div></div><div class="tbl-wrap sticky1"><table id="expTbl">'+thead(ECOLS,state.expSort,'exp')+expBody()+'</table></div></section>';
  h+=mobCollapse('expExpand',expDetail);
  return h;};

/* inventory at cost */
var ICOLS=[
 {key:'name',label:'Product',l:1,sv:function(r){return r.name;},f:function(r){return prodNameCell(D.skus[r.k],r.name);}},
 {key:'available',label:'Available',f:function(r){return num(r.available);}},
 {key:'inbound',label:'Inbound',f:function(r){return num(r.inbound);}},
 {key:'reserved',label:'Reserved',f:function(r){return num(r.reserved);}},
 {key:'stuck',label:'Stuck',f:function(r){return r.stuck?num(r.stuck):'<span class="mut">-</span>';}},
 {key:'cost',label:'Unit cost',f:function(r){return money(r.cost,1);}},
 {key:'atCost',label:'At cost',sv:function(r){return r.atCost;},f:function(r){return money(r.atCost,1);}}];
function invBucketRow(lbl,units,cents,sub){return '<div class="inv-bucket"><p class="inv-bucket-lbl">'+lbl+'</p><p class="inv-bucket-val"><strong>'+money(cents,1)+'</strong><small>'+num(units)+' units'+(sub?(' · '+sub):'')+'</small></p></div>';}
function invTie(){var q=D.openingInventory,out=[];for(var w=0;w<NWEEKS;w++){var a=w*7,b=a+6,purch=0;BANK.forEach(function(x){if(x.type==='Inventory purchase'&&x.i>=a&&x.i<=b)purch-=x.amt;});var g=agg(a,b);q=q+purch-g.cogs-g.loss;var sb=invValue(b);out.push({w:w,purch:purch,cogs:g.cogs,loss:g.loss,qbo:q,sb:sb,diff:q-sb});}return out;}
PAGES.inventory=function(){var last=NDAYS-1,snap=invCostSnapshot(last),rows=invCostRows(last),bs=balanceSheetSnap(),overlap=stuckClaimOverlap(),ct=claimTotals();
  var tie=invTie(),lt=tie[tie.length-1],tieNote=lt.diff===0?'Matches QuickBooks inventory roll-forward':'Roll-forward off by '+money(lt.diff,1);
  var bsNote=bs.assets.inventory===snap.totalCents?'Matches balance sheet Inventory line':'Off balance sheet by '+money(snap.totalCents-bs.assets.inventory,1);
  var h=pageLead()+'<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Inventory at cost</h2><span class="note">As of '+fd(last)+' · QuickBooks asset</span></div>';
  h+='<div class="card-inset"><p class="inv-total"><span>Total at cost</span><strong>'+money(snap.totalCents,1)+'</strong></p>';
  h+='<div class="inv-buckets">'+invBucketRow('Available',snap.available,snap.availableCents)+invBucketRow('Inbound / in transit',snap.inbound,snap.inboundCents)+invBucketRow('Reserved',snap.reserved,snap.reservedCents)+invBucketRow('Stuck in FBA',snap.stuck,snap.stuckCents,'unfulfillable · researching · stranded')+'</div></div></section>';
  h+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Stuck in FBA detail</h2></div>';
  h+='<div class="card-inset"><div class="inv-buckets inv-buckets-sub">'+invBucketRow('Unfulfillable',snap.stuckParts.unfulfillable,snap.stuckPartCents.unfulfillable)+invBucketRow('Researching / lost pending',snap.stuckParts.researching,snap.stuckPartCents.researching)+invBucketRow('Stranded',snap.stuckParts.stranded,snap.stuckPartCents.stranded)+'</div>';
  h+='<p class="fin-note inv-fin-note">Stuck at cost '+money(snap.stuckCents,1)+' ('+num(snap.stuck)+' units). Overlap with pending &amp; not-filed claims: '+num(overlap.units)+' units at cost '+money(overlap.cents,1)+' (claim reimbursement potential '+money(ct.pending+ct.notfiled,1)+'). '+bsNote+' · '+tieNote+'</p></div></section>';
  var tot={available:0,inbound:0,reserved:0,stuck:0,atCost:0};rows.forEach(function(r){tot.available+=r.available;tot.inbound+=r.inbound;tot.reserved+=r.reserved;tot.stuck+=r.stuck;tot.atCost+=r.atCost;});
  var invSorted=sortRows(rows,state.invSort,ICOLS);
  var invMobCards=isMob()?'<div class="mob-only mob-card-list inv-mob-list">'+invSorted.map(function(r){return '<a class="data-card tap-card has-link" href="#/products/'+r.sku+'"><div class="data-card-h">'+prodImgHtml(D.skus[r.k])+'<div class="data-card-t">'+esc(r.name)+'</div></div><dl class="data-card-rows"><div><dt>Available</dt><dd>'+num(r.available)+'</dd></div><div><dt>Inbound</dt><dd>'+num(r.inbound)+'</dd></div><div><dt>At cost</dt><dd>'+money(r.atCost,1)+'</dd></div></dl></a>';}).join('')+'</div>':'';
  var invDetail=invMobCards+'<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>By product</h2></div><div class="tbl-wrap sticky1 inv-table-wrap'+(isMob()?' desk-only':'')+'"><table id="invTbl">'+thead(ICOLS,state.invSort,'inv')+'<tbody>'+invSorted.map(function(r){return '<tr class="click tap-row" data-go="#/products/'+r.sku+'" tabindex="0">'+ICOLS.map(function(c){return cell(c,r);}).join('')+'</tr>';}).join('')+'</tbody><tfoot><tr><td>Total</td><td>'+num(tot.available)+'</td><td>'+num(tot.inbound)+'</td><td>'+num(tot.reserved)+'</td><td>'+num(tot.stuck)+'</td><td></td><td>'+money(tot.atCost,1)+'</td></tr></tfoot></table></div></section>';
  invDetail+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>QBO tie-out</h2></div><div class="tbl-wrap sticky1"><table><thead><tr><th scope="col">Week</th><th scope="col">Purchases</th><th scope="col">COGS</th><th scope="col">Write-offs</th><th scope="col">QuickBooks</th><th scope="col">Sellerboard</th><th scope="col">Diff</th></tr></thead><tbody>';
  tie.slice().reverse().forEach(function(r){invDetail+='<tr><td>'+fd(r.w*7+6)+'</td><td>'+(r.purch?'+'+money(r.purch,1):'<span class="mut">-</span>')+'</td><td>-'+money(r.cogs,1)+'</td><td>'+(r.loss?(r.loss>0?'-':'+')+money(Math.abs(r.loss),1):'<span class="mut">-</span>')+'</td><td>'+money(r.qbo,1)+'</td><td>'+money(r.sb,1)+'</td><td class="'+(r.diff===0?'pos':'neg')+'">'+money(r.diff,1)+'</td></tr>';});
  invDetail+='<tr><td class="mut">Opening, '+fd(-1)+'</td><td></td><td></td><td></td><td>'+money(D.openingInventory,1)+'</td><td></td><td></td></tr>';
  invDetail+='</tbody></table></div></section>';
  h+=mobCollapse('invExpand',invDetail);
  return h;};

/* payables */
function apAgingBar(lbl,amt,tot){var w=tot?Math.max(2,amt/tot*100):0;return '<div class="aging-row"><span class="aging-lbl">'+lbl+'</span><span class="aging-bar"><span style="width:'+w.toFixed(1)+'%"></span></span><span class="aging-amt">'+money(amt,1)+'</span></div>';}
PAGES.payables=function(){if(!LIAB)return pageLead()+'<p class="empty">No data</p>';var sec=liabSections(),due=liabDueIn30(),apm=liabApMetrics(),ap=LIAB.accountsPayable,mob=isMob(),aging=apAgingFromBills(),fin=liabFinanceCharges();
  var h=pageLead()+statGrid([['Total liabilities',money(sec.total),'QuickBooks'],['Due in 30 days',money(due.total),'']]);
  var billsSorted=ap.bills.slice().sort(function(a,b){return idx(a.dueDate)-idx(b.dueDate);});
  var apBody=billsSorted.map(function(b){return '<tr><td class="l">'+esc(b.vendor)+'</td><td>'+fdIso(b.billDate)+'</td><td>'+fdIso(b.dueDate)+'</td><td>'+money(b.amount,1)+'</td></tr>';}).join('');
  h+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Accounts payable</h2><span class="note">'+fdIso(LIAB.asOf)+'</span></div>';
  h+=statGrid([['Total payable',money(sec.ap),''],['Due this week',money(apm.dueWeek),''],['Overdue',money(apm.overdue),'']]);
  h+='<div class="aging">'+apAgingBar('Current',aging.current,sec.ap)+apAgingBar('1-30',aging.d1_30,sec.ap)+apAgingBar('31-60',aging.d31_60,sec.ap)+apAgingBar('60+',aging.d60plus,sec.ap)+'</div>';
  if(mob)h+='<div class="mob-only">'+mobBillCards(billsSorted)+'<div class="mob-card-tot"><span>Total payable</span><strong>'+money(sec.ap,1)+'</strong></div></div>';
  h+='<div class="tbl-wrap sticky1 liab-table-wrap'+(mob?' desk-only':'')+'"><table><thead><tr><th class="l" scope="col">Vendor</th><th scope="col">Bill date</th><th scope="col">Due date</th><th scope="col">Amount</th></tr></thead><tbody>'+apBody+'</tbody><tfoot><tr><td colspan="3">Total</td><td>'+money(sec.ap,1)+'</td></tr></tfoot></table></div></section>';
  h+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Credit cards</h2></div><p class="fin-note">Posted finance charges (Oct): Amex '+money(fin.amex,1)+', Ink '+money(fin.ink,1)+'</p>';
  if(mob)h+=mobCcCards(LIAB.creditCards,sec.cc);
  h+='<div class="tbl-wrap sticky1 liab-table-wrap'+(mob?' desk-only':'')+'"><table><thead><tr><th class="l" scope="col">Card</th><th scope="col">Balance</th><th scope="col">Limit</th><th scope="col">Statement due</th><th scope="col">Amount due</th></tr></thead><tbody>';
  LIAB.creditCards.forEach(function(c){var bal=liabCardBalance(c);h+='<tr><td class="l">'+esc(c.name)+'</td><td>'+money(bal,1)+'</td><td>'+money(c.limit,1)+'</td><td>'+fdIso(c.statementDue)+'</td><td>'+money(c.amountDue,1)+'</td></tr>';});
  h+='</tbody><tfoot><tr><td>Total</td><td>'+money(sec.cc,1)+'</td><td></td><td></td><td></td></tr></tfoot></table></div></section>';
  h+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Loans and lines of credit</h2></div><p class="fin-note">Posted loan interest (Oct): Amazon Lending '+money(fin.amazonLoan,1)+', LOC '+money(fin.loc,1)+'</p>';
  if(mob)h+=mobLoanCards(LIAB.loans,sec.loans);
  h+='<div class="tbl-wrap sticky1 liab-table-wrap'+(mob?' desk-only':'')+'"><table><thead><tr><th class="l" scope="col">Lender</th><th scope="col">Balance</th><th scope="col">Next payment</th><th scope="col">Rate</th></tr></thead><tbody>';
  LIAB.loans.forEach(function(l){h+='<tr><td class="l">'+esc(l.name)+'</td><td>'+money(l.balance,1)+'</td><td>'+money(l.nextPayment,1)+' · '+fdIso(l.nextDate)+'</td><td>'+pct(l.rate,1)+'</td></tr>';});
  h+='</tbody><tfoot><tr><td>Total</td><td>'+money(sec.loans,1)+'</td><td></td><td></td></tr></tfoot></table></div></section>';
  h+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Sales tax payable</h2></div>'+kvRows([['Balance',money(LIAB.salesTax.balance,1),null],['Due date',fdIso(LIAB.salesTax.dueDate),null]])+'</section>';
  h+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Payroll liabilities</h2></div>'+kvRows([['Accrued',money(LIAB.payroll.balance,1),null]])+'</section>';
  return h;};

/* cash */
PAGES.cash=function(){var last=NDAYS-1,c=cashAt(last),nx=D.settlements[D.settlements.length-1],bs=balanceSheetSnap(),mob=isMob();
  var h=pageLead()+statGrid([['Cash on hand',money(c.cash),'As of '+fd(last),null],['Checking',money(c.checking),'Business checking',null],['Savings',money(c.savings),'Reserve',null],['Amex',money(c.amex,1),'Card balance','#/payables'],['Next payout',money(nx.amount),'Lands '+fdIso(nx.deposit,{wd:1}),'#/payout']]);
  h+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Balance sheet</h2><span class="note">'+fd(last)+'</span></div><div class="bs-grid">';
  h+='<div class="bs-col"><h3 class="bs-h">Assets</h3>'+kvRows([['Cash',money(bs.assets.cash,1),'#/cash'],['Inventory',money(bs.assets.inventory,1),'#/inventory'],['Amazon reserve',money(bs.assets.reserve,1),'#/payout'],['Prepaid',money(bs.assets.prepaid,1),null],['Total assets',money(bs.assets.total,1),null]])+'</div>';
  h+='<div class="bs-col"><h3 class="bs-h">Liabilities</h3>'+kvRows([['Accounts payable',money(bs.liabilitySections.ap,1),'#/payables'],['Credit cards',money(bs.liabilitySections.cc,1),'#/payables'],['Loans',money(bs.liabilitySections.loans,1),'#/payables'],['Sales tax',money(bs.liabilitySections.tax,1),'#/payables'],['Payroll',money(bs.liabilitySections.payroll,1),'#/payables'],['Total liabilities',money(bs.liabilities,1),'#/payables']])+'</div>';
  h+='<div class="bs-col"><h3 class="bs-h">Equity</h3>'+kvRows([['Owner\'s equity',money(bs.equity,1),null]])+'</div></div></section>';
  var bals=[],rows=[];for(var w=0;w<NWEEKS;w++){var a=w*7,b=a+6,f=cashFlow(a,b);f.w=w;f.end=cashAt(b).cash;rows.push(f);bals.push(f.end);}
  var cashDetail='<div class="two sec"><section class="card panel"><div class="panel-h"><h2>Cash by week</h2></div>'+lineChart({values:bals,label:'Cash on hand by week',xl:function(i){return fd(i*7+6);},tip:function(i){return fd(i*7+6)+': '+money(bals[i]);}})+'</section>';
  cashDetail+='<section class="card panel"><div class="panel-h"><h2>Payouts</h2></div>';
  if(mob)cashDetail+='<div class="mob-card-list flush">'+D.settlements.slice().reverse().map(function(s){return mobRowCard(fdIso(s.deposit),[['Settlement',fdIso(s.start)+' – '+fdIso(s.end)+(s.open?' (open)':'')],['Amount',money(s.amount,1)]],s.open?'#/payout':null);}).join('')+'</div>';
  cashDetail+='<div class="tbl-wrap cash-table-wrap'+(mob?' desk-only':'')+'"><table><thead><tr><th scope="col">Settlement</th><th scope="col">Deposit</th><th scope="col">Amount</th></tr></thead><tbody>'+D.settlements.slice().reverse().map(function(s){return '<tr'+(s.open?' class="click tap-row" data-go="#/payout" tabindex="0"':'')+'><td>'+fdIso(s.start)+' - '+fdIso(s.end)+(s.open?' <span class="tag signal">Open</span>':'')+'</td><td>'+fdIso(s.deposit)+'</td><td>'+money(s.amount,1)+'</td></tr>';}).join('')+'</tbody></table></div></section></div>';
  cashDetail+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Weekly flow</h2><span class="note">QuickBooks</span></div>';
  if(mob)cashDetail+='<div class="mob-card-list flush">'+rows.slice().reverse().slice(0,8).map(function(f){return mobRowCard(fd(f.w*7),[['Payouts',money(f.payouts)],['Expenses',money(f.opex)],['Net',(f.net>0?'+':'')+money(f.net)],['Ending',money(f.end)]],null);}).join('')+'</div>';
  cashDetail+='<div class="tbl-wrap sticky1 cash-table-wrap'+(mob?' desk-only':'')+'"><table><thead><tr><th scope="col">Week</th><th scope="col">Payouts</th><th scope="col">Expenses</th><th scope="col">Amex</th><th scope="col">Inventory</th><th scope="col">Owner</th><th scope="col">Net</th><th scope="col">Ending</th></tr></thead><tbody>';
  var tot={payouts:0,opex:0,card:0,inventory:0,owner:0,net:0};var z=function(v){return v?money(v):'<span class="mut">-</span>';};
  rows.slice().reverse().forEach(function(f){Object.keys(tot).forEach(function(k){tot[k]+=f[k];});cashDetail+='<tr><td>'+fd(f.w*7)+'</td><td class="pos">'+z(f.payouts)+'</td><td>'+z(f.opex)+'</td><td>'+z(f.card)+'</td><td>'+z(f.inventory)+'</td><td>'+z(f.owner)+'</td><td class="'+(f.net>=0?'pos':'neg')+'">'+(f.net>0?'+':'')+money(f.net)+'</td><td><strong>'+money(f.end)+'</strong></td></tr>';});
  cashDetail+='</tbody><tfoot><tr><td>'+NWEEKS+' weeks</td><td>'+money(tot.payouts)+'</td><td>'+money(tot.opex)+'</td><td>'+money(tot.card)+'</td><td>'+money(tot.inventory)+'</td><td>'+money(tot.owner)+'</td><td>'+(tot.net>0?'+':'')+money(tot.net)+'</td><td>'+money(c.cash)+'</td></tr></tfoot></table></div></section>';
  var act=BANK.map(function(b){return {i:b.i,date:b.date,desc:b.desc,acct:b.acct,amt:b.amt,type:b.type};}).concat(EXP.filter(function(e){return e.acct===D.accounts.checking;}).map(function(e){return {i:e.i,date:e.date,desc:e.vendor+', '+e.memo,acct:e.acct,amt:-e.amt,type:e.cat};})).sort(function(x,y){return y.i-x.i;}).slice(0,20);
  cashDetail+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Recent activity</h2></div>';
  if(mob)cashDetail+='<div class="mob-card-list">'+act.slice(0,8).map(function(x){return mobRowCard(x.desc,[['Date',fdIso(x.date)],['Type',esc(x.type)],['Amount',(x.amt>0?'+':'')+money(x.amt,1)]],null);}).join('')+'</div>';
  cashDetail+='<div class="tbl-wrap sticky1 cash-table-wrap'+(mob?' desk-only':'')+'"><table><thead><tr><th scope="col">Date</th><th class="l" scope="col">Description</th><th class="l hide-m" scope="col">Type</th><th scope="col">Amount</th></tr></thead><tbody>'+act.map(function(x){return '<tr><td>'+fdIso(x.date)+'</td><td class="l"><span class="pn" style="min-width:170px">'+esc(x.desc)+'</span><span class="ps">'+esc(x.acct)+'</span></td><td class="l hide-m">'+esc(x.type)+'</td><td class="'+(x.amt>0?'pos':'')+'">'+(x.amt>0?'+':'')+money(x.amt,1)+'</td></tr>';}).join('')+'</tbody></table></div></section>';
  h+=mobCollapse('cashExpand',cashDetail);
  return h;};

/* data sources */
function jeLines(w){var o=agg(w*7,w*7+6);var net=o.sales-o.refunds-o.fees-o.ads+o.reimb;
  var L=[['Amazon clearing (due from Amazon)',net,0],['Sales: Amazon',0,o.sales],['Refunds and returns',o.refunds,0],['Amazon referral fees',o.referral,0],['FBA fulfillment fees',o.fba,0],['Inbound placement fees',o.placement,0],['FBA storage fees',o.storage,0],['Advertising: Amazon PPC',o.ads,0],['Other income: Amazon reimbursements',0,o.reimb],['Cost of goods sold',o.cogs,0],['Inventory shrinkage',o.loss>0?o.loss:0,o.loss<0?-o.loss:0],['Inventory asset',0,o.cogs+o.loss]];
  return L.filter(function(l){return l[1]||l[2];});}
PAGES.sources=function(){
  var t=function(s){var p=s.split('T'),d=idx(p[0]),hm=p[1].split(':'),h=+hm[0];return fd(d)+', '+((h%12)||12)+':'+hm[1]+(h<12?' AM':' PM');};
  var h='<div class="two even"><section class="card conn"><div class="conn-h"><h3>Sellerboard</h3><span class="tag neu">Connected</span></div><div class="meta">Synced '+t(D.sync.sellerboard)+' · Amazon US</div></section>';
  h+='<section class="card conn"><div class="conn-h"><h3>QuickBooks</h3><span class="tag neu">Connected</span></div><div class="meta">Synced '+t(D.sync.qbo)+'</div></section></div>';
  var srcDetail='';
  var w=NWEEKS-1,L=jeLines(w),dr=0,cr=0;L.forEach(function(l){dr+=l[1];cr+=l[2];});
  srcDetail+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>JE-'+(D.jeStart+w)+'</h2><span class="note">'+frange(w*7,w*7+6)+' · Posted '+fd(w*7+7)+'</span><span class="tag '+(dr===cr?'neu':'signal')+'">'+(dr===cr?'Balanced':'Off')+'</span></div><div class="tbl-wrap"><table><thead><tr><th scope="col">Account</th><th scope="col">Debit</th><th scope="col">Credit</th></tr></thead><tbody>'+L.map(function(l){return '<tr><td>'+l[0]+'</td><td>'+(l[1]?money(l[1],1):'')+'</td><td>'+(l[2]?money(l[2],1):'')+'</td></tr>';}).join('')+'</tbody><tfoot><tr><td>Total</td><td>'+money(dr,1)+'</td><td>'+money(cr,1)+'</td></tr></tfoot></table></div></section>';
  srcDetail+='<section class="card sec"><div class="panel panel-h" style="margin:0"><h2>Posting log</h2></div><div class="tbl-wrap"><table><thead><tr><th scope="col">Entry</th><th scope="col">Week</th><th scope="col">Posted</th><th scope="col">Amazon profit</th><th class="l" scope="col">Status</th></tr></thead><tbody>';
  for(var i=NWEEKS-1;i>=0;i--){var o=agg(i*7,i*7+6);srcDetail+='<tr><td>JE-'+(D.jeStart+i)+'</td><td>'+frange(i*7,i*7+6)+'</td><td>'+fd(i*7+7)+'</td><td>'+money(o.amzProfit,1)+'</td><td class="l"><span class="tag neu">Posted</span></td></tr>';}
  srcDetail+='</tbody></table></div></section>';
  h+=mobCollapse('srcExpand',srcDetail);
  return h;};

/* ---------- shell ---------- */
var TITLES={overview:['Overview',''],report:['Weekly report',''],products:['Products',''],shipments:['FBA shipments',''],expenses:['Expenses',''],inventory:['Inventory',''],cash:['Cash',''],payables:['Payables',''],payout:['Next payout','Open settlement'],sources:['Data sources','']};
var RANGED={overview:1,products:1,expenses:1};
function renderRange(page){var bar=$('#rangeBar');if(!RANGED[page]){bar.hidden=true;bar.innerHTML='';return;}bar.hidden=false;var ab=rangeAB();
  var opts=[['week','This week'],['last','Last week'],['mtd','Month to date'],['custom','Custom']];
  var h='<div class="seg">'+opts.map(function(o){return '<button type="button" data-range="'+o[0]+'" aria-pressed="'+(state.range===o[0])+'">'+o[1]+'</button>';}).join('')+'</div>';
  if(state.range==='custom')h+='<span class="custom"><input type="date" id="ca" aria-label="Start date" min="'+D.start+'" max="'+D.end+'" value="'+isoOf(Math.min(state.ca,state.cb))+'"><span>to</span><input type="date" id="cb" aria-label="End date" min="'+D.start+'" max="'+D.end+'" value="'+isoOf(Math.max(state.ca,state.cb))+'"></span>';
  h+='<span class="range-label">'+frange(ab[0],ab[1])+'</span>';bar.innerHTML=h;}
function sideSync(){var t=function(s){var hm=s.split('T')[1].split(':'),h=+hm[0];return ((h%12)||12)+':'+hm[1]+(h<12?' AM':' PM');};
  $('#sideSync').innerHTML='<div class="row"><span class="dot"></span>Sellerboard · '+t(D.sync.sellerboard)+'</div><div class="row"><span class="dot"></span>QuickBooks · '+t(D.sync.qbo)+'</div>';}
var cur={page:null,sub:null};
function route(){var hs=(location.hash||'#/overview').replace(/^#\/?/,'').split('/');var page=PAGES[hs[0]]?hs[0]:'overview';var sub=hs[1]?decodeURIComponent(hs[1]):null;
  if(page==='report'&&sub&&/^\d+$/.test(sub)){state.reportWeek=Math.max(0,Math.min(NWEEKS-1,+sub));sub=null;cur.page=null;}
  var pageChanged=cur.page!==page;cur.page=page;cur.sub=sub;
  if(page==='overview')state.backTo=null;
  if(pageChanged&&page!=='products')state.prodShowAll=false;
  closeMobMore();
  if(pageChanged)render();
  renderSideNav(page);
  renderMobTabs(page);
  openDrawer(page,sub);
  if(pageChanged&&!sub)window.scrollTo(0,0);}
function render(){var page=cur.page;$('#pageTitle').textContent=TITLES[page][0];var ps=$('#pageSub'),sub=TITLES[page][1];ps.textContent=sub;ps.hidden=!sub;document.title=TITLES[page][0]+' | '+D.business.name+' | Sample client portal';renderRange(page);$('#main').innerHTML=PAGES[page]();}
var lastFocus=null;
function openDrawer(page,sub){var wrap=$('#drawerWrap'),dr=$('#drawer');var html=null;
  if(sub&&page==='products')html=productDrawer(sub);if(sub&&page==='shipments')html=shipmentDrawer(sub);
  if(html){if(wrap.hidden)lastFocus=document.activeElement;dr.innerHTML=html;wrap.hidden=false;document.body.style.overflow='hidden';dr.scrollTop=0;var x=dr.querySelector('.x');if(x)x.focus({preventScroll:true});}
  else if(!wrap.hidden){wrap.hidden=true;document.body.style.overflow='';if(lastFocus&&lastFocus.focus){try{lastFocus.focus({preventScroll:true});}catch(e){}}}}
function closeDrawer(){location.hash=(state.backTo&&(cur.page==='products'||cur.page==='shipments'))?state.backTo:'#/'+cur.page;}
function refreshTable(id,cols,sort,tbl,bodyFn){var t=document.getElementById(id);if(t)t.innerHTML=thead(cols,sort,tbl)+bodyFn();}
function refreshBody(id,fn){var t=document.getElementById(id);if(!t)return;var th=t.querySelector('thead').outerHTML;t.innerHTML=th+fn();}
var TBL={prod:['prodSort','prodTbl',function(){return PCOLS;},function(){return prodBody();}],ship:['shipSort','shipTbl',function(){return SCOLS;},function(){return shipBody();}],exp:['expSort','expTbl',function(){return ECOLS;},function(){return expBody();}],inv:['invSort','invTbl',null,null]};
var TEXTKEYS={name:1,id:1,vendor:1,cat:1,acct:1,fc:1,status:1,cover:1,type:1};
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;
  if(t.closest('#nav a, #mobTabs a, #mobMorePanel a'))state.backTo=null;
  var fromOv=t.closest('#main a[href^="#"]');
  if(fromOv&&cur.page==='overview'&&!t.closest('#nav, #mobTabs, #mobMorePanel, .seg, .chip, [data-range], [data-metric], [data-sort], [data-expand], [data-prod-all], #printBtn'))state.backTo='#/overview';
  if(t.closest('[data-close]')){closeDrawer();return;}
  if(t.closest('#mobMoreBtn')){openMobMore();return;}
  if(t.closest('[data-close-more]')){closeMobMore();return;}
  var ex=t.closest('[data-expand]');if(ex){var pid=ex.getAttribute('data-expand'),pan=$('#'+pid);if(pan){var opening=pan.hidden;pan.hidden=!opening;ex.setAttribute('aria-expanded',String(opening));ex.textContent=opening?'Show less':'Show more';}return;}
  if(t.closest('[data-prod-all]')){state.prodShowAll=true;var pc=$('#prodCards');if(pc)pc.innerHTML=prodCards();return;}
  var r=t.closest('[data-range]');if(r){state.range=r.getAttribute('data-range');render();return;}
  var m=t.closest('[data-metric]');if(m){state.chartMetric=m.getAttribute('data-metric');render();return;}
  var s=t.closest('[data-sort]');if(s){var key=s.getAttribute('data-sort'),tb=s.getAttribute('data-tbl'),mm=TBL[tb],st=state[mm[0]];
    if(st.key===key)st.dir=-st.dir;else{st.key=key;st.dir=TEXTKEYS[key]?1:-1;}
    if(mm[2])refreshTable(mm[1],mm[2](),st,tb,mm[3]);else render();var nb=document.querySelector('#'+mm[1]+' [data-sort="'+key+'"]');if(nb)nb.focus();return;}
  var sf=t.closest('[data-sf]');if(sf){state.shipFilter=sf.getAttribute('data-sf');document.querySelectorAll('[data-sf]').forEach(function(b){b.setAttribute('aria-pressed',String(b===sf));});refreshShipUi();return;}
  var cf=t.closest('[data-cf]');if(cf){state.claimFilter=cf.getAttribute('data-cf');document.querySelectorAll('[data-cf]').forEach(function(b){b.setAttribute('aria-pressed',String(b===cf));});refreshShipUi();return;}
  var cat=t.closest('[data-cat]');if(cat){state.expCat=cat.getAttribute('data-cat');render();var et=$('#expTbl');if(et)et.closest('section').scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(t.closest('#printBtn')){window.print();return;}
  if(t.closest('a'))return;
  var go=t.closest('[data-go]');if(go){location.hash=go.getAttribute('data-go');return;}
  var bar=t.closest('rect.bar,circle.ptA');if(bar){showTip(bar);return;}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('#drawerWrap').hidden){closeDrawer();return;}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('tr[data-go],tr[data-cat]')){e.preventDefault();e.target.click();}});
document.addEventListener('input',function(e){var id=e.target.id;
  if(id==='prodQ'){state.prodQ=e.target.value;refreshBody('prodTbl',prodBody);var pc=$('#prodCards');if(pc)pc.innerHTML=prodCards();}
  else if(id==='shipQ'){state.shipQ=e.target.value;refreshShipUi();}
  else if(id==='expQ'){state.expQ=e.target.value;refreshBody('expTbl',expBody);}});
document.addEventListener('change',function(e){var id=e.target.id;
  if(id==='repWeek'){location.hash='#/report/'+e.target.value;}
  else if(id==='expCat'){state.expCat=e.target.value;refreshBody('expTbl',expBody);}
  else if(id==='expAcct'){state.expAcct=e.target.value;refreshBody('expTbl',expBody);}
  else if(id==='expAll'){state.expAll=e.target.value==='1';refreshBody('expTbl',expBody);}
  else if(id==='ca'||id==='cb'){var v=e.target.value;if(!v)return;var i=Math.max(0,Math.min(NDAYS-1,idx(v)));if(id==='ca')state.ca=i;else state.cb=i;render();}});
var tip=$('#tip'),tipTimer=null;
function showTip(el){var r=el.getBoundingClientRect();tip.textContent=el.getAttribute('data-tip');tip.classList.add('on');var w=tip.offsetWidth;var x=Math.max(8,Math.min(window.innerWidth-w-8,r.left+r.width/2-w/2));tip.style.left=x+'px';tip.style.top=Math.max(8,r.top-34)+'px';clearTimeout(tipTimer);tipTimer=setTimeout(function(){tip.classList.remove('on');},2200);}
document.addEventListener('mouseover',function(e){var b=e.target.closest&&e.target.closest('rect.bar,circle.ptA');if(b)showTip(b);});
window.addEventListener('scroll',function(){tip.classList.remove('on');},{passive:true});
window.addEventListener('hashchange',route);
var wasMob=window.innerWidth<640;window.addEventListener('resize',function(){var m=window.innerWidth<640;if(m!==wasMob){wasMob=m;render();openDrawer(cur.page,cur.sub);}});
sideSync();route();
window.__portal={agg:agg,full:full,other:other,invValue:invValue,invCostSnapshot:invCostSnapshot,invCostRows:invCostRows,stuckClaimOverlap:stuckClaimOverlap,invTie:invTie,cashAt:cashAt,cashFlow:cashFlow,claimTotals:claimTotals,breakdownSum:breakdownSum,breakdownParts:breakdownParts,jeLines:jeLines,NDAYS:NDAYS,NWEEKS:NWEEKS,rangeAB:rangeAB,state:state,invRows:invRows,SHIPS:SHIPS,liabSections:liabSections,liabDueIn30:liabDueIn30,liabApTotal:liabApTotal,liabApBillTotal:liabApBillTotal,apAgingFromBills:apAgingFromBills,apBillBucket:apBillBucket,liabApAsOf:liabApAsOf,liabFinanceCharges:liabFinanceCharges,balanceSheetSnap:balanceSheetSnap,settlementBreakdown:settlementBreakdown,EXP:EXP,D:D};
})();
