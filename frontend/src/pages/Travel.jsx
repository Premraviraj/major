import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { MdMyLocation, MdSearch, MdDirectionsBus, MdTrain, MdSubway,
         MdAirportShuttle, MdQrCode, MdClose, MdRoute, MdToken, MdLocationOn,
         MdAccessTime, MdSpeed } from "react-icons/md";
import { QRCodeSVG } from "qrcode.react";
import { useRazorpay } from "../hooks/useRazorpay";

// Average speeds (km/h) per transport type for ETA
const AVG_SPEED = { BMTC: 18, KSRTC: 45, Metro: 35, Railway: 60 };

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ICON_MAP = { BMTC: MdDirectionsBus, KSRTC: MdAirportShuttle, Metro: MdSubway, Railway: MdTrain };

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.setView(coords, 14); }, [coords]);
  return null;
}

function useDebounce(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

// ── Shared autocomplete dropdown ──────────────────────────────
function ACInput({ placeholder, value, onChange, suggestions, onSelect, dotColor, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <ACWrap ref={ref}>
      <SearchRow>
        {dotColor ? <SearchDot $color={dotColor} /> : Icon ? <Icon size={14} style={{ flexShrink: 0, color: "#6b5e4e" }} /> : null}
        <SearchInput
          placeholder={placeholder} value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {value && <ClearBtn onClick={() => { onChange(""); setOpen(false); }}><MdClose size={13} /></ClearBtn>}
      </SearchRow>
      {open && suggestions.length > 0 && (
        <SuggestList>
          {suggestions.map((s, i) => (
            <SuggestItem key={i} onClick={() => { onSelect(s); setOpen(false); }}>
              <MdLocationOn size={12} color="#0f766e" />
              <SuggestMain>{s.label}</SuggestMain>
              {s.sub && <SuggestSub>{s.sub}</SuggestSub>}
            </SuggestItem>
          ))}
        </SuggestList>
      )}
    </ACWrap>
  );
}

export default function Travel() {
  const { user } = useAuth();
  const { pay } = useRazorpay();
  const [transportTypes, setTransportTypes] = useState([]);
  const [filter, setFilter] = useState("BMTC");
  const [pos, setPos] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [logging, setLogging] = useState(false);

  // BMTC state
  const [bmtcSearchMode, setBmtcSearchMode] = useState("stop"); // "stop" | "route"
  const [bmtcFrom, setBmtcFrom] = useState("");
  const [bmtcTo, setBmtcTo] = useState("");
  const [bmtcFromSug, setBmtcFromSug] = useState([]);
  const [bmtcToSug, setBmtcToSug] = useState([]);
  const [bmtcRouteQ, setBmtcRouteQ] = useState("");
  const [bmtcRouteSug, setBmtcRouteSug] = useState([]);
  const [bmtcRoutes, setBmtcRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  // Metro state
  const [metroFrom, setMetroFrom] = useState("");
  const [metroTo, setMetroTo] = useState("");
  const [metroFromSug, setMetroFromSug] = useState([]);
  const [metroToSug, setMetroToSug] = useState([]);
  const [metroFromCoords, setMetroFromCoords] = useState(null);
  const [metroToCoords, setMetroToCoords] = useState(null);

  // Railway state
  const [trainNo, setTrainNo] = useState("");
  const [trainSug, setTrainSug] = useState([]);
  const [trainFrom, setTrainFrom] = useState("");
  const [trainTo, setTrainTo] = useState("");

  const POPULAR_TRAINS = [
    { no: "12628", name: "Karnataka Express", from: "Bengaluru", to: "New Delhi" },
    { no: "12657", name: "KSK Express", from: "Bengaluru", to: "Mumbai" },
    { no: "16022", name: "Kaveri Express", from: "Bengaluru", to: "Mysuru" },
    { no: "12649", name: "Sampark Kranti", from: "Bengaluru", to: "Hazrat Nizamuddin" },
    { no: "12677", name: "Ernakulam Express", from: "Bengaluru", to: "Ernakulam" },
    { no: "12864", name: "Yesvantpur Express", from: "Yesvantpur", to: "Howrah" },
    { no: "16591", name: "Hampi Express", from: "Bengaluru", to: "Hospet" },
    { no: "12025", name: "Shatabdi Express", from: "Bengaluru", to: "Chennai" },
    { no: "22691", name: "Rajdhani Express", from: "Bengaluru", to: "New Delhi" },
    { no: "12079", name: "Jan Shatabdi", from: "Bengaluru", to: "Hubli" },
  ];

  useEffect(() => {
    supabase.from("transport_types").select("*").order("sort_order").then(({ data }) => {
      if (data?.length) {
        setTransportTypes(data.map(t => ({ ...t, icon: ICON_MAP[t.key] || MdDirectionsBus })));
        setFilter(data[0].key);
      }
    });
  }, []);

  useEffect(() => {
    let refined = false;
    navigator.geolocation.getCurrentPosition(
      p => { setPos([p.coords.latitude, p.coords.longitude]); setAccuracy(p.coords.accuracy?.toFixed(0)); },
      null, { enableHighAccuracy: false, timeout: 5000 }
    );
    const wid = navigator.geolocation.watchPosition(
      p => {
        if (refined && p.coords.accuracy > 50) return;
        refined = true;
        setPos([p.coords.latitude, p.coords.longitude]);
        setAccuracy(p.coords.accuracy?.toFixed(0));
      },
      null, { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  // BMTC stop suggestions — search stops table + route long names
  const dFrom = useDebounce(bmtcFrom, 400);
  const dTo   = useDebounce(bmtcTo, 400);
  const dRouteQ = useDebounce(bmtcRouteQ, 300);

  useEffect(() => {
    if (dFrom.length < 2) { setBmtcFromSug([]); return; }
    Promise.all([
      supabase.from("bmtc_stops").select("stop_id, stop_name, stop_lat, stop_lon").ilike("stop_name", `%${dFrom}%`).limit(6),
      supabase.from("bmtc_routes").select("route_id, route_short_name, route_long_name").ilike("route_long_name", `%${dFrom}%`).limit(4),
    ]).then(([{ data: stops }, { data: routes }]) => {
      const stopSugs = (stops||[]).map(s => ({ label: s.stop_name, sub: "Bus Stop", id: s.stop_id, lat: s.stop_lat, lon: s.stop_lon, kind: "stop" }));
      const routeSugs = (routes||[]).map(r => {
        // Extract the "from" part of the route name
        const part = r.route_long_name.split("→")[0].trim();
        return { label: part, sub: `Route ${r.route_short_name}`, id: r.route_id, kind: "route", route: r };
      });
      setBmtcFromSug([...stopSugs, ...routeSugs]);
    });
  }, [dFrom]);

  useEffect(() => {
    if (dTo.length < 2) { setBmtcToSug([]); return; }
    Promise.all([
      supabase.from("bmtc_stops").select("stop_id, stop_name, stop_lat, stop_lon").ilike("stop_name", `%${dTo}%`).limit(6),
      supabase.from("bmtc_routes").select("route_id, route_short_name, route_long_name").ilike("route_long_name", `%${dTo}%`).limit(4),
    ]).then(([{ data: stops }, { data: routes }]) => {
      const stopSugs = (stops||[]).map(s => ({ label: s.stop_name, sub: "Bus Stop", id: s.stop_id, lat: s.stop_lat, lon: s.stop_lon, kind: "stop" }));
      const routeSugs = (routes||[]).map(r => {
        const part = r.route_long_name.split("→").pop().trim();
        return { label: part, sub: `Route ${r.route_short_name}`, id: r.route_id, kind: "route", route: r };
      });
      setBmtcToSug([...stopSugs, ...routeSugs]);
    });
  }, [dTo]);

  // Route number search
  useEffect(() => {
    if (dRouteQ.length < 1) { setBmtcRouteSug([]); return; }
    supabase.from("bmtc_routes").select("*")
      .or(`route_short_name.ilike.%${dRouteQ}%,route_long_name.ilike.%${dRouteQ}%`)
      .limit(10)
      .then(({ data }) => setBmtcRouteSug(data || []));
  }, [dRouteQ]);

  // Metro station suggestions
  const dMFrom = useDebounce(metroFrom, 400);
  const dMTo   = useDebounce(metroTo, 400);
  useEffect(() => {
    if (dMFrom.length < 2) { setMetroFromSug([]); return; }
    supabase.from("metro_stops").select("stop_id, stop_name, stop_lat, stop_lon, line").ilike("stop_name", `%${dMFrom}%`).limit(8)
      .then(({ data }) => setMetroFromSug((data||[]).map(s => ({ label: s.stop_name, sub: `${s.line} line`, lat: s.stop_lat, lon: s.stop_lon }))));
  }, [dMFrom]);
  useEffect(() => {
    if (dMTo.length < 2) { setMetroToSug([]); return; }
    supabase.from("metro_stops").select("stop_id, stop_name, stop_lat, stop_lon, line").ilike("stop_name", `%${dMTo}%`).limit(8)
      .then(({ data }) => setMetroToSug((data||[]).map(s => ({ label: s.stop_name, sub: `${s.line} line`, lat: s.stop_lat, lon: s.stop_lon }))));
  }, [dMTo]);

  // Train suggestions
  const dTrain = useDebounce(trainNo, 300);
  useEffect(() => {
    if (!dTrain) { setTrainSug([]); return; }
    const q = dTrain.toLowerCase();
    setTrainSug(POPULAR_TRAINS.filter(t => t.no.includes(q) || t.name.toLowerCase().includes(q))
      .map(t => ({ label: t.name, sub: `${t.no} · ${t.from} → ${t.to}`, no: t.no, from: t.from, to: t.to })));
  }, [dTrain]);

  // Fetch BMTC routes for selected stop
  async function fetchBmtcRoutes(stopId, stopName) {
    // Try junction table first
    const { data: mappings } = await supabase.from("bmtc_stop_routes").select("route_id").eq("stop_id", stopId);
    if (mappings?.length) {
      const ids = mappings.map(m => m.route_id);
      const { data } = await supabase.from("bmtc_routes").select("*").in("route_id", ids);
      setBmtcRoutes(data || []);
      return;
    }
    // Fallback: search route names containing the stop name
    const { data } = await supabase.from("bmtc_routes").select("*")
      .ilike("route_long_name", `%${stopName}%`).limit(20);
    setBmtcRoutes(data || []);
  }

  // ETA calculation
  function calcETA(distKm, transportKey) {
    const speed = AVG_SPEED[transportKey] || 20;
    const mins = Math.round((distKm / speed) * 60);
    if (mins < 60) return `~${mins} min`;
    return `~${Math.floor(mins/60)}h ${mins%60}m`;
  }

  const selectedType = transportTypes.find(t => t.key === filter) || transportTypes[0] || null;

  // Calculate fare and tokens based on transport type
  function calcFare(distKm) {
    if (!selectedType) return { price: 0, tokens: 0 };
    return {
      price: Math.round(selectedType.base_fare + distKm * selectedType.fare_per_km),
      tokens: Math.round(distKm * selectedType.tokens_per_km),
    };
  }

  // Metro distance from coords
  const metroDist = (metroFromCoords && metroToCoords)
    ? haversine(metroFromCoords[0], metroFromCoords[1], metroToCoords[0], metroToCoords[1]).toFixed(1)
    : null;

  function handleBook(bookingData) {
    const { distKm, fromName, toName, routeInfo } = bookingData;
    const { price, tokens } = calcFare(distKm);
    // CO2 saved vs private car (avg car ~0.21 kg CO2/km)
    const co2PerKm = { BMTC: 0.08, KSRTC: 0.08, Metro: 0.12, Railway: 0.12 };
    const co2Saved = parseFloat(((0.21 - (co2PerKm[filter] || 0.08)) * distKm).toFixed(3));
    setLogging(true);
    pay({
      amount: price,
      description: `${filter} · ${fromName} → ${toName}`,
      onSuccess: async (paymentId) => {
        const km = Math.round(distKm);
        await supabase.from("trips").insert({
          user_id: user.id,
          distance_km: km,
          tokens_earned: tokens,
          transport_type: filter,
          co2_saved: co2Saved,
        });
        await supabase.rpc("increment_tokens", { p_user_id: user.id, p_amount: tokens });
        setTicket({
          id: `TRT-${Date.now()}`, type: filter,
          from: fromName, to: toName,
          route: routeInfo || "",
          distance: km, price, tokens, co2Saved,
          time: new Date().toLocaleString(), paymentId,
        });
        setLogging(false);
      },
      onFailure: msg => { setLogging(false); alert(msg || "Payment failed"); },
    });
  }

  return (
    <Page>
      <MapWrap>
        {pos ? (
          <MapContainer key="map" center={pos} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            <RecenterMap coords={pos} />
            <Marker position={pos}><Popup>You are here · ±{accuracy}m</Popup></Marker>
            {accuracy && selectedType && <Circle center={pos} radius={parseFloat(accuracy)} color={selectedType.color} fillOpacity={0.08} />}
            {/* Route line between from and to */}
            {fromCoords && toCoords && (
              <>
                <Polyline positions={[fromCoords, toCoords]} color={selectedType?.color || "#0f766e"} weight={4} dashArray="8 4" />
                <Marker position={fromCoords}><Popup>From: {bmtcFrom || metroFrom}</Popup></Marker>
                <Marker position={toCoords}><Popup>To: {bmtcTo || metroTo}</Popup></Marker>
              </>
            )}
            {metroFromCoords && metroToCoords && (
              <>
                <Polyline positions={[metroFromCoords, metroToCoords]} color="#7c3aed" weight={4} />
                <Marker position={metroFromCoords}><Popup>{metroFrom}</Popup></Marker>
                <Marker position={metroToCoords}><Popup>{metroTo}</Popup></Marker>
              </>
            )}
          </MapContainer>
        ) : (
          <MapPlaceholder><MdMyLocation size={36} /><p>Getting location...</p></MapPlaceholder>
        )}
        {accuracy && <GpsBadge>GPS ±{accuracy}m</GpsBadge>}
        <MapTitle>Bangalore</MapTitle>
      </MapWrap>

      <Content>
        {/* Transport type tabs */}
        <TypeRow>
          {transportTypes.map(({ key, icon: Icon, color }) => (
            <TypeBtn key={key} $active={filter === key} $color={color} onClick={() => { setFilter(key); setSelectedRoute(null); setBmtcRoutes([]); }}>
              <Icon size={20} /><span>{key}</span>
            </TypeBtn>
          ))}
        </TypeRow>

        {/* ── BMTC Booking ── */}
        {filter === "BMTC" && (
          <BookCard>
            <CardLabel>BMTC Bus Booking</CardLabel>

            {/* Search mode toggle */}
            <ModeToggle>
              <ModeBtn $active={bmtcSearchMode === "stop"} onClick={() => setBmtcSearchMode("stop")}>
                <MdLocationOn size={13} />By Stop Name
              </ModeBtn>
              <ModeBtn $active={bmtcSearchMode === "route"} onClick={() => setBmtcSearchMode("route")}>
                <MdDirectionsBus size={13} />By Route No.
              </ModeBtn>
            </ModeToggle>

            {bmtcSearchMode === "stop" && (
              <>
                <FieldLabel>From Stop</FieldLabel>
                <ACInput
                  placeholder="Stop or area (e.g. Majestic, Koramangala, Devanahalli)"
                  value={bmtcFrom} onChange={v => { setBmtcFrom(v); setFromCoords(null); }}
                  suggestions={bmtcFromSug}
                  onSelect={s => {
                    setBmtcFrom(s.label);
                    if (s.lat) setFromCoords([s.lat, s.lon]);
                    if (s.kind === "stop") fetchBmtcRoutes(s.id, s.label);
                    else if (s.kind === "route") { setBmtcRoutes([s.route]); setSelectedRoute(s.route); }
                    setBmtcFromSug([]);
                  }}
                  dotColor="#22c55e"
                />

                <FieldLabel>To Stop</FieldLabel>
                <ACInput
                  placeholder="Destination stop or area"
                  value={bmtcTo} onChange={v => { setBmtcTo(v); setToCoords(null); }}
                  suggestions={bmtcToSug}
                  onSelect={s => {
                    setBmtcTo(s.label);
                    if (s.lat) setToCoords([s.lat, s.lon]);
                    setBmtcToSug([]);
                  }}
                  dotColor="#ef4444"
                />
              </>
            )}

            {bmtcSearchMode === "route" && (
              <>
                <FieldLabel>Route Number or Name</FieldLabel>
                <ACInput
                  placeholder="e.g. 500C, 225, Vajra, Devanahalli, Airport"
                  value={bmtcRouteQ} onChange={setBmtcRouteQ}
                  suggestions={bmtcRouteSug.map(r => ({ label: r.route_short_name, sub: r.route_long_name, route: r }))}
                  onSelect={s => {
                    setBmtcRouteQ(s.label);
                    setBmtcRoutes([s.route]);
                    setSelectedRoute(s.route);
                    // Extract from/to from route name
                    const parts = s.route.route_long_name.split("→");
                    if (parts[0]) setBmtcFrom(parts[0].trim());
                    if (parts[1]) setBmtcTo(parts[1].trim());
                    setBmtcRouteSug([]);
                  }}
                  icon={MdDirectionsBus}
                />
              </>
            )}

            {/* Route list */}
            {bmtcRoutes.length > 0 && (
              <>
                <FieldLabel>{bmtcRoutes.length} Route(s) Found</FieldLabel>
                <RouteList>
                  {bmtcRoutes.map(r => {
                    const parts = r.route_long_name.split("→");
                    const dist = (fromCoords && toCoords)
                      ? haversine(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1]).toFixed(1)
                      : null;
                    const eta = dist ? calcETA(parseFloat(dist), "BMTC") : null;
                    return (
                      <RouteOption key={r.route_id} $selected={selectedRoute?.route_id === r.route_id}
                        onClick={() => setSelectedRoute(r)}>
                        <RouteNo>{r.route_short_name}</RouteNo>
                        <RouteInfo>
                          <RouteLong>{parts[0]?.trim()}</RouteLong>
                          {parts[1] && <RouteArrow>→ {parts[1]?.trim()}</RouteArrow>}
                          {eta && <RouteETA><MdAccessTime size={11} />{eta}</RouteETA>}
                        </RouteInfo>
                        {selectedRoute?.route_id === r.route_id && <SelectedMark>✓</SelectedMark>}
                      </RouteOption>
                    );
                  })}
                </RouteList>
              </>
            )}

            {bmtcFrom && bmtcTo && bmtcRoutes.length === 0 && bmtcSearchMode === "stop" && (
              <NoRouteMsg>No routes found. Try searching by route number instead.</NoRouteMsg>
            )}

            {/* Distance + ETA strip */}
            {selectedRoute && fromCoords && toCoords && (() => {
              const dist = haversine(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1]).toFixed(1);
              const eta = calcETA(parseFloat(dist), "BMTC");
              const { price, tokens } = calcFare(parseFloat(dist));
              return (
                <FareStrip>
                  <FareChip><MdRoute size={12} /><b>{dist} km</b><span>Distance</span></FareChip>
                  <FareChip><MdAccessTime size={12} /><b>{eta}</b><span>ETA</span></FareChip>
                  <FareChip $yellow><b>₹{price}</b><span>Fare</span></FareChip>
                  <FareChip $green><MdToken size={12} /><b>+{tokens}</b><span>Tokens</span></FareChip>
                </FareStrip>
              );
            })()}

            {selectedRoute && !(fromCoords && toCoords) && (
              <FareStrip>
                <FareChip $yellow><b>₹{selectedType?.base_fare || 15}</b><span>Base Fare</span></FareChip>
                <FareChip $green><MdToken size={12} /><b>+{selectedType?.tokens_per_km || 5}/km</b><span>Tokens</span></FareChip>
                <FareChip><MdSpeed size={12} /><b>~18 km/h</b><span>Avg Speed</span></FareChip>
              </FareStrip>
            )}

            <BookBtn
              disabled={!bmtcFrom || !bmtcTo || !selectedRoute || logging}
              onClick={() => {
                const dist = (fromCoords && toCoords)
                  ? haversine(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1])
                  : 5;
                handleBook({ distKm: dist, fromName: bmtcFrom, toName: bmtcTo, routeInfo: `Route ${selectedRoute.route_short_name}` });
              }}
            >
              {logging ? "Processing..." : selectedRoute ? `Book · Route ${selectedRoute.route_short_name}` : "Select a route to book"}
            </BookBtn>
          </BookCard>
        )}

        {/* ── Metro Booking ── */}
        {filter === "Metro" && (
          <BookCard>
            <CardLabel>Namma Metro Booking</CardLabel>

            <MetroLines>
              <MetroLine $color="#7c3aed"><MetroDot $color="#7c3aed" />Purple Line: Baiyappanahalli ↔ Kengeri</MetroLine>
              <MetroLine $color="#16a34a"><MetroDot $color="#16a34a" />Green Line: Nagasandra ↔ Silk Institute</MetroLine>
            </MetroLines>

            <FieldLabel>From Station</FieldLabel>
            <ACInput
              placeholder="Type station name (e.g. MG Road, Indiranagar)"
              value={metroFrom} onChange={setMetroFrom}
              suggestions={metroFromSug}
              onSelect={s => { setMetroFrom(s.label); setMetroFromCoords([s.lat, s.lon]); setMetroFromSug([]); }}
              dotColor="#a78bfa"
            />

            <FieldLabel>To Station</FieldLabel>
            <ACInput
              placeholder="Type destination station"
              value={metroTo} onChange={setMetroTo}
              suggestions={metroToSug}
              onSelect={s => { setMetroTo(s.label); setMetroToCoords([s.lat, s.lon]); setMetroToSug([]); }}
              dotColor="#7c3aed"
            />

            {metroDist && (
              <FareStrip>
                <FareChip><MdRoute size={13} /><b>{metroDist} km</b><span>Distance</span></FareChip>
                <FareChip><MdAccessTime size={13} /><b>{calcETA(parseFloat(metroDist), "Metro")}</b><span>ETA</span></FareChip>
                <FareChip $yellow><b>₹{calcFare(parseFloat(metroDist)).price}</b><span>Fare</span></FareChip>
                <FareChip $green><MdToken size={13} /><b>+{calcFare(parseFloat(metroDist)).tokens}</b><span>Tokens</span></FareChip>
              </FareStrip>
            )}

            <BookBtn
              disabled={!metroFrom || !metroTo || !metroDist || logging}
              onClick={() => handleBook({
                distKm: parseFloat(metroDist),
                fromName: metroFrom, toName: metroTo,
                routeInfo: "Namma Metro",
              })}
            >
              {logging ? "Processing..." : metroDist ? `Book Metro · ₹${calcFare(parseFloat(metroDist)).price}` : "Select stations to book"}
            </BookBtn>
          </BookCard>
        )}

        {/* ── Railway Booking ── */}
        {(filter === "Railway" || filter === "KSRTC") && (
          <BookCard>
            <CardLabel>{filter === "Railway" ? "Train Booking" : "KSRTC Bus Booking"}</CardLabel>

            {filter === "Railway" && (
              <>
                <FieldLabel>Train Number or Name</FieldLabel>
                <ACInput
                  placeholder="e.g. 12628 or Karnataka Express"
                  value={trainNo} onChange={setTrainNo}
                  suggestions={trainSug}
                  onSelect={s => { setTrainNo(s.no); setTrainFrom(s.from); setTrainTo(s.to); setTrainSug([]); }}
                  icon={MdTrain}
                />

                <PopularTrains>
                  <FieldLabel>Popular Trains</FieldLabel>
                  <TrainGrid>
                    {POPULAR_TRAINS.slice(0, 6).map(t => (
                      <TrainChip key={t.no} onClick={() => { setTrainNo(t.no); setTrainFrom(t.from); setTrainTo(t.to); }}>
                        <TrainChipNo>{t.no}</TrainChipNo>
                        <TrainChipName>{t.name}</TrainChipName>
                      </TrainChip>
                    ))}
                  </TrainGrid>
                </PopularTrains>

                {trainFrom && trainTo && (
                  <FareStrip>
                    <FareChip><b>{trainFrom}</b><span>From</span></FareChip>
                    <FareChip><b>{trainTo}</b><span>To</span></FareChip>
                    <FareChip $yellow><b>₹{selectedType?.base_fare || 100}</b><span>Base Fare</span></FareChip>
                  </FareStrip>
                )}

                <BookBtn
                  disabled={!trainNo || logging}
                  onClick={() => handleBook({
                    distKm: 50, // default for train
                    fromName: trainFrom || "Bengaluru",
                    toName: trainTo || "Destination",
                    routeInfo: `Train ${trainNo}`,
                  })}
                >
                  {logging ? "Processing..." : trainNo ? `Book Train ${trainNo}` : "Enter train number"}
                </BookBtn>
              </>
            )}

            {filter === "KSRTC" && (
              <>
                <FieldLabel>From</FieldLabel>
                <ACInput placeholder="Departure city/stop" value={bmtcFrom} onChange={setBmtcFrom}
                  suggestions={[]} onSelect={() => {}} dotColor="#22c55e" />
                <FieldLabel>To</FieldLabel>
                <ACInput placeholder="Destination city/stop" value={bmtcTo} onChange={setBmtcTo}
                  suggestions={[]} onSelect={() => {}} dotColor="#ef4444" />
                <BookBtn
                  disabled={!bmtcFrom || !bmtcTo || logging}
                  onClick={() => handleBook({ distKm: 30, fromName: bmtcFrom, toName: bmtcTo, routeInfo: "KSRTC" })}
                >
                  {logging ? "Processing..." : "Book KSRTC Ticket"}
                </BookBtn>
              </>
            )}
          </BookCard>
        )}
      </Content>

      {/* Ticket modal — same for all transport types */}
      {ticket && (
        <Modal>
          <ModalCard>
            <ModalTop>
              <ModalTitle><MdQrCode size={18} />Ticket Confirmed</ModalTitle>
              <CloseBtn onClick={() => setTicket(null)}><MdClose size={18} /></CloseBtn>
            </ModalTop>
            <QRWrap>
              <QRCodeSVG value={JSON.stringify(ticket)} size={160} bgColor="#f5f0e8" fgColor="#1a1a1a" />
            </QRWrap>
            <TicketGrid>
              <TicketRow><span>ID</span><b>{ticket.id}</b></TicketRow>
              <TicketRow><span>Type</span><b>{ticket.type}</b></TicketRow>
              {ticket.route && <TicketRow><span>Route</span><b>{ticket.route}</b></TicketRow>}
              <TicketRow><span>From</span><b>{ticket.from?.split(",")[0]}</b></TicketRow>
              <TicketRow><span>To</span><b>{ticket.to?.split(",")[0]}</b></TicketRow>
              <TicketRow><span>Fare</span><b>₹{ticket.price}</b></TicketRow>
              <TicketRow $hi><span>Tokens Earned</span><b>+{ticket.tokens} TRT</b></TicketRow>
              {ticket.co2Saved > 0 && <TicketRow><span>CO₂ Saved</span><b>{ticket.co2Saved} kg</b></TicketRow>}
              <TicketRow><span>Time</span><b>{ticket.time}</b></TicketRow>
              {ticket.paymentId && <TicketRow><span>Payment ID</span><b style={{fontSize:10}}>{ticket.paymentId}</b></TicketRow>}
            </TicketGrid>
          </ModalCard>
        </Modal>
      )}
    </Page>
  );
}

const Page = styled.div`width:100%;min-height:100vh;background:${p=>p.theme.bg};padding-bottom:80px;`;
const MapWrap = styled.div`width:100%;height:220px;position:relative;border-bottom:2px solid #1a1a1a;`;
const MapPlaceholder = styled.div`height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:${p=>p.theme.surface};color:${p=>p.theme.muted};font-size:14px;`;
const GpsBadge = styled.div`position:absolute;top:10px;right:10px;background:#fff;border:2px solid #1a1a1a;color:#1a1a1a;font-size:10px;font-weight:700;padding:3px 9px;border-radius:4px;z-index:999;box-shadow:2px 2px 0 #1a1a1a;`;
const MapTitle = styled.div`position:absolute;top:10px;left:10px;background:${p=>p.theme.primary};border:2px solid #1a1a1a;color:#fff;font-size:10px;font-weight:700;padding:3px 9px;border-radius:4px;z-index:999;box-shadow:2px 2px 0 #1a1a1a;text-transform:uppercase;letter-spacing:0.5px;`;
const Content = styled.div`width:100%;padding:12px 14px;display:flex;flex-direction:column;gap:10px;`;
const TypeRow = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:6px;`;
const TypeBtn = styled.button`display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:4px;border:2px solid ${p=>p.$active?"#1a1a1a":"transparent"};background:${p=>p.$active?p.$color+"22":p.theme.surface};color:#1a1a1a;font-size:9px;font-weight:700;cursor:pointer;box-shadow:${p=>p.$active?"3px 3px 0 #1a1a1a":"none"};text-transform:uppercase;letter-spacing:0.5px;`;
const BookCard = styled.div`background:${p=>p.theme.card};border:2px solid #1a1a1a;border-radius:4px;padding:16px;box-shadow:4px 4px 0 #1a1a1a;display:flex;flex-direction:column;gap:10px;`;
const CardLabel = styled.div`font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#1a1a1a;`;
const FieldLabel = styled.div`font-size:10px;font-weight:700;color:#6b5e4e;text-transform:uppercase;letter-spacing:1px;margin-bottom:-4px;`;
const ACWrap = styled.div`position:relative;`;
const SearchRow = styled.div`display:flex;align-items:center;gap:8px;background:${p=>p.theme.surface};border:2px solid #1a1a1a;border-radius:4px;padding:0 12px;`;
const SearchDot = styled.div`width:9px;height:9px;border-radius:50%;background:${p=>p.$color};border:2px solid #1a1a1a;flex-shrink:0;`;
const SearchInput = styled.input`flex:1;background:transparent;border:none;outline:none;color:#1a1a1a;font-size:13px;font-weight:500;padding:10px 0;font-family:inherit;&::placeholder{color:#6b5e4e;}`;
const ClearBtn = styled.button`background:none;border:none;cursor:pointer;color:#6b5e4e;display:flex;align-items:center;padding:0;`;
const SuggestList = styled.div`position:absolute;top:100%;left:0;right:0;background:#fff;border:2px solid #1a1a1a;border-radius:4px;box-shadow:3px 3px 0 #1a1a1a;z-index:50;overflow:hidden;margin-top:2px;max-height:220px;overflow-y:auto;`;
const SuggestItem = styled.div`display:flex;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0;&:last-child{border-bottom:none;}&:hover{background:#f5f0e8;}`;
const SuggestMain = styled.span`font-size:12px;font-weight:600;color:#1a1a1a;flex:1;`;
const SuggestSub  = styled.span`font-size:10px;color:#6b5e4e;white-space:nowrap;`;
const RouteList = styled.div`display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;`;
const RouteOption = styled.div`display:flex;align-items:flex-start;gap:10px;background:${p=>p.$selected?"#0f766e18":"#fff"};border:2px solid ${p=>p.$selected?"#1a1a1a":"#e0e0e0"};border-radius:4px;padding:10px 12px;cursor:pointer;box-shadow:${p=>p.$selected?"2px 2px 0 #1a1a1a":"none"};&:hover{border-color:#1a1a1a;}`;
const RouteNo = styled.div`font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#0f766e;min-width:52px;flex-shrink:0;`;
const RouteInfo = styled.div`flex:1;display:flex;flex-direction:column;gap:2px;`;
const RouteLong = styled.div`font-size:11px;font-weight:600;color:#1a1a1a;`;
const RouteArrow = styled.div`font-size:11px;color:#6b5e4e;`;
const RouteETA = styled.div`display:flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:#0f766e;margin-top:2px;`;
const SelectedMark = styled.div`font-size:14px;color:#0f766e;font-weight:700;flex-shrink:0;`;
const ModeToggle = styled.div`display:grid;grid-template-columns:1fr 1fr;border:2px solid #1a1a1a;border-radius:4px;overflow:hidden;`;
const ModeBtn = styled.button`display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;border:none;cursor:pointer;font-size:11px;font-weight:700;background:${p=>p.$active?"#1a1a1a":p.theme.surface};color:${p=>p.$active?"#fff":"#1a1a1a"};border-right:1px solid #1a1a1a;&:last-child{border-right:none;}`;
const NoRouteMsg = styled.p`font-size:11px;color:#6b5e4e;font-style:italic;`;
const FareStrip = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(60px,1fr));gap:8px;`;
const FareChip = styled.div`background:${p=>p.$green?p.theme.tag:p.$yellow?"#fde68a":p.theme.surface};border:2px solid #1a1a1a;border-radius:4px;padding:9px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:2px 2px 0 #1a1a1a;b{display:block;font-size:14px;font-weight:800;color:#1a1a1a;font-family:'Syne',sans-serif;}span{font-size:9px;font-weight:600;color:#6b5e4e;text-transform:uppercase;letter-spacing:0.5px;}`;
const BookBtn = styled.button`width:100%;padding:13px;border-radius:4px;background:${p=>p.disabled?p.theme.surface:p.theme.primary};color:${p=>p.disabled?"#6b5e4e":"#fff"};border:2px solid #1a1a1a;font-size:13px;font-weight:700;cursor:${p=>p.disabled?"not-allowed":"pointer"};box-shadow:${p=>p.disabled?"none":"4px 4px 0 #1a1a1a"};`;
const MetroLines = styled.div`display:flex;flex-direction:column;gap:6px;`;
const MetroLine = styled.div`display:flex;align-items:center;gap:8px;font-size:11px;font-weight:600;color:#1a1a1a;`;
const MetroDot = styled.div`width:10px;height:10px;border-radius:50%;background:${p=>p.$color};border:2px solid #1a1a1a;flex-shrink:0;`;
const PopularTrains = styled.div`display:flex;flex-direction:column;gap:8px;`;
const TrainGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:6px;`;
const TrainChip = styled.div`background:#fff;border:2px solid #1a1a1a;border-radius:4px;padding:8px 10px;cursor:pointer;box-shadow:2px 2px 0 #1a1a1a;&:hover{background:#fffbeb;}`;
const TrainChipNo   = styled.div`font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#c17f3a;`;
const TrainChipName = styled.div`font-size:10px;color:#6b5e4e;margin-top:1px;`;
const Modal = styled.div`position:fixed;inset:0;background:rgba(245,240,232,0.88);display:flex;align-items:center;justify-content:center;z-index:200;padding:24px;`;
const ModalCard = styled.div`background:${p=>p.theme.card};border:2px solid #1a1a1a;border-radius:4px;padding:22px;width:100%;max-width:340px;box-shadow:6px 6px 0 #1a1a1a;`;
const ModalTop = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;`;
const ModalTitle = styled.div`display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:#1a1a1a;font-family:'Syne',sans-serif;`;
const CloseBtn = styled.button`background:${p=>p.theme.surface};border:2px solid #1a1a1a;border-radius:4px;width:28px;height:28px;cursor:pointer;color:#1a1a1a;display:flex;align-items:center;justify-content:center;box-shadow:2px 2px 0 #1a1a1a;`;
const QRWrap = styled.div`display:flex;justify-content:center;background:${p=>p.theme.surface};border:2px solid #1a1a1a;border-radius:4px;padding:14px;margin-bottom:14px;`;
const TicketGrid = styled.div`display:flex;flex-direction:column;gap:5px;`;
const TicketRow = styled.div`display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:6px 10px;border-radius:4px;background:${p=>p.$hi?p.theme.tag:p.theme.surface};border:${p=>p.$hi?"2px solid #1a1a1a":"1px solid transparent"};span{color:#6b5e4e;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:0.5px;}b{color:#1a1a1a;font-weight:700;}`;
