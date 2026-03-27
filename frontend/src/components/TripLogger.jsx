import { useState } from "react";
import { supabase } from "../supabaseClient";
import { MdDirectionsBus, MdCheckCircle, MdErrorOutline, MdAddRoad } from "react-icons/md";

export default function TripLogger({ onTripLogged }) {
  const [distance, setDistance] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLog(e) {
    e.preventDefault();
    const km = parseInt(distance, 10);
    if (!km || km <= 0) return;

    setLoading(true);
    setStatus(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.functions.invoke("log-trip", {
      body: { userId: user.id, distance: km },
    });

    if (error || data?.error) {
      setStatus({ type: "error", message: error?.message || data?.error });
    } else {
      setStatus({
        type: "success",
        message: `Earned ${data.tokensEarned} TRT tokens! Receipt: ${data.entryHash?.slice(0, 16)}...`,
      });
      setDistance("");
      onTripLogged();
    }

    setLoading(false);
  }

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <MdAddRoad size={20} color="#4f46e5" />
        <h3 style={s.title}>Log a Trip</h3>
      </div>
      <p style={s.hint}>Enter the distance you traveled on public transport.</p>

      <form onSubmit={handleLog} style={s.form}>
        <div style={s.inputWrap}>
          <MdDirectionsBus size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            style={s.input}
            type="number"
            min="1"
            placeholder="Distance in km"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            required
          />
          <span style={s.unit}>km</span>
        </div>
        <button style={s.button} type="submit" disabled={loading}>
          {loading ? "Logging..." : "Log Trip & Earn Tokens"}
        </button>
      </form>

      {status && (
        <div style={{ ...s.statusBox, background: status.type === "success" ? "#f0fdf4" : "#fef2f2", borderColor: status.type === "success" ? "#bbf7d0" : "#fecaca" }}>
          {status.type === "success"
            ? <MdCheckCircle size={16} color="#16a34a" />
            : <MdErrorOutline size={16} color="#dc2626" />}
          <span style={{ ...s.statusText, color: status.type === "success" ? "#15803d" : "#dc2626" }}>
            {status.message}
          </span>
        </div>
      )}
    </div>
  );
}

const s = {
  card: { background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" },
  cardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { margin: 0, fontSize: 15, fontWeight: 600, color: "#1e293b" },
  hint: { margin: "0 0 16px", fontSize: 13, color: "#94a3b8" },
  form: { display: "flex", gap: 10 },
  inputWrap: {
    flex: 1, display: "flex", alignItems: "center", gap: 8,
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "0 14px",
  },
  input: { flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#1e293b", padding: "11px 0" },
  unit: { fontSize: 13, color: "#94a3b8", flexShrink: 0 },
  button: {
    padding: "11px 20px", borderRadius: 10,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", fontSize: 13,
    fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  },
  statusBox: {
    display: "flex", alignItems: "center", gap: 8,
    marginTop: 12, padding: "10px 14px",
    borderRadius: 8, border: "1px solid",
  },
  statusText: { fontSize: 13 },
};
