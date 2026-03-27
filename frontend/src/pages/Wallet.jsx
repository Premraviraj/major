import { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { MdToken, MdArrowUpward, MdArrowDownward, MdDirectionsBus } from "react-icons/md";

export default function Wallet() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    supabase.from("trips").select("*").eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .then(({ data }) => setTrips(data || []));
    supabase.from("redemptions").select("*").eq("user_id", user.id)
      .order("redeemed_at", { ascending: false })
      .then(({ data }) => setRedemptions(data || []));
  }, [user]);

  // Fetch directly from DB columns — no client-side computation
  const earned = profile?.tokens_earned ?? trips.reduce((s, t) => s + (t.tokens_earned || 0), 0);
  const spent  = profile?.tokens_spent  ?? redemptions.reduce((s, r) => s + (r.tokens_spent || 0), 0);

  // Merge trips + redemptions into a unified timeline
  const timeline = [
    ...trips.map(t => ({ ...t, _type: "trip", _date: t.logged_at })),
    ...redemptions.map(r => ({ ...r, _type: "redemption", _date: r.redeemed_at })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date));

  return (
    <Page>
      <Header>
        <PageTitle>Wallet</PageTitle>
        <Tag>TRT</Tag>
      </Header>

      <Bento>
        <BalanceTile>
          <BalTop>
            <BalIcon><MdToken size={24} /></BalIcon>
            <BalVal>{profile?.total_tokens || 0}</BalVal>
          </BalTop>
          <BalLabel>TOKEN BALANCE</BalLabel>
          <BalStats>
            <BalStat $green><MdArrowUpward size={12} />+{earned} earned</BalStat>
            <BalStat><MdArrowDownward size={12} />-{spent} spent</BalStat>
          </BalStats>
        </BalanceTile>

        <EarnedTile>
          <MiniLabel>EARNED</MiniLabel>
          <MiniVal $green>+{earned}</MiniVal>
          <MiniSub>TRT tokens</MiniSub>
        </EarnedTile>

        <SpentTile>
          <MiniLabel>SPENT</MiniLabel>
          <MiniVal>-{spent}</MiniVal>
          <MiniSub>TRT tokens</MiniSub>
        </SpentTile>

        <HistoryTile>
          <TileLabel>TRANSACTION HISTORY</TileLabel>
          {timeline.length === 0
            ? <Empty>No transactions yet. Log a trip to earn tokens.</Empty>
            : timeline.map(item => (
                <TxRow key={item.id}>
                  <TxIco $green={item._type === "trip"}>
                    {item._type === "redemption" ? <MdArrowDownward size={15} /> : <MdDirectionsBus size={15} />}
                  </TxIco>
                  <TxInfo>
                    <TxLabel>
                      {item._type === "redemption"
                        ? `Redeemed: ${item.reward_title}`
                        : `${item.transport_type || "Trip"} · ${item.distance_km}km`}
                    </TxLabel>
                    <TxDate>{new Date(item._date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</TxDate>
                  </TxInfo>
                  <TxAmt $green={item._type === "trip"}>
                    {item._type === "redemption" ? `-${item.tokens_spent}` : `+${item.tokens_earned}`} TRT
                  </TxAmt>
                </TxRow>
              ))
          }
        </HistoryTile>
      </Bento>
    </Page>
  );
}

const Page = styled.div`width:100%;min-height:100vh;background:${p=>p.theme.bg};padding-bottom:80px;`;
const Header = styled.div`display:flex;align-items:center;gap:12px;padding:16px 16px 0;`;
const PageTitle = styled.h1`font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:${p=>p.theme.text};`;
const Tag = styled.span`background:${p=>p.theme.tag};color:${p=>p.theme.tagText};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:3px 10px;font-size:11px;font-weight:700;letter-spacing:1px;`;
const Bento = styled.div`padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;`;
const BalanceTile = styled.div`grid-column:span 2;background:${p=>p.theme.primary};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:20px;box-shadow:${p=>p.theme.shadowLg};color:#fff;`;
const BalTop = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:4px;`;
const BalIcon = styled.div`opacity:0.8;`;
const BalVal = styled.div`font-family:'Syne',sans-serif;font-size:42px;font-weight:800;line-height:1;`;
const BalLabel = styled.div`font-size:11px;font-weight:700;letter-spacing:1.5px;opacity:0.7;margin-bottom:12px;`;
const BalStats = styled.div`display:flex;gap:20px;`;
const BalStat = styled.div`display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:${p=>p.$green?"#d1fae5":"#fecaca"};`;
const EarnedTile = styled.div`background:#d1fae5;border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};`;
const SpentTile = styled.div`background:#fecaca;border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};`;
const MiniLabel = styled.div`font-size:10px;font-weight:700;letter-spacing:1.5px;color:#1a1a1a;margin-bottom:6px;`;
const MiniVal = styled.div`font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:${p=>p.$green?"#065f46":"#991b1b"};`;
const MiniSub = styled.div`font-size:11px;color:#1a1a1a;margin-top:2px;`;
const HistoryTile = styled.div`grid-column:span 2;background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:14px;box-shadow:${p=>p.theme.shadow};display:flex;flex-direction:column;gap:8px;`;
const TileLabel = styled.div`font-size:10px;font-weight:700;color:${p=>p.theme.muted};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;`;
const Empty = styled.p`color:${p=>p.theme.muted};font-size:13px;text-align:center;padding:20px 0;`;
const TxRow = styled.div`display:flex;align-items:center;gap:10px;background:${p=>p.theme.surface};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:10px 12px;`;
const TxIco = styled.div`width:32px;height:32px;border-radius:${p=>p.theme.radius};background:${p=>p.$green?"#d1fae5":"#fecaca"};border:${p=>p.theme.border};display:flex;align-items:center;justify-content:center;color:${p=>p.$green?"#065f46":"#991b1b"};flex-shrink:0;`;
const TxInfo = styled.div`flex:1;min-width:0;`;
const TxLabel = styled.div`font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const TxDate = styled.div`font-size:11px;color:${p=>p.theme.muted};margin-top:1px;`;
const TxAmt = styled.div`font-size:13px;font-weight:700;color:${p=>p.$green?"#065f46":"#991b1b"};flex-shrink:0;`;
