import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { MdHome, MdAccountBalanceWallet, MdDirectionsBus, MdCardGiftcard, MdPerson, MdSettings, MdLogout, MdExpandLess } from "react-icons/md";
import { supabase } from "../supabaseClient";

const tabs = [
  { path: "/",        icon: MdHome,                label: "Home" },
  { path: "/wallet",  icon: MdAccountBalanceWallet, label: "Wallet" },
  { path: "/travel",  icon: MdDirectionsBus,        label: "Travel" },
  { path: "/rewards", icon: MdCardGiftcard,         label: "Rewards" },
];

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <>
      {accountOpen && <Overlay onClick={() => setAccountOpen(false)} />}
      {accountOpen && (
        <Dropdown>
          <DropItem onClick={() => { navigate("/profile"); setAccountOpen(false); }}>
            <MdPerson size={15} />Profile
          </DropItem>
          <DropItem onClick={() => { navigate("/settings"); setAccountOpen(false); }}>
            <MdSettings size={15} />Settings
          </DropItem>
          <DropDivider />
          <DropItem $danger onClick={signOut}>
            <MdLogout size={15} />Sign Out
          </DropItem>
        </Dropdown>
      )}
      <Nav>
        {tabs.map(({ path, icon: Icon, label }) => (
          <Tab key={path} $active={location.pathname === path} onClick={() => navigate(path)}>
            <Icon size={20} />
            <TabLabel>{label}</TabLabel>
          </Tab>
        ))}
        <Tab $active={accountOpen} onClick={() => setAccountOpen(v => !v)}>
          <MdPerson size={20} />
          <TabLabel>Account</TabLabel>
          <MdExpandLess size={12} style={{ transform: accountOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "0.2s" }} />
        </Tab>
      </Nav>
    </>
  );
}

const Nav = styled.nav`
  position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 2px;
  background: ${p => p.theme.card};
  border: ${p => p.theme.border};
  border-radius: 6px; padding: 6px 8px;
  box-shadow: ${p => p.theme.shadowLg};
  z-index: 100;
`;
const Tab = styled.button`
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: ${p => p.$active ? p.theme.primary : "transparent"};
  border: ${p => p.$active ? p.theme.border : "2px solid transparent"};
  border-radius: 4px; padding: 8px 14px; cursor: pointer;
  color: ${p => p.$active ? "#fff" : p.theme.muted};
  box-shadow: ${p => p.$active ? p.theme.shadow : "none"};
  transition: all 0.15s;
  &:hover { background: ${p => p.$active ? p.theme.primary : p.theme.surface}; color: ${p => p.$active ? "#fff" : p.theme.text}; }
`;
const TabLabel = styled.span`font-size: 9px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;`;
const Overlay = styled.div`position: fixed; inset: 0; z-index: 99;`;
const Dropdown = styled.div`
  position: fixed; bottom: 80px; right: 20px;
  background: ${p => p.theme.card};
  border: ${p => p.theme.border};
  border-radius: 4px; padding: 6px; z-index: 100;
  box-shadow: ${p => p.theme.shadowLg}; min-width: 150px;
`;
const DropItem = styled.button`
  display: flex; align-items: center; gap: 8px; width: 100%;
  background: none; border: none; border-radius: 3px;
  padding: 9px 12px; cursor: pointer; font-size: 13px; font-weight: 600;
  color: ${p => p.$danger ? "#d94f2a" : p.theme.text};
  &:hover { background: ${p => p.$danger ? "#fecaca" : p.theme.surface}; }
`;
const DropDivider = styled.div`height: 1px; background: #1a1a1a; margin: 4px 0; opacity: 0.12;`;
