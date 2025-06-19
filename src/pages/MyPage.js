import React from 'react';
import styled from 'styled-components';
import Header from '../components/Header';
import Navigation from '../components/Navigation';

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

function MyPage() {
  // 임시 닉네임, 정보
  const nickname = '홍길동';
  const info = '오늘도 즐거운 하루!';

  const handleLogout = () => {
    // 로그아웃 로직 (예: localStorage.clear(), 페이지 이동 등)
    alert('로그아웃 되었습니다.');
    // window.location.href = '/';
  };

  return (
    <>
      <Header />
      <MainContainer className="my-page-container">
        <ProfileImage>😊</ProfileImage>
        <Nickname>{nickname}</Nickname>
        <Info>{info}</Info>
        <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
        <Navigation />
      </MainContainer>
    </>
  );
}

export default MyPage; 