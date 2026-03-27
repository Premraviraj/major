import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import { supabase } from "../supabaseClient";
import { MdEmail, MdLock, MdPerson, MdAlternateEmail, MdVisibility, MdVisibilityOff, MdDirectionsBus } from "react-icons/md";

export default function Auth({ mode }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) setError(error.message); else navigate("/");
    } else {
      if (!form.name || !form.username) { setError("All fields required."); setLoading(false); return; }
      const { error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.name, username: form.username } },
      });
      if (error) setError(error.message); else navigate("/");
    }
    setLoading(false);
  }

  return (
    <Page>
      <Wrap>
        <BrandRow><BusIcon><MdDirectionsBus size={22} /></BusIcon><Brand>TransitRewards</Brand></BrandRow>
        <Card>
          <CardTitle>{isLogin ? "Sign In" : "Create Account"}</CardTitle>
          <CardSub>{isLogin ? "Welcome back, traveler" : "Start earning tokens for every trip"}</CardSub>
          <Form onSubmit={submit}>
            {!isLogin && (
              <>
                <Field><FIcon><MdPerson size={16} /></FIcon><FInput name="name" type="text" placeholder="Full name" value={form.name} onChange={handle} required /></Field>
                <Field><FIcon><MdAlternateEmail size={16} /></FIcon><FInput name="username" type="text" placeholder="Username" value={form.username} onChange={handle} required /></Field>
              </>
            )}
            <Field><FIcon><MdEmail size={16} /></FIcon><FInput name="email" type="email" placeholder="Email address" value={form.email} onChange={handle} required /></Field>
            <Field>
              <FIcon><MdLock size={16} /></FIcon>
              <FInput name="password" type={showPw ? "text" : "password"} placeholder="Password" value={form.password} onChange={handle} required minLength={6} />
              <EyeBtn type="button" onClick={() => setShowPw(v => !v)}>{showPw ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}</EyeBtn>
            </Field>
            {error && <Err>{error}</Err>}
            <SubmitBtn type="submit" disabled={loading}>{loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}</SubmitBtn>
          </Form>
          <SwitchRow>
            {isLogin ? <>No account? <Link to="/signup">Sign up</Link></> : <>Have an account? <Link to="/login">Sign in</Link></>}
          </SwitchRow>
        </Card>
        <Tagline>🚌 Ride public transport · Earn TRT tokens · Redeem rewards</Tagline>
      </Wrap>
    </Page>
  );
}

const Page = styled.div`min-height:100vh;background:${p=>p.theme.bg};display:flex;align-items:center;justify-content:center;padding:24px;`;
const Wrap = styled.div`width:100%;max-width:420px;display:flex;flex-direction:column;gap:20px;`;
const BrandRow = styled.div`display:flex;align-items:center;gap:10px;`;
const BusIcon = styled.div`width:40px;height:40px;background:${p=>p.theme.primary};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:${p=>p.theme.shadow};`;
const Brand = styled.div`font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:${p=>p.theme.text};`;
const Card = styled.div`background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:28px;box-shadow:${p=>p.theme.shadowLg};`;
const CardTitle = styled.h1`font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${p=>p.theme.text};margin-bottom:4px;`;
const CardSub = styled.p`font-size:13px;color:${p=>p.theme.muted};margin-bottom:24px;`;
const Form = styled.form`display:flex;flex-direction:column;gap:12px;`;
const Field = styled.div`display:flex;align-items:center;background:${p=>p.theme.surface};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:0 12px;`;
const FIcon = styled.div`color:${p=>p.theme.muted};display:flex;align-items:center;margin-right:8px;flex-shrink:0;`;
const FInput = styled.input`flex:1;background:transparent;border:none;outline:none;color:${p=>p.theme.text};font-size:14px;padding:12px 0;font-family:inherit;&::placeholder{color:${p=>p.theme.muted};}`;
const EyeBtn = styled.button`background:none;border:none;cursor:pointer;color:${p=>p.theme.muted};display:flex;align-items:center;padding:0;`;
const Err = styled.p`font-size:12px;color:#d94f2a;font-weight:600;`;
const SubmitBtn = styled.button`padding:13px;background:${p=>p.theme.primary};color:#fff;border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};font-size:15px;font-weight:700;cursor:pointer;box-shadow:${p=>p.theme.shadow};transition:transform 0.1s;&:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #1a1a1a;}&:disabled{opacity:0.6;}`;
const SwitchRow = styled.p`text-align:center;margin-top:16px;font-size:13px;color:${p=>p.theme.muted};a{color:${p=>p.theme.primary};font-weight:700;text-decoration:none;}`;
const Tagline = styled.p`text-align:center;font-size:12px;color:${p=>p.theme.muted};`;
