import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { MdMyLocation, MdSearch, MdDirectionsBus, MdTrain, MdSubway, MdAirportShuttle, MdQrCode, MdClose, MdSwapVert, MdToken, MdRoute } from "react-icons/md";
import { QRCodeSVG } from "qrcode.react";
import { useRazorpay } from "../hooks/useRazorpay";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" });

const ICON_MAP = {
  BMTC: MdDirectionsBus,
  KSRTC: MdAirportShuttle,
  Metro: MdSubway,
  Railway: MdTrain,
};

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

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Use a CORS proxy for Nominatim to avoid 429 / CORS issues in dev
const NOMINATIM_BASE = "/nominatim";

function nominatimUrl(path) {
  return NOMINATIM_BASE + path;
}
const BBOX_BANGALORE = "77.4601,12.8340,77.7800,13.1400";
const BBOX_KARNATAKA = "74.0,11.5,78.6,18.5";

function getBbox(transportType) {
  return transportType === "KSRTC" ? BBOX_KARNATAKA : BBOX_BANGALORE;
}

function getSearchSuffix(transportType) {
  return transportType === "KSRTC" ? ", Karnataka" : ", Bangalore";
}

export default function Travel() {
  const { user } = useAuth();
  const [transportTypes, setTransportTypes] = useState([]);
  const [pos, setPos] = useState(null);
  const [posName, setPosName] = useState("Current Location");
  const [accuracy, setAccuracy] = useState(null);
  const [filter, setFilter] = useState("BMTC");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [logging, setLogging] = useState(false);
  const [fromSug, setFromSug] = useState([]);
  const [toSug, setToSug] = useState([]);
  const [fromFocus, setFromFocus] = useState(false);
  const [toFocus, setToFocus] = useState(false);

  const debouncedFrom = useDebounce(from, 600);
  const debouncedTo = useDebounce(to, 600);

  // Fetch transport types from DB
  useEffect(() => {
    supabase.from("transport_types").select("*").order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTransportTypes(data.map(t => ({ ...t, icon: ICON_MAP[t.key] || MdDirectionsBus })));
          setFilter(data[0].key);
        }
      });
  }, []);

  // GPS — fast fix first (cell/wifi), then refine with high accuracy
  useEffect(() => {
    let refined = false;

    // Fast fix — no GPS chip, instant result
    navigator.geolocation.getCurrentPosition(
      p => {
        setPos([p.coords.latitude, p.coords.longitude]);
        setAccuracy(p.coords.accuracy?.toFixed(0));
      },
      null,
      { enableHighAccuracy: false, timeout: 5000 }
    );

    // Refine in background with GPS chip
    const watchId = navigator.geolocation.watchPosition(
      p => {
        if (refined && p.coords.accuracy > 50) return; // skip if not better
        refined = true;
        setPos([p.coords.latitude, p.coords.longitude]);
        setAccuracy(p.coords.accuracy?.toFixed(0));
      },
      null,
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Debounced search — only fires 600ms after user stops typing
  useEffect(() => {
    if (debouncedFrom.length >= 3 && !fromCoords) searchPlace(debouncedFrom, setFromSug);
    else if (debouncedFrom.length < 3) setFromSug([]);
  }, [debouncedFrom]);

  useEffect(() => {
    if (debouncedTo.length >= 3 && !toCoords) searchPlace(debouncedTo, setToSug);
    else if (debouncedTo.length < 3) setToSug([]);
  }, [debouncedTo]);

  useEffect(() => {
    if (fromCoords && toCoords) setDistance(haversine(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1]).toFixed(1));
  }, [fromCoords, toCoords]);

  async function searchPlace(q, setSug) {
    try {
      const bbox = getBbox(filter);
      const suffix = getSearchSuffix(filter);
      const path = `/search?q=${encodeURIComponent(q)}${suffix}&format=json&limit=5&viewbox=${bbox}&bounded=1`;
      const res = await fetch(nominatimUrl(path));
      if (res.ok) setSug(await res.json());
    } catch { setSug([]); }
  }

  const selectedType = transportTypes.find(t => t.key === filter) || transportTypes[0] || null;
  const price = (selectedType && distance) ? (selectedType.base_fare + parseFloat(distance) * selectedType.fare_per_km).toFixed(0) : null;
  const tokens = (selectedType && distance) ? (parseFloat(distance) * selectedType.tokens_per_km).toFixed(0) : null;

  const { pay } = useRazorpay();

  async function logTrip() {
    if (!distance) return;
    setLogging(true);
    const km = Math.round(parseFloat(distance));
    const tokensEarned = km * selectedType.tokens_per_km;
    const fare = parseInt(price);

    pay({
      amount: fare,
      description: `${filter} ticket · ${distance}km · ${from.split(",")[0]} → ${to.split(",")[0]}`,
      onSuccess: async (paymentId) => {
        await supabase.from("trips").insert({ user_id: user.id, distance_km: km, tokens_earned: tokensEarned, transport_type: filter });
        await supabase.rpc("increment_tokens", { p_user_id: user.id, p_amount: tokensEarned });
        setTicket({ id: `TRT-${Date.now()}`, from, to, distance, type: filter, price, tokens: tokensEarned, time: new Date().toLocaleString(), paymentId });
        setLogging(false);
      },
      onFailure: (msg) => {
        setLogging(false);
        alert(msg || "Payment failed");
      },
    });
  }

  function pickFrom(name, coords) { setFrom(name); setFromCoords(coords); setFromSug([]); setFromFocus(false); }
  function pickTo(name, coords) { setTo(name); setToCoords(coords); setToSug([]); setToFocus(false); }

  const showFromDrop = fromFocus && !fromCoords;
  const showToDrop = toFocus && !toCoords;

  return (
    <Page>
      <MapWrap>
        {pos ? (
          <MapContainer key="map" center={pos} zoom={14} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            <RecenterMap coords={pos} />
            <Marker position={pos}><Popup>You are here · ±{accuracy}m</Popup></Marker>
            {accuracy && selectedType && <Circle center={pos} radius={parseFloat(accuracy)} color={selectedType.color} fillOpacity={0.08} />}
          </MapContainer>
        ) : (
          <MapPlaceholder><MdMyLocation size={40} /><p>Getting location...</p></MapPlaceholder>
        )}
        {accuracy && <GpsBadge>GPS ±{accuracy}m</GpsBadge>}
        <MapTitle>Bangalore</MapTitle>
      </MapWrap>

      <Content>
        <TypeRow>
          {transportTypes.map(({ key, icon: Icon, color }) => (
            <TypeBtn key={key} $active={filter === key} $color={color} onClick={() => setFilter(key)}>
              <Icon size={20} /><span>{key}</span>
            </TypeBtn>
          ))}
        </TypeRow>

        <RouteCard>
          <RouteLabel>Plan Your Route · {filter === "KSRTC" ? "Karnataka" : "Bangalore"}</RouteLabel>

          <SearchRow>
            <SearchDot $from />
            <SearchField>
              <SearchInput
                placeholder="From — departure"
                value={from}
                onFocus={() => setFromFocus(true)}
                onBlur={() => setTimeout(() => setFromFocus(false), 200)}
                onChange={e => { setFrom(e.target.value); setFromCoords(null); setDistance(null); }}
              />
              {from && <ClearBtn onClick={() => { setFrom(""); setFromCoords(null); setFromSug([]); setDistance(null); }}>×</ClearBtn>}
            </SearchField>
          </SearchRow>

          {showFromDrop && (
            <SuggestList>
              {pos && (
                <CurrentLocItem onClick={() => pickFrom(posName + ", Bangalore", pos)}>
                  <MdMyLocation size={14} />
                  <span><strong>{posName}</strong> — Current Location</span>
                  <NowBadge>NOW</NowBadge>
                </CurrentLocItem>
              )}
              {fromSug.map((s, i) => (
                <SuggestItem key={i} onClick={() => pickFrom(s.display_name.split(",").slice(0,3).join(", "), [parseFloat(s.lat), parseFloat(s.lon)])}>
                  <MdSearch size={13} />{s.display_name.split(",").slice(0,3).join(", ")}
                </SuggestItem>
              ))}
            </SuggestList>
          )}

          <DistanceConnector>
            <ConnLine />
            {distance && <DistPill><MdRoute size={11} />{distance} km</DistPill>}
            <ConnLine />
          </DistanceConnector>

          <SearchRow>
            <SearchDot />
            <SearchField>
              <SearchInput
                placeholder="To — destination"
                value={to}
                onFocus={() => setToFocus(true)}
                onBlur={() => setTimeout(() => setToFocus(false), 200)}
                onChange={e => { setTo(e.target.value); setToCoords(null); setDistance(null); }}
              />
              {to && <ClearBtn onClick={() => { setTo(""); setToCoords(null); setToSug([]); setDistance(null); }}>×</ClearBtn>}
            </SearchField>
          </SearchRow>

          {showToDrop && (
            <SuggestList>
              {pos && (
                <CurrentLocItem onClick={() => pickTo(posName + ", Bangalore", pos)}>
                  <MdMyLocation size={14} />
                  <span><strong>{posName}</strong> — Current Location</span>
                  <NowBadge>NOW</NowBadge>
                </CurrentLocItem>
              )}
              {toSug.map((s, i) => (
                <SuggestItem key={i} onClick={() => pickTo(s.display_name.split(",").slice(0,3).join(", "), [parseFloat(s.lat), parseFloat(s.lon)])}>
                  <MdSearch size={13} />{s.display_name.split(",").slice(0,3).join(", ")}
                </SuggestItem>
              ))}
            </SuggestList>
          )}

          {distance && (
            <InfoStrip>
              <InfoChip><MdRoute size={15} /><b>{distance} km</b><span>Distance</span></InfoChip>
              <InfoChip $yellow><b>₹{price}</b><span>Fare</span></InfoChip>
              <InfoChip $green><MdToken size={15} /><b>+{tokens}</b><span>TRT earned</span></InfoChip>
            </InfoStrip>
          )}

          <LogBtn onClick={logTrip} disabled={!distance || !selectedType || logging}>
            {logging ? "Logging..." : !distance ? "Select departure & destination" : `Log ${filter} Trip · Earn ${tokens} TRT`}
          </LogBtn>
        </RouteCard>
      </Content>

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
              <TicketRow><span>Distance</span><b>{ticket.distance} km</b></TicketRow>
              <TicketRow><span>Fare</span><b>₹{ticket.price}</b></TicketRow>
              <TicketRow $hi><span>Tokens</span><b>+{ticket.tokens} TRT</b></TicketRow>
              <TicketRow><span>Time</span><b>{ticket.time}</b></TicketRow>
              {ticket.paymentId && <TicketRow><span>Payment ID</span><b style={{fontSize:10}}>{ticket.paymentId}</b></TicketRow>}
            </TicketGrid>
          </ModalCard>
        </Modal>
      )}
    </Page>
  );
}

const Page = styled.div`width:100%;min-height:100vh;background:${p=>p.theme.bg};padding-bottom:100px;`;
const MapWrap = styled.div`width:100%;height:300px;position:relative;border-bottom:2px solid #1a1a1a;`;
const MapPlaceholder = styled.div`height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:${p=>p.theme.surface};color:${p=>p.theme.muted};font-size:14px;`;
const GpsBadge = styled.div`position:absolute;top:12px;right:12px;background:#fff;border:2px solid #1a1a1a;color:#1a1a1a;font-size:10px;font-weight:700;padding:4px 10px;border-radius:4px;z-index:999;box-shadow:2px 2px 0 #1a1a1a;`;
const MapTitle = styled.div`position:absolute;top:12px;left:12px;background:${p=>p.theme.primary};border:2px solid #1a1a1a;color:#fff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:4px;z-index:999;box-shadow:2px 2px 0 #1a1a1a;text-transform:uppercase;letter-spacing:0.5px;`;
const Content = styled.div`width:100%;padding:16px 20px;display:flex;flex-direction:column;gap:12px;`;
const TypeRow = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:10px;`;
const TypeBtn = styled.button`display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 8px;border-radius:4px;border:2px solid ${p=>p.$active?"#1a1a1a":"transparent"};background:${p=>p.$active?p.$color+"22":p.theme.surface};color:#1a1a1a;font-size:10px;font-weight:700;cursor:pointer;box-shadow:${p=>p.$active?"3px 3px 0 #1a1a1a":"none"};text-transform:uppercase;letter-spacing:0.5px;`;
const RouteCard = styled.div`background:${p=>p.theme.card};border:2px solid #1a1a1a;border-radius:4px;padding:18px;box-shadow:4px 4px 0 #1a1a1a;display:flex;flex-direction:column;gap:10px;`;
const RouteLabel = styled.div`font-size:10px;font-weight:700;color:${p=>p.theme.muted};text-transform:uppercase;letter-spacing:1.5px;`;
const SearchRow = styled.div`display:flex;align-items:center;gap:10px;`;
const SearchDot = styled.div`width:10px;height:10px;border-radius:50%;background:${p=>p.$from?p.theme.primary:"#d94f2a"};flex-shrink:0;border:2px solid #1a1a1a;`;
const SearchField = styled.div`flex:1;display:flex;align-items:center;background:${p=>p.theme.surface};border:2px solid #1a1a1a;border-radius:4px;padding:0 12px;`;
const SearchInput = styled.input`flex:1;background:transparent;border:none;outline:none;color:#1a1a1a;font-size:13px;font-weight:500;padding:11px 0;font-family:inherit;&::placeholder{color:${p=>p.theme.muted};}`;
const ClearBtn = styled.button`background:none;border:none;color:${p=>p.theme.muted};cursor:pointer;font-size:16px;padding:0 2px;`;
const SuggestList = styled.div`background:${p=>p.theme.card};border:2px solid #1a1a1a;border-radius:4px;overflow:hidden;box-shadow:3px 3px 0 #1a1a1a;`;
const CurrentLocItem = styled.div`display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:12px;font-weight:600;color:#1a1a1a;cursor:pointer;background:${p=>p.theme.tag};border-bottom:1px solid #1a1a1a;&:hover{opacity:0.85;}`;
const NowBadge = styled.span`margin-left:auto;background:#1a1a1a;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;letter-spacing:0.5px;`;
const SuggestItem = styled.div`display:flex;align-items:center;gap:8px;padding:9px 12px;font-size:12px;font-weight:500;color:#1a1a1a;cursor:pointer;&:hover{background:${p=>p.theme.tag};}`;
const DistanceConnector = styled.div`display:flex;align-items:center;gap:8px;padding:2px 0 2px 4px;`;
const ConnLine = styled.div`flex:1;height:2px;background:#1a1a1a;opacity:0.12;`;
const DistPill = styled.div`display:flex;align-items:center;gap:4px;background:${p=>p.theme.tag};border:2px solid #1a1a1a;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;color:#1a1a1a;white-space:nowrap;box-shadow:2px 2px 0 #1a1a1a;`;
const InfoStrip = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:10px;`;
const InfoChip = styled.div`background:${p=>p.$green?p.theme.tag:p.$yellow?"#fde68a":p.theme.surface};border:2px solid #1a1a1a;border-radius:4px;padding:10px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:2px 2px 0 #1a1a1a;b{display:block;font-size:16px;font-weight:800;color:#1a1a1a;font-family:'Syne',sans-serif;}span{font-size:10px;font-weight:600;color:${p=>p.theme.muted};text-transform:uppercase;letter-spacing:0.5px;}`;
const LogBtn = styled.button`width:100%;padding:14px;border-radius:4px;background:${p=>p.disabled?p.theme.surface:p.theme.primary};color:${p=>p.disabled?p.theme.muted:"#fff"};border:2px solid #1a1a1a;font-size:14px;font-weight:700;cursor:${p=>p.disabled?"not-allowed":"pointer"};box-shadow:${p=>p.disabled?"none":"4px 4px 0 #1a1a1a"};`;
const Modal = styled.div`position:fixed;inset:0;background:rgba(245,240,232,0.88);display:flex;align-items:center;justify-content:center;z-index:200;padding:24px;`;
const ModalCard = styled.div`background:${p=>p.theme.card};border:2px solid #1a1a1a;border-radius:4px;padding:24px;width:100%;max-width:340px;box-shadow:6px 6px 0 #1a1a1a;`;
const ModalTop = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;`;
const ModalTitle = styled.div`display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:#1a1a1a;font-family:'Syne',sans-serif;`;
const CloseBtn = styled.button`background:${p=>p.theme.surface};border:2px solid #1a1a1a;border-radius:4px;width:28px;height:28px;cursor:pointer;color:#1a1a1a;display:flex;align-items:center;justify-content:center;box-shadow:2px 2px 0 #1a1a1a;`;
const QRWrap = styled.div`display:flex;justify-content:center;background:${p=>p.theme.surface};border:2px solid #1a1a1a;border-radius:4px;padding:14px;margin-bottom:14px;`;
const TicketGrid = styled.div`display:flex;flex-direction:column;gap:5px;`;
const TicketRow = styled.div`display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:6px 10px;border-radius:4px;background:${p=>p.$hi?p.theme.tag:p.theme.surface};border:${p=>p.$hi?"2px solid #1a1a1a":"1px solid transparent"};span{color:${p=>p.theme.muted};font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:0.5px;}b{color:#1a1a1a;font-weight:700;}`;
