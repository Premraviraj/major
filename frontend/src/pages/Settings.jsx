import styled from "styled-components";
import { useTheme } from "../context/ThemeContext";
import { MdCheck } from "react-icons/md";

const THEME_META = {
  earth: { emoji: "🌍", desc: "Warm gold" },
  fire:  { emoji: "🔥", desc: "Bold red" },
  water: { emoji: "💧", desc: "Cool cyan" },
  air:   { emoji: "🌬️", desc: "Soft purple" },
  space: { emoji: "🚀", desc: "Teal cosmos" },
};

export default function Settings() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <Page>
      <Header>
        <PageTitle>Settings</PageTitle>
      </Header>
      <Bento>
        <SectionTile>
          <TileLabel>CHOOSE THEME</TileLabel>
          <ThemeGrid>
            {Object.entries(themes).map(([key, t]) => (
              <TCard key={key} active={theme.name === t.name} style={{ borderTop: `4px solid ${t.primary}` }} onClick={() => setTheme(t)}>
                <TEmoji>{THEME_META[key].emoji}</TEmoji>
                <TName>{t.name}</TName>
                <TDesc>{THEME_META[key].desc}</TDesc>
                <Swatches>
                  <Sw style={{ background: t.primary }} />
                  <Sw style={{ background: t.accent }} />
                  <Sw style={{ background: t.tag }} />
                </Swatches>
                {theme.name === t.name && <ActiveMark><MdCheck size={11} /></ActiveMark>}
              </TCard>
            ))}
          </ThemeGrid>
        </SectionTile>

        <PreviewTile>
          <TileLabel>LIVE PREVIEW</TileLabel>
          <PreviewRow>
            <PreviewChip style={{ background: theme.primary, color: "#fff" }}>Primary</PreviewChip>
            <PreviewChip style={{ background: theme.tag, color: theme.tagText }}>Tag</PreviewChip>
            <PreviewChip style={{ background: theme.surface, color: theme.text }}>Surface</PreviewChip>
          </PreviewRow>
          <PreviewBtn>Sample Button</PreviewBtn>
        </PreviewTile>
      </Bento>
    </Page>
  );
}

const Page = styled.div`width:100%;min-height:100vh;background:${p=>p.theme.bg};padding-bottom:100px;`;
const Header = styled.div`padding:20px 20px 0;`;
const PageTitle = styled.h1`font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${p=>p.theme.text};`;
const Bento = styled.div`padding:16px 20px;display:flex;flex-direction:column;gap:12px;`;
const SectionTile = styled.div`background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};`;
const TileLabel = styled.div`font-size:10px;font-weight:700;color:${p=>p.theme.muted};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;`;
const ThemeGrid = styled.div`display:grid;grid-template-columns:repeat(5,1fr);gap:10px;`;
const TCard = styled.div`background:${p=>p.active?p.theme.surface:p.theme.bg};border:${p=>p.active?p.theme.border:"2px solid transparent"};border-radius:${p=>p.theme.radius};padding:14px 10px;cursor:pointer;position:relative;box-shadow:${p=>p.active?p.theme.shadow:"none"};transition:all 0.15s;`;
const TEmoji = styled.div`font-size:24px;margin-bottom:6px;`;
const TName = styled.div`font-size:12px;font-weight:700;color:${p=>p.theme.text};margin-bottom:2px;`;
const TDesc = styled.div`font-size:10px;color:${p=>p.theme.muted};margin-bottom:8px;`;
const Swatches = styled.div`display:flex;gap:4px;`;
const Sw = styled.div`width:14px;height:14px;border-radius:50%;border:1px solid #1a1a1a;`;
const ActiveMark = styled.div`position:absolute;top:8px;right:8px;background:${p=>p.theme.primary};border:2px solid #1a1a1a;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:#fff;`;
const PreviewTile = styled.div`background:${p=>p.theme.card};border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};padding:16px;box-shadow:${p=>p.theme.shadow};`;
const PreviewRow = styled.div`display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;`;
const PreviewChip = styled.div`padding:6px 14px;border:${p=>p.theme.border};border-radius:${p=>p.theme.radius};font-size:12px;font-weight:700;box-shadow:${p=>p.theme.shadow};`;
const PreviewBtn = styled.button`padding:11px 22px;border-radius:${p=>p.theme.radius};background:${p=>p.theme.primary};color:#fff;border:${p=>p.theme.border};font-size:13px;font-weight:700;cursor:pointer;box-shadow:${p=>p.theme.shadow};`;
