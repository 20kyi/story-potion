import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';

const NavBar = styled.nav`
  position: fixed;
  left: 0; right: 0; bottom: 0;
  width: 100%;
  background: #fff;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  // box-shadow: 0 -2px 16px rgba(228,98,98,0.08);
  padding: 12px 0 8px 0;
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
  gap: 4px;
  cursor: pointer;
  flex: 1;
`;

// const IconCircle = styled.div`
//   width: 48px; height: 48px;
//   border-radius: 50%;
//   background: #f8e6e6;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   margin-bottom: 2px;
// `;

const NavText = styled.span`
  font-size: 14px;
  color: ${props => props.active ? '#e46262' : '#bdbdbd'};
  font-weight: ${props => props.active ? 700 : 400};
`;

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

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
        <NavText active={isActive('/')}>Home</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/diaries')}>
        <img
          src={process.env.PUBLIC_URL + '/icons/diary.png'}
          alt="Diary"
          style={{ width: 32, height: 32, filter: isActive('/diaries') ? 'none' : 'grayscale(1) opacity(0.5)' }}
        />
        <NavText active={isActive('/diaries')}>Diary</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/novel')}>
        <img
          src={process.env.PUBLIC_URL + '/icons/novel.png'}
          alt="Novel"
          style={{ width: 32, height: 32, filter: isActive('/novel') ? 'none' : 'grayscale(1) opacity(0.5)' }}
        />
        <NavText active={isActive('/novel')}>Novel</NavText>
      </NavButton>
      <NavButton onClick={() => navigate('/my')}>
        <img
          src={process.env.PUBLIC_URL + '/icons/my.png'}
          alt="My"
          style={{ width: 32, height: 32, filter: isActive('/my') ? 'none' : 'grayscale(1) opacity(0.5)' }}
        />
        <NavText active={isActive('/my')}>My</NavText>
      </NavButton>
    </NavBar>
  );
}

export default Navigation;
