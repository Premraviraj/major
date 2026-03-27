import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { MdHistory, MdDirectionsBus, MdToken } from "react-icons/md";

export default function TripHistory({ refreshKey }) {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    async function fetchTrips() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(10);
      setTrips(data || []);
    }
    fetchTrips();
  }, [refreshKey]);

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <MdHistory size={20} color="#4f46e5" />
        <h3 style={s.title}>Trip History</h3>
      </div>

      {trips.length === 0 ? (
        <div style={s.empty}>
          <MdDirectionsBus size={36} color="#cbd5e1" />
          <p style={s.emptyText}>No trips yet. Start traveling to earn tokens.</p>
        </div>
      ) : (
        <div style={s.list}>
          {trips.map((trip) => (
            <div key={trip.id} style={s.row}>
              <div style={s.rowIcon}>
                <MdDirectionsBus size={18} color="#4f46e5" />
              </div>
              <div style={s.rowInfo}>
                <span style={s.rowDate}>
                  {new Date(trip.logged_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span style={s.rowDist}>{trip.distance_km} km</span>
              </div>
              <div style={s.rowTokens}>
                <MdToken size={14} color="#7c3aed" />
                <span style={s.rowTokenText}>+{trip.tokens_earned} TRT</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  card: { background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" },
  cardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  title: { margin: 0, fontSize: 15, fontWeight: 600, color: "#1e293b" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 10 },
  emptyText: { margin: 0, color: "#94a3b8", fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 2 },
  row: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 10px", borderRadius: 10,
    transition: "background 0.15s",
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "#ede9fe",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  rowInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  rowDate: { fontSize: 13, color: "#1e293b", fontWeight: 500 },
  rowDist: { fontSize: 12, color: "#94a3b8" },
  rowTokens: { display: "flex", alignItems: "center", gap: 4 },
  rowTokenText: { fontSize: 13, fontWeight: 600, color: "#7c3aed" },
};
