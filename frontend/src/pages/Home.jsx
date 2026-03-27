import { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from "chart.js";
import { MdDirectionsBus, MdTrain, MdSubway, MdAirportShuttle, MdEco, MdToken, MdRoute, MdEmojiEvents } from "react-icons/md";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const TRANSPORT_ICONS = { BMTC: MdDirectionsBus, KSRTC: MdAirportShuttle, Metro: MdSubway, Railway: MdTrain };

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  async function fetchAll() {
    let { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!prof) {
      // New profile — don't hardcode tokens, let DB defaults handle it
      const { data } = await supabase.from("profiles")
        .upsert({ id: user.id, email: user.email })
        .select().maybeSingle();
      prof = data;
    }
    setProfile(prof);
    const { data: t } = await supabase.from("trips").select("*").eq("user_id", user.id).order("logged_at", { ascending: true });
    setTrips(t || []);
    const { data: lb } = await supabase.from("profiles").select("id,email,full_name,total_tokens,avatar").order("total_tokens", { ascending: false }).limit(10);
    setLeaderboard(lb || []);
  }

  const totalTrips = trips.length;
  const totalDist = trips.reduce((s, t) => s + (t.distance_km || 0), 0);
  const co2 = (totalDist * 0.1).toFixed(1);
  const tokens = profile?.total_tokens || 0;
  const typeCounts = trips.reduce((acc, t) => { acc[t.transport_type] = (acc[t.transport_type] || 0) + 1; return acc; }, {});

  const last7 = trips.slice(-7);
  const lineData = {
    labels: last7.map(t => new Date(t.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    datasets: [{
      label: "Tokens Earned",
      data: last7.map(t => t.tokens_earned || 0),
      borderColor: "#0f766e",
      backgroundColor: "rgba(15,118,110,0.12)",
      tension: 0.4, fill: true,
      pointBackgroundColor: "#fff",
      pointBorderColor: "#0f766e",
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      borderWidth: 2.5,
    }],
  };
  const doughnutData = {
    labels: ["BMTC", "KSRTC", "Metro", "Railway"],
    datasets: [{
      data: ["BMTC","KSRTC","Metro","Railway"].map(t => typeCounts[t] || 0),
      backgroundColor: ["#0f766e","#7c3aed","#d94f2a","#c17f3a"],
      borderWidth: 3,
      borderColor: "#f5f0e8",
      hoverBorderColor: "#1a1a1a",
      hoverOffset: 6,
    }],
  };
  const chartOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a1a",
        titleColor: "#fff",
        bodyColor: "#99f6e4",
        padding: 10,
        cornerRadius: 4,
        titleFont: { family: "Space Grotesk", size: 11, weight: "700" },
        bodyFont: { family: "Space Grotesk", size: 12 },
        callbacks: { label: ctx => ` ${ctx.parsed.y} TRT` },
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b5e4e", font: { size: 10, family: "Space Grotesk", weight: "600" } },
        grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
        border: { color: "#1a1a1a", width: 2 },
      },
      y: {
        ticks: { color: "#6b5e4e", font: { size: 10, family: "Space Grotesk" } },
        grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
        border: { color: "#1a1a1a", width: 2 },
        beginAtZero: true,
      },
    },
  };
  const doughnutOpts = {
    responsive: true,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#1a1a1a",
          font: { size: 11, family: "Space Grotesk", weight: "600" },
          padding: 14,
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: "rectRounded",
        },
      },
      tooltip: {
        backgroundColor: "#1a1a1a",
        titleColor: "#fff",
        bodyColor: "#99f6e4",
        padding: 10,
        cornerRadius: 4,
        callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} trips` },
      },
    },
  };

  return (
    <Page>
      {/* Hero bento tile */}
      <HeroTile>
        <HeroLeft>
          <HeroLabel>WELCOME BACK</HeroLabel>
          <HeroName>{profile?.full_name || user?.email?.split("@")[0] || "Traveler"}</HeroName>
          <HeroSub>Keep riding, keep earning</HeroSub>
        </HeroLeft>
        <TokenTile>
          <MdToken size={20} />
          <TNum>{tokens}</TNum>
          <TLbl>TRT</TLbl>
        </TokenTile>
      </HeroTile>

      {/* Bento grid */}
      <Bento>
        {/* Stats row */}
        <StatTile $color="#fde68a"><StatIco><MdRoute size={18} /></StatIco><StatNum>{totalTrips}</StatNum><StatLbl>Trips</StatLbl></StatTile>
        <StatTile $color="#99f6e4"><StatIco><MdEco size={18} /></StatIco><StatNum>{co2}<StatU>kg</StatU></StatNum><StatLbl>CO₂ Saved</StatLbl></StatTile>
        <StatTile $color="#ddd6fe"><StatIco><MdToken size={18} /></StatIco><StatNum>{tokens}</StatNum><StatLbl>Tokens</StatLbl></StatTile>
        <StatTile $color="#fed7aa"><StatIco><MdRoute size={18} /></StatIco><StatNum>{totalDist}<StatU>km</StatU></StatNum><StatLbl>Distance</StatLbl></StatTile>

        {/* Transport breakdown */}
        <TransportTile>
          <TileLabel>BY TRANSPORT</TileLabel>
          <TTypeGrid>
            {Object.entries(TRANSPORT_ICONS).map(([type, Icon]) => (
              <TTypeCard key={type}>
                <Icon size={18} />
                <TTypeNum>{typeCounts[type] || 0}</TTypeNum>
                <TTypeLbl>{type}</TTypeLbl>
              </TTypeCard>
            ))}
          </TTypeGrid>
        </TransportTile>

        {trips.length > 0 && (
          <ChartTile>
            <TileLabel>TOKEN TREND — LAST {last7.length} TRIPS</TileLabel>
            <Line data={lineData} options={chartOpts} />
          </ChartTile>
        )}

        {trips.length > 0 && (
          <DonutTile>
            <TileLabel>MODE SPLIT</TileLabel>
            <Doughnut data={doughnutData} options={doughnutOpts} />
          </DonutTile>
        )}

        {/* Leaderboard */}
        <LeaderTile>
          <TileLabel><MdEmojiEvents size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />LEADERBOARD</TileLabel>
          {leaderboard.map((u, i) => (
            <LRow key={u.id} $me={u.id === user.id}>
              <LRank>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</LRank>
              <LAv>{u.avatar || "🧑"}</LAv>
              <LName $me={u.id === user.id}>{u.id === user.id ? "You" : (u.full_name || u.email?.split("@")[0])}</LName>
              <LScore><MdToken size={11} />{u.total_tokens}</LScore>
            </LRow>
          ))}
        </LeaderTile>
      </Bento>
    </Page>
  );
}

// Remove unused helper

const Page = styled.div`width:100%;min-height:100vh;background:${p=>p.theme.bg};padding-bottom:100px;`;

const HeroTile = styled.div`
  width:100%;background:${p=>p.theme.primary};
  border-bottom:${p=>p.theme.border};
  padding:24px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;
`;
const HeroLeft = styled.div``;
const HeroLabel = styled.div`font-size:10px;font-weight:700;color:rgba(255,255,255,0.65);letter-spacing:1.5px;margin-bottom:4px;`;
const HeroName = styled.h1`font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#fff;margin-bottom:2px;`;
const HeroSub = styled.p`font-size:12px;color:rgba(255,255,255,0.65);`;
const TokenTile = styled.div`
  display:flex;flex-direction:column;align-items:center;gap:1px;
  background:#fff;border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};
  padding:12px 16px;box-shadow:${p=>p.theme.shadow};flex-shrink:0;
`;
const TNum = styled.div`font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${p=>p.theme.primary};line-height:1;margin:2px 0;`;
const TLbl = styled.div`font-size:10px;font-weight:700;color:${p=>p.theme.muted};letter-spacing:0.5px;`;

const Bento = styled.div`padding:16px 20px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;`;

const StatTile = styled.div`
  background:${p=>p.$color||p.theme.card};border:${p=>p.theme.border};
  border-radius:${p=>p.theme.radius};padding:16px 12px;
  box-shadow:${p=>p.theme.shadow};
`;
const StatIco = styled.div`color:#1a1a1a;margin-bottom:8px;`;
const StatNum = styled.div`font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#1a1a1a;line-height:1;`;
const StatU = styled.span`font-size:11px;font-weight:600;margin-left:1px;`;
const StatLbl = styled.div`font-size:10px;font-weight:600;color:#1a1a1a;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px;`;

const TransportTile = styled.div`grid-column:span 4;background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};`;
const TileLabel = styled.div`font-size:10px;font-weight:700;color:${p=>p.theme.muted};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;`;
const TTypeGrid = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:10px;`;
const TTypeCard = styled.div`background:${p=>p.theme.surface};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:14px 8px;text-align:center;box-shadow:3px 3px 0 #1a1a1a;color:#1a1a1a;`;
const TTypeNum = styled.div`font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin:6px 0 2px;`;
const TTypeLbl = styled.div`font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;`;

const ChartTile = styled.div`grid-column:span 3;background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};`;
const DonutTile = styled.div`grid-column:span 1;background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};`;

const LeaderTile = styled.div`grid-column:span 4;background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};display:flex;flex-direction:column;gap:6px;`;
const LRow = styled.div`display:flex;align-items:center;gap:10px;background:${p=>p.$me?p.theme.tag:p.theme.surface};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:10px 12px;`;
const LRank = styled.div`font-size:16px;width:24px;text-align:center;`;
const LAv = styled.div`font-size:20px;width:28px;text-align:center;`;
const LName = styled.div`flex:1;font-size:13px;font-weight:${p=>p.$me?"700":"500"};color:#1a1a1a;`;
const LScore = styled.div`display:flex;align-items:center;gap:3px;font-size:12px;font-weight:700;color:${p=>p.theme.primary};`;
