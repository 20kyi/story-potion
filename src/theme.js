// theme.js
// 라이트/다크 테마에서 사용되는 색상 및 스타일 변수 정의

// lightTheme: 라이트 모드 색상
export const lightTheme = {
    mode: 'light', // 현재 테마 모드
    background: '#fff', // 전체 배경색
    text: '#222', // 기본 텍스트 색상
    card: '#fff', // 일반 카드 배경색
    navCard: '#fff', // 네비게이션 바 배경색
    progressCard: '#f5f6fa', // 주간일기/통계 등 진행도 카드 배경색 (더 밝은 회색, 라이트)
    cardText: '#222', // 카드 내 주요 텍스트 색상
    cardSubText: '#555', // 카드 내 서브/보조 텍스트 색상 (라이트)
    diaryText: '#e46262', // 일기 제목 색상 (라이트)
    diaryContent: '#444', // 일기 본문 색상 (라이트)
    primary: '#e46262', // 주요 포인트 컬러(버튼, 강조 등)
    secondary: '#cb6565', // 보조 포인트 컬러(버튼 hover 등)
    border: '#f1f1f1', // 카드/컨테이너 테두리 색상
    cardShadow: '0 2px 8px rgba(0,0,0,0.06)', // 카드 그림자
    cardGradient: 'linear-gradient(135deg, #aee2ff 0%, #6db3f2 100%)', // 카드 그라디언트(홈 등)
    writeCardGradient: 'linear-gradient(135deg, #ffe29f 0%, #ffc371 100%)', // 일기쓰기 버튼 그라디언트
    menuText: '#222', // 메뉴 텍스트 색상 (라이트)
    menuHover: '#e0e0e0', // 메뉴 버튼 hover 배경색 (라이트)
};

// darkTheme: 다크 모드 색상
export const darkTheme = {
    mode: 'dark', // 현재 테마 모드
    background: '#202020', // 전체 배경색
    text: '#f1f1f1', // 기본 텍스트 색상
    card: '#232323', // 일반 카드 배경색
    navCard: '#18181b', // 네비게이션 바 배경색
    progressCard: 'rgb(58, 58, 58)', // 주간일기/통계 등 진행도 카드 배경색 (더 밝은 회색, 다크)
    cardText: '#f1f1f1', // 카드 내 주요 텍스트 색상
    cardSubText: '#bfc3c9', // 카드 내 서브/보조 텍스트 색상 (다크)
    diaryText: '#a26769', // 일기 제목 색상 (다크) - 톤다운된 로즈, 빈티지
    diaryContent: '#bfc3c9', // 일기 본문 색상 (다크)
    primary: '#ffb3b3', // 주요 포인트 컬러(버튼, 강조 등)
    secondary: '#ffb3b3', // 보조 포인트 컬러(버튼 hover 등)
    border: '#232323', // 카드/컨테이너 테두리 색상
    cardShadow: '0 2px 8px rgba(0,0,0,0.18)', // 카드 그림자
    cardGradient: 'linear-gradient(135deg, #232526 0%,rgb(74, 76, 78) 100%)', // 카드 그라디언트(홈 등)
    writeCardGradient: 'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)', // 일기쓰기 버튼 그라디언트
    menuText: '#d1d5db', // 메뉴 텍스트 색상 (다크, 연회색)
    menuHover: '#333333', // 메뉴 버튼 hover 배경색 (다크)
}; 