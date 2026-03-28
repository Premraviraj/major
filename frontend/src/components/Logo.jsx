import styled, { useTheme } from "styled-components";

export function LogoMark({ size = 36 }) {
  const theme = useTheme();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bus body */}
      <rect x="2" y="8" width="32" height="20" rx="3" fill={theme.primary} stroke="#1a1a1a" strokeWidth="2.2" />
      {/* Windshield */}
      <rect x="5" y="11" width="10" height="8" rx="1.5" fill="#fff" stroke="#1a1a1a" strokeWidth="1.8" />
      {/* Rear window */}
      <rect x="21" y="11" width="10" height="8" rx="1.5" fill="#fff" stroke="#1a1a1a" strokeWidth="1.8" />
      {/* Wheels */}
      <circle cx="10" cy="29" r="4" fill="#1a1a1a" />
      <circle cx="10" cy="29" r="2" fill={theme.accent} />
      <circle cx="26" cy="29" r="4" fill="#1a1a1a" />
      <circle cx="26" cy="29" r="2" fill={theme.accent} />
      {/* Lightning bolt */}
      <path d="M20 10 L16 19h4l-2 7 6-10h-4l2-6z" fill="#fff" stroke="#1a1a1a" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoFull({ size = 36 }) {
  const theme = useTheme();
  return (
    <LogoWrap>
      <LogoMark size={size} />
      <LogoText $color={theme.primary}>
        TRIPP
        <LogoDot $color={theme.accent}>.</LogoDot>
      </LogoText>
    </LogoWrap>
  );
}

const LogoWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoText = styled.span`
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: ${p => p.$color};
  letter-spacing: -1px;
  line-height: 1;
`;

const LogoDot = styled.span`
  color: ${p => p.$color};
  font-size: 28px;
  line-height: 0;
  vertical-align: -4px;
`;
