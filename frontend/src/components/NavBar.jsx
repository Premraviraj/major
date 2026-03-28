import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { gsap } from "gsap";
import {
  MdHome, MdAccountBalanceWallet, MdDirectionsBus,
  MdCardGiftcard, MdPerson, MdSettings, MdLogout,
} from "react-icons/md";
import { LogoFull } from "./Logo";
import { supabase } from "../supabaseClient";

const NAV_ITEMS = [
  { path: "/",         icon: MdHome,                label: "Home" },
  { path: "/travel",   icon: MdDirectionsBus,        label: "Travel" },
  { path: "/wallet",   icon: MdAccountBalanceWallet, label: "Wallet" },
  { path: "/rewards",  icon: MdCardGiftcard,         label: "Rewards" },
  { path: "/profile",  icon: MdPerson,               label: "Profile" },
  { path: "/settings", icon: MdSettings,             label: "Settings" },
];

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);
  const tlRef = useRef(null);

  function toggleMenu() {
    const nav = navRef.current;
    if (!nav) return;
    if (tlRef.current) tlRef.current.kill();

    if (!open) {
      setOpen(true);
      tlRef.current = gsap.timeline()
        .to(nav, { "--panel-bottom-1": "100%", duration: 0.4, ease: "power1.out" })
        .to(nav, { "--panel-bottom-2": "100%", duration: 0.4, ease: "power1.out" }, 0.08)
        .to(nav, { "--panel-bottom-3": "100%", duration: 0.4, ease: "power1.out" }, 0.16)
        .to(nav, { "--panel-bottom-4": "100%", duration: 0.4, ease: "power1.out" }, 0.24);
    } else {
      tlRef.current = gsap.timeline({
        onComplete: () => setOpen(false),
      })
        .to(nav, { "--panel-bottom-4": "0%", duration: 0.35, ease: "power1.in" })
        .to(nav, { "--panel-bottom-3": "0%", duration: 0.35, ease: "power1.in" }, 0.08)
        .to(nav, { "--panel-bottom-2": "0%", duration: 0.35, ease: "power1.in" }, 0.16)
        .to(nav, { "--panel-bottom-1": "0%", duration: 0.35, ease: "power1.in" }, 0.24);
    }
  }

  function goTo(path) {
    toggleMenu();
    setTimeout(() => navigate(path), 500);
  }

  async function signOut() {
    toggleMenu();
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/login");
    }, 600);
  }

  return (
    <>
      <TopBar>
        <LogoFull size={32} />
        <Trigger onClick={toggleMenu} $open={open} aria-label={open ? "Close menu" : "Open menu"}>
          <Line $open={open} $top />
          <Line $open={open} />
        </Trigger>
      </TopBar>

      <FullNav
        ref={navRef}
        $open={open}
        $bg={theme.primary}
        style={{
          "--panel-bottom-1": "0%",
          "--panel-bottom-2": "0%",
          "--panel-bottom-3": "0%",
          "--panel-bottom-4": "0%",
        }}
      >
        <NavInner>
          <NavList>
            {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path;
              return (
                <NavItem key={path}>
                  <NavLink onClick={() => goTo(path)} $active={active}>
                    <NavIcon><Icon size={26} /></NavIcon>
                    <span>{label}</span>
                    {active && <ActiveDot />}
                  </NavLink>
                </NavItem>
              );
            })}
          </NavList>

          <SignOutBtn onClick={signOut}>
            <MdLogout size={16} />
            Sign Out
          </SignOutBtn>
        </NavInner>
      </FullNav>
    </>
  );
}

/* ── Styles ── */

const TopBar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  background: ${p => p.theme.card};
  border-bottom: ${p => p.theme.border};
  box-shadow: 0 4px 0 #1a1a1a;

  @media (min-width: 768px) {
    padding: 0 32px;
  }
`;

const Trigger = styled.button`
  position: relative;
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  cursor: pointer;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  z-index: 201;
`;

const Line = styled.span`
  display: block;
  width: 22px;
  height: 2px;
  border-radius: 1px;
  background-color: ${p => p.theme.text};
  transition: transform 0.55s cubic-bezier(0.17, 0.67, 0, 1),
              opacity 0.3s ease;
  transform-origin: center;

  ${p => p.$top && p.$open && `
    transform: translateY(3.5px) rotate(45deg) scaleX(0.9);
  `}
  ${p => !p.$top && p.$open && `
    transform: translateY(-3.5px) rotate(-45deg) scaleX(0.9);
  `}
`;

const FullNav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  z-index: 199;
  background: ${p => p.$bg};
  pointer-events: ${p => p.$open ? "all" : "none"};
  overflow-y: auto;
  clip-path: polygon(
    0 0,
    0 var(--panel-bottom-1),
    25% var(--panel-bottom-1),
    25% 0,

    25% 0,
    25% var(--panel-bottom-2),
    50% var(--panel-bottom-2),
    50% 0,

    50% 0,
    50% var(--panel-bottom-3),
    75% var(--panel-bottom-3),
    75% 0,

    75% 0,
    75% var(--panel-bottom-4),
    100% var(--panel-bottom-4),
    100% 0
  );
`;

const NavInner = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 80px 28px 48px;
  max-width: 900px;

  @media (min-width: 768px) {
    padding: 80px 60px 48px;
  }
`;
const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
`;

const NavItem = styled.li`
  & + & { margin-top: 0.3em; }
`;

const NavLink = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 0;
  width: 100%;

  font-family: 'Syne', sans-serif;
  font-size: clamp(2.4rem, 12vw, 4.5rem);
  font-weight: 700;
  color: ${p => p.$active ? "#fff" : "rgba(255,255,255,0.65)"};
  letter-spacing: -0.5px;
  line-height: 1;
  transition: color 0.2s ease, letter-spacing 0.45s cubic-bezier(0.17, 0.67, 0, 1);

  &:hover {
    color: #fff;
    letter-spacing: 1px;
  }
`;

const NavIcon = styled.span`
  display: flex;
  align-items: center;
  color: rgba(255,255,255,0.55);
  flex-shrink: 0;
  margin-top: 2px;
`;

const ActiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid rgba(0,0,0,0.3);
  margin-left: 6px;
  flex-shrink: 0;
`;

const SignOutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.12);
  border: 2px solid rgba(255,255,255,0.35);
  border-radius: 4px;
  padding: 12px 20px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 36px;
  width: fit-content;
  font-family: 'Space Grotesk', sans-serif;
  transition: background 0.2s;

  &:hover { background: rgba(255,255,255,0.22); }
`;
