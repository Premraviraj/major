/**
 * GTFS Import Script
 * Usage:
 *   node import-gtfs.js --type bmtc --dir ./gtfs/bmtc
 *   node import-gtfs.js --type metro --dir ./gtfs/metro
 *
 * Place your GTFS .txt files in the specified directory.
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import "dotenv/config";

const args = process.argv.slice(2);
const typeIdx = args.indexOf("--type");
const dirIdx = args.indexOf("--dir");

if (typeIdx === -1 || dirIdx === -1) {
  console.error("Usage: node import-gtfs.js --type <bmtc|metro> --dir <path>");
  process.exit(1);
}

const TYPE = args[typeIdx + 1];
const DIR  = args[dirIdx + 1];

if (!["bmtc", "metro"].includes(TYPE)) {
  console.error("--type must be bmtc or metro");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function readGTFS(filename) {
  const filepath = path.join(DIR, filename);
  if (!fs.existsSync(filepath)) { console.warn(`⚠ ${filename} not found, skipping`); return []; }
  const content = fs.readFileSync(filepath, "utf8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

async function upsertBatch(table, rows, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: "stop_id,route_id,trip_id".split(",")[0] });
    if (error) console.error(`Error upserting ${table}:`, error.message);
    else process.stdout.write(`\r  ${table}: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }
  console.log();
}

async function importBMTC() {
  console.log("\n📍 Importing BMTC stops...");
  const stops = readGTFS("stops.txt").map(r => ({
    stop_id: r.stop_id, stop_name: r.stop_name,
    stop_lat: parseFloat(r.stop_lat) || null,
    stop_lon: parseFloat(r.stop_lon) || null,
    stop_code: r.stop_code || null, zone_id: r.zone_id || null,
  }));
  await upsertBatch("bmtc_stops", stops);

  console.log("🛣  Importing BMTC routes...");
  const routes = readGTFS("routes.txt").map(r => ({
    route_id: r.route_id, route_short_name: r.route_short_name || null,
    route_long_name: r.route_long_name || null,
    route_type: parseInt(r.route_type) || 3,
    route_color: r.route_color || null,
  }));
  await upsertBatch("bmtc_routes", routes);

  console.log("🚌 Importing BMTC trips...");
  const trips = readGTFS("trips.txt").map(r => ({
    trip_id: r.trip_id, route_id: r.route_id,
    service_id: r.service_id || null,
    trip_headsign: r.trip_headsign || null,
    direction_id: parseInt(r.direction_id) || 0,
  }));
  await upsertBatch("bmtc_trips", trips);

  console.log("⏱  Importing BMTC stop times (this may take a while)...");
  const stopTimes = readGTFS("stop_times.txt").map(r => ({
    trip_id: r.trip_id, stop_id: r.stop_id,
    arrival_time: r.arrival_time || null,
    departure_time: r.departure_time || null,
    stop_sequence: parseInt(r.stop_sequence) || 0,
  }));
  // stop_times has no natural PK — delete and reinsert
  await supabase.from("bmtc_stop_times").delete().neq("id", 0);
  for (let i = 0; i < stopTimes.length; i += 500) {
    const batch = stopTimes.slice(i, i + 500);
    const { error } = await supabase.from("bmtc_stop_times").insert(batch);
    if (error) console.error("Error inserting stop_times:", error.message);
    else process.stdout.write(`\r  bmtc_stop_times: ${Math.min(i + 500, stopTimes.length)}/${stopTimes.length}`);
  }
  console.log();
}

async function importMetro() {
  console.log("\n📍 Importing Metro stops...");
  const stops = readGTFS("stops.txt").map(r => ({
    stop_id: r.stop_id, stop_name: r.stop_name,
    stop_lat: parseFloat(r.stop_lat) || null,
    stop_lon: parseFloat(r.stop_lon) || null,
    line: r.zone_id || null,
  }));
  await upsertBatch("metro_stops", stops);

  console.log("🛣  Importing Metro routes...");
  const routes = readGTFS("routes.txt").map(r => ({
    route_id: r.route_id,
    route_short_name: r.route_short_name || null,
    route_long_name: r.route_long_name || null,
    route_color: r.route_color || null,
  }));
  await upsertBatch("metro_routes", routes);

  console.log("🚇 Importing Metro trips...");
  const trips = readGTFS("trips.txt").map(r => ({
    trip_id: r.trip_id, route_id: r.route_id,
    trip_headsign: r.trip_headsign || null,
    direction_id: parseInt(r.direction_id) || 0,
  }));
  await upsertBatch("metro_trips", trips);
}

async function syncUnified() {
  console.log("\n🔄 Syncing unified layer...");
  await supabase.rpc("sync_unified_stops");
  await supabase.rpc("sync_unified_routes");
  console.log("✅ Unified layer synced");
}

(async () => {
  console.log(`\n🚀 Importing ${TYPE.toUpperCase()} GTFS from ${DIR}`);
  if (TYPE === "bmtc") await importBMTC();
  if (TYPE === "metro") await importMetro();
  await syncUnified();
  console.log("\n✅ Import complete");
})();
