import styled, { useTheme as useStyledTheme } from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useTranslation } from '../LanguageContext';

const NavBar = styled.nav`
  position: fixed;
  left: 0; right: 0; bottom: 0;
  width: 100%;
  background: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#faf8f3';
    if (theme.mode === 'dark') return '#18181b';
    return theme.navCard;
  }};
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  box-shadow: ${({ theme, $isDiaryTheme }) => $isDiaryTheme
    ? '0 -2px 8px rgba(0, 0, 0, 0.06), 0 -1px 3px rgba(0, 0, 0, 0.04)'
    : theme.cardShadow};
  padding: 12px 0 calc(12px + env(safe-area-inset-bottom)) 0;
  display: flex;
  justify-content: space-around;
  z-index: 100;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  cursor: pointer;
  flex: 1;
`;

const NavText = styled.span`
  font-size: 12px !important;
  color: ${({ active, theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) {
      return active ? theme.primary : '#5A6C7D';
    }
    if (active) {
      return $isDiaryTheme ? '#8B6F47' : theme.primary;
    }
    return $isDiaryTheme ? '#b8a082' : '#bdbdbd';
  }};
  font-weight: ${({ active }) => active ? 700 : 400};
`;

const IconContainer = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actualTheme } = useTheme();
  const { t } = useTranslation();
  const isDiaryTheme = actualTheme === 'diary';
  const styledTheme = useStyledTheme();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  // 다크모드에 따라 아이콘 파일명 결정
  const getIconPath = (iconName) => {
    const suffix = actualTheme === 'dark' ? '_dark.png' : '.png';
    return process.env.PUBLIC_URL + `/icons/${iconName}${suffix}`;
  };

  return (
    <NavBar $isDiaryTheme={isDiaryTheme} theme={styledTheme}>
      <NavButton onClick={() => navigate('/')}>
        <IconContainer>
          <IconImage
            src={getIconPath('home')}
            alt="Home"
            style={{ filter: isActive('/') ? 'none' : 'grayscale(1) opacity(0.5)' }}
          />
        </IconContainer>
        <NavText active={isActive('/') ? 'true' : undefined} $isDiaryTheme={isDiaryTheme}>{t('nav_home')}</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/diaries')}>
        <IconContainer>
          <IconImage
            src={getIconPath('diary')}
            alt="Diary"
            style={{ filter: isActive('/diaries') ? 'none' : 'grayscale(1) opacity(0.5)' }}
          />
        </IconContainer>
        <NavText active={isActive('/diaries') ? 'true' : undefined} $isDiaryTheme={isDiaryTheme}>{t('nav_diary')}</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/novel')}>
        <IconContainer>
          <IconImage
            src={getIconPath('novel')}
            alt="Novel"
            style={{ filter: isActive('/novel') ? 'none' : 'grayscale(1) opacity(0.5)' }}
          />
        </IconContainer>
        <NavText active={isActive('/novel') ? 'true' : undefined} $isDiaryTheme={isDiaryTheme}>{t('nav_novel')}</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/my')}>
        <IconContainer>
          <IconImage
            src={getIconPath('my')}
            alt="My"
            style={{ filter: isActive('/my') ? 'none' : 'grayscale(1) opacity(0.5)' }}
          />
        </IconContainer>
        <NavText active={isActive('/my') ? 'true' : undefined} $isDiaryTheme={isDiaryTheme}>{t('nav_mypage')}</NavText>
      </NavButton>
    </NavBar>
  );
}

export default Navigation;
