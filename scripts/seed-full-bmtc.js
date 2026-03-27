/**
 * Full BMTC Bangalore seed — all major stops and routes
 * Run: node seed-full-bmtc.js
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
  const res = await fetch(BASE + table, { method: 'POST', headers: H, body: JSON.stringify(rows) });
  const txt = await res.text();
  if (res.status >= 400) console.error(`❌ ${table}:`, txt.slice(0,120));
  else console.log(`✅ ${table}: ${rows.length} rows (${res.status})`);
}

async function rpc(fn) {
  const res = await fetch(BASE + 'rpc/' + fn, { method: 'POST', headers: { ...H, Prefer: '' }, body: '{}' });
  console.log(`🔄 ${fn}: ${res.status}`);
}

const ALL_STOPS = [
  // ── Central / Majestic area ──
  { stop_id:"S001", stop_name:"Majestic (Kempegowda Bus Stand)", stop_lat:12.9767, stop_lon:77.5713 },
  { stop_id:"S002", stop_name:"Shivajinagar Bus Stand", stop_lat:12.9850, stop_lon:77.6010 },
  { stop_id:"S003", stop_name:"City Railway Station", stop_lat:12.9774, stop_lon:77.5660 },
  { stop_id:"S004", stop_name:"Majestic Metro Station", stop_lat:12.9767, stop_lon:77.5713 },
  { stop_id:"S005", stop_name:"Chickpete", stop_lat:12.9680, stop_lon:77.5760 },
  { stop_id:"S006", stop_name:"KR Market", stop_lat:12.9620, stop_lon:77.5780 },
  { stop_id:"S007", stop_name:"Mysore Road Bus Stand", stop_lat:12.9490, stop_lon:77.5000 },
  // ── North Bangalore ──
  { stop_id:"S010", stop_name:"Hebbal Flyover", stop_lat:13.0350, stop_lon:77.5970 },
  { stop_id:"S011", stop_name:"Hebbal Lake", stop_lat:13.0370, stop_lon:77.5950 },
  { stop_id:"S012", stop_name:"Yelahanka New Town", stop_lat:13.1007, stop_lon:77.5963 },
  { stop_id:"S013", stop_name:"Yelahanka Old Town", stop_lat:13.0990, stop_lon:77.5940 },
  { stop_id:"S014", stop_name:"Yelahanka Satellite Town", stop_lat:13.1020, stop_lon:77.5980 },
  { stop_id:"S015", stop_name:"Doddaballapur Road", stop_lat:13.1500, stop_lon:77.6200 },
  { stop_id:"S016", stop_name:"Bagalur Cross", stop_lat:13.1800, stop_lon:77.6800 },
  { stop_id:"S017", stop_name:"Kempegowda International Airport", stop_lat:13.1986, stop_lon:77.7066 },
  { stop_id:"S018", stop_name:"Devanahalli Bus Stand", stop_lat:13.2460, stop_lon:77.7120 },
  { stop_id:"S019", stop_name:"Devanahalli Town", stop_lat:13.2480, stop_lon:77.7100 },
  { stop_id:"S020", stop_name:"Nandi Hills Road", stop_lat:13.3700, stop_lon:77.6830 },
  { stop_id:"S021", stop_name:"Chikkaballapur Road", stop_lat:13.2000, stop_lon:77.7200 },
  { stop_id:"S022", stop_name:"Thanisandra Main Road", stop_lat:13.0600, stop_lon:77.6300 },
  { stop_id:"S023", stop_name:"Kogilu Cross", stop_lat:13.0700, stop_lon:77.6100 },
  { stop_id:"S024", stop_name:"Jakkur Layout", stop_lat:13.0800, stop_lon:77.6200 },
  { stop_id:"S025", stop_name:"Bellary Road", stop_lat:13.0500, stop_lon:77.6000 },
  // ── South Bangalore ──
  { stop_id:"S030", stop_name:"Jayanagar 4th Block", stop_lat:12.9250, stop_lon:77.5938 },
  { stop_id:"S031", stop_name:"Jayanagar Shopping Complex", stop_lat:12.9270, stop_lon:77.5920 },
  { stop_id:"S032", stop_name:"JP Nagar 6th Phase", stop_lat:12.9063, stop_lon:77.5857 },
  { stop_id:"S033", stop_name:"JP Nagar 7th Phase", stop_lat:12.9010, stop_lon:77.5840 },
  { stop_id:"S034", stop_name:"Banashankari Bus Stand", stop_lat:12.9255, stop_lon:77.5468 },
  { stop_id:"S035", stop_name:"Banashankari Temple", stop_lat:12.9240, stop_lon:77.5480 },
  { stop_id:"S036", stop_name:"Banashankari 2nd Stage", stop_lat:12.9300, stop_lon:77.5500 },
  { stop_id:"S037", stop_name:"Banashankari 3rd Stage", stop_lat:12.9200, stop_lon:77.5450 },
  { stop_id:"S038", stop_name:"Kanakapura Road", stop_lat:12.8900, stop_lon:77.5700 },
  { stop_id:"S039", stop_name:"Uttarahalli", stop_lat:12.8800, stop_lon:77.5500 },
  { stop_id:"S040", stop_name:"Subramanyapura", stop_lat:12.8950, stop_lon:77.5300 },
  { stop_id:"S041", stop_name:"Anekal Town", stop_lat:12.7100, stop_lon:77.6960 },
  { stop_id:"S042", stop_name:"Electronic City Phase 1", stop_lat:12.8399, stop_lon:77.6770 },
  { stop_id:"S043", stop_name:"Electronic City Phase 2", stop_lat:12.8340, stop_lon:77.6760 },
  { stop_id:"S044", stop_name:"Hosur Road", stop_lat:12.8700, stop_lon:77.6600 },
  { stop_id:"S045", stop_name:"Bommanahalli", stop_lat:12.9050, stop_lon:77.6270 },
  { stop_id:"S046", stop_name:"Silk Board Junction", stop_lat:12.9172, stop_lon:77.6228 },
  { stop_id:"S047", stop_name:"BTM Layout 1st Stage", stop_lat:12.9166, stop_lon:77.6101 },
  { stop_id:"S048", stop_name:"BTM Layout 2nd Stage", stop_lat:12.9120, stop_lon:77.6110 },
  { stop_id:"S049", stop_name:"Hulimavu", stop_lat:12.8800, stop_lon:77.6100 },
  { stop_id:"S050", stop_name:"Begur Road", stop_lat:12.8700, stop_lon:77.6200 },
  // ── East Bangalore ──
  { stop_id:"S060", stop_name:"Indiranagar 100 Feet Road", stop_lat:12.9784, stop_lon:77.6408 },
  { stop_id:"S061", stop_name:"Indiranagar CMH Road", stop_lat:12.9760, stop_lon:77.6390 },
  { stop_id:"S062", stop_name:"Domlur Layout", stop_lat:12.9610, stop_lon:77.6390 },
  { stop_id:"S063", stop_name:"Domlur Flyover", stop_lat:12.9620, stop_lon:77.6370 },
  { stop_id:"S064", stop_name:"Marathahalli Bridge", stop_lat:12.9591, stop_lon:77.7009 },
  { stop_id:"S065", stop_name:"Marathahalli Colony", stop_lat:12.9560, stop_lon:77.7020 },
  { stop_id:"S066", stop_name:"Whitefield Main Road", stop_lat:12.9698, stop_lon:77.7499 },
  { stop_id:"S067", stop_name:"Whitefield ITPL Gate", stop_lat:12.9716, stop_lon:77.7412 },
  { stop_id:"S068", stop_name:"Whitefield Railway Station", stop_lat:12.9698, stop_lon:77.7499 },
  { stop_id:"S069", stop_name:"Hoskote Bus Stand", stop_lat:13.0700, stop_lon:77.7980 },
  { stop_id:"S070", stop_name:"Hoskote Town", stop_lat:13.0720, stop_lon:77.7960 },
  { stop_id:"S071", stop_name:"KR Puram Bus Stand", stop_lat:13.0050, stop_lon:77.6960 },
  { stop_id:"S072", stop_name:"KR Puram Railway Station", stop_lat:13.0070, stop_lon:77.6940 },
  { stop_id:"S073", stop_name:"Tin Factory", stop_lat:12.9940, stop_lon:77.6600 },
  { stop_id:"S074", stop_name:"Old Madras Road", stop_lat:12.9920, stop_lon:77.6580 },
  { stop_id:"S075", stop_name:"Varthur Road", stop_lat:12.9380, stop_lon:77.7100 },
  { stop_id:"S076", stop_name:"Sarjapur Road", stop_lat:12.9010, stop_lon:77.6700 },
  { stop_id:"S077", stop_name:"Bellandur Gate", stop_lat:12.9260, stop_lon:77.6780 },
  { stop_id:"S078", stop_name:"Outer Ring Road Bellandur", stop_lat:12.9300, stop_lon:77.6800 },
  { stop_id:"S079", stop_name:"Kadubeesanahalli", stop_lat:12.9450, stop_lon:77.7000 },
  { stop_id:"S080", stop_name:"Panathur Road", stop_lat:12.9500, stop_lon:77.7100 },
  // ── West Bangalore ──
  { stop_id:"S090", stop_name:"Rajajinagar 1st Block", stop_lat:12.9910, stop_lon:77.5530 },
  { stop_id:"S091", stop_name:"Rajajinagar 4th Block", stop_lat:12.9880, stop_lon:77.5510 },
  { stop_id:"S092", stop_name:"Malleshwaram 8th Cross", stop_lat:13.0030, stop_lon:77.5700 },
  { stop_id:"S093", stop_name:"Malleshwaram Circle", stop_lat:13.0050, stop_lon:77.5680 },
  { stop_id:"S094", stop_name:"Yeshwanthpur Circle", stop_lat:13.0210, stop_lon:77.5540 },
  { stop_id:"S095", stop_name:"Yeshwanthpur Bus Stand", stop_lat:13.0230, stop_lon:77.5520 },
  { stop_id:"S096", stop_name:"Nagarbhavi Circle", stop_lat:12.9710, stop_lon:77.5100 },
  { stop_id:"S097", stop_name:"Vijayanagar 4th Stage", stop_lat:12.9720, stop_lon:77.5200 },
  { stop_id:"S098", stop_name:"Kengeri Bus Stand", stop_lat:12.9140, stop_lon:77.4820 },
  { stop_id:"S099", stop_name:"Kengeri Satellite Town", stop_lat:12.9120, stop_lon:77.4800 },
  { stop_id:"S100", stop_name:"Nelamangala Bus Stand", stop_lat:13.0990, stop_lon:77.3920 },
  { stop_id:"S101", stop_name:"Tumkur Road Nelamangala", stop_lat:13.0950, stop_lon:77.3900 },
  { stop_id:"S102", stop_name:"Peenya Industrial Area", stop_lat:13.0280, stop_lon:77.5200 },
  { stop_id:"S103", stop_name:"Peenya Bus Stand", stop_lat:13.0260, stop_lon:77.5220 },
  { stop_id:"S104", stop_name:"Bidadi Industrial Area", stop_lat:12.7980, stop_lon:77.3900 },
  { stop_id:"S105", stop_name:"Ramanagara Bus Stand", stop_lat:12.7160, stop_lon:77.2820 },
  // ── Outer Ring Road ──
  { stop_id:"S110", stop_name:"Outer Ring Road Hebbal", stop_lat:13.0400, stop_lon:77.6100 },
  { stop_id:"S111", stop_name:"Outer Ring Road Marathahalli", stop_lat:12.9591, stop_lon:77.7009 },
  { stop_id:"S112", stop_name:"Outer Ring Road Silk Board", stop_lat:12.9172, stop_lon:77.6228 },
  { stop_id:"S113", stop_name:"Outer Ring Road Bannerghatta", stop_lat:12.8900, stop_lon:77.5900 },
  { stop_id:"S114", stop_name:"Outer Ring Road Nagawara", stop_lat:13.0450, stop_lon:77.6350 },
  // ── HSR / Koramangala ──
  { stop_id:"S120", stop_name:"Koramangala 1st Block", stop_lat:12.9352, stop_lon:77.6245 },
  { stop_id:"S121", stop_name:"Koramangala 4th Block", stop_lat:12.9340, stop_lon:77.6270 },
  { stop_id:"S122", stop_name:"Koramangala 6th Block", stop_lat:12.9310, stop_lon:77.6290 },
  { stop_id:"S123", stop_name:"Koramangala 8th Block", stop_lat:12.9280, stop_lon:77.6310 },
  { stop_id:"S124", stop_name:"HSR Layout Sector 1", stop_lat:12.9116, stop_lon:77.6389 },
  { stop_id:"S125", stop_name:"HSR Layout BDA Complex", stop_lat:12.9100, stop_lon:77.6400 },
  { stop_id:"S126", stop_name:"HSR Layout 27th Main", stop_lat:12.9080, stop_lon:77.6420 },
  // ── Frazer Town / Cox Town ──
  { stop_id:"S130", stop_name:"Frazer Town", stop_lat:12.9870, stop_lon:77.6180 },
  { stop_id:"S131", stop_name:"Cox Town", stop_lat:12.9890, stop_lon:77.6200 },
  { stop_id:"S132", stop_name:"Benson Town", stop_lat:13.0000, stop_lon:77.6100 },
  { stop_id:"S133", stop_name:"Lingarajapuram", stop_lat:13.0050, stop_lon:77.6200 },
  // ── Bannerghatta Road ──
  { stop_id:"S140", stop_name:"Bannerghatta Road", stop_lat:12.8900, stop_lon:77.5900 },
  { stop_id:"S141", stop_name:"Bannerghatta National Park Gate", stop_lat:12.8000, stop_lon:77.5760 },
  { stop_id:"S142", stop_name:"Gottigere", stop_lat:12.8700, stop_lon:77.5900 },
  { stop_id:"S143", stop_name:"Arekere Gate", stop_lat:12.8800, stop_lon:77.6000 },
  // ── Whitefield Extended ──
  { stop_id:"S150", stop_name:"Kadugodi Bus Stand", stop_lat:12.9800, stop_lon:77.7600 },
  { stop_id:"S151", stop_name:"Nallurhalli", stop_lat:12.9750, stop_lon:77.7700 },
  { stop_id:"S152", stop_name:"Channasandra", stop_lat:12.9700, stop_lon:77.7800 },
  { stop_id:"S153", stop_name:"Hoodi Circle", stop_lat:12.9850, stop_lon:77.7200 },
  { stop_id:"S154", stop_name:"Mahadevapura", stop_lat:12.9900, stop_lon:77.7100 },
  // ── Mysore Road ──
  { stop_id:"S160", stop_name:"Mysore Road NICE Junction", stop_lat:12.9300, stop_lon:77.4700 },
  { stop_id:"S161", stop_name:"Kengeri Metro Station", stop_lat:12.9140, stop_lon:77.4820 },
  { stop_id:"S162", stop_name:"Bidadi Town", stop_lat:12.7980, stop_lon:77.3900 },
  { stop_id:"S163", stop_name:"Channapatna Bus Stand", stop_lat:12.6510, stop_lon:77.2080 },
  { stop_id:"S164", stop_name:"Maddur Bus Stand", stop_lat:12.5830, stop_lon:77.0430 },
  { stop_id:"S165", stop_name:"Mandya Bus Stand", stop_lat:12.5220, stop_lon:76.8950 },
  { stop_id:"S166", stop_name:"Mysuru Bus Stand", stop_lat:12.3052, stop_lon:76.6552 },
];

const ALL_ROUTES = [
  // ── 100 series — Central/West ──
  { route_id:"R100",  route_short_name:"100",   route_long_name:"Majestic → Rajajinagar → Yeshwanthpur", route_type:3, route_color:"0f766e" },
  { route_id:"R100A", route_short_name:"100A",  route_long_name:"Majestic → Malleshwaram → Yeshwanthpur", route_type:3, route_color:"0f766e" },
  { route_id:"R101",  route_short_name:"101",   route_long_name:"Majestic → Peenya Industrial Area", route_type:3, route_color:"0f766e" },
  { route_id:"R102",  route_short_name:"102",   route_long_name:"Shivajinagar → Peenya Bus Stand", route_type:3, route_color:"0f766e" },
  { route_id:"R110",  route_short_name:"110",   route_long_name:"Majestic → Nagarbhavi → Kengeri", route_type:3, route_color:"0f766e" },
  { route_id:"R110A", route_short_name:"110A",  route_long_name:"Majestic → Vijayanagar → Kengeri", route_type:3, route_color:"0f766e" },
  { route_id:"R111",  route_short_name:"111",   route_long_name:"Majestic → Mysore Road → Kengeri", route_type:3, route_color:"0f766e" },
  // ── 150 series — Rajajinagar ──
  { route_id:"R150",  route_short_name:"150",   route_long_name:"Majestic → Rajajinagar 1st Block", route_type:3, route_color:"0f766e" },
  { route_id:"R150A", route_short_name:"150A",  route_long_name:"Shivajinagar → Rajajinagar 4th Block", route_type:3, route_color:"0f766e" },
  { route_id:"R151",  route_short_name:"151",   route_long_name:"Majestic → Rajajinagar → Yeshwanthpur Circle", route_type:3, route_color:"0f766e" },
  // ── 200 series — Electronic City ──
  { route_id:"R201",  route_short_name:"201",   route_long_name:"Majestic → Silk Board → Electronic City Phase 1", route_type:3, route_color:"0f766e" },
  { route_id:"R201A", route_short_name:"201A",  route_long_name:"Shivajinagar → Electronic City Phase 2", route_type:3, route_color:"0f766e" },
  { route_id:"R201B", route_short_name:"201B",  route_long_name:"Majestic → BTM Layout → Electronic City", route_type:3, route_color:"0f766e" },
  { route_id:"R210",  route_short_name:"210",   route_long_name:"Majestic → Hosur Road → Anekal", route_type:3, route_color:"0f766e" },
  { route_id:"R210A", route_short_name:"210A",  route_long_name:"Shivajinagar → Hosur Road → Anekal", route_type:3, route_color:"0f766e" },
  // ── 216 series — Hoskote ──
  { route_id:"R216",  route_short_name:"216",   route_long_name:"Majestic → KR Puram → Hoskote Bus Stand", route_type:3, route_color:"0f766e" },
  { route_id:"R216A", route_short_name:"216A",  route_long_name:"Shivajinagar → Old Madras Road → Hoskote", route_type:3, route_color:"0f766e" },
  { route_id:"R216B", route_short_name:"216B",  route_long_name:"Majestic → Tin Factory → Hoskote Town", route_type:3, route_color:"0f766e" },
  // ── 225 series — Devanahalli / Airport ──
  { route_id:"R225",  route_short_name:"225",   route_long_name:"Majestic → Hebbal → Devanahalli Bus Stand", route_type:3, route_color:"0f766e" },
  { route_id:"R225A", route_short_name:"225A",  route_long_name:"Shivajinagar → Yelahanka → Devanahalli", route_type:3, route_color:"0f766e" },
  { route_id:"R225B", route_short_name:"225B",  route_long_name:"Majestic → Bellary Road → Bagalur Cross", route_type:3, route_color:"0f766e" },
  { route_id:"R225C", route_short_name:"225C",  route_long_name:"Majestic → Hebbal → Chikkaballapur Road", route_type:3, route_color:"0f766e" },
  // ── 250 series — Malleshwaram ──
  { route_id:"R250",  route_short_name:"250",   route_long_name:"Majestic → Malleshwaram 8th Cross", route_type:3, route_color:"0f766e" },
  { route_id:"R250A", route_short_name:"250A",  route_long_name:"Majestic → Malleshwaram → Yeshwanthpur", route_type:3, route_color:"0f766e" },
  { route_id:"R251",  route_short_name:"251",   route_long_name:"Shivajinagar → Malleshwaram Circle", route_type:3, route_color:"0f766e" },
  // ── 300 series — Indiranagar / Domlur ──
  { route_id:"R300",  route_short_name:"300",   route_long_name:"Majestic → Indiranagar 100 Feet Road", route_type:3, route_color:"0f766e" },
  { route_id:"R300A", route_short_name:"300A",  route_long_name:"Majestic → Domlur Layout", route_type:3, route_color:"0f766e" },
  { route_id:"R300B", route_short_name:"300B",  route_long_name:"Shivajinagar → Indiranagar CMH Road", route_type:3, route_color:"0f766e" },
  { route_id:"R301",  route_short_name:"301",   route_long_name:"Majestic → Frazer Town → Indiranagar", route_type:3, route_color:"0f766e" },
  // ── 335 series — Koramangala ──
  { route_id:"R335",  route_short_name:"335",   route_long_name:"Majestic → Koramangala 1st Block", route_type:3, route_color:"0f766e" },
  { route_id:"R335E", route_short_name:"335E",  route_long_name:"Majestic → Koramangala 6th Block", route_type:3, route_color:"0f766e" },
  { route_id:"R335F", route_short_name:"335F",  route_long_name:"Shivajinagar → Koramangala 8th Block", route_type:3, route_color:"0f766e" },
  { route_id:"R336",  route_short_name:"336",   route_long_name:"Majestic → BTM Layout → Koramangala", route_type:3, route_color:"0f766e" },
  // ── 356 series — BTM / HSR ──
  { route_id:"R356",  route_short_name:"356",   route_long_name:"Shivajinagar → BTM Layout 2nd Stage", route_type:3, route_color:"0f766e" },
  { route_id:"R356A", route_short_name:"356A",  route_long_name:"Majestic → HSR Layout Sector 1", route_type:3, route_color:"0f766e" },
  { route_id:"R356B", route_short_name:"356B",  route_long_name:"Shivajinagar → HSR Layout BDA Complex", route_type:3, route_color:"0f766e" },
  // ── 401 series — Banashankari / JP Nagar ──
  { route_id:"R401",  route_short_name:"401",   route_long_name:"Majestic → Banashankari Bus Stand", route_type:3, route_color:"0f766e" },
  { route_id:"R401A", route_short_name:"401A",  route_long_name:"Majestic → Banashankari 3rd Stage", route_type:3, route_color:"0f766e" },
  { route_id:"R401G", route_short_name:"401G",  route_long_name:"Majestic → JP Nagar 7th Phase", route_type:3, route_color:"0f766e" },
  { route_id:"R401H", route_short_name:"401H",  route_long_name:"Shivajinagar → JP Nagar 6th Phase", route_type:3, route_color:"0f766e" },
  { route_id:"R402",  route_short_name:"402",   route_long_name:"Majestic → Jayanagar 4th Block", route_type:3, route_color:"0f766e" },
  { route_id:"R402A", route_short_name:"402A",  route_long_name:"Majestic → Jayanagar Shopping Complex", route_type:3, route_color:"0f766e" },
  // ── 500 series — Whitefield / Marathahalli ──
  { route_id:"R500",  route_short_name:"500",   route_long_name:"Majestic → Marathahalli → Whitefield", route_type:3, route_color:"0f766e" },
  { route_id:"R500C", route_short_name:"500C",  route_long_name:"Majestic → Marathahalli Bridge → Whitefield ITPL", route_type:3, route_color:"0f766e" },
  { route_id:"R500D", route_short_name:"500D",  route_long_name:"Majestic → Indiranagar → Whitefield", route_type:3, route_color:"0f766e" },
  { route_id:"R500K", route_short_name:"500K",  route_long_name:"Shivajinagar → Marathahalli Colony → Whitefield", route_type:3, route_color:"0f766e" },
  { route_id:"R501",  route_short_name:"501",   route_long_name:"Majestic → KR Puram → Whitefield Railway Station", route_type:3, route_color:"0f766e" },
  { route_id:"R502",  route_short_name:"502",   route_long_name:"Majestic → Hoodi Circle → Kadugodi", route_type:3, route_color:"0f766e" },
  // ── 600 series — Yelahanka / North ──
  { route_id:"R600",  route_short_name:"600",   route_long_name:"Majestic → Hebbal → Yelahanka New Town", route_type:3, route_color:"0f766e" },
  { route_id:"R600C", route_short_name:"600C",  route_long_name:"Majestic → Yelahanka Old Town", route_type:3, route_color:"0f766e" },
  { route_id:"R600D", route_short_name:"600D",  route_long_name:"Shivajinagar → Hebbal Flyover", route_type:3, route_color:"0f766e" },
  { route_id:"R600E", route_short_name:"600E",  route_long_name:"Majestic → Yelahanka → Airport Road", route_type:3, route_color:"0f766e" },
  { route_id:"R601",  route_short_name:"601",   route_long_name:"Majestic → Thanisandra → Jakkur", route_type:3, route_color:"0f766e" },
  { route_id:"R602",  route_short_name:"602",   route_long_name:"Shivajinagar → Kogilu Cross → Yelahanka", route_type:3, route_color:"0f766e" },
  // ── 700 series — Kengeri / Mysore Road ──
  { route_id:"R700",  route_short_name:"700",   route_long_name:"Majestic → Mysore Road → Kengeri Bus Stand", route_type:3, route_color:"0f766e" },
  { route_id:"R700C", route_short_name:"700C",  route_long_name:"Majestic → Nagarbhavi Circle", route_type:3, route_color:"0f766e" },
  { route_id:"R700D", route_short_name:"700D",  route_long_name:"Majestic → Vijayanagar → Kengeri Satellite Town", route_type:3, route_color:"0f766e" },
  { route_id:"R701",  route_short_name:"701",   route_long_name:"Majestic → Mysore Road → Bidadi", route_type:3, route_color:"0f766e" },
  { route_id:"R702",  route_short_name:"702",   route_long_name:"Majestic → Mysore Road → Ramanagara", route_type:3, route_color:"0f766e" },
  { route_id:"R703",  route_short_name:"703",   route_long_name:"Majestic → Channapatna → Maddur", route_type:3, route_color:"0f766e" },
  { route_id:"R704",  route_short_name:"704",   route_long_name:"Majestic → Mandya Bus Stand", route_type:3, route_color:"0f766e" },
  // ── 800 series — Nelamangala / Tumkur Road ──
  { route_id:"R800",  route_short_name:"800",   route_long_name:"Majestic → Tumkur Road → Nelamangala", route_type:3, route_color:"0f766e" },
  { route_id:"R800A", route_short_name:"800A",  route_long_name:"Shivajinagar → Peenya → Nelamangala", route_type:3, route_color:"0f766e" },
  { route_id:"R801",  route_short_name:"801",   route_long_name:"Majestic → Yeshwanthpur → Nelamangala", route_type:3, route_color:"0f766e" },
  // ── 900 series — Sarjapur / Anekal ──
  { route_id:"R900",  route_short_name:"900",   route_long_name:"Majestic → Silk Board → Anekal Town", route_type:3, route_color:"0f766e" },
  { route_id:"R900A", route_short_name:"900A",  route_long_name:"Shivajinagar → Sarjapur Road → Anekal", route_type:3, route_color:"0f766e" },
  { route_id:"R901",  route_short_name:"901",   route_long_name:"Majestic → Bommanahalli → Sarjapur Road", route_type:3, route_color:"0f766e" },
  // ── Vajra (Volvo AC) ──
  { route_id:"VAJRA1", route_short_name:"Vajra 1",  route_long_name:"Airport → Majestic (Volvo AC)", route_type:3, route_color:"1d4ed8" },
  { route_id:"VAJRA2", route_short_name:"Vajra 2",  route_long_name:"Airport → Shivajinagar (Volvo AC)", route_type:3, route_color:"1d4ed8" },
  { route_id:"VAJRA3", route_short_name:"Vajra 3",  route_long_name:"Airport → Majestic via Hebbal (AC)", route_type:3, route_color:"1d4ed8" },
  { route_id:"VAJRA4", route_short_name:"Vajra 4",  route_long_name:"Airport → Koramangala (AC)", route_type:3, route_color:"1d4ed8" },
  { route_id:"VAJRA5", route_short_name:"Vajra 5",  route_long_name:"Airport → Electronic City (AC)", route_type:3, route_color:"1d4ed8" },
  { route_id:"VAJRA6", route_short_name:"Vajra 6",  route_long_name:"Airport → Whitefield (AC)", route_type:3, route_color:"1d4ed8" },
  { route_id:"VAJRA7", route_short_name:"Vajra 7",  route_long_name:"Airport → Marathahalli (AC)", route_type:3, route_color:"1d4ed8" },
  // ── Big10 (High frequency) ──
  { route_id:"BIG10A", route_short_name:"Big10 A", route_long_name:"Majestic → Silk Board → Electronic City (Big10)", route_type:3, route_color:"dc2626" },
  { route_id:"BIG10B", route_short_name:"Big10 B", route_long_name:"Majestic → Marathahalli → Whitefield (Big10)", route_type:3, route_color:"dc2626" },
  { route_id:"BIG10C", route_short_name:"Big10 C", route_long_name:"Majestic → Hebbal → Yelahanka (Big10)", route_type:3, route_color:"dc2626" },
  { route_id:"BIG10D", route_short_name:"Big10 D", route_long_name:"Majestic → Banashankari → JP Nagar (Big10)", route_type:3, route_color:"dc2626" },
  // ── Bannerghatta Road ──
  { route_id:"R450",  route_short_name:"450",   route_long_name:"Majestic → Bannerghatta Road → Gottigere", route_type:3, route_color:"0f766e" },
  { route_id:"R450A", route_short_name:"450A",  route_long_name:"Shivajinagar → Bannerghatta National Park", route_type:3, route_color:"0f766e" },
  { route_id:"R451",  route_short_name:"451",   route_long_name:"Majestic → Arekere Gate → Hulimavu", route_type:3, route_color:"0f766e" },
];

async function run() {
  console.log(`\n🚌 Seeding ${ALL_STOPS.length} BMTC stops...`);
  // Batch in chunks of 50
  for (let i = 0; i < ALL_STOPS.length; i += 50) {
    await upsert('bmtc_stops', ALL_STOPS.slice(i, i + 50));
  }

  console.log(`\n🛣  Seeding ${ALL_ROUTES.length} BMTC routes...`);
  for (let i = 0; i < ALL_ROUTES.length; i += 50) {
    await upsert('bmtc_routes', ALL_ROUTES.slice(i, i + 50));
  }

  console.log('\n🔄 Syncing unified layer...');
  await rpc('sync_unified_stops');
  await rpc('sync_unified_routes');

  // Final count
  const r = await fetch(BASE + 'bmtc_stops?select=count', { headers: H });
  const d = await r.json();
  console.log(`\n✅ Done! bmtc_stops: ${d[0]?.count}, bmtc_routes: ${ALL_ROUTES.length}`);
}

run();
