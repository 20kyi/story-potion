// 튜토리얼 소설 데이터
export const getTutorialNovel = (userCreatedAt = null) => {
    // 사용자 가입일이 있으면 사용, 없으면 현재 시간 사용
    const createdAtDate = userCreatedAt
        ? (userCreatedAt.toDate ? userCreatedAt.toDate() : new Date(userCreatedAt))
        : new Date();

    const year = createdAtDate.getFullYear();
    const month = createdAtDate.getMonth() + 1;

    // createdAt을 Firestore Timestamp 형식으로 변환
    const createdAtTimestamp = userCreatedAt
        ? (userCreatedAt.toDate
            ? { seconds: Math.floor(userCreatedAt.toDate().getTime() / 1000), nanoseconds: 0 }
            : (userCreatedAt.seconds
                ? userCreatedAt
                : { seconds: Math.floor(new Date(userCreatedAt).getTime() / 1000), nanoseconds: 0 }))
        : { seconds: Math.floor(createdAtDate.getTime() / 1000), nanoseconds: 0 };

    return {
        id: 'tutorial',
        userId: 'system',
        title: '스토리 포션 시작하기',
        imageUrl: process.env.PUBLIC_URL + '/bookcover.png',
        year: year,
        month: month,
        weekNum: 1,
        genre: '동화',
        content: `# 스토리 포션에 오신 것을 환영합니다! 📚

안녕하세요! 스토리 포션은 당신의 일기를 소설로 만들어주는 특별한 앱입니다.

## 주요 기능

### 1. 일기 작성하기 ✍️
- 매일 일기를 작성하세요
- 사진도 함께 첨부할 수 있어요
- 오늘의 글감을 참고해보세요

### 2. 소설 생성하기 ✨
- 일기를 모아 소설을 만들어보세요
- 다양한 장르를 선택할 수 있어요
- AI가 당신의 이야기를 멋진 소설로 변환해드립니다

### 3. 다른 사람의 소설 읽기 📖
- 다른 사용자들이 만든 소설을 읽어보세요
- 좋아하는 소설은 구매해서 서재에 보관할 수 있어요

### 4. 포션 사용하기 🧪
- 포션을 사용하면 무료로 소설을 생성할 수 있어요
- 다양한 장르의 포션이 준비되어 있어요

## 시작하기

1. 홈 화면에서 "일기 쓰기" 버튼을 눌러 첫 일기를 작성해보세요
2. 일기를 모아 소설을 만들어보세요
3. 다른 사람들의 소설도 구경해보세요

감사합니다! 🎉`,
        createdAt: createdAtTimestamp,
        isPublic: true,
        ownerName: '스토리 포션',
        week: `${year}년 ${month}월 1주차`,
        dateRange: '',
        isTutorial: true // 튜토리얼 책임을 표시
    };
};

// 튜토리얼 책인지 확인
export const isTutorialNovel = (novel) => {
    return novel?.id === 'tutorial' || novel?.isTutorial === true;
};

