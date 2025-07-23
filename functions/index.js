const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");
const { DateTime } = require('luxon');

admin.initializeApp();

const openai = new OpenAI({
    apiKey: functions.config().openai.key,
});

exports.generateNovel = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "소설을 생성하려면 로그인이 필요합니다。",
        );
    }

    const { diaryContents, genre, userName } = data;
    if (!diaryContents || !genre || !userName) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "일기 내용, 장르, 사용자 이름 정보가 필요합니다。",
        );
    }

    try {
        // 1. 장르별 프롬프트 분기 함수 정의
        function getPrompts(genre, diaryContents, novelContent) {
            let contentPrompt, titlePrompt, imagePrompt;
            const diaryBanClause = `아래는 한 주간의 일기입니다.\n- 절대 일기와 관련된 인물, 사건, 배경, 감정, 구체적 내용, 메타적 언급(예: '이 일기를 바탕으로', '경험', '방문', '실제', '반영', '참고', '소재', '영감' 등)과 관련된 단어, 상황, 구조, 시점, 경험을 사용하지 마세요.\n- 일기와 관련된 그 어떤 흔적도 남기지 말고, 완전히 새로운 세계관, 인물, 사건, 대화, 분위기로 창작하세요.\n- 반드시 한국어로 소설을 작성하세요.\n\nBelow is a week of diary entries.\n- Do NOT use any content, characters, events, background, emotions, meta references (such as “based on this diary”, “the writer experienced”, “visited”, “real”, “inspired by”, etc.), or any structure, perspective, or experience related to the diary.\n- Leave no trace of the diary. Write a completely new, original, and unrelated story with new world, characters, events, dialogues, and atmosphere.\n- The novel must be written in Korean.`;
            switch (genre) {
                case '로맨스':
                    contentPrompt = `당신은 실제 출판되는 장편 로맨스 소설 작가입니다. 아래는 한 주간의 일기입니다.\n${diaryBanClause}\n소설은 실제 서점에서 판매되는 로맨스 소설처럼 문학적이고 몰입감 있게, 충분히 길고 풍부하게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 사랑, 설렘, 감정의 변화, 인물 간의 관계와 대화, 내면 묘사를 적극적으로 활용해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요. [일기 내용]\n${diaryContents}`;
                    titlePrompt = `이 소설은 따뜻하고 감성적인 로맨스 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘. [소설 내용]\n${novelContent?.substring(0, 1000)}`;
                    imagePrompt = `A warm, dreamy romantic illustration of a couple or symbolic objects, soft colors, gentle atmosphere. No text, no words, no violence.`;
                    break;
                case '추리':
                    contentPrompt = `당신은 실제 출판되는 장편 추리 소설 작가입니다. 아래는 한 주간의 일기입니다.\n${diaryBanClause}\n소설은 실제 서점에서 판매되는 추리 소설처럼 치밀하고 몰입감 있게, 충분히 길고 풍부하게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 단서, 반전, 추리, 탐정의 추리 과정, 인물 간의 심리전과 대화, 내면 묘사를 적극적으로 활용해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요. [일기 내용]\n${diaryContents}`;
                    titlePrompt = `이 소설은 추리와 반전이 있는 추리 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘. [소설 내용]\n${novelContent?.substring(0, 1000)}`;
                    imagePrompt = `A classic, peaceful illustration inspired by detective stories. Use soft colors and gentle atmosphere. No people, no violence, no text.`;
                    break;
                case '역사':
                    contentPrompt = `당신은 실제 출판되는 장편 역사 소설 작가입니다. 아래는 한 주간의 일기입니다.\n${diaryBanClause}\n소설은 실제 서점에서 판매되는 역사 소설처럼 시대적 배경과 고증, 인물의 삶과 사건, 대화와 내면 묘사가 풍부하게 드러나도록 충분히 길고 몰입감 있게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요. [일기 내용]\n${diaryContents}`;
                    titlePrompt = `이 소설은 시대적 배경이 살아있는 역사 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘. [소설 내용]\n${novelContent?.substring(0, 1000)}`;
                    imagePrompt = `A beautiful, classic historical illustration with traditional buildings and nature. Use warm colors and peaceful mood. No people, no violence, no text.`;
                    break;
                case '동화':
                    contentPrompt = `당신은 실제 출판되는 장편 동화 작가입니다. 아래는 한 주간의 일기입니다.\n${diaryBanClause}\n소설은 실제 서점에서 판매되는 동화처럼 밝고 환상적이며 교훈적이고, 충분히 길고 풍부하게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 상상력과 교훈, 따뜻한 분위기, 인물 간의 대화와 내면 묘사를 적극적으로 활용해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 이야기로 이어지게 해주세요. [일기 내용]\n${diaryContents}`;
                    titlePrompt = `이 소설은 밝고 따뜻한 동화야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘. [소설 내용]\n${novelContent?.substring(0, 1000)}`;
                    imagePrompt = `A colorful, cheerful fairy tale illustration with magical elements, friendly animals, and a bright atmosphere. No text, no scary elements, no violence.`;
                    break;
                case '판타지':
                    contentPrompt = `당신은 실제 출판되는 장편 판타지 소설 작가입니다. 아래는 한 주간의 일기입니다.\n${diaryBanClause}\n소설은 실제 서점에서 판매되는 판타지 소설처럼 세계관, 마법, 신비로운 존재, 모험, 인물 간의 관계와 대화, 내면 묘사가 풍부하게 드러나도록 충분히 길고 몰입감 있게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요. [일기 내용]\n${diaryContents}`;
                    titlePrompt = `이 소설은 신비로운 세계관의 판타지 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘. [소설 내용]\n${novelContent?.substring(0, 1000)}`;
                    imagePrompt = `A dreamy, magical fantasy landscape with bright colors and gentle light. No creatures, no people, no violence, no text.`;
                    break;
                case '공포':
                    contentPrompt = `당신은 실제 출판되는 장편 공포 소설 작가입니다. 아래는 한 주간의 일기입니다.\n${diaryBanClause}\n소설은 실제 서점에서 판매되는 공포 소설처럼 심리적 긴장감, 불안, 이상함, 인물의 내면 변화와 대화, 분위기 묘사가 풍부하게 드러나도록 충분히 길고 몰입감 있게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 직접적인 폭력, 피, 유령, 시체 등은 피하고, 심리적 공포와 분위기, 내면 묘사에 집중해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요. 정체불명의 존재, 이상한 기억의 공백, 반복되는 꿈, 사진 속 괴이한 형체, 이상한 말투 등 공포 요소를 자유롭게 활용해 주세요. 배경은 일상적일수록 좋지만, 점점 이상한 기운이나 초자연적 사건이 드러나도록 구성해 주세요.   [일기 내용]\n${diaryContents}`;
                    titlePrompt = `이 소설은 심리적 긴장감이 있는 공포 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘. [소설 내용]\n${novelContent?.substring(0, 1000)}`;
                    imagePrompt = `A calm, atmospheric illustration with subtle shadows and soft colors. No scary elements, no people, no violence, no text.`;
                    break;
                default:
                    contentPrompt = `당신은 실제 출판되는 장편 '${genre}' 소설 작가입니다. 아래는 한 주간의 일기입니다.\n${diaryBanClause}\n소설은 실제 서점에서 판매되는 소설처럼 문학적이고 몰입감 있게, 충분히 길고 풍부하게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요. [일기 내용]\n${diaryContents}`;
            }
            return { contentPrompt, titlePrompt, imagePrompt };
        }

        // 2. 소설 내용 생성
        const { contentPrompt } = getPrompts(genre, diaryContents);
        const contentResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: contentPrompt }],
            temperature: 0.7,
            max_tokens: 2500,
        });
        const novelContent = contentResponse.choices[0].message.content;

        // 3. 소설 제목 생성
        const { titlePrompt } = getPrompts(genre, diaryContents, novelContent);
        const titleResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: titlePrompt }],
            temperature: 0.8,
            max_tokens: 60,
        });
        const novelTitle = titleResponse.choices[0].message.content.replace(/"/g, '').trim();

        // 4. 소설 표지 이미지 생성
        const { imagePrompt } = getPrompts(genre, diaryContents, novelContent);
        const imageResponse = await openai.images.generate({
            model: "dall-e-2",
            prompt: imagePrompt + ` Story: ${novelContent.substring(0, 700)}`,
            n: 1,
            size: "512x512",
            response_format: "b64_json",
        });

        const b64_json = imageResponse.data[0].b64_json;
        if (!b64_json) {
            throw new Error("b64_json is missing from the OpenAI response.");
        }
        const imageBuffer = Buffer.from(b64_json, "base64");

        const bucket = admin.storage().bucket();
        const fileName = `novel-covers/${novelTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.png`;
        const file = bucket.file(fileName);

        await file.save(imageBuffer, {
            metadata: {
                contentType: "image/png",
            },
            public: true,
        });

        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // 5. 모든 결과 반환
        return { content: novelContent, title: novelTitle, imageUrl: imageUrl };
    } catch (error) {
        console.error("OpenAI API 호출 중 오류 발생:", error);
        throw new functions.https.HttpsError(
            "internal",
            "AI 소설 생성에 실패했습니다. 잠시 후 다시 시도해주세요。",
            error,
        );
    }
});

// 일기 작성 리마인더 예약 푸시 함수
exports.sendDiaryReminders = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const usersSnapshot = await admin.firestore().collection('users')
        .where('reminderEnabled', '==', true)
        .get();

    const messages = [];
    usersSnapshot.forEach(doc => {
        const user = doc.data();
        const token = user.fcmToken;
        const reminderTime = user.reminderTime;

        if (!token || !reminderTime) return;

        const timezone = user.reminderTimezone || 'Asia/Seoul';
        const now = DateTime.now().setZone(timezone).toFormat('HH:mm');

        // 약간의 오차 허용 (±30초 범위)
        const reminderHourMinute = DateTime.fromFormat(reminderTime, 'HH:mm', { zone: timezone });
        const diff = Math.abs(DateTime.now().setZone(timezone).diff(reminderHourMinute, 'minutes').minutes);
        if (diff <= 1) {
            messages.push({
                token,
                notification: {
                    title: '일기 작성 리마인더',
                    body: user.message || '오늘의 일기를 잊지 마세요!',
                }
            });
        }
    });

    if (messages.length === 0) {
        console.log('리마인더 대상자 없음');
        return null;
    }

    try {
        const response = await admin.messaging().sendAll(messages);
        console.log(`${response.successCount}명에게 리마인더 푸시 발송 완료`);
    } catch (error) {
        console.error('FCM 전송 오류:', error);
    }

    return null;
});