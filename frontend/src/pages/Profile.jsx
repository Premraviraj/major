import { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { MdToken, MdEco, MdRoute, MdEdit, MdCheck } from "react-icons/md";

const AVATARS = ["🧑‍💻","👩‍🚀","🧑‍🎨","👨‍🔬","🧑‍🚒","👩‍✈️","🧑‍🌾","👨‍🎤"];

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "" });
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatar, setAvatar] = useState("🧑‍💻");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data);
      setForm({ full_name: data?.full_name || user.user_metadata?.full_name || "", email: data?.email || user.email || "" });
      if (data?.avatar) setAvatar(data.avatar);
    });
    supabase.from("trips").select("*").eq("user_id", user.id).then(({ data }) => setTrips(data || []));
  }, [user]);

  async function saveProfile() {
    await supabase.from("profiles").update({ full_name: form.full_name, email: form.email, avatar }).eq("id", user.id);
    setProfile(p => ({ ...p, ...form, avatar }));
    setEditing(false);
  }

  async function selectAvatar(a) {
    setAvatar(a); setAvatarOpen(false);
    await supabase.from("profiles").update({ avatar: a }).eq("id", user.id);
  }

  const totalDist = trips.reduce((s, t) => s + (t.distance_km || 0), 0);
  const co2 = trips.reduce((s, t) => s + (t.co2_saved || (t.distance_km || 0) * 0.1), 0).toFixed(1);
  const ecoTrips = trips.filter(t => t.transport_type === "Metro" || t.transport_type === "Railway").length;

  return (
    <Page>
      <Bento>
        <AvatarTile>
          <AvatarBtn onClick={() => setAvatarOpen(true)}>
            {avatar}
            <EditDot><MdEdit size={10} /></EditDot>
          </AvatarBtn>
          <PName>{form.full_name || "User"}</PName>
          <PEmail>{form.email}</PEmail>
          <PJoin>Joined {new Date(user?.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</PJoin>
        </AvatarTile>

        <StatTile color="#fde68a">
          <MdToken size={18} />
          <SVal>{profile?.total_tokens || 0}</SVal>
          <SLbl>TOKENS</SLbl>
        </StatTile>
        <StatTile color="#99f6e4">
          <MdEco size={18} />
          <SVal>{ecoTrips}</SVal>
          <SLbl>ECO TRIPS</SLbl>
        </StatTile>
        <StatTile color="#ddd6fe">
          <MdRoute size={18} />
          <SVal>{co2}kg</SVal>
          <SLbl>CO₂ SAVED</SLbl>
        </StatTile>

        {avatarOpen && (
          <PickerTile>
            <TileLabel>CHOOSE AVATAR</TileLabel>
            <AGrid>{AVATARS.map(a => <AOpt key={a} active={a === avatar} onClick={() => selectAvatar(a)}>{a}</AOpt>)}</AGrid>
            <CancelBtn onClick={() => setAvatarOpen(false)}>Cancel</CancelBtn>
          </PickerTile>
        )}

        <FormTile>
          <FormHeader>
            <TileLabel>EDIT PROFILE</TileLabel>
            {editing
              ? <ActionBtn onClick={saveProfile}><MdCheck size={13} />Save</ActionBtn>
              : <ActionBtn onClick={() => setEditing(true)}><MdEdit size={13} />Edit</ActionBtn>}
          </FormHeader>
          {[{ label: "Full Name", key: "full_name" }, { label: "Email", key: "email" }].map(({ label, key }) => (
            <FGroup key={key}>
              <FLabel>{label}</FLabel>
              <FInput disabled={!editing} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </FGroup>
          ))}
        </FormTile>
      </Bento>
    </Page>
  );
}

const Page = styled.div`width:100%;min-height:100vh;background:${p=>p.theme.bg};padding-top:52px;padding-bottom:32px;`;
const Bento = styled.div`padding:14px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;`;
const AvatarTile = styled.div`grid-column:span 3;background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:20px;text-align:center;box-shadow:${p=>p.theme.shadowLg};`;
const AvatarBtn = styled.button`font-size:52px;background:${p=>p.theme.surface};border:${p=>p.theme.border};border-radius:50%;width:84px;height:84px;cursor:pointer;position:relative;display:inline-flex;align-items:center;justify-content:center;box-shadow:${p=>p.theme.shadow};`;
const EditDot = styled.div`position:absolute;bottom:2px;right:2px;background:${p=>p.theme.primary};border:2px solid #1a1a1a;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:#fff;`;
const PName = styled.h2`font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:${p=>p.theme.text};margin:12px 0 3px;`;
const PEmail = styled.p`font-size:12px;color:${p=>p.theme.muted};`;
const PJoin = styled.p`font-size:11px;color:${p=>p.theme.muted};margin-top:3px;`;
const StatTile = styled.div`background:${p=>p.color};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px 12px;text-align:center;box-shadow:${p=>p.theme.shadow};color:#1a1a1a;`;
const SVal = styled.div`font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin:6px 0 2px;`;
const SLbl = styled.div`font-size:9px;font-weight:700;letter-spacing:1px;`;
const PickerTile = styled.div`grid-column:span 3;background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};`;
const TileLabel = styled.div`font-size:10px;font-weight:700;color:${p=>p.theme.muted};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;`;
const AGrid = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;`;
const AOpt = styled.button`font-size:30px;background:${p=>p.active?p.theme.tag:"transparent"};border:${p=>p.active?p.theme.border:"2px solid transparent"};border-radius:${p=>p.theme.radius};padding:8px;cursor:pointer;box-shadow:${p=>p.active?p.theme.shadow:"none"};`;
const CancelBtn = styled.button`width:100%;padding:9px;background:transparent;border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};color:${p=>p.theme.muted};cursor:pointer;font-size:13px;font-weight:600;`;
const FormTile = styled.div`grid-column:span 3;background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};`;
const FormHeader = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;`;
const ActionBtn = styled.button`display:flex;align-items:center;gap:5px;background:${p=>p.theme.primary};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:7px 12px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;box-shadow:${p=>p.theme.shadow};`;
const FGroup = styled.div`margin-bottom:12px;&:last-child{margin-bottom:0;}`;
const FLabel = styled.div`font-size:10px;font-weight:700;color:${p=>p.theme.muted};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;`;
const FInput = styled.input`width:100%;background:${p=>p.disabled?p.theme.surface:p.theme.bg};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:10px 12px;color:${p=>p.theme.text};font-size:13px;font-weight:500;outline:none;&:disabled{opacity:0.6;}&:focus{outline:2px solid ${p=>p.theme.primary};}`;
