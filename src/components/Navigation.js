import styled, { useTheme as useStyledTheme } from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useTranslation } from '../LanguageContext';

const NavBar = styled.nav`
  position: fixed;
  left: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '0'};
  right: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '0'};
  bottom: ${({ $isGlassTheme }) => $isGlassTheme ? 'calc(12px + env(safe-area-inset-bottom, 0px))' : '0'};
  width: ${({ $isGlassTheme }) => $isGlassTheme ? 'calc(100% - 24px)' : '100%'};
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#faf8f3';
    if (theme.mode === 'dark') return '#18181b';
    return theme.navCard;
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgb(255, 255, 255)' : 'none'};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '24px' : '32px 32px 0 0'};
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 -2px 8px rgba(0, 0, 0, 0.06), 0 -1px 3px rgba(0, 0, 0, 0.04)';
    return theme.cardShadow;
  }};
  padding: ${({ $isGlassTheme }) => $isGlassTheme ? '8px 0' : '12px 0 calc(12px + env(safe-area-inset-bottom)) 0'};
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
  font-size: 0.75rem !important; /* 12px 기준 16px일 때, html font-size에 비례하여 조절 */
  color: ${({ active, theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) {
      return active ? 'rgb(80, 80, 80)' : 'rgba(255, 255, 255, 0.8)';
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
  transition: all 0.3s ease;
`;

const IconImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: filter 0.3s ease;
`;

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actualTheme } = useTheme();
  const { t } = useTranslation();
  const isDiaryTheme = actualTheme === 'diary';
  const isGlassTheme = actualTheme === 'glass';
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
    <NavBar $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme} theme={styledTheme}>
      <NavButton onClick={() => navigate('/home', { replace: true })}>
        <IconContainer>
          <IconImage
            src={getIconPath('home')}
            alt="Home"
            style={{
              filter: isActive('/')
                ? (isGlassTheme
                  ? 'drop-shadow(2px 0 0 rgba(255, 255, 255, 0.9)) drop-shadow(-1px 0 0 rgba(255, 255, 255, 0.9)) drop-shadow(0 1px 0 rgba(255, 255, 255, 0.9)) drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.9))'
                  : 'none')
                : 'grayscale(1) opacity(0.5)'
            }}
          />
        </IconContainer>
        <NavText active={isActive('/') ? 'true' : undefined} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>{t('nav_home')}</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/diaries', { replace: true })}>
        <IconContainer>
          <IconImage
            src={getIconPath('diary')}
            alt="Diary"
            style={{
              filter: isActive('/diaries')
                ? (isGlassTheme
                  ? 'drop-shadow(1px 0 0 rgba(255, 255, 255, 0.9)) drop-shadow(-1px 0 0 rgba(255, 255, 255, 0.9)) drop-shadow(0 1px 0 rgba(255, 255, 255, 0.9)) drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.9))'
                  : 'none')
                : 'grayscale(1) opacity(0.5)'
            }}
          />
        </IconContainer>
        <NavText active={isActive('/diaries') ? 'true' : undefined} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>{t('nav_diary')}</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/novel', { replace: true })}>
        <IconContainer>
          <IconImage
            src={getIconPath('novel')}
            alt="Novel"
            style={{
              filter: isActive('/novel')
                ? (isGlassTheme
                  ? 'drop-shadow(1px 0 0 rgba(255, 255, 255, 0.9)) drop-shadow(-1px 0 0 rgba(255, 255, 255, 0.9)) drop-shadow(0 1px 0 rgba(255, 255, 255, 0.9)) drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.9))'
                  : 'none')
                : 'grayscale(1) opacity(0.5)'
            }}
          />
        </IconContainer>
        <NavText active={isActive('/novel') ? 'true' : undefined} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>{t('nav_novel')}</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/my', { replace: true })}>
        <IconContainer>
          <IconImage
            src={getIconPath('my')}
            alt="My"
            style={{
              filter: isActive('/my')
                ? (isGlassTheme
                  ? 'drop-shadow(1px 0 0 rgba(255, 255, 255, 0.9)) drop-shadow(-1px 0 0 rgba(255, 255, 255, 0.9)) drop-shadow(0 1px 0 rgba(255, 255, 255, 0.9)) drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.9))'
                  : 'none')
                : 'grayscale(1) opacity(0.5)'
            }}
          />
        </IconContainer>
        <NavText active={isActive('/my') ? 'true' : undefined} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>{t('nav_mypage')}</NavText>
      </NavButton>
    </NavBar>
  );
}

export default Navigation;
