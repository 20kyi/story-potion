import React from 'react';
import styled from 'styled-components';
import Header from '../components/Header';
import Navigation from '../components/Navigation';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f7f7f7;
  padding: 20px;
  padding-top: 70px;
  padding-bottom: 100px;
  gap: 24px;
`;

const CarouselBanner = styled.div`
  width: 100%;
  height: 120px;
  border-radius: 16px;
  background-color: #e46262;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
  background-image: linear-gradient(135deg, #f2b7b7 0%, #e46262 100%);
`;

const WelcomeMessage = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #333;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #555;
  margin-bottom: -10px;
`;

const Card = styled.div`
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const CardImage = styled.div`
  width: 75px;
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  background-color: #eee;
  flex-shrink: 0;
  /* 실제로는 img 태그를 사용하고 object-fit: cover를 적용합니다. */
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardTitle = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const CardText = styled.p`
  font-size: 14px;
  color: #777;
`;

const ShortcutContainer = styled.div`
  display: flex;
  gap: 12px;
`;

const ShortcutButton = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  background-color: #fff;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
`;

const FloatingActionButton = styled.button`
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #e46262;
  color: white;
  border: none;
  font-size: 28px;
  line-height: 56px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  cursor: pointer;
`;

function HomeTest({ user }) {
    // 이 페이지는 UI 데모용으로, 실제 데이터는 사용하지 않습니다.
    const displayName = user?.displayName?.split('(')[0] || '작가';

    return (
        <>
            <Container>
                <Header user={user} />
                <CarouselBanner>이벤트 배너</CarouselBanner>
                <WelcomeMessage>"{displayName}님, 좋은 아침이에요!"</WelcomeMessage>

                <SectionTitle>최근 활동</SectionTitle>
                <Card>
                    <CardImage />
                    <CardContent>
                        <CardTitle>치킨 먹은 날</CardTitle>
                        <CardText>오늘은 남자친구랑 치킨을 먹었다. 정말 맛있었다...</CardText>
                    </CardContent>
                </Card>

                <Card>
                    <CardImage />
                    <CardContent>
                        <CardTitle>마법사의 제자</CardTitle>
                        <CardText>챕터 3. 새로운 마법을 배우다...</CardText>
                    </CardContent>
                </Card>

                <SectionTitle>바로가기</SectionTitle>
                <ShortcutContainer>
                    <ShortcutButton>내 모든 일기 보기 &gt;</ShortcutButton>
                    <ShortcutButton>내 모든 소설 보기 &gt;</ShortcutButton>
                </ShortcutContainer>

            </Container>
            <FloatingActionButton>+</FloatingActionButton>
            <Navigation />
        </>
    );
}

export default HomeTest; 