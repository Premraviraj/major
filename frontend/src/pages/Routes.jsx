import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { supabase } from "../supabaseClient";
import { MdDirectionsBus, MdSubway, MdTrain, MdSearch, MdLocationOn, MdRadar, MdQrCode2, MdClose } from "react-icons/md";

const TABS = [
  { key: "bus",   label: "BMTC Bus", icon: MdDirectionsBus, accent: "#0f766e", bg: "#f0fdf9", tag: "City Bus" },
  { key: "metro", label: "Metro",    icon: MdSubway,        accent: "#7c3aed", bg: "#faf5ff", tag: "Namma Metro" },
  { key: "train", label: "Railway",  icon: MdTrain,         accent: "#c17f3a", bg: "#fffbeb", tag: "Indian Railways" },
];

// Popular trains for autocomplete
const POPULAR_TRAINS = [
  { no: "12628", name: "Karnataka Express" },
  { no: "12657", name: "KSK Express" },
  { no: "16022", name: "Kaveri Express" },
  { no: "12649", name: "Sampark Kranti" },
  { no: "12677", name: "Ernakulam Express" },
  { no: "12864", name: "Yesvantpur Express" },
  { no: "16591", name: "Hampi Express" },
  { no: "12079", name: "Jan Shatabdi" },
  { no: "22691", name: "Rajdhani Express" },
  { no: "12025", name: "Shatabdi Express" },
];

// ── Shared autocomplete input ─────────────────────────────────
function AutocompleteInput({ placeholder, value, onChange, onSelect, suggestions, accent, dotColor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <ACWrap ref={ref}>
      <SearchRow>
        <Dot $color={dotColor} />
        <SInput
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {value && <ClearBtn onClick={() => { onChange(""); setOpen(false); }}><MdClose size={14} /></ClearBtn>}
      </SearchRow>
      {open && suggestions.length > 0 && (
        <SuggestList $accent={accent}>
          {suggestions.map((s, i) => (
            <SuggestItem key={i} onClick={() => { onSelect(s); setOpen(false); }}>
              <MdLocationOn size={12} color={accent} />
              <SuggestMain>{s.main}</SuggestMain>
              {s.sub && <SuggestSub>{s.sub}</SuggestSub>}
            </SuggestItem>
          ))}
        </SuggestList>
      )}
    </ACWrap>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function RoutesPage() {
  const [active, setActive] = useState("bus");
  const tab = TABS.find(t => t.key === active);

  return (
    <Page>
      <Body>
        <PageTitle>Transport Routes</PageTitle>
        <ModeRow>
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <ModeBtn key={t.key} $active={active === t.key} $accent={t.accent} onClick={() => setActive(t.key)}>
                <Icon size={22} />
                <ModeName>{t.label}</ModeName>
                <ModeTag>{t.tag}</ModeTag>
              </ModeBtn>
            );
          })}
        </ModeRow>
        {active === "bus"   && <BusPanel   accent={tab.accent} bg={tab.bg} />}
        {active === "metro" && <MetroPanel accent={tab.accent} bg={tab.bg} />}
        {active === "train" && <TrainPanel accent={tab.accent} bg={tab.bg} />}
      </Body>
    </Page>
  );
}

// ── BMTC Bus Panel ────────────────────────────────────────────
function BusPanel({ accent, bg }) {
  const [searchMode, setSearchMode] = useState("stop"); // stop | route
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  const [routeQ, setRouteQ] = useState("");
  const [fromSug, setFromSug] = useState([]);
  const [toSug, setToSug]     = useState([]);
  const [routeSug, setRouteSug] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchStopSug(q, setSug) {
    if (q.length < 2) { setSug([]); return; }
    const { data } = await supabase
      .from("unified_stops").select("name, source_id")
      .eq("type", "bus").ilike("name", `%${q}%`).limit(8);
    setSug((data || []).map(s => ({ main: s.name, sub: `Stop ID: ${s.source_id}` })));
  }

  async function fetchRouteSug(q) {
    if (q.length < 1) { setRouteSug([]); return; }
    const { data } = await supabase
      .from("unified_routes").select("name, short_name")
      .eq("type", "bus")
      .or(`short_name.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(8);
    setRouteSug((data || []).map(r => ({ main: r.short_name || r.name, sub: r.name, full: r })));
  }

  useEffect(() => { fetchStopSug(from, setFromSug); }, [from]);
  useEffect(() => { fetchStopSug(to, setToSug); }, [to]);
  useEffect(() => { fetchRouteSug(routeQ); }, [routeQ]);

  async function searchByStop() {
    if (!from || !to) return;
    setLoading(true);

    // Find matching stops
    const [{ data: fromStops }, { data: toStops }] = await Promise.all([
      supabase.from("unified_stops").select("*").eq("type", "bus").ilike("name", `%${from}%`).limit(5),
      supabase.from("unified_stops").select("*").eq("type", "bus").ilike("name", `%${to}%`).limit(5),
    ]);

    // Get routes that serve the FROM stop via junction table
    let routes = [];
    if (fromStops?.length > 0) {
      const fromIds = fromStops.map(s => s.source_id);
      const { data: mappings } = await supabase
        .from("bmtc_stop_routes")
        .select("route_id")
        .in("stop_id", fromIds);

      if (mappings?.length > 0) {
        const routeIds = [...new Set(mappings.map(m => m.route_id))];
        const { data: routeData } = await supabase
          .from("bmtc_routes")
          .select("*")
          .in("route_id", routeIds);
        routes = routeData || [];
      }
    }

    // Fallback: if no junction data, search by name match in route
    if (routes.length === 0) {
      const { data } = await supabase
        .from("unified_routes").select("*").eq("type", "bus")
        .or(`name.ilike.%${from}%,name.ilike.%${to}%`)
        .limit(20);
      routes = data || [];
    }

    setResults({ mode: "stop", from_stops: fromStops || [], to_stops: toStops || [], routes });
    setLoading(false);
  }

  async function searchByRoute() {
    if (!routeQ) return;
    setLoading(true);
    const { data: routes } = await supabase
      .from("unified_routes").select("*").eq("type", "bus")
      .or(`short_name.ilike.%${routeQ}%,name.ilike.%${routeQ}%`)
      .limit(20);
    setResults({ mode: "route", routes: routes || [] });
    setLoading(false);
  }

  return (
    <Panel $bg={bg} $accent={accent}>
      <PanelHeader $accent={accent}>
        <MdDirectionsBus size={20} />
        <span>BMTC Bus Route Search</span>
        <PanelBadge $accent={accent}>Bangalore + Extended</PanelBadge>
      </PanelHeader>

      {/* Search mode toggle */}
      <TrainToggle>
        <TrainToggleBtn $active={searchMode === "stop"} $accent={accent} onClick={() => setSearchMode("stop")}>
          <MdLocationOn size={14} />By Stop
        </TrainToggleBtn>
        <TrainToggleBtn $active={searchMode === "route"} $accent={accent} onClick={() => setSearchMode("route")}>
          <MdDirectionsBus size={14} />By Route No.
        </TrainToggleBtn>
      </TrainToggle>

      {searchMode === "stop" && (
        <SearchBox $accent={accent}>
          <AutocompleteInput
            placeholder="From stop (e.g. Majestic, Hoskote)"
            value={from} onChange={setFrom}
            onSelect={s => setFrom(s.main)}
            suggestions={fromSug} accent={accent} dotColor="#22c55e"
          />
          <DotLine />
          <AutocompleteInput
            placeholder="To stop (e.g. Whitefield, Devanahalli)"
            value={to} onChange={setTo}
            onSelect={s => setTo(s.main)}
            suggestions={toSug} accent={accent} dotColor="#ef4444"
          />
          <GoBtn $accent={accent} onClick={searchByStop} disabled={loading || !from || !to}>
            <MdSearch size={16} />{loading ? "Searching..." : "Find Bus Routes"}
          </GoBtn>
        </SearchBox>
      )}

      {searchMode === "route" && (
        <SearchBox $accent={accent}>
          <ACWrap>
            <SearchRow>
              <Dot $color={accent} />
              <SInput
                placeholder="Route number or name (e.g. 500C, Vajra, Airport)"
                value={routeQ}
                onChange={e => setRouteQ(e.target.value)}
                onFocus={() => {}}
                autoComplete="off"
              />
              {routeQ && <ClearBtn onClick={() => { setRouteQ(""); setRouteSug([]); }}><MdClose size={14} /></ClearBtn>}
            </SearchRow>
            {routeSug.length > 0 && (
              <SuggestList $accent={accent}>
                {routeSug.map((s, i) => (
                  <SuggestItem key={i} onClick={() => { setRouteQ(s.main); setRouteSug([]); }}>
                    <MdDirectionsBus size={12} color={accent} />
                    <SuggestMain>{s.main}</SuggestMain>
                    <SuggestSub>{s.sub}</SuggestSub>
                  </SuggestItem>
                ))}
              </SuggestList>
            )}
          </ACWrap>
          <GoBtn $accent={accent} onClick={searchByRoute} disabled={loading || !routeQ}>
            <MdSearch size={16} />{loading ? "Searching..." : "Find Route"}
          </GoBtn>
        </SearchBox>
      )}

      {results?.mode === "stop" && (
        <>
          <StopsRow>
            <div>
              <ResultLabel>Stops near "{from}"</ResultLabel>
              {results.from_stops.length === 0 && <NoResult>No stops found</NoResult>}
              {results.from_stops.map(s => <StopChip key={s.id} $accent={accent}><MdLocationOn size={12} color={accent} />{s.name}</StopChip>)}
            </div>
            <div>
              <ResultLabel>Stops near "{to}"</ResultLabel>
              {results.to_stops.length === 0 && <NoResult>No stops found</NoResult>}
              {results.to_stops.map(s => <StopChip key={s.id} $accent={accent}><MdLocationOn size={12} color={accent} />{s.name}</StopChip>)}
            </div>
          </StopsRow>
          <ResultLabel>Bus Routes</ResultLabel>
          {results.routes.length === 0 && <NoResult>No routes found.</NoResult>}
          {results.routes.map(r => <BusRouteRow key={r.id} route={r} accent={accent} />)}
        </>
      )}

      {results?.mode === "route" && (
        <>
          <ResultLabel>{results.routes.length} route(s) found for "{routeQ}"</ResultLabel>
          {results.routes.length === 0 && <NoResult>No routes found. Try a different number.</NoResult>}
          {results.routes.map(r => <BusRouteRow key={r.id} route={r} accent={accent} />)}
        </>
      )}

      <InfoBox $accent={accent}>
        <InfoTitle>Coverage</InfoTitle>
        <InfoList>
          <li>City: Majestic, Koramangala, Whitefield, Electronic City, Indiranagar</li>
          <li>Extended: Hoskote, Devanahalli, Airport, Nelamangala, Anekal</li>
          <li>Search by route number: 500C, 201, 335E, Vajra, 225 (Devanahalli)</li>
        </InfoList>
      </InfoBox>
    </Panel>
  );
}

function BusRouteRow({ route, accent }) {
  return (
    <RouteCard $accent={accent}>
      <RouteStripe $accent={accent} />
      <RouteBody>
        <RouteNum $accent={accent}>{route.short_name || "—"}</RouteNum>
        <RouteName>{route.name}</RouteName>
      </RouteBody>
      <RouteMode $accent={accent}><MdDirectionsBus size={13} />Bus</RouteMode>
    </RouteCard>
  );
}

// ── Metro Panel ───────────────────────────────────────────────
function MetroPanel({ accent, bg }) {
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  const [fromSug, setFromSug] = useState([]);
  const [toSug, setToSug]     = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchSug(q, setSug) {
    if (q.length < 2) { setSug([]); return; }
    const { data } = await supabase
      .from("unified_stops").select("name, metadata")
      .eq("type", "metro").ilike("name", `%${q}%`).limit(8);
    setSug((data || []).map(s => ({
      main: s.name,
      sub: s.metadata?.line ? `${s.metadata.line} line` : "Metro Station",
    })));
  }

  useEffect(() => { fetchSug(from, setFromSug); }, [from]);
  useEffect(() => { fetchSug(to, setToSug); }, [to]);

  async function search() {
    if (!from || !to) return;
    setLoading(true);
    const [{ data: fromStops }, { data: toStops }] = await Promise.all([
      supabase.from("unified_stops").select("*").eq("type", "metro").ilike("name", `%${from}%`).limit(5),
      supabase.from("unified_stops").select("*").eq("type", "metro").ilike("name", `%${to}%`).limit(5),
    ]);
    setResults({ from_stops: fromStops || [], to_stops: toStops || [] });
    setLoading(false);
  }

  const LINES = [
    { name: "Purple Line", from: "Baiyappanahalli", to: "Kengeri", color: "#7c3aed" },
    { name: "Green Line",  from: "Nagasandra",      to: "Silk Institute", color: "#16a34a" },
  ];

  return (
    <Panel $bg={bg} $accent={accent}>
      <PanelHeader $accent={accent}>
        <MdSubway size={20} />
        <span>Namma Metro</span>
        <PanelBadge $accent={accent}>Bangalore Metro</PanelBadge>
      </PanelHeader>

      <MetroLines>
        {LINES.map(l => (
          <MetroLine key={l.name} $color={l.color}>
            <MetroLineDot $color={l.color} />
            <MetroLineInfo>
              <MetroLineName>{l.name}</MetroLineName>
              <MetroLineRoute>{l.from} ↔ {l.to}</MetroLineRoute>
            </MetroLineInfo>
          </MetroLine>
        ))}
      </MetroLines>

      <SearchBox $accent={accent}>
        <AutocompleteInput
          placeholder="From station (e.g. MG Road, Indiranagar)"
          value={from} onChange={setFrom}
          onSelect={s => setFrom(s.main)}
          suggestions={fromSug} accent={accent} dotColor="#a78bfa"
        />
        <DotLine />
        <AutocompleteInput
          placeholder="To station (e.g. Majestic, Whitefield)"
          value={to} onChange={setTo}
          onSelect={s => setTo(s.main)}
          suggestions={toSug} accent={accent} dotColor="#7c3aed"
        />
        <GoBtn $accent={accent} onClick={search} disabled={loading || !from || !to}>
          <MdSearch size={16} />{loading ? "Searching..." : "Find Metro Route"}
        </GoBtn>
      </SearchBox>

      {results && (
        <StopsRow>
          <div>
            <ResultLabel>From Stations</ResultLabel>
            {results.from_stops.length === 0 && <NoResult>No stations found</NoResult>}
            {results.from_stops.map(s => (
              <MetroStopCard key={s.id} $color={s.metadata?.line === "green" ? "#16a34a" : accent}>
                <MetroStopDot $color={s.metadata?.line === "green" ? "#16a34a" : accent} />
                <div>
                  <StopName>{s.name}</StopName>
                  {s.metadata?.line && <StopLine $color={s.metadata.line === "green" ? "#16a34a" : accent}>{s.metadata.line} line</StopLine>}
                </div>
              </MetroStopCard>
            ))}
          </div>
          <div>
            <ResultLabel>To Stations</ResultLabel>
            {results.to_stops.length === 0 && <NoResult>No stations found</NoResult>}
            {results.to_stops.map(s => (
              <MetroStopCard key={s.id} $color={s.metadata?.line === "green" ? "#16a34a" : accent}>
                <MetroStopDot $color={s.metadata?.line === "green" ? "#16a34a" : accent} />
                <div>
                  <StopName>{s.name}</StopName>
                  {s.metadata?.line && <StopLine $color={s.metadata.line === "green" ? "#16a34a" : accent}>{s.metadata.line} line</StopLine>}
                </div>
              </MetroStopCard>
            ))}
          </div>
        </StopsRow>
      )}

      <InfoBox $accent={accent}>
        <InfoTitle>Tips</InfoTitle>
        <InfoList>
          <li>Type any station name — suggestions appear from the DB</li>
          <li>Purple Line: Baiyappanahalli ↔ Kengeri (east-west)</li>
          <li>Green Line: Nagasandra ↔ Silk Institute (north-south)</li>
        </InfoList>
      </InfoBox>
    </Panel>
  );
}

// ── Train Panel ───────────────────────────────────────────────
function TrainPanel({ accent, bg }) {
  const [trainNo, setTrainNo] = useState("");
  const [trainSug, setTrainSug] = useState([]);
  const [pnr, setPnr]           = useState("");
  const [trainData, setTrainData] = useState(null);
  const [pnrData, setPnrData]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [mode, setMode]           = useState("live");

  // Filter popular trains as user types
  useEffect(() => {
    if (trainNo.length < 1) { setTrainSug([]); return; }
    const q = trainNo.toLowerCase();
    setTrainSug(
      POPULAR_TRAINS.filter(t => t.no.includes(q) || t.name.toLowerCase().includes(q))
        .map(t => ({ main: t.name, sub: `Train No: ${t.no}`, no: t.no }))
    );
  }, [trainNo]);

  async function fetchTrain() {
    if (!trainNo) return;
    setLoading(true); setTrainData(null);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-train?train_no=${trainNo}`;
    const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } });
    setTrainData(await res.json());
    setLoading(false);
  }

  async function fetchPNR() {
    if (pnr.length !== 10) return;
    setLoading(true); setPnrData(null);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pnr-status?pnr=${pnr}`;
    const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } });
    setPnrData(await res.json());
    setLoading(false);
  }

  return (
    <Panel $bg={bg} $accent={accent}>
      <PanelHeader $accent={accent}>
        <MdTrain size={20} />
        <span>Indian Railways</span>
        <PanelBadge $accent={accent}>Live Tracking</PanelBadge>
      </PanelHeader>

      <TrainToggle>
        <TrainToggleBtn $active={mode === "live"} $accent={accent} onClick={() => setMode("live")}>
          <MdRadar size={15} />Live Status
        </TrainToggleBtn>
        <TrainToggleBtn $active={mode === "pnr"} $accent={accent} onClick={() => setMode("pnr")}>
          <MdQrCode2 size={15} />PNR Status
        </TrainToggleBtn>
      </TrainToggle>

      {mode === "live" && (
        <TrainSearchBox $accent={accent}>
          <TrainLabel>Train Number or Name</TrainLabel>
          <ACWrap>
            <TrainInputRow>
              <TrainInput
                placeholder="e.g. 12628 or Karnataka Express"
                value={trainNo}
                onChange={e => setTrainNo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchTrain()}
              />
              <GoBtn $accent={accent} onClick={fetchTrain} disabled={loading || !trainNo} style={{ width: "auto", padding: "10px 18px" }}>
                {loading ? "..." : "Track"}
              </GoBtn>
            </TrainInputRow>
            {trainSug.length > 0 && (
              <SuggestList $accent={accent}>
                {trainSug.map((s, i) => (
                  <SuggestItem key={i} onClick={() => { setTrainNo(s.no); setTrainSug([]); }}>
                    <MdTrain size={12} color={accent} />
                    <SuggestMain>{s.main}</SuggestMain>
                    <SuggestSub>{s.sub}</SuggestSub>
                  </SuggestItem>
                ))}
              </SuggestList>
            )}
          </ACWrap>
          {trainData && <TrainResult data={trainData} accent={accent} />}
        </TrainSearchBox>
      )}

      {mode === "pnr" && (
        <TrainSearchBox $accent={accent}>
          <TrainLabel>PNR Number (10 digits)</TrainLabel>
          <TrainInputRow>
            <TrainInput
              placeholder="e.g. 4501234567"
              value={pnr}
              onChange={e => setPnr(e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
              onKeyDown={e => e.key === "Enter" && fetchPNR()}
            />
            <GoBtn $accent={accent} onClick={fetchPNR} disabled={loading || pnr.length !== 10} style={{ width: "auto", padding: "10px 18px" }}>
              {loading ? "..." : "Check"}
            </GoBtn>
          </TrainInputRow>
          <PNRHint>PNR is printed on your ticket / IRCTC booking confirmation</PNRHint>
          {pnrData && <TrainResult data={pnrData} accent={accent} />}
        </TrainSearchBox>
      )}

      <InfoBox $accent={accent}>
        <InfoTitle>Popular Trains from Bangalore</InfoTitle>
        <TrainGrid>
          {POPULAR_TRAINS.slice(0, 6).map(t => (
            <TrainChip key={t.no} $accent={accent} onClick={() => { setTrainNo(t.no); setMode("live"); }}>
              <TrainChipNo $accent={accent}>{t.no}</TrainChipNo>
              <TrainChipName>{t.name}</TrainChipName>
            </TrainChip>
          ))}
        </TrainGrid>
      </InfoBox>
    </Panel>
  );
}

function TrainResult({ data, accent }) {
  if (data.error) return <ErrorMsg>{data.error}</ErrorMsg>;
  const train = data?.body || data?.data || data;
  return (
    <TrainResultBox $accent={accent}>
      {train.train_name && <TrainName>{train.train_name}</TrainName>}
      {train.train_number && <TrainNum $accent={accent}>#{train.train_number}</TrainNum>}
      {train.current_station && (
        <TrainStatus><MdLocationOn size={14} color={accent} />Currently at: <strong>{train.current_station}</strong></TrainStatus>
      )}
      {train.delay !== undefined && (
        <TrainDelay $late={train.delay > 0}>{train.delay === 0 ? "✓ On time" : `${train.delay} min late`}</TrainDelay>
      )}
      {!train.train_name && !train.current_station && (
        <pre style={{ fontSize: 10, overflow: "auto", maxHeight: 160, color: "#6b5e4e" }}>{JSON.stringify(data, null, 2)}</pre>
      )}
    </TrainResultBox>
  );
}

// ── Styled components ─────────────────────────────────────────
const Page = styled.div`width:100%;min-height:100vh;background:${p=>p.theme.bg};padding-bottom:100px;`;
const Body = styled.div`width:100%;padding:20px;display:flex;flex-direction:column;gap:16px;`;
const PageTitle = styled.h1`font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${p=>p.theme.text};`;
const ModeRow = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:10px;`;
const ModeBtn = styled.button`display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 8px;border-radius:${p=>p.theme.radius};cursor:pointer;border:2px solid ${p=>p.$active?"#1a1a1a":"transparent"};background:${p=>p.$active?p.$accent+"18":p.theme.surface};color:${p=>p.$active?p.$accent:"#1a1a1a"};box-shadow:${p=>p.$active?"4px 4px 0 #1a1a1a":"none"};transition:all 0.15s;`;
const ModeName = styled.div`font-size:12px;font-weight:700;`;
const ModeTag  = styled.div`font-size:9px;color:#6b5e4e;font-weight:500;`;
const Panel = styled.div`background:${p=>p.$bg};border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:18px;box-shadow:4px 4px 0 #1a1a1a;display:flex;flex-direction:column;gap:14px;`;
const PanelHeader = styled.div`display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:${p=>p.$accent};font-family:'Syne',sans-serif;`;
const PanelBadge = styled.span`margin-left:auto;background:${p=>p.$accent};color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:3px;letter-spacing:0.5px;border:1px solid #1a1a1a;`;
const SearchBox = styled.div`background:#fff;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:14px;display:flex;flex-direction:column;gap:8px;box-shadow:3px 3px 0 #1a1a1a;`;
const ACWrap = styled.div`position:relative;`;
const SearchRow = styled.div`display:flex;align-items:center;gap:10px;`;
const Dot = styled.div`width:10px;height:10px;border-radius:50%;background:${p=>p.$color};border:2px solid #1a1a1a;flex-shrink:0;`;
const DotLine = styled.div`width:2px;height:12px;background:#1a1a1a;opacity:0.15;margin-left:4px;`;
const SInput = styled.input`flex:1;background:${p=>p.theme.surface};border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:9px 12px;color:#1a1a1a;font-size:13px;font-family:inherit;outline:none;`;
const ClearBtn = styled.button`background:none;border:none;cursor:pointer;color:#6b5e4e;display:flex;align-items:center;padding:0 4px;`;
const SuggestList = styled.div`position:absolute;top:100%;left:0;right:0;background:#fff;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};box-shadow:3px 3px 0 #1a1a1a;z-index:50;overflow:hidden;margin-top:2px;`;
const SuggestItem = styled.div`display:flex;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0;&:last-child{border-bottom:none;}&:hover{background:${p=>p.theme.surface};}`;
const SuggestMain = styled.span`font-size:12px;font-weight:600;color:#1a1a1a;flex:1;`;
const SuggestSub  = styled.span`font-size:10px;color:#6b5e4e;white-space:nowrap;`;
const GoBtn = styled.button`width:100%;padding:11px;background:${p=>p.disabled?p.theme.surface:p.$accent};color:${p=>p.disabled?"#6b5e4e":"#fff"};border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};font-size:13px;font-weight:700;cursor:${p=>p.disabled?"not-allowed":"pointer"};box-shadow:${p=>p.disabled?"none":"3px 3px 0 #1a1a1a"};display:flex;align-items:center;justify-content:center;gap:6px;`;
const ResultLabel = styled.div`font-size:10px;font-weight:700;color:#6b5e4e;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;`;
const NoResult = styled.p`font-size:11px;color:#6b5e4e;font-style:italic;`;
const StopsRow = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:12px;`;
const StopChip = styled.div`display:flex;align-items:center;gap:6px;background:#fff;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:7px 10px;font-size:11px;font-weight:600;color:#1a1a1a;box-shadow:2px 2px 0 #1a1a1a;margin-bottom:5px;`;
const RouteCard = styled.div`display:flex;align-items:center;background:#fff;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};overflow:hidden;box-shadow:3px 3px 0 #1a1a1a;margin-bottom:8px;`;
const RouteStripe = styled.div`width:6px;background:${p=>p.$accent};align-self:stretch;flex-shrink:0;`;
const RouteBody = styled.div`flex:1;padding:10px 12px;`;
const RouteNum  = styled.div`font-size:14px;font-weight:800;color:${p=>p.$accent};font-family:'Syne',sans-serif;`;
const RouteName = styled.div`font-size:11px;color:#6b5e4e;margin-top:1px;`;
const RouteMode = styled.div`display:flex;align-items:center;gap:4px;padding:0 12px;font-size:10px;font-weight:700;color:${p=>p.$accent};`;
const MetroLines = styled.div`display:flex;flex-direction:column;gap:8px;`;
const MetroLine = styled.div`display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:10px 14px;box-shadow:2px 2px 0 #1a1a1a;`;
const MetroLineDot = styled.div`width:14px;height:14px;border-radius:50%;background:${p=>p.$color};border:2px solid #1a1a1a;flex-shrink:0;`;
const MetroLineInfo = styled.div``;
const MetroLineName = styled.div`font-size:12px;font-weight:700;color:#1a1a1a;`;
const MetroLineRoute = styled.div`font-size:11px;color:#6b5e4e;`;
const MetroStopCard = styled.div`display:flex;align-items:center;gap:8px;background:#fff;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:9px 12px;box-shadow:2px 2px 0 #1a1a1a;margin-bottom:6px;`;
const MetroStopDot = styled.div`width:10px;height:10px;border-radius:50%;background:${p=>p.$color};border:2px solid #1a1a1a;flex-shrink:0;`;
const StopName = styled.div`font-size:12px;font-weight:600;color:#1a1a1a;`;
const StopLine = styled.div`font-size:10px;font-weight:600;color:${p=>p.$color};`;
const TrainToggle = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:0;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};overflow:hidden;`;
const TrainToggleBtn = styled.button`display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border:none;cursor:pointer;font-size:12px;font-weight:700;background:${p=>p.$active?p.$accent:p.theme.surface};color:${p=>p.$active?"#fff":"#1a1a1a"};border-right:${p=>p.$active?"none":"1px solid #1a1a1a"};`;
const TrainSearchBox = styled.div`background:#fff;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:16px;box-shadow:3px 3px 0 #1a1a1a;display:flex;flex-direction:column;gap:10px;`;
const TrainLabel = styled.div`font-size:10px;font-weight:700;color:#6b5e4e;text-transform:uppercase;letter-spacing:1px;`;
const TrainInputRow = styled.div`display:flex;gap:8px;`;
const TrainInput = styled.input`flex:1;background:${p=>p.theme.surface};border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:10px 12px;color:#1a1a1a;font-size:13px;font-family:inherit;outline:none;`;
const PNRHint = styled.p`font-size:10px;color:#6b5e4e;`;
const TrainResultBox = styled.div`background:${p=>p.$accent}10;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:14px;`;
const TrainName = styled.div`font-size:15px;font-weight:800;color:#1a1a1a;font-family:'Syne',sans-serif;`;
const TrainNum  = styled.div`font-size:12px;font-weight:700;color:${p=>p.$accent};margin-bottom:8px;`;
const TrainStatus = styled.div`display:flex;align-items:center;gap:4px;font-size:13px;color:#1a1a1a;`;
const TrainDelay = styled.div`font-size:12px;font-weight:700;color:${p=>p.$late?"#d94f2a":"#16a34a"};margin-top:4px;`;
const TrainGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;`;
const TrainChip = styled.div`background:#fff;border:2px solid #1a1a1a;border-radius:${p=>p.theme.radius};padding:8px 10px;cursor:pointer;box-shadow:2px 2px 0 #1a1a1a;&:hover{background:${p=>p.$accent}10;}`;
const TrainChipNo   = styled.div`font-size:13px;font-weight:800;color:${p=>p.$accent};font-family:'Syne',sans-serif;`;
const TrainChipName = styled.div`font-size:10px;color:#6b5e4e;margin-top:1px;`;
const InfoBox = styled.div`background:${p=>p.$accent}0d;border:2px dashed ${p=>p.$accent}60;border-radius:${p=>p.theme.radius};padding:14px;`;
const InfoTitle = styled.div`font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;`;
const InfoList = styled.ul`list-style:none;display:flex;flex-direction:column;gap:5px;li{font-size:11px;color:#6b5e4e;padding-left:12px;position:relative;&::before{content:"→";position:absolute;left:0;}}code{background:#1a1a1a;color:#fff;padding:1px 5px;border-radius:3px;font-size:10px;}`;
const ErrorMsg = styled.p`color:#d94f2a;font-size:12px;font-weight:600;`;
