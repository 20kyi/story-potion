import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createNovelUrl } from '../../utils/novelUtils';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import styled from 'styled-components';
import { useLanguage, useTranslation } from '../../LanguageContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: transparent;
  color: ${({ theme }) => theme.text};
  padding: 20px;
  padding-top: 10px;
  padding-bottom: 100px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 120px; /* 하단 네비게이션 바와 작성하기 버튼을 위한 여백 */
`;

const HeaderRow = styled.header`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
`;

const ProfileImage = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #df9696;
  cursor: pointer;
  background: ${({ theme }) => theme.card};
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
`;

const Welcome = styled.h1`
  font-family: 'Island Moments';
  font-size: 20px;
  color: #df9696;
  letter-spacing: 2px;
  margin: 0;
`;

const HeaderTitle = styled.p`
  font-family: 'Instrument Sans';
  font-size: 10px;
  color: #de2a2a;
  margin: 0;
`;

const MainContent = styled.main`
  background: ${({ theme }) => theme.card};
  border-radius: 30px;
  padding: 20px;
  flex: 1;
  overflow-y: auto;
`;

const NovelListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const NovelItem = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 12px;
  padding: 16px;
  box-shadow: ${({ theme }) => theme.cardShadow};
  border: 1px solid ${({ theme }) => theme.border};
  cursor: pointer;
  transition: box-shadow 0.15s;
  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  }
`;

const NovelTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 8px;
`;

const NovelDate = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.cardSubText};
  margin-bottom: 12px;
`;

const NovelContent = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.cardText};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

function NovelList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const novels = JSON.parse(localStorage.getItem('novels') || '[]');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    if (language === 'en') {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <Container>
      <Header title={t('novel_list_header')} />
      <ContentWrapper>
        <HeaderRow>
          <ProfileImage
            onClick={() => navigate('/home')}
            title={t('home')}
          />
          <HeaderText>
            <Welcome>Welcome</Welcome>
            <HeaderTitle>{t('novel_list_header')}</HeaderTitle>
          </HeaderText>
        </HeaderRow>
        <MainContent>
          <NovelListWrapper>
            {novels.map((novel) => (
              <NovelItem
                key={novel.id}
                onClick={() => navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}`)}
              >
                <NovelTitle>{novel.title}</NovelTitle>
                <NovelDate>{formatDate(novel.date)}</NovelDate>
                <NovelContent>{novel.content}</NovelContent>
              </NovelItem>
            ))}
          </NovelListWrapper>
        </MainContent>
      </ContentWrapper>
      <Navigation />
    </Container>
  );
}

export default NovelList; 