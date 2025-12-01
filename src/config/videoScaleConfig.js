// 동영상 확대 비율 설정
// 화면 크기별로 다른 확대 비율을 설정할 수 있습니다.
// 테스트 화면에서 조절한 후 아래 값들을 업데이트하세요.

export const VIDEO_SCALE_CONFIG = {
    // 소설 생성 로딩 동영상 확대 비율
    novelLoading: {
        로맨스: {
            mobile: 1.0,
            tablet: 1.2,
            desktop: 1.2,
        },
        역사: {
            mobile: 1.0,
            tablet: 1.2,
            desktop: 1.2,
        },
        추리: {
            mobile: 1.1,
            tablet: 1.2,
            desktop: 1.2,
        },
        공포: {
            mobile: 1.1,
            tablet: 1.2,
            desktop: 1.2,
        },
        동화: {
            mobile: 1.0,
            tablet: 1.2,
            desktop: 1.2,
        },
        판타지: {
            mobile: 1.1,
            tablet: 1.2,
            desktop: 1.2,
        },
    },

    // 앱 시작 로딩 동영상 확대 비율
    startLoading: {
        mobile: 0.6,    // 모바일 (480px 이하)
        tablet: 1.0,    // 태블릿 (481px ~ 1024px)
        desktop: 1.0,   // 데스크탑 (1025px 이상)
    },
};

// 기기 타입 감지 함수
export const getDeviceType = () => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width <= 480) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
};

// 소설 생성 로딩 동영상 확대 비율 가져오기 (장르별)
export const getNovelLoadingVideoScale = (genre) => {
    const deviceType = getDeviceType();
    const genreConfig = VIDEO_SCALE_CONFIG.novelLoading[genre];
    if (!genreConfig) {
        // 장르가 없으면 기본값 (로맨스 사용)
        return VIDEO_SCALE_CONFIG.novelLoading['로맨스'][deviceType] || 1.2;
    }
    return genreConfig[deviceType] || 1.2;
};

// 앱 시작 로딩 동영상 확대 비율 가져오기
export const getStartLoadingVideoScale = () => {
    const deviceType = getDeviceType();
    return VIDEO_SCALE_CONFIG.startLoading[deviceType];
};
