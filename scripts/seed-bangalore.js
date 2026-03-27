/**
 * Seed Bangalore transport data directly into Supabase
 * No GTFS files needed — uses curated real data
 * 
 * Usage: node seed-bangalore.js
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── BMTC Bus Stops (real Bangalore stops) ─────────────────────
const BMTC_STOPS = [
  { stop_id: "BLR001", stop_name: "Majestic (Kempegowda Bus Stand)", stop_lat: 12.9767, stop_lon: 77.5713 },
  { stop_id: "BLR002", stop_name: "Shivajinagar Bus Stand", stop_lat: 12.9850, stop_lon: 77.6010 },
  { stop_id: "BLR003", stop_name: "Koramangala 1st Block", stop_lat: 12.9352, stop_lon: 77.6245 },
  { stop_id: "BLR004", stop_name: "Koramangala 4th Block", stop_lat: 12.9340, stop_lon: 77.6270 },
  { stop_id: "BLR005", stop_name: "Koramangala 6th Block", stop_lat: 12.9310, stop_lon: 77.6290 },
  { stop_id: "BLR006", stop_name: "Whitefield Main Road", stop_lat: 12.9698, stop_lon: 77.7499 },
  { stop_id: "BLR007", stop_name: "Whitefield ITPL Gate", stop_lat: 12.9716, stop_lon: 77.7412 },
  { stop_id: "BLR008", stop_name: "Electronic City Phase 1", stop_lat: 12.8399, stop_lon: 77.6770 },
  { stop_id: "BLR009", stop_name: "Electronic City Phase 2", stop_lat: 12.8340, stop_lon: 77.6760 },
  { stop_id: "BLR010", stop_name: "Marathahalli Bridge", stop_lat: 12.9591, stop_lon: 77.7009 },
  { stop_id: "BLR011", stop_name: "Marathahalli Colony", stop_lat: 12.9560, stop_lon: 77.7020 },
  { stop_id: "BLR012", stop_name: "Indiranagar 100 Feet Road", stop_lat: 12.9784, stop_lon: 77.6408 },
  { stop_id: "BLR013", stop_name: "Indiranagar CMH Road", stop_lat: 12.9760, stop_lon: 77.6390 },
  { stop_id: "BLR014", stop_name: "Jayanagar 4th Block", stop_lat: 12.9250, stop_lon: 77.5938 },
  { stop_id: "BLR015", stop_name: "Jayanagar Shopping Complex", stop_lat: 12.9270, stop_lon: 77.5920 },
  { stop_id: "BLR016", stop_name: "JP Nagar 6th Phase", stop_lat: 12.9063, stop_lon: 77.5857 },
  { stop_id: "BLR017", stop_name: "JP Nagar 7th Phase", stop_lat: 12.9010, stop_lon: 77.5840 },
  { stop_id: "BLR018", stop_name: "Banashankari Bus Stand", stop_lat: 12.9255, stop_lon: 77.5468 },
  { stop_id: "BLR019", stop_name: "Banashankari Temple", stop_lat: 12.9240, stop_lon: 77.5480 },
  { stop_id: "BLR020", stop_name: "BTM Layout 1st Stage", stop_lat: 12.9166, stop_lon: 77.6101 },
  { stop_id: "BLR021", stop_name: "BTM Layout 2nd Stage", stop_lat: 12.9120, stop_lon: 77.6110 },
  { stop_id: "BLR022", stop_name: "HSR Layout Sector 1", stop_lat: 12.9116, stop_lon: 77.6389 },
  { stop_id: "BLR023", stop_name: "HSR Layout BDA Complex", stop_lat: 12.9100, stop_lon: 77.6400 },
  { stop_id: "BLR024", stop_name: "Hebbal Flyover", stop_lat: 13.0350, stop_lon: 77.5970 },
  { stop_id: "BLR025", stop_name: "Hebbal Lake", stop_lat: 13.0370, stop_lon: 77.5950 },
  { stop_id: "BLR026", stop_name: "Yeshwanthpur Circle", stop_lat: 13.0210, stop_lon: 77.5540 },
  { stop_id: "BLR027", stop_name: "Yeshwanthpur Bus Stand", stop_lat: 13.0230, stop_lon: 77.5520 },
  { stop_id: "BLR028", stop_name: "Rajajinagar 1st Block", stop_lat: 12.9910, stop_lon: 77.5530 },
  { stop_id: "BLR029", stop_name: "Rajajinagar 4th Block", stop_lat: 12.9880, stop_lon: 77.5510 },
  { stop_id: "BLR030", stop_name: "Malleshwaram 8th Cross", stop_lat: 13.0030, stop_lon: 77.5700 },
  { stop_id: "BLR031", stop_name: "Malleshwaram Circle", stop_lat: 13.0050, stop_lon: 77.5680 },
  { stop_id: "BLR032", stop_name: "Yelahanka New Town", stop_lat: 13.1007, stop_lon: 77.5963 },
  { stop_id: "BLR033", stop_name: "Yelahanka Old Town", stop_lat: 13.0990, stop_lon: 77.5940 },
  { stop_id: "BLR034", stop_name: "Nagarbhavi Circle", stop_lat: 12.9710, stop_lon: 77.5100 },
  { stop_id: "BLR035", stop_name: "Vijayanagar 4th Stage", stop_lat: 12.9720, stop_lon: 77.5200 },
  { stop_id: "BLR036", stop_name: "Kengeri Bus Stand", stop_lat: 12.9140, stop_lon: 77.4820 },
  { stop_id: "BLR037", stop_name: "Kengeri Satellite Town", stop_lat: 12.9120, stop_lon: 77.4800 },
  { stop_id: "BLR038", stop_name: "Domlur Layout", stop_lat: 12.9610, stop_lon: 77.6390 },
  { stop_id: "BLR039", stop_name: "Domlur Flyover", stop_lat: 12.9620, stop_lon: 77.6370 },
  { stop_id: "BLR040", stop_name: "Silk Board Junction", stop_lat: 12.9172, stop_lon: 77.6228 },
  { stop_id: "BLR041", stop_name: "Bommanahalli", stop_lat: 12.9050, stop_lon: 77.6270 },
  { stop_id: "BLR042", stop_name: "Sarjapur Road", stop_lat: 12.9010, stop_lon: 77.6700 },
  { stop_id: "BLR043", stop_name: "Bellandur Gate", stop_lat: 12.9260, stop_lon: 77.6780 },
  { stop_id: "BLR044", stop_name: "Varthur Road", stop_lat: 12.9380, stop_lon: 77.7100 },
  { stop_id: "BLR045", stop_name: "KR Puram Bus Stand", stop_lat: 13.0050, stop_lon: 77.6960 },
  { stop_id: "BLR046", stop_name: "KR Puram Railway Station", stop_lat: 13.0070, stop_lon: 77.6940 },
  { stop_id: "BLR047", stop_name: "Tin Factory", stop_lat: 12.9940, stop_lon: 77.6600 },
  { stop_id: "BLR048", stop_name: "Old Madras Road", stop_lat: 12.9920, stop_lon: 77.6580 },
  { stop_id: "BLR049", stop_name: "Frazer Town", stop_lat: 12.9870, stop_lon: 77.6180 },
  { stop_id: "BLR050", stop_name: "Cox Town", stop_lat: 12.9890, stop_lon: 77.6200 },
];

// ── BMTC Routes (real route numbers) ─────────────────────────
const BMTC_ROUTES = [
  { route_id: "R500C", route_short_name: "500C", route_long_name: "Majestic → Whitefield via Marathahalli", route_type: 3, route_color: "0f766e" },
  { route_id: "R500D", route_short_name: "500D", route_long_name: "Majestic → Whitefield via Indiranagar", route_type: 3, route_color: "0f766e" },
  { route_id: "R201",  route_short_name: "201",  route_long_name: "Majestic → Electronic City", route_type: 3, route_color: "0f766e" },
  { route_id: "R201A", route_short_name: "201A", route_long_name: "Shivajinagar → Electronic City Phase 2", route_type: 3, route_color: "0f766e" },
  { route_id: "R335E", route_short_name: "335E", route_long_name: "Majestic → Koramangala 6th Block", route_type: 3, route_color: "0f766e" },
  { route_id: "R356",  route_short_name: "356",  route_long_name: "Shivajinagar → BTM Layout", route_type: 3, route_color: "0f766e" },
  { route_id: "R401",  route_short_name: "401",  route_long_name: "Majestic → Banashankari", route_type: 3, route_color: "0f766e" },
  { route_id: "R401G", route_short_name: "401G", route_long_name: "Majestic → JP Nagar 7th Phase", route_type: 3, route_color: "0f766e" },
  { route_id: "R600C", route_short_name: "600C", route_long_name: "Majestic → Yelahanka", route_type: 3, route_color: "0f766e" },
  { route_id: "R600D", route_short_name: "600D", route_long_name: "Shivajinagar → Hebbal", route_type: 3, route_color: "0f766e" },
  { route_id: "R700",  route_short_name: "700",  route_long_name: "Majestic → Kengeri", route_type: 3, route_color: "0f766e" },
  { route_id: "R700C", route_short_name: "700C", route_long_name: "Majestic → Nagarbhavi", route_type: 3, route_color: "0f766e" },
  { route_id: "R250",  route_short_name: "250",  route_long_name: "Majestic → Malleshwaram", route_type: 3, route_color: "0f766e" },
  { route_id: "R250A", route_short_name: "250A", route_long_name: "Majestic → Yeshwanthpur", route_type: 3, route_color: "0f766e" },
  { route_id: "R150",  route_short_name: "150",  route_long_name: "Majestic → Rajajinagar", route_type: 3, route_color: "0f766e" },
  { route_id: "R150A", route_short_name: "150A", route_long_name: "Shivajinagar → Rajajinagar 4th Block", route_type: 3, route_color: "0f766e" },
  { route_id: "R300",  route_short_name: "300",  route_long_name: "Majestic → Indiranagar", route_type: 3, route_color: "0f766e" },
  { route_id: "R300A", route_short_name: "300A", route_long_name: "Majestic → Domlur", route_type: 3, route_color: "0f766e" },
  { route_id: "VAJRA1",route_short_name: "Vajra 1", route_long_name: "Airport → Majestic (Volvo AC)", route_type: 3, route_color: "1d4ed8" },
  { route_id: "VAJRA2",route_short_name: "Vajra 2", route_long_name: "Airport → Shivajinagar (Volvo AC)", route_type: 3, route_color: "1d4ed8" },
];

// ── Namma Metro Stations ──────────────────────────────────────
const METRO_STOPS = [
  // Purple Line (East-West)
  { stop_id: "PL01", stop_name: "Baiyappanahalli",    stop_lat: 12.9985, stop_lon: 77.6609, line: "purple" },
  { stop_id: "PL02", stop_name: "Swami Vivekananda Road", stop_lat: 12.9940, stop_lon: 77.6530, line: "purple" },
  { stop_id: "PL03", stop_name: "Indiranagar",         stop_lat: 12.9784, stop_lon: 77.6408, line: "purple" },
  { stop_id: "PL04", stop_name: "Halasuru",            stop_lat: 12.9810, stop_lon: 77.6280, line: "purple" },
  { stop_id: "PL05", stop_name: "Trinity",             stop_lat: 12.9760, stop_lon: 77.6200, line: "purple" },
  { stop_id: "PL06", stop_name: "MG Road",             stop_lat: 12.9756, stop_lon: 77.6099, line: "purple" },
  { stop_id: "PL07", stop_name: "Cubbon Park",         stop_lat: 12.9780, stop_lon: 77.5960, line: "purple" },
  { stop_id: "PL08", stop_name: "Vidhana Soudha",      stop_lat: 12.9794, stop_lon: 77.5906, line: "purple" },
  { stop_id: "PL09", stop_name: "Sir M Visvesvaraya (Central College)", stop_lat: 12.9780, stop_lon: 77.5840, line: "purple" },
  { stop_id: "PL10", stop_name: "Majestic (Kempegowda)", stop_lat: 12.9767, stop_lon: 77.5713, line: "purple" },
  { stop_id: "PL11", stop_name: "City Railway Station", stop_lat: 12.9774, stop_lon: 77.5660, line: "purple" },
  { stop_id: "PL12", stop_name: "Magadi Road",         stop_lat: 12.9740, stop_lon: 77.5560, line: "purple" },
  { stop_id: "PL13", stop_name: "Hosahalli",           stop_lat: 12.9680, stop_lon: 77.5440, line: "purple" },
  { stop_id: "PL14", stop_name: "Vijayanagar",         stop_lat: 12.9720, stop_lon: 77.5200, line: "purple" },
  { stop_id: "PL15", stop_name: "Attiguppe",           stop_lat: 12.9600, stop_lon: 77.5300, line: "purple" },
  { stop_id: "PL16", stop_name: "Deepanjali Nagar",    stop_lat: 12.9540, stop_lon: 77.5100, line: "purple" },
  { stop_id: "PL17", stop_name: "Mysuru Road",         stop_lat: 12.9490, stop_lon: 77.5000, line: "purple" },
  { stop_id: "PL18", stop_name: "Pantharapalya",       stop_lat: 12.9420, stop_lon: 77.4940, line: "purple" },
  { stop_id: "PL19", stop_name: "Nayandahalli",        stop_lat: 12.9350, stop_lon: 77.4880, line: "purple" },
  { stop_id: "PL20", stop_name: "Rajarajeshwari Nagar", stop_lat: 12.9280, stop_lon: 77.4820, line: "purple" },
  { stop_id: "PL21", stop_name: "Jnanabharathi",       stop_lat: 12.9210, stop_lon: 77.4780, line: "purple" },
  { stop_id: "PL22", stop_name: "Pattanagere",         stop_lat: 12.9160, stop_lon: 77.4820, line: "purple" },
  { stop_id: "PL23", stop_name: "Kengeri Bus Terminal", stop_lat: 12.9140, stop_lon: 77.4820, line: "purple" },
  { stop_id: "PL24", stop_name: "Kengeri",             stop_lat: 12.9120, stop_lon: 77.4800, line: "purple" },
  // Green Line (North-South)
  { stop_id: "GL01", stop_name: "Nagasandra",          stop_lat: 13.0490, stop_lon: 77.5130, line: "green" },
  { stop_id: "GL02", stop_name: "Dasarahalli",         stop_lat: 13.0380, stop_lon: 77.5180, line: "green" },
  { stop_id: "GL03", stop_name: "Jalahalli",           stop_lat: 13.0290, stop_lon: 77.5230, line: "green" },
  { stop_id: "GL04", stop_name: "Peenya Industry",     stop_lat: 13.0230, stop_lon: 77.5270, line: "green" },
  { stop_id: "GL05", stop_name: "Peenya",              stop_lat: 13.0200, stop_lon: 77.5300, line: "green" },
  { stop_id: "GL06", stop_name: "Goraguntepalya",      stop_lat: 13.0150, stop_lon: 77.5350, line: "green" },
  { stop_id: "GL07", stop_name: "Yeshwanthpur",        stop_lat: 13.0210, stop_lon: 77.5540, line: "green" },
  { stop_id: "GL08", stop_name: "Sandal Soap Factory", stop_lat: 13.0100, stop_lon: 77.5580, line: "green" },
  { stop_id: "GL09", stop_name: "Mahalakshmi",         stop_lat: 13.0020, stop_lon: 77.5620, line: "green" },
  { stop_id: "GL10", stop_name: "Rajajinagar",         stop_lat: 12.9910, stop_lon: 77.5530, line: "green" },
  { stop_id: "GL11", stop_name: "Mahakavi Kuvempu Road", stop_lat: 12.9860, stop_lon: 77.5600, line: "green" },
  { stop_id: "GL12", stop_name: "Srirampura",          stop_lat: 12.9820, stop_lon: 77.5650, line: "green" },
  { stop_id: "GL13", stop_name: "Mantri Square Sampige Road", stop_lat: 12.9800, stop_lon: 77.5700, line: "green" },
  { stop_id: "GL14", stop_name: "Majestic (Kempegowda)", stop_lat: 12.9767, stop_lon: 77.5713, line: "green" },
  { stop_id: "GL15", stop_name: "Chickpete",           stop_lat: 12.9680, stop_lon: 77.5760, line: "green" },
  { stop_id: "GL16", stop_name: "Krishna Rajendra Market", stop_lat: 12.9620, stop_lon: 77.5780, line: "green" },
  { stop_id: "GL17", stop_name: "National College",    stop_lat: 12.9560, stop_lon: 77.5800, line: "green" },
  { stop_id: "GL18", stop_name: "Lalbagh",             stop_lat: 12.9500, stop_lon: 77.5830, line: "green" },
  { stop_id: "GL19", stop_name: "South End Circle",    stop_lat: 12.9440, stop_lon: 77.5860, line: "green" },
  { stop_id: "GL20", stop_name: "Jayanagar",           stop_lat: 12.9380, stop_lon: 77.5890, line: "green" },
  { stop_id: "GL21", stop_name: "Rashtreeya Vidyalaya Road", stop_lat: 12.9320, stop_lon: 77.5920, line: "green" },
  { stop_id: "GL22", stop_name: "Banashankari",        stop_lat: 12.9255, stop_lon: 77.5468, line: "green" },
  { stop_id: "GL23", stop_name: "JP Nagar",            stop_lat: 12.9063, stop_lon: 77.5857, line: "green" },
  { stop_id: "GL24", stop_name: "Yelachenahalli",      stop_lat: 12.8980, stop_lon: 77.5900, line: "green" },
  { stop_id: "GL25", stop_name: "Konanakunte Cross",   stop_lat: 12.8900, stop_lon: 77.5940, line: "green" },
  { stop_id: "GL26", stop_name: "Doddakallasandra",    stop_lat: 12.8820, stop_lon: 77.5970, line: "green" },
  { stop_id: "GL27", stop_name: "Vajarahalli",         stop_lat: 12.8750, stop_lon: 77.6000, line: "green" },
  { stop_id: "GL28", stop_name: "Thalaghattapura",     stop_lat: 12.8680, stop_lon: 77.6030, line: "green" },
  { stop_id: "GL29", stop_name: "Silk Institute",      stop_lat: 12.8610, stop_lon: 77.6060, line: "green" },
];

const METRO_ROUTES = [
  { route_id: "PURPLE", route_short_name: "Purple Line", route_long_name: "Baiyappanahalli ↔ Kengeri", route_color: "7c3aed" },
  { route_id: "GREEN",  route_short_name: "Green Line",  route_long_name: "Nagasandra ↔ Silk Institute", route_color: "16a34a" },
];

async function upsert(table, rows, conflict) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
  if (error) console.error(`❌ ${table}:`, error.message);
  else console.log(`✅ ${table}: ${rows.length} rows`);
}

async function seed() {
  console.log("\n🚌 Seeding BMTC data...");
  await upsert("bmtc_stops",  BMTC_STOPS,  "stop_id");
  await upsert("bmtc_routes", BMTC_ROUTES, "route_id");

  console.log("\n🚇 Seeding Metro data...");
  await upsert("metro_stops",  METRO_STOPS,  "stop_id");
  await upsert("metro_routes", METRO_ROUTES, "route_id");

  console.log("\n🔄 Syncing unified layer...");
  const { error: e1 } = await supabase.rpc("sync_unified_stops");
  if (e1) console.error("❌ sync_unified_stops:", e1.message);
  else console.log("✅ unified_stops synced");

  const { error: e2 } = await supabase.rpc("sync_unified_routes");
  if (e2) console.error("❌ sync_unified_routes:", e2.message);
  else console.log("✅ unified_routes synced");

  console.log("\n✅ Seed complete! Bangalore transport data is ready.");
}

seed();
