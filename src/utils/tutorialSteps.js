/**
 * 튜토리얼 단계 정의
 * 각 단계는 특정 요소를 가리키고 설명을 제공합니다.
 */

// 홈 화면 온보딩 튜토리얼
export const homeOnboardingSteps = [
  {
    target: '[data-tutorial="write-diary-button"]',
    title: '일기 작성하기',
    content: '여기서 매일 일기를 작성할 수 있어요. 일주일치 일기를 모두 작성하면 소설을 만들 수 있어요!',
    position: 'bottom',
    showSkip: true,
    allowClickOutside: false,
  },
  {
    target: '[data-tutorial="ai-create-button"]',
    title: 'AI 소설 만들기',
    content: '일주일치 일기를 작성하면 AI가 소설로 변환해줘요. 다양한 장르의 소설을 만들어보세요!',
    position: 'bottom',
    showSkip: true,
    allowClickOutside: false,
  },
  {
    target: '[data-tutorial="potion-shop-button"]',
    title: '포션 상점',
    content: '소설 생성에 필요한 포션을 구매할 수 있어요. 포인트로 다양한 장르의 포션을 구매하세요.',
    position: 'bottom',
    showSkip: true,
    allowClickOutside: false,
  },
  {
    target: '[data-tutorial="premium-banner"]',
    title: '프리미엄 구독',
    content: '프리미엄 회원이 되면 한 주에 여러 장르의 소설을 무제한으로 생성할 수 있어요!',
    position: 'bottom',
    showSkip: true,
    allowClickOutside: false,
  },
];

// 소설 생성 튜토리얼
export const novelCreationSteps = [
  {
    target: '[data-tutorial="week-selector"]',
    title: '주차 선택',
    content: '일기를 작성한 주차를 선택하세요. 일주일치 일기가 모두 작성된 주차만 선택할 수 있어요.',
    position: 'bottom',
    showSkip: true,
    allowClickOutside: false,
  },
  {
    target: '[data-tutorial="genre-selector"]',
    title: '장르 선택',
    content: '원하는 장르를 선택하세요. 각 장르마다 다른 스타일의 소설이 생성됩니다.',
    position: 'bottom',
    showSkip: true,
    allowClickOutside: false,
  },
  {
    target: '[data-tutorial="create-button"]',
    title: '소설 생성',
    content: '이 버튼을 누르면 AI가 일주일치 일기를 분석하여 소설로 변환합니다. 포션 1개가 소모됩니다.',
    position: 'top',
    showSkip: true,
    allowClickOutside: false,
  },
];


