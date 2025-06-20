import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fff;
  padding: 20px;
  padding-top: 70px;
  padding-bottom: 100px;
  margin-top: 10px;
`;

const ProfileImage = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #fdd2d2;
  border: 2px solid #e46262;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #e46262;
  margin-top: 40px;
  margin-bottom: 16px;
  margin-left: auto;
  margin-right: auto;
`;

const Nickname = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: #cb6565;
  margin-bottom: 8px;
  text-align: center;
`;

const Info = styled.div`
  font-size: 15px;
  color: #888;
  margin-bottom: 32px;
  text-align: center;
`;

const LogoutButton = styled.button`
  background: #e46262;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.2s;
  display: block;
  margin-left: auto;
  margin-right: auto;
  &:hover {
    background: #cb6565;
  }
`;

function MyPage({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // 로그아웃 성공 시 App.js의 onAuthStateChanged가 감지하여
      // 자동으로 로그인 페이지로 리디렉션합니다.
      alert('로그아웃 되었습니다.');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  const displayName = user?.displayName || user?.email;

  return (
    <>
      <Header user={user} />
      <MainContainer className="my-page-container">
        <ProfileImage>😊</ProfileImage>
        <Nickname>{displayName}</Nickname>
        <Info>오늘도 즐거운 하루!</Info>
        <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
        <Navigation />
      </MainContainer>
    </>
  );
}

export default MyPage; 