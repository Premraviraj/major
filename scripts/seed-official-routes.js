/**
 * Seeds all official BMTC routes from the Essential Service Details list
 * and creates stop↔route mappings so search shows only relevant routes.
 * Run: node seed-official-routes.js
 */
import { readFileSync } from 'fs';
const env = readFileSync('.env', 'utf8');
env.split('\n').forEach(l => { const [k,...v]=l.split('='); if(k?.trim()) process.env[k.trim()]=v.join('=').trim(); });

const BASE = process.env.SUPABASE_URL + '/rest/v1/';
const H = {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates',
};

async function upsert(table, rows) {
  if (!rows.length) return;
  const res = await fetch(BASE + table, { method: 'POST', headers: H, body: JSON.stringify(rows) });
  if (res.status >= 400) console.error(`❌ ${table}:`, (await res.text()).slice(0,120));
  else process.stdout.write(`✅ ${table}: ${rows.length} rows\n`);
}

async function rpc(fn) {
  const res = await fetch(BASE + 'rpc/' + fn, { method: 'POST', headers: { ...H, Prefer: '' }, body: '{}' });
  console.log(`🔄 ${fn}: ${res.status}`);
}

// All routes from the official BMTC Essential Service Details document
// Format: [route_no, from, to]
const OFFICIAL_ROUTES = [
  ["13",    "Shivajinagara Bus Station",    "Banashankari TTMC"],
  ["18",    "Kempegowda Bus Station",       "Marenahalli Bus Station"],
  ["25A",   "Kempegowda Bus Station",       "BTM Layout"],
  ["45D",   "Kempegowda Bus Station",       "AGS Layout"],
  ["61",    "Kempegowda Bus Station",       "Vijayanagara TTMC"],
  ["63",    "Shivajinagara Bus Station",    "BCC Layout"],
  ["75B",   "Malleshwaram Bus Stand",       "Hampinagara"],
  ["90E",   "Kempegowda Bus Station",       "Yeshawanthapura Railway Station"],
  ["94",    "Shivajinagara Bus Station",    "Yeshawanthapura TTMC"],
  ["94E",   "Shivajinagara Bus Station",    "Yeshawanthapura Railway Station"],
  ["96",    "Kempegowda Bus Station",       "Kempegowda Bus Station"],
  ["96A",   "Kempegowda Bus Station",       "Kempegowda Bus Station"],
  ["96G",   "Kempegowda Bus Station",       "Shankarnagh Bus Stand"],
  ["111",   "KR Market",                    "Kaval Byrasandra"],
  ["111C",  "Kempegowda Bus Station",       "Kaval Byrasandra"],
  ["114A",  "Shivajinagara Bus Station",    "Sultanpalya"],
  ["138",   "Kempegowda Bus Station",       "Jeevan Bheemanagara"],
  ["171",   "Kempegowda Bus Station",       "Koramangala 1st Block"],
  ["176",   "Hampinagara",                  "Kaval Byrasandra"],
  ["195",   "Shivajinagara Bus Station",    "Chandra Layout"],
  ["201D",  "S V Metro Station",            "Central Silk Board"],
  ["201G",  "Banashankari TTMC",            "Jeevan Bheemanagara"],
  ["210N",  "Kempegowda Bus Station",       "Uttarahalli"],
  ["215H",  "Kempegowda Bus Station",       "Jambu Savari Dinne"],
  ["215N",  "Kempegowda Bus Station",       "Anjanapura"],
  ["225C",  "Kempegowda Bus Station",       "BEML Layout 5th Stage"],
  ["226M",  "KR Market",                    "Bidadi"],
  ["226N",  "Kempegowda Bus Station",       "Bidadi"],
  ["234E",  "Kempegowda Bus Station",       "Hullala Sattelite Town"],
  ["238U",  "Kempegowda Bus Station",       "Bengaluru University Administrative Block"],
  ["242",   "KR Market",                    "Tavarakere"],
  ["242B",  "Kempegowda Bus Station",       "Tavarakere"],
  ["248",   "KR Market",                    "Jalahalli Cross"],
  ["250P",  "Kempegowda Bus Station",       "Chikkabanavara"],
  ["252F",  "Kempegowda Bus Station",       "Peenya 2nd Stage"],
  ["253",   "KR Market",                    "Hesaraghatta I D Farm"],
  ["253J",  "Kempegowda Bus Station",       "Hesarughatta"],
  ["258",   "KR Market",                    "Nelamangala"],
  ["258C",  "Kempegowda Bus Station",       "Nelamangala"],
  ["266",   "KR Market",                    "Hesaraghatta I D Farm"],
  ["273C",  "Kempegowda Bus Station",       "Jalahalli Cross"],
  ["276",   "Kempegowda Bus Station",       "Vidyaranyapura"],
  ["276E",  "Vidyaranyapura",               "Shanthinagara"],
  ["284",   "Kempegowda Bus Station",       "Yelahanka"],
  ["285MA", "Kempegowda Bus Station",       "Doddaballapura"],
  ["285MC", "Shanthinagara",                "Doddaballapura"],
  ["291H",  "Kempegowda Bus Station",       "Ramakrishna Hegde Nagara"],
  ["293",   "KR Market",                    "Razakpalya"],
  ["293S",  "Kempegowda Bus Station",       "Bagaluru"],
  ["296Q",  "Shivajinagara Bus Station",    "Kannuru"],
  ["298M",  "Kempegowda Bus Station",       "Devanahalli"],
  ["298ME", "Kempegowda Bus Station",       "Devanahalli Govt Hospital"],
  ["300",   "Kempegowda Bus Station",       "KR Puram"],
  ["302B",  "Kempegowda Bus Station",       "Kalyanagara"],
  ["305D",  "Kempegowda Bus Station",       "Channasandra"],
  ["314T",  "Kempegowda Bus Station",       "Rameshnagara"],
  ["316B",  "Kempegowda Bus Station",       "Budigere"],
  ["317",   "KR Market",                    "Hosakote"],
  ["317G",  "Shivajinagara Bus Station",    "Hosakote"],
  ["317TA", "KR Market",                    "Tharabanahalli"],
  ["333E",  "Kempegowda Bus Station",       "Kadugodi"],
  ["342F",  "Kempegowda Bus Station",       "Sarjapura"],
  ["356M",  "Kempegowda Bus Station",       "Anekal"],
  ["360B",  "Kempegowda Bus Station",       "Attibele"],
  ["365J",  "Kempegowda Bus Station",       "Jigani APC Circle"],
  ["375D",  "Kengeri TTMC",                 "Banashankari TTMC"],
  ["401A",  "Yelahanka",                    "Peenya 2nd Stage"],
  ["401K",  "Yelahanka",                    "Kengeri TTMC"],
  ["401M",  "Yeshawanthapura TTMC",         "Kengeri TTMC"],
  ["402D",  "Kempegowda Bus Station",       "Yelahanka New Town 5th Phase"],
  ["410",   "Bommanahalli",                 "Jalahalli Cross"],
  ["410FA", "Banashankari TTMC",            "Yeshawanthapura TTMC"],
  ["500A",  "Banashankari TTMC",            "Hebbala"],
  ["500D",  "Hebbala",                      "Central Silk Board"],
  ["501A",  "Hebbala",                      "Banashankari TTMC"],
  ["501BH", "Banashankari TTMC",            "Hebbala"],
  ["502H",  "Kengeri TTMC",                 "Dwarakanagara"],
  ["600F",  "Banashankari TTMC",            "Attibele"],
  ["G6",    "Shanthinagara TTMC",           "Shirke"],
  ["KBS5H", "Kempegowda Bus Station",       "Harohalli"],
  ["TR12",  "Srinagara",                    "Yeshawanthapura Railway Station"],
  ["HS1",   "Kempegowda Bus Station",       "Apollo Hospital Bannerughatta Road"],
  ["HS2",   "Kempegowda Bus Station",       "Supra Hospital, RBI LO, J.P Nagar"],
  ["HS3",   "Kempegowda Bus Station",       "Rajarajeshwari Hospital"],
  ["HS4",   "Kempegowda Bus Station",       "Devanahalli General Hospital"],
  ["HS5",   "Kempegowda Bus Station",       "Ambedkar Medical College, K.G.Halli"],
  ["HS6",   "Kempegowda Bus Station",       "Hosakote General Hospital"],
  ["HS6A",  "ESI Indiranagara Hospital",    "Hosakote General Hospital"],
  ["HS7",   "Kempegowda Bus Station",       "Vaidehi Hospital, Whitefield"],
  ["HS8",   "Kempegowda Bus Station",       "Nelamanagala General Hospital"],
  ["HS9",   "Kempegowda Bus Station",       "Sapthagiri Medical College, Chikkabanawara"],
  ["HS10",  "Kempegowda Bus Station",       "Sakra Hospital, Devarabisanahlli"],
  ["HS11A", "Banashankari",                 "Banashankari"],
  ["HS12",  "Shanthinagara TTMC",           "Shanthinagara TTMC"],
  ["HS12A", "Shanthinagara TTMC",           "Shanthinagara TTMC"],
  ["KIA9",  "Kempegowda Bus Station",       "Kempegowda International Airport"],
];

// Build routes array
const routes = OFFICIAL_ROUTES.map(([no, from, to]) => ({
  route_id: `OFF_${no.replace(/\s/g,'_')}`,
  route_short_name: no,
  route_long_name: `${from} → ${to}`,
  route_type: 3,
  route_color: no.startsWith('HS') ? 'dc2626' : no.startsWith('KIA') ? '1d4ed8' : '0f766e',
}));

// Extract all unique stop names and create stop records
const stopNames = new Set();
OFFICIAL_ROUTES.forEach(([, from, to]) => { stopNames.add(from); stopNames.add(to); });

// Coordinate map for known stops
const COORDS = {
  "Kempegowda Bus Station":           [12.9767, 77.5713],
  "Shivajinagara Bus Station":        [12.9850, 77.6010],
  "KR Market":                        [12.9620, 77.5780],
  "Malleshwaram Bus Stand":           [13.0030, 77.5700],
  "Banashankari TTMC":                [12.9255, 77.5468],
  "Kengeri TTMC":                     [12.9140, 77.4820],
  "Hebbala":                          [13.0350, 77.5970],
  "Yelahanka":                        [13.1007, 77.5963],
  "Yeshawanthapura TTMC":             [13.0210, 77.5540],
  "Yeshawanthapura Railway Station":  [13.0230, 77.5520],
  "Bommanahalli":                     [12.9050, 77.6270],
  "Hampinagara":                      [12.9720, 77.5200],
  "Vidyaranyapura":                   [13.0600, 77.5500],
  "Shanthinagara":                    [12.9600, 77.5900],
  "Shanthinagara TTMC":               [12.9600, 77.5900],
  "S V Metro Station":                [12.9767, 77.5713],
  "Banashankari":                     [12.9255, 77.5468],
  "ESI Indiranagara Hospital":        [12.9784, 77.6408],
  "Srinagara":                        [12.9700, 77.5100],
  "Devanahalli":                      [13.2460, 77.7120],
  "Devanahalli Govt Hospital":        [13.2460, 77.7120],
  "Devanahalli General Hospital":     [13.2460, 77.7120],
  "Hosakote":                         [13.0700, 77.7980],
  "Hosakote General Hospital":        [13.0700, 77.7980],
  "Nelamangala":                      [13.0990, 77.3920],
  "Nelamanagala General Hospital":    [13.0990, 77.3920],
  "Anekal":                           [12.7100, 77.6960],
  "Attibele":                         [12.7700, 77.7600],
  "Sarjapura":                        [12.9010, 77.6700],
  "Kadugodi":                         [12.9800, 77.7600],
  "Whitefield":                       [12.9698, 77.7499],
  "Vaidehi Hospital, Whitefield":     [12.9698, 77.7499],
  "KR Puram":                         [13.0050, 77.6960],
  "Koramangala 1st Block":            [12.9352, 77.6245],
  "BTM Layout":                       [12.9166, 77.6101],
  "Central Silk Board":               [12.9172, 77.6228],
  "Uttarahalli":                      [12.8800, 77.5500],
  "Bidadi":                           [12.7980, 77.3900],
  "Jalahalli Cross":                  [13.0280, 77.5200],
  "Peenya 2nd Stage":                 [13.0260, 77.5220],
  "Doddaballapura":                   [13.2940, 77.5370],
  "Kempegowda International Airport": [13.1986, 77.7066],
  "Apollo Hospital Bannerughatta Road":[12.8900, 77.5900],
  "Rajarajeshwari Hospital":          [12.9280, 77.4820],
  "Sakra Hospital, Devarabisanahlli": [13.0050, 77.6960],
  "Sapthagiri Medical College, Chikkabanawara":[13.0500, 77.4800],
  "Ambedkar Medical College, K.G.Halli":[13.0050, 77.6960],
  "Supra Hospital, RBI LO, J.P Nagar":[12.9063, 77.5857],
  "Jeevan Bheemanagara":              [12.9784, 77.6408],
  "Channasandra":                     [12.9700, 77.7800],
  "Kalyanagara":                      [13.0050, 77.6500],
  "Tavarakere":                       [12.9010, 77.6700],
  "Hesaraghatta I D Farm":            [13.1300, 77.4800],
  "Hesarughatta":                     [13.1300, 77.4800],
  "Bagaluru":                         [13.1800, 77.6800],
  "Kannuru":                          [13.1000, 77.6000],
  "Ramakrishna Hegde Nagara":         [13.0600, 77.6300],
  "Razakpalya":                       [12.9910, 77.5530],
  "Vijayanagara TTMC":                [12.9720, 77.5200],
  "BCC Layout":                       [12.9850, 77.6010],
  "AGS Layout":                       [12.9767, 77.5713],
  "Sultanpalya":                      [13.0200, 77.5900],
  "Chandra Layout":                   [12.9710, 77.5100],
  "Anjanapura":                       [12.8700, 77.5700],
  "BEML Layout 5th Stage":            [12.9140, 77.4820],
  "Hullala Sattelite Town":           [12.9120, 77.4800],
  "Bengaluru University Administrative Block":[12.9710, 77.5100],
  "Chikkabanavara":                   [13.0500, 77.4800],
  "Rameshnagara":                     [12.7160, 77.2820],
  "Budigere":                         [13.0500, 77.7500],
  "Tharabanahalli":                   [13.0700, 77.7980],
  "Jigani APC Circle":                [12.7900, 77.6300],
  "Harohalli":                        [12.6500, 77.5500],
  "Shirke":                           [12.9600, 77.5900],
  "Dwarakanagara":                    [12.9140, 77.4820],
  "Kaval Byrasandra":                 [13.0050, 77.6200],
  "Shankarnagh Bus Stand":            [12.9255, 77.5468],
  "Jambu Savari Dinne":               [12.8700, 77.5700],
  "Yelahanka New Town 5th Phase":     [13.1007, 77.5963],
  "Marenahalli Bus Station":          [12.9050, 77.6270],
};

const stops = Array.from(stopNames).map((name, i) => {
  const coords = COORDS[name] || [12.9767 + (Math.random()-0.5)*0.1, 77.5713 + (Math.random()-0.5)*0.1];
  return {
    stop_id: `OS_${i+1}`,
    stop_name: name,
    stop_lat: coords[0],
    stop_lon: coords[1],
  };
});

// Build stop_routes mapping: each route maps to its from+to stops
const stopNameToId = {};
stops.forEach(s => { stopNameToId[s.stop_name] = s.stop_id; });

const stopRoutes = [];
OFFICIAL_ROUTES.forEach(([no, from, to]) => {
  const routeId = `OFF_${no.replace(/\s/g,'_')}`;
  const fromId = stopNameToId[from];
  const toId = stopNameToId[to];
  if (fromId) stopRoutes.push({ stop_id: fromId, route_id: routeId, role: 'origin' });
  if (toId)   stopRoutes.push({ stop_id: toId,   route_id: routeId, role: 'destination' });
});

async function run() {
  console.log(`\n📍 Upserting ${stops.length} stops...`);
  for (let i = 0; i < stops.length; i += 50) await upsert('bmtc_stops', stops.slice(i, i+50));

  console.log(`\n🛣  Upserting ${routes.length} routes...`);
  for (let i = 0; i < routes.length; i += 50) await upsert('bmtc_routes', routes.slice(i, i+50));

  console.log(`\n🔗 Upserting ${stopRoutes.length} stop-route mappings...`);
  for (let i = 0; i < stopRoutes.length; i += 100) await upsert('bmtc_stop_routes', stopRoutes.slice(i, i+100));

  console.log('\n🔄 Syncing unified layer...');
  await rpc('sync_unified_stops');
  await rpc('sync_unified_routes');

  const r = await fetch(BASE + 'bmtc_routes?select=count', { headers: H });
  const d = await r.json();
  console.log(`\n✅ Done! Total routes: ${d[0]?.count}`);
}

run();
