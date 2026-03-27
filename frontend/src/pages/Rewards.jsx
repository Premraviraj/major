import { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { MdToken, MdDirectionsBus, MdTrain, MdSubway, MdLocalMovies, MdPark, MdTwoWheeler } from "react-icons/md";

const CATEGORIES = ["All", "Transport", "Entertainment", "Eco"];
const REWARDS = [
  { id: 1, title: "Bike Rental",  desc: "1-hour bike rental pass",      cost: 50,  category: "Transport",     icon: MdTwoWheeler,    color: "#0f766e" },
  { id: 2, title: "Bus Pass",     desc: "1-day BMTC unlimited pass",    cost: 100, category: "Transport",     icon: MdDirectionsBus, color: "#7c3aed" },
  { id: 3, title: "Movie Ticket", desc: "1 standard movie ticket",      cost: 150, category: "Entertainment", icon: MdLocalMovies,   color: "#d94f2a" },
  { id: 4, title: "Plant a Tree", desc: "We plant a tree in your name", cost: 80,  category: "Eco",           icon: MdPark,          color: "#15803d" },
  { id: 5, title: "Metro Pass",   desc: "1-day metro unlimited pass",   cost: 120, category: "Transport",     icon: MdSubway,        color: "#c17f3a" },
  { id: 6, title: "Train Pass",   desc: "Single journey train ticket",  cost: 200, category: "Transport",     icon: MdTrain,         color: "#0e7490" },
];

export default function Rewards() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [cat, setCat] = useState("All");
  const [redeeming, setRedeeming] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  async function redeem(reward) {
    if (!profile || profile.total_tokens < reward.cost) return;
    setRedeeming(reward.id);
    await supabase.rpc("increment_tokens", { p_user_id: user.id, p_amount: -reward.cost });
    setProfile(p => ({ ...p, total_tokens: p.total_tokens - reward.cost }));
    setMsg("Redeemed " + reward.title + " for " + reward.cost + " TRT");
    setTimeout(() => setMsg(""), 3000);
    setRedeeming(null);
  }

  const filtered = cat === "All" ? REWARDS : REWARDS.filter(r => r.category === cat);

  return (
    <Page>
      <Header>
        <PageTitle>Rewards</PageTitle>
        <TokenChip><MdToken size={14} />{profile?.total_tokens || 0} TRT</TokenChip>
      </Header>

      {msg && <Toast>{msg}</Toast>}

      <Filters>
        {CATEGORIES.map(c => (
          <FilterBtn key={c} active={cat === c} onClick={() => setCat(c)}>{c}</FilterBtn>
        ))}
      </Filters>

      <Grid>
        {filtered.map(reward => {
          const Icon = reward.icon;
          const can = (profile?.total_tokens || 0) >= reward.cost;
          return (
            <RCard key={reward.id} style={{ borderTop: "4px solid " + reward.color }}>
              <RIco style={{ background: reward.color + "18", color: reward.color }}>
                <Icon size={22} />
              </RIco>
              <RTitle>{reward.title}</RTitle>
              <RDesc>{reward.desc}</RDesc>
              <RBottom>
                <RCost><MdToken size={12} />{reward.cost}</RCost>
                <RBtn
                  can={can}
                  disabled={!can || redeeming === reward.id}
                  onClick={() => redeem(reward)}
                >
                  {redeeming === reward.id ? "..." : can ? "Redeem" : "Need more"}
                </RBtn>
              </RBottom>
            </RCard>
          );
        })}
      </Grid>
    </Page>
  );
}

const Page = styled.div`width:100%;min-height:100vh;background:${p=>p.theme.bg};padding-bottom:100px;`;
const Header = styled.div`display:flex;justify-content:space-between;align-items:center;padding:20px 20px 0;`;
const PageTitle = styled.h1`font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${p=>p.theme.text};`;
const TokenChip = styled.div`display:flex;align-items:center;gap:5px;background:${p=>p.theme.tag};color:${p=>p.theme.tagText};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:6px 12px;font-weight:700;font-size:13px;box-shadow:${p=>p.theme.shadow};`;
const Toast = styled.div`margin:12px 20px 0;background:${p=>p.theme.tag};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:10px 14px;color:${p=>p.theme.tagText};font-size:13px;font-weight:600;`;
const Filters = styled.div`display:flex;gap:8px;padding:16px 20px 0;overflow-x:auto;&::-webkit-scrollbar{display:none;}`;
const FilterBtn = styled.button`padding:7px 16px;border-radius:${p=>p.theme.radius};white-space:nowrap;font-size:12px;font-weight:600;cursor:pointer;border:${p=>p.theme.border};background:${p=>p.active?p.theme.primary:p.theme.surface};color:${p=>p.active?"#fff":p.theme.text};box-shadow:${p=>p.active?p.theme.shadow:"none"};`;
const Grid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px 20px;`;
const RCard = styled.div`background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;display:flex;flex-direction:column;gap:8px;box-shadow:${p=>p.theme.shadow};`;
const RIco = styled.div`width:44px;height:44px;border-radius:${p=>p.theme.radius};display:flex;align-items:center;justify-content:center;border:2px solid #1a1a1a;`;
const RTitle = styled.div`font-size:14px;font-weight:700;color:${p=>p.theme.text};`;
const RDesc = styled.div`font-size:11px;color:${p=>p.theme.muted};flex:1;line-height:1.4;`;
const RBottom = styled.div`display:flex;align-items:center;justify-content:space-between;margin-top:4px;`;
const RCost = styled.div`display:flex;align-items:center;gap:3px;font-size:12px;font-weight:700;color:${p=>p.theme.primary};`;
const RBtn = styled.button`padding:7px 12px;border-radius:${p=>p.theme.radius};font-size:11px;font-weight:700;cursor:${p=>p.can?"pointer":"not-allowed"};background:${p=>p.can?p.theme.primary:p.theme.surface};border:${p=>p.theme.border};color:${p=>p.can?"#fff":p.theme.muted};box-shadow:${p=>p.can?p.theme.shadow:"none"};`;
