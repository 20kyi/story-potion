import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../LanguageContext';

const NavBar = styled.nav`
  position: fixed;
  left: 0; right: 0; bottom: 0;
  width: 100%;
  background: ${({ theme }) => theme.navCard};
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  box-shadow: ${({ theme }) => theme.cardShadow};
  padding: 12px 0 calc(8px + env(safe-area-inset-bottom)) 0;
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
  font-size: 12px;
  color: ${({ active, theme }) => active ? theme.primary : '#bdbdbd'};
  font-weight: ${({ active }) => active ? 700 : 400};
`;

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  return (
    <NavBar>
      <NavButton onClick={() => navigate('/')}>
        <img
          src={process.env.PUBLIC_URL + '/icons/home.png'}
          alt="Home"
          style={{ width: 32, height: 32, filter: isActive('/') ? 'none' : 'grayscale(1) opacity(0.5)' }}
        />
        <NavText active={isActive('/') ? 'true' : undefined}>{t('home')}</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/diaries')}>
        <img
          src={process.env.PUBLIC_URL + '/icons/diary.png'}
          alt="Diary"
          style={{ width: 32, height: 32, filter: isActive('/diaries') ? 'none' : 'grayscale(1) opacity(0.5)' }}
        />
        <NavText active={isActive('/diaries') ? 'true' : undefined}>{t('diary')}</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/novel')}>
        <img
          src={process.env.PUBLIC_URL + '/icons/novel.png'}
          alt="Novel"
          style={{ width: 32, height: 32, filter: isActive('/novel') ? 'none' : 'grayscale(1) opacity(0.5)' }}
        />
        <NavText active={isActive('/novel') ? 'true' : undefined}>{t('novel')}</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/my')}>
        <img
          src={process.env.PUBLIC_URL + '/icons/my.png'}
          alt="My"
          style={{ width: 32, height: 32, filter: isActive('/my') ? 'none' : 'grayscale(1) opacity(0.5)' }}
        />
        <NavText active={isActive('/my') ? 'true' : undefined}>{t('mypage')}</NavText>
      </NavButton>
    </NavBar>
  );
}

export default Navigation;
