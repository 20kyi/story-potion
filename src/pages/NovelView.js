import React from 'react';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import { useLocation } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
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

const SectionTitle = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 15px;
  margin-top: 24px;
  h2 {
    font-size: 20px;
    color: #e46262;
    margin: 0;
  }
`;

const NovelCard = styled.div`
  background-color: #fdd2d2;
  border-radius: 15px;
  padding: 32px 24px;
  margin-bottom: 30px;
  min-height: 200px;
  width: 100%;
  box-sizing: border-box;
  font-size: clamp(16px, 2vw, 22px);
  color: #cb6565;
  line-height: 1.7;
  font-weight: 400;
  white-space: pre-line;
`;

function NovelView() {
  const location = useLocation();
  const title = location.state?.title || '소설 제목';
  const content = location.state?.content || `어느 날, 바람이 불었다. 나는 그 바람을 따라 천천히 걷기 시작했다. 골목길을 지나, 오래된 벽돌집 앞을 지나쳤다. 햇살이 따뜻하게 내리쬐는 오후였다. 바람은 내 머리카락을 가볍게 흔들었다. 나는 두 눈을 감고, 바람의 소리를 들었다. 어릴 적 뛰놀던 들판이 떠올랐다. 그곳엔 늘 자유가 있었다. 친구들과 웃으며 달리던 기억. 풀잎 사이로 스며드는 햇살. 바람은 그 시절의 향기를 실어왔다. 나는 잠시 멈춰 섰다. 하늘을 올려다보았다. 구름이 천천히 흘러가고 있었다. 새 한 마리가 높이 날아올랐다. 나는 다시 걷기 시작했다. 발밑의 자갈이 사각사각 소리를 냈다. 바람은 내 등을 밀어주었다. 나는 어디론가 이끌리듯 걸었다. 작은 연못이 보였다. 물 위에 햇살이 반짝였다. 연못가에 앉아 조용히 숨을 골랐다. 바람이 내 뺨을 스쳤다. 나는 미소를 지었다. 어릴 적 그리던 꿈이 생각났다. 나는 언젠가 바람을 타고 멀리 떠나고 싶었다. 지금, 그 꿈을 따라 걷고 있는 것 같았다. 연못 위로 나뭇잎이 떨어졌다. 파문이 잔잔하게 번졌다. 나는 손을 뻗어 바람을 잡으려 했다. 바람은 잡히지 않았다. 하지만 그 느낌은 내 마음에 남았다. 나는 다시 일어섰다. 바람을 따라 걷는 길. 어디로 가는지 알 수 없지만 두렵지 않았다. 길가에 작은 꽃이 피어 있었다. 나는 꽃을 바라보며 미소 지었다. 바람이 꽃잎을 흔들었다. 나는 그 순간을 마음에 담았다. 세상은 여전히 아름다웠다. 나는 천천히, 그러나 확실하게 앞으로 나아갔다. 바람은 내 곁을 떠나지 않았다. 나는 바람과 함께 걷는 여행자였다. 어느새 해가 기울고 있었다. 노을이 하늘을 붉게 물들였다. 나는 멈춰서서 그 풍경을 바라보았다. 바람이 마지막 인사를 건넸다. 나는 속삭였다. "고마워, 바람아." 그리고 다시, 조용히 걸음을 옮겼다.`;

  return (
    <Container>
      <Header />
      <SectionTitle>
        <h2>{title}</h2>
      </SectionTitle>
      <NovelCard>
        {content}
      </NovelCard>
      <Navigation />
    </Container>
  );
}

export default NovelView; 