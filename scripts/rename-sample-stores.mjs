/**
 * Replace real store names with fictitious names (per-page maps). Strips primal store addresses/phones.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const PRIMAL = {
  "Einhorn's Supermarket - Boro Park": 'Shefa Market - Boro Park',
  'Pomegranate - Flatbush': 'Kesher Foods - Flatbush',
  'Manna Health Market - 5 Towns': 'Golden Basket Kosher - 5 Towns',
  'Kosher Kingdom - Aventura': 'Neshama Kosher - Aventura',
  'Riverdale Kosher Market': 'Pri Market - Riverdale',
  'Cedar Market - Teaneck': 'Simcha Market - Teaneck',
  'Evergreen - Lakewood': 'Bais Hamakolet - Lakewood',
  'Salt Market - Deal': 'Yam Kosher Market - Deal',
  'Shalom Kosher - Silver Spring': 'Lev Fresh - Silver Spring',
  "Aron's Kissena Farms": 'Tal Fresh - Queens',
  "Aron's Kissena Farms - Queens": 'Tal Fresh - Queens',
  "Moisha's Kosher": 'Tzur Kosher - Brooklyn',
  "Moisha's - Brooklyn": 'Tzur Kosher - Brooklyn',
  Breadberry: 'Shalva Fresh - Brooklyn',
  'Breadberry - Brooklyn': 'Shalva Fresh - Brooklyn',
  'Bingo Wholesale': 'Ohr Wholesale - Lakewood',
  'Rockland Kosher Supermarket': 'Brocha Supermarket - Monsey',
  'Kosher Experience': 'Ashira Kosher - Brooklyn',
  'Gourmet Glatt - Lakewood': 'Bais Hamakolet - Lakewood',
  'Gourmet Glatt - Cedarhurst': 'Golden Basket Kosher - Cedarhurst',
  'Seven Mile Market - Baltimore': 'Ahava Market - Baltimore',
  'Market Maven - Baltimore': 'Simcha Foods - Baltimore',
  'Shoprite Wesley Hills': 'Tova Supermarket - Wesley Hills',
  'KRM - Brooklyn': 'Ner Market - Brooklyn',
  "Brach's - Lawrence": "Gitty's Market - Lawrence",
  'Supersol - Lawrence': 'Golden Basket Kosher - Lawrence',
  'Evergreen - Monsey': 'Shefa Market - Monsey',
  'Cedar Market - Teaneck': 'Simcha Market - Teaneck',
}

const AUFSCHNITT = {
  'Pomegranate - Flatbush': 'Tamar Market - Flatbush',
  "Moisha's - Brooklyn": "Zissel's - Brooklyn",
  'Breadberry - Brooklyn': 'Nachas Foods - Brooklyn',
  'KRM - Brooklyn': 'Ner Market - Brooklyn',
  'Rockland Kosher Supermarket': 'Gan Eden Market - Monsey',
  'Shoprite Wesley Hills': 'Tova Supermarket - Wesley Hills',
  'Gourmet Glatt - Lakewood': 'Meged Glatt - Lakewood',
  'Evergreen - Lakewood': 'Nitzan Market - Lakewood',
  'Gourmet Glatt - Cedarhurst': 'Achdus Foods - Cedarhurst',
  "Brach's - Lawrence": "Gitty's Market - Lawrence",
  'Cedar Market - Teaneck': 'Shoresh Market - Teaneck',
  'Salt Market - Deal': 'Dvir Market - Deal',
  'Supersol - Lawrence': 'Golden Basket Kosher - Lawrence',
  'Evergreen - Monsey': 'Shefa Market - Monsey',
  'Seven Mile Market - Baltimore': 'Ahava Market - Baltimore',
  'Market Maven - Baltimore': 'Simcha Foods - Baltimore',
  "Aron's Kissena Farms - Queens": 'Lev Fresh - Queens',
  'Bingo Wholesale': 'Keren Wholesale - Lakewood',
}

const MR_DIPZ = {
  'Rockland Kosher Supermarket': 'Brocha Supermarket - Monsey',
  'Evergreen - Monsey': 'Tova Market - Monsey',
  'Wesley Kosher': 'Shefa Market - Monsey',
  'Hatzlacha - Monsey': 'Ohr Kosher - Monsey',
  'Monsey Glatt': 'Gan Eden Glatt - Monsey',
  'Hatzlacha - Spring Valley': 'Nachas Market - Spring Valley',
  Pomegranate: 'Kesher Foods - Flatbush',
  "Moisha's": "Zissel's - Boro Park",
  Breadberry: 'Shalva Fresh - Boro Park',
  'Glatt Mart': 'Ateres Glatt - Brooklyn',
  'Certo Market': 'Yashar Market - Brooklyn',
  "Wasserman's": "Pnina's Market - Queens",
  'Supersol - Kew Gardens Hills': 'Lev Fresh - Kew Gardens Hills',
  'Seasons - Queens': 'Chesed Market - Queens',
  'A to Z Kosher Supermarket': 'Tamar Kosher - Queens',
  'Gourmet Glatt - Cedarhurst': 'Golden Basket Kosher - Cedarhurst',
  "Brach's - Lawrence": 'Achdus Foods - Lawrence',
  'Gourmet Glatt - Woodmere': 'Hadas Glatt - Woodmere',
  'Seasons - Lawrence': 'Dvash Market - Lawrence',
  'Spartan Kosher': 'Ezra Market - Southfield',
  'One Stop Kosher': 'Bracha Foods - Southfield',
  'Kosher Konnection': 'Neshama Kosher - Boca',
  'Grand Kosher Boca': 'Ahava Market - Boca',
  'The Grove - Boca': 'Ilan Kosher - Boca',
}

const POP_STORES = {
  'Rockland Kosher Supermarket': 'Brocha Supermarket - Monsey',
  'Evergreen - Monsey': 'Shefa Market - Monsey',
  'Wesley Kosher - Monsey': 'Ohr Kosher - Monsey',
  'Pomegranate - Flatbush': 'Kesher Foods - Flatbush',
  'Breadberry - Boro Park': 'Shalva Fresh - Boro Park',
  'KRM - Boro Park': 'Ruchama Market - Boro Park',
  'Gourmet Glatt - Lakewood': 'Bais Hamakolet - Lakewood',
  'Seasons - Lakewood': 'Nitzan Market - Lakewood',
  "Aron's Kissena Farms - Queens": 'Lev Fresh - Queens',
  'Seasons - Lawrence': 'Golden Basket Kosher - Lawrence',
}

const POP_CORP = {
  'Rockland Pediatrics': 'Brookview Pediatric Associates',
  'Clarkstown Orthodontics': 'Elmridge Orthodontics',
  'Highview Senior Living': 'Fernhill Senior Residence',
  'Hudson Valley Dental Group': 'Stonecrest Dental Group',
  'Maple Ave Realty': 'Birchwood Realty Partners',
  'Northgate Property Management': 'Oakpoint Property Management',
  'Palisades Physical Therapy': 'Glenmoor Physical Therapy',
  'Pinnacle Home Care': 'Willowmere Home Care',
  'Riverdale Staffing': 'Kestrel Staffing Group',
  'Bergen Medical Supply': 'Halbrook Medical Supply',
}

function replaceMap(text, map) {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length)
  let out = text
  for (const k of keys) {
    out = out.split(k).join(map[k])
  }
  return out
}

function processFile(rel, map) {
  const file = path.join(root, rel)
  let text = fs.readFileSync(file, 'utf8')
  const next = replaceMap(text, map)
  if (next !== text) fs.writeFileSync(file, next)
}

function stripAndRenamePrimal() {
  const file = path.join(root, 'data/primal-krisp.json')
  let text = fs.readFileSync(file, 'utf8')
  text = replaceMap(text, PRIMAL)
  const data = JSON.parse(text)
  for (const st of data.stores?.list || []) {
    delete st.address
    delete st.phone
    if (st.real === true) st.real = false
    if (st.sample?.real === true) st.sample.real = false
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n')
}

stripAndRenamePrimal()

processFile('data/popinsanity.json', { ...POP_STORES, ...POP_CORP })
processFile('components/samples/mrDipz/mrDipzData.js', MR_DIPZ)
processFile('components/samples/aufschnitt/aufschnittData.js', AUFSCHNITT)
processFile('components/samples/aufschnitt/aufschnittCatalog.js', AUFSCHNITT)

console.log('Store renames applied.')
