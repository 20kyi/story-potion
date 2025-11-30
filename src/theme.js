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
    cardGradient: 'linear-gradient(135deg, #B8D9F5 0%, #A8D0F0 50%, #9AC8EB 100%)', // 카드 그라디언트(홈 등) - Cerulean
    writeCardGradient: 'linear-gradient(135deg, #E8D5D3 0%, #D4A5A5 50%, #C99A9A 100%)', // 일기쓰기 버튼 그라디언트
    menuText: '#222', // 메뉴 텍스트 색상 (라이트)
    menuHover: '#e0e0e0', // 메뉴 버튼 hover 배경색 (라이트)
    primaryBlue: '#4F8CFF', // 산뜻한 파랑(버튼)
    primaryBlueHover: '#2563eb', // 파랑 버튼 hover
    secondaryMint: '#E6F6F2', // 연민트(서브 버튼)
    secondaryMintHover: '#B2E9DB', // 민트 버튼 hover
    secondaryMintText: '#2DBD85', // 민트 텍스트/테두리
    // 홈화면 버튼 라이트모드 색상 (기본값 유지)
    aiCreateCardBg: 'linear-gradient(135deg, #FFF5F3 0%, #FFEBE8 50%, #FFE0DB 100%)',
    aiCreateCardBorder: '#FFD4CC',
    aiCreateCardText: '#8B3E2E',
    aiCreateCardDesc: '#A05245',
    premiumBannerBg: 'linear-gradient(135deg, #ffe29f 0%, #ffc371 100%)',
    premiumBannerText: '#8B4513',
    premiumBannerButtonBg: 'white',
    potionShopButtonBg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 50%, #A5B4FC 100%)',
    // 소설 페이지 진행도 카드 라이트모드 색상 (기본값 유지)
    novelProgressCardBg: '#FFFFFF',
    novelProgressCardBorder: '#E5E5E5',
    novelProgressBarBg: '#E5E5E5',
    novelProgressBarFill: 'linear-gradient(90deg, #C99A9A 0%, #D4A5A5 100%)',
    // 마이페이지 프리미엄 혜택 카드 라이트모드 색상 (기본값 유지)
    premiumUpgradeCardBg: 'linear-gradient(135deg, #F5E6D3 0%, #FFE5B4 50%, #FFD89B 100%)',
    premiumUpgradeCardText: '#8B6914',
    premiumUpgradeCardDesc: 'rgba(139, 105, 20, 0.85)',
    premiumUpgradeCardButtonBg: 'white',
    premiumUpgradeCardButtonText: '#D4A017',
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
    primaryBlue: '#4F8CFF',
    primaryBlueHover: '#2563eb',
    secondaryMint: '#2A3A3A', // 다크에서 민트 대신 어두운 배경
    secondaryMintHover: '#1A2828',
    secondaryMintText: '#2DBD85',
    // 홈화면 버튼 다크모드 색상
    aiCreateCardBg: 'linear-gradient(135deg, #3A2A2A 0%, #2A1F1F 50%, #1F1717 100%)', // AI 소설 만들기 카드 배경
    aiCreateCardBorder: '#4A3535', // AI 소설 만들기 카드 테두리
    aiCreateCardText: '#FFB3B3', // AI 소설 만들기 텍스트
    aiCreateCardDesc: '#D4A5A5', // AI 소설 만들기 설명 텍스트
    premiumBannerBg: 'linear-gradient(135deg, #4A3A2A 0%, #3A2A1F 100%)', // 프리미엄 배너 배경
    premiumBannerText: '#FFD4A5', // 프리미엄 배너 텍스트
    premiumBannerButtonBg: '#2A1F1F', // 프리미엄 배너 버튼 배경
    potionShopButtonBg: 'linear-gradient(135deg, #2A2A3A 0%, #1F1F2A 50%, #17171F 100%)', // 포션 상점 버튼 배경
    // 소설 페이지 진행도 카드 다크모드 색상
    novelProgressCardBg: 'linear-gradient(135deg, #2A2A2A 0%, #1F1F1F 100%)', // 이번주 일기 진행도 카드 배경
    novelProgressCardBorder: '#3A3A3A', // 이번주 일기 진행도 카드 테두리
    novelProgressBarBg: '#3A3A3A', // 진행도 바 배경
    novelProgressBarFill: 'linear-gradient(90deg, #A67A7A 0%, #B88585 100%)', // 진행도 바 채움
    // 마이페이지 프리미엄 혜택 카드 다크모드 색상
    premiumUpgradeCardBg: 'linear-gradient(135deg, #3A2F1F 0%, #2A1F0F 50%, #1F1505 100%)', // 프리미엄 혜택 카드 배경
    premiumUpgradeCardText: '#FFD4A5', // 프리미엄 혜택 카드 텍스트
    premiumUpgradeCardDesc: 'rgba(255, 212, 165, 0.85)', // 프리미엄 혜택 카드 설명 텍스트
    premiumUpgradeCardButtonBg: '#2A1F0F', // 프리미엄 혜택 카드 버튼 배경
    premiumUpgradeCardButtonText: '#FFD4A5', // 프리미엄 혜택 카드 버튼 텍스트
};

// glassTheme: 글래스모피즘 테마 색상
export const glassTheme = {
    mode: 'glass', // 현재 테마 모드
    background: 'transparent', // 전체 배경색 (그라디언트로 처리)
    text: '#2C3E50', // 기본 텍스트 색상
    card: 'rgba(255, 255, 255, 0.25)', // 일반 카드 배경색
    navCard: 'rgba(255, 255, 255, 0.15)', // 네비게이션 바 배경색
    progressCard: 'rgba(255, 255, 255, 0.2)', // 주간일기/통계 등 진행도 카드 배경색
    cardText: '#2C3E50', // 카드 내 주요 텍스트 색상
    cardSubText: '#5A6C7D', // 카드 내 서브/보조 텍스트 색상
    diaryText: '#E74C3C', // 일기 제목 색상
    diaryContent: '#34495E', // 일기 본문 색상
    primary: '#E74C3C', // 주요 포인트 컬러(버튼, 강조 등)
    secondary: '#C0392B', // 보조 포인트 컬러(버튼 hover 등)
    border: 'rgba(255, 255, 255, 0.3)', // 카드/컨테이너 테두리 색상
    cardShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)', // 카드 그림자
    cardGradient: 'linear-gradient(135deg, rgba(184, 217, 245, 0.3) 0%, rgba(168, 208, 240, 0.3) 50%, rgba(154, 200, 235, 0.3) 100%)', // 카드 그라디언트(홈 등)
    writeCardGradient: 'linear-gradient(135deg, rgba(232, 213, 211, 0.3) 0%, rgba(212, 165, 165, 0.3) 50%, rgba(201, 154, 154, 0.3) 100%)', // 일기쓰기 버튼 그라디언트
    menuText: '#2C3E50', // 메뉴 텍스트 색상
    menuHover: 'rgba(255, 255, 255, 0.2)', // 메뉴 버튼 hover 배경색
    primaryBlue: '#4F8CFF', // 산뜻한 파랑(버튼)
    primaryBlueHover: '#2563eb', // 파랑 버튼 hover
    secondaryMint: 'rgba(230, 246, 242, 0.3)', // 연민트(서브 버튼)
    secondaryMintHover: 'rgba(178, 233, 219, 0.4)', // 민트 버튼 hover
    secondaryMintText: '#2DBD85', // 민트 텍스트/테두리
    // 홈화면 버튼 글래스모피즘 색상
    aiCreateCardBg: 'linear-gradient(135deg, rgba(255, 245, 243, 0.3) 0%, rgba(255, 235, 232, 0.3) 50%, rgba(255, 224, 219, 0.3) 100%)',
    aiCreateCardBorder: 'rgba(255, 212, 204, 0.5)',
    aiCreateCardText: '#8B3E2E',
    aiCreateCardDesc: '#A05245',
    premiumBannerBg: 'linear-gradient(135deg, rgba(255, 226, 159, 0.3) 0%, rgba(255, 195, 113, 0.3) 100%)',
    premiumBannerText: '#8B4513',
    premiumBannerButtonBg: 'rgba(255, 255, 255, 0.4)',
    potionShopButtonBg: 'linear-gradient(135deg, rgba(224, 231, 255, 0.3) 0%, rgba(199, 210, 254, 0.3) 50%, rgba(165, 180, 252, 0.3) 100%)',
    // 소설 페이지 진행도 카드 글래스모피즘 색상
    novelProgressCardBg: 'rgba(255, 255, 255, 0.25)',
    novelProgressCardBorder: 'rgba(255, 255, 255, 0.3)',
    novelProgressBarBg: 'rgba(255, 255, 255, 0.2)',
    novelProgressBarFill: 'linear-gradient(90deg, rgba(201, 154, 154, 0.6) 0%, rgba(212, 165, 165, 0.6) 100%)',
    // 마이페이지 프리미엄 혜택 카드 글래스모피즘 색상
    premiumUpgradeCardBg: 'linear-gradient(135deg, rgba(245, 230, 211, 0.3) 0%, rgba(255, 229, 180, 0.3) 50%, rgba(255, 216, 155, 0.3) 100%)',
    premiumUpgradeCardText: '#8B6914',
    premiumUpgradeCardDesc: 'rgba(139, 105, 20, 0.85)',
    premiumUpgradeCardButtonBg: 'rgba(255, 255, 255, 0.4)',
    premiumUpgradeCardButtonText: '#D4A017',
}; 