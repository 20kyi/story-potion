import React from 'react';
import styled from 'styled-components';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { useLocation, useNavigate } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f6eaea;
  padding: 20px;
  padding-top: 70px;
  padding-bottom: 100px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Title = styled.h1`
  color: #cb6565;
  font-size: 28px;
  margin-bottom: 30px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  text-align: center;
`;

const CenterBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const WeekText = styled.div`
  color: #cb6565;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
`;

const DateText = styled.div`
  color: #cb6565;
  font-size: 16px;
  margin-bottom: 24px;
  text-align: center;
`;

const NovelImage = styled.img`
  width: 300px;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
  border: 3px solid #df9696;
  margin-bottom: 32px;
`;

const NovelTitle = styled.div`
  background: #df9696;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-radius: 16px;
  padding: 10px 32px;
  text-align: center;
  margin-bottom: 32px;
`;

function NovelCreate() {
  const location = useLocation();
  const navigate = useNavigate();
  const week = location.state?.week;
  const dateRange = location.state?.dateRange;
  const imageUrl = location.state?.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=400&h=540';
  const title = location.state?.title;

  const handleViewNovel = () => {
    navigate('/novel/view', {
      state: {
        title,
      },
    });
  };

  return (
    <Container>
      <Header />
      {/* <Title>Novel</Title> */}
      <CenterBox>
        <WeekText>{week}</WeekText>
        <DateText>{dateRange}</DateText>
        <NovelImage src={imageUrl} alt="소설 이미지" />
        {/* <NovelTitle>{title}</NovelTitle> */}
        <button
          style={{
            background: '#df9696',
            color: '#fff',
            border: 'none',
            borderRadius: '16px',
            padding: '10px 32px',
            fontSize: '18px',
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: '32px',
            marginTop: '0',
            cursor: 'pointer',
          }}
          onClick={handleViewNovel}
        >
          {title}
        </button>
      </CenterBox>
      <Navigation />
    </Container>
  );
}

export default NovelCreate;