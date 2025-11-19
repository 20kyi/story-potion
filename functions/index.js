const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");
const { DateTime } = require('luxon');

admin.initializeApp();

// OpenAI 클라이언트 초기화 (에러 처리 포함)
let openai;
try {
    const apiKey = functions.config().openai?.key;
    if (!apiKey) {
        console.error("⚠️ OpenAI API 키가 설정되지 않았습니다.");
    } else {
        openai = new OpenAI({
            apiKey: apiKey,
        });
        console.log("✅ OpenAI 클라이언트 초기화 완료");
    }
} catch (error) {
    console.error("❌ OpenAI 클라이언트 초기화 실패:", error);
}

exports.generateNovel = functions.runWith({
    timeoutSeconds: 540, // 9분 (최대값)
    memory: '1GB'
}).https.onCall(async (data, context) => {
    // 최상위 레벨에서 모든 에러를 잡아서 명확한 메시지로 전달
    try {
        console.log("=== generateNovel 함수 호출 시작 ===");
        console.log("요청 시간:", new Date().toISOString());
        console.log("사용자 ID:", context.auth?.uid || "인증되지 않음");

        if (!context.auth) {
            console.error("❌ 인증되지 않은 사용자");
            throw new functions.https.HttpsError(
                "unauthenticated",
                "소설을 생성하려면 로그인이 필요합니다。",
            );
        }

        const { diaryContents, genre, userName, language } = data;
        console.log("요청 데이터:", {
            diaryContentsLength: diaryContents?.length || 0,
            genre: genre,
            userName: userName,
            language: language
        });

        if (!diaryContents || !genre || !userName) {
            console.error("❌ 필수 파라미터 누락:", { diaryContents: !!diaryContents, genre: !!genre, userName: !!userName });
            throw new functions.https.HttpsError(
                "invalid-argument",
                "일기 내용, 장르, 사용자 이름 정보가 필요합니다。",
            );
        }

        try {
            // OpenAI 클라이언트 확인
            if (!openai) {
                const apiKey = functions.config().openai?.key;
                console.error("❌ OpenAI 클라이언트가 초기화되지 않았습니다.");
                console.error("API 키 상태:", apiKey ? "설정됨" : "설정되지 않음");
                throw new functions.https.HttpsError(
                    "failed-precondition",
                    "OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.",
                    { message: "OpenAI API 키가 설정되지 않았습니다." }
                );
            }

            // OpenAI API 키 재확인
            const apiKey = functions.config().openai?.key;
            console.log("✅ OpenAI API 키 확인:", apiKey ? "설정됨" : "설정되지 않음");
            if (!apiKey) {
                console.error("❌ OpenAI API 키가 설정되지 않았습니다.");
                throw new functions.https.HttpsError(
                    "failed-precondition",
                    "OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.",
                    { message: "OpenAI API 키가 설정되지 않았습니다." }
                );
            }

            const targetLanguage = language === 'en' ? 'en' : 'ko';

            // 1. 장르별 프롬프트 분기 함수 정의
            function getPrompts(genre, diaryContents, novelContent, lang) {
                const isEnglish = lang === 'en';
                let contentPrompt, titlePrompt, imagePrompt;

                const diaryBanClauseKo = `아래는 한 주간의 일기입니다.
- 절대 일기와 관련된 인물, 사건, 배경, 감정, 구체적 내용, 메타적 언급(예: '이 일기를 바탕으로', '경험', '방문', '실제', '반영', '참고', '소재', '영감' 등)과 관련된 단어, 상황, 구조, 시점, 경험을 사용하지 마세요.
- 일기와 관련된 그 어떤 흔적도 남기지 말고, 완전히 새로운 세계관, 인물, 사건, 대화, 분위기로 창작하세요.
- 반드시 한국어로 소설을 작성하세요.
`;

                const diaryBanClauseEn = `Below is a week of diary entries.
- Do NOT use any content, characters, events, background, emotions, meta references (such as “based on this diary”, “the writer experienced”, “visited”, “real”, “inspired by”, etc.), or any structure, perspective, or experience related to the diary.
- Leave absolutely no trace of the diary. Write a completely new, original, and unrelated story with a new world, characters, events, dialogues, and atmosphere.
- The novel must be written in English.
`;

                const diaryBanClause = isEnglish ? diaryBanClauseEn : diaryBanClauseKo;
                switch (genre) {
                    case '로맨스':
                        if (isEnglish) {
                            contentPrompt = `You are a professional romance novelist.
${diaryBanClause}
Write a long, immersive romance novel as if it will be published in a bookstore. Include rich emotions, conversations between characters, and inner monologues. Focus on love, excitement, and the changes in relationships. Do not separate introduction/body/conclusion—write it as one continuous, natural story.

[Diary entries]
${diaryContents}`;
                            titlePrompt = `This is a warm and emotional romance novel. Suggest only one most fitting title in English, with no explanation.

[Novel]
${novelContent?.substring(0, 1000)}`;
                        } else {
                            contentPrompt = `당신은 실제 출판되는 장편 로맨스 소설 작가입니다.
${diaryBanClause}
소설은 실제 서점에서 판매되는 로맨스 소설처럼 문학적이고 몰입감 있게, 충분히 길고 풍부하게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 사랑, 설렘, 감정의 변화, 인물 간의 관계와 대화, 내면 묘사를 적극적으로 활용해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

[일기 내용]
${diaryContents}`;
                            titlePrompt = `이 소설은 따뜻하고 감성적인 로맨스 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 1000)}`;
                        }
                        imagePrompt = `A warm, dreamy romantic illustration of a couple or symbolic objects, soft colors, gentle atmosphere. No text, no words, no violence.`;
                        break;
                    case '추리':
                        if (isEnglish) {
                            contentPrompt = `You are a professional mystery novelist.
${diaryBanClause}
Write a long, immersive mystery novel as if it will be published in a bookstore. Include clues, twists, psychological tension, investigation process, dialogues, and inner monologues. Do not separate introduction/body/conclusion—write it as one continuous, natural story.

[Diary entries]
${diaryContents}`;
                            titlePrompt = `This is a mystery novel full of deduction and twists. Suggest only one most fitting English title, with no explanation.

[Novel]
${novelContent?.substring(0, 1000)}`;
                        } else {
                            contentPrompt = `당신은 실제 출판되는 장편 추리 소설 작가입니다.
${diaryBanClause}
소설은 실제 서점에서 판매되는 추리 소설처럼 치밀하고 몰입감 있게, 충분히 길고 풍부하게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 단서, 반전, 추리, 탐정의 추리 과정, 인물 간의 심리전과 대화, 내면 묘사를 적극적으로 활용해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

[일기 내용]
${diaryContents}`;
                            titlePrompt = `이 소설은 추리와 반전이 있는 추리 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 1000)}`;
                        }
                        imagePrompt = `A classic, peaceful illustration inspired by detective stories. Use soft colors and gentle atmosphere. No people, no violence, no text.`;
                        break;
                    case '역사':
                        if (isEnglish) {
                            contentPrompt = `You are a professional historical novelist.
${diaryBanClause}
Write a long, immersive historical novel with vivid setting, accurate details, and rich descriptions of people's lives and events. Include dialogues and inner monologues. Write it as one continuous story.

[Diary entries]
${diaryContents}`;
                            titlePrompt = `This is a historical novel with a vivid sense of era. Suggest only one most fitting English title, with no explanation.

[Novel]
${novelContent?.substring(0, 1000)}`;
                        } else {
                            contentPrompt = `당신은 실제 출판되는 장편 역사 소설 작가입니다.
${diaryBanClause}
소설은 실제 서점에서 판매되는 역사 소설처럼 시대적 배경과 고증, 인물의 삶과 사건, 대화와 내면 묘사가 풍부하게 드러나도록 충분히 길고 몰입감 있게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

[일기 내용]
${diaryContents}`;
                            titlePrompt = `이 소설은 시대적 배경이 살아있는 역사 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 1000)}`;
                        }
                        imagePrompt = `A beautiful, classic historical illustration with traditional buildings and nature. Use warm colors and peaceful mood. No people, no violence, no text.`;
                        break;
                    case '동화':
                        if (isEnglish) {
                            contentPrompt = `You are a professional children's fairy tale writer.
${diaryBanClause}
Write a bright, heartwarming, and meaningful fairy tale that feels like a published storybook. Use imagination, gentle lessons, dialogues, and inner monologues. Write it as one continuous story.

[Diary entries]
${diaryContents}`;
                            titlePrompt = `This is a bright and heartwarming fairy tale. Suggest only one most fitting English title, with no explanation.

[Novel]
${novelContent?.substring(0, 1000)}`;
                        } else {
                            contentPrompt = `당신은 실제 출판되는 장편 동화 작가입니다.
${diaryBanClause}
소설은 실제 서점에서 판매되는 동화처럼 밝고 환상적이며 교훈적이고, 충분히 길고 풍부하게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 상상력과 교훈, 따뜻한 분위기, 인물 간의 대화와 내면 묘사를 적극적으로 활용해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 이야기로 이어지게 해주세요.

[일기 내용]
${diaryContents}`;
                            titlePrompt = `이 소설은 밝고 따뜻한 동화야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 1000)}`;
                        }
                        imagePrompt = `A colorful, cheerful fairy tale illustration with magical elements, friendly animals, and a bright atmosphere. No text, no scary elements, no violence.`;
                        break;
                    case '판타지':
                        if (isEnglish) {
                            contentPrompt = `You are a professional fantasy novelist.
${diaryBanClause}
Write a long, immersive fantasy novel with a rich world, magic, mysterious beings, and adventures. Include dialogues and inner monologues and write it as one continuous story.

[Diary entries]
${diaryContents}`;
                            titlePrompt = `This is a fantasy novel set in a mysterious world. Suggest only one most fitting English title, with no explanation.

[Novel]
${novelContent?.substring(0, 1000)}`;
                        } else {
                            contentPrompt = `당신은 실제 출판되는 장편 판타지 소설 작가입니다.
${diaryBanClause}
소설은 실제 서점에서 판매되는 판타지 소설처럼 세계관, 마법, 신비로운 존재, 모험, 인물 간의 관계와 대화, 내면 묘사가 풍부하게 드러나도록 충분히 길고 몰입감 있게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

[일기 내용]
${diaryContents}`;
                            titlePrompt = `이 소설은 신비로운 세계관의 판타지 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 1000)}`;
                        }
                        imagePrompt = `A dreamy, magical fantasy landscape with bright colors and gentle light. No creatures, no people, no violence, no text.`;
                        break;
                    case '공포':
                        if (isEnglish) {
                            contentPrompt = `You are a professional horror novelist.
${diaryBanClause}
Write a long, immersive psychological horror novel focusing on tension, unease, and atmosphere rather than gore. Avoid explicit violence, blood, ghosts, or corpses. Use strange memories, odd behaviors, subtle supernatural hints, dialogues, and inner monologues.

[Diary entries]
${diaryContents}`;
                            titlePrompt = `This is a horror novel with strong psychological tension. Suggest only one most fitting English title, with no explanation.

[Novel]
${novelContent?.substring(0, 1000)}`;
                        } else {
                            contentPrompt = `당신은 실제 출판되는 장편 공포 소설 작가입니다.
${diaryBanClause}
소설은 실제 서점에서 판매되는 공포 소설처럼 심리적 긴장감, 불안, 이상함, 인물의 내면 변화와 대화, 분위기 묘사가 풍부하게 드러나도록 충분히 길고 몰입감 있게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 직접적인 폭력, 피, 유령, 시체 등은 피하고, 심리적 공포와 분위기, 내면 묘사에 집중해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요. 정체불명의 존재, 이상한 기억의 공백, 반복되는 꿈, 사진 속 괴이한 형체, 이상한 말투 등 공포 요소를 자유롭게 활용해 주세요. 배경은 일상적일수록 좋지만, 점점 이상한 기운이나 초자연적 사건이 드러나도록 구성해 주세요.

[일기 내용]
${diaryContents}`;
                            titlePrompt = `이 소설은 심리적 긴장감이 있는 공포 소설이야. 가장 어울리는 제목 하나만 추천해줘. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 1000)}`;
                        }
                        imagePrompt = `A calm, atmospheric illustration with subtle shadows and soft colors. No scary elements, no people, no violence, no text.`;
                        break;
                    default:
                        if (isEnglish) {
                            contentPrompt = `You are a professional '${genre}' novelist.
${diaryBanClause}
Write a long, immersive novel as if it will be published in a bookstore. Include dialogues and inner monologues and write it as one continuous story.

[Diary entries]
${diaryContents}`;
                        } else {
                            contentPrompt = `당신은 실제 출판되는 장편 '${genre}' 소설 작가입니다.
${diaryBanClause}
소설은 실제 서점에서 판매되는 소설처럼 문학적이고 몰입감 있게, 충분히 길고 풍부하게 써주세요. 등장인물, 동물, 사물들이 서로 대화하고, 혼자 생각하는 장면을 꼭 포함해 주세요. 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

[일기 내용]
${diaryContents}`;
                        }
                }
                return { contentPrompt, titlePrompt, imagePrompt };
            }

            // 재시도 헬퍼 함수 (exponential backoff)
            async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        const result = await fn();
                        return result;
                    } catch (error) {
                        // OpenAI SDK v4 에러 구조 처리
                        const statusCode = error.statusCode || error.status || error.response?.status;
                        const isRateLimit = statusCode === 429 || error.message?.toLowerCase().includes('rate limit');

                        console.error(`재시도 중 에러 발생 (시도 ${i + 1}/${maxRetries}):`, {
                            statusCode: statusCode,
                            message: error.message,
                            errorType: error.constructor?.name,
                            isRateLimit: isRateLimit
                        });

                        if (isRateLimit) {
                            if (i < maxRetries - 1) {
                                const delay = baseDelay * Math.pow(2, i);
                                console.log(`Rate limit 발생, ${delay}ms 후 재시도... (${i + 1}/${maxRetries})`);
                                await new Promise(resolve => setTimeout(resolve, delay));
                                continue;
                            }
                        }
                        // Rate limit이 아니거나 재시도 횟수를 초과한 경우 에러를 던짐
                        throw error;
                    }
                }
            }

            // 2. 소설 내용 생성
            console.log("소설 내용 생성 시작...");
            console.log("장르:", genre);
            console.log("타겟 언어:", targetLanguage);
            console.log("일기 내용 길이:", diaryContents?.length || 0);
            const { contentPrompt } = getPrompts(genre, diaryContents, null, targetLanguage);
            console.log("프롬프트 길이:", contentPrompt?.length || 0);
            let contentResponse;
            try {
                contentResponse = await retryWithBackoff(async () => {
                    console.log("OpenAI API 호출 시작 (소설 내용)...");
                    const response = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: contentPrompt }],
                        temperature: 0.7,
                        max_tokens: 2500,
                    });
                    console.log("OpenAI API 응답 받음 (소설 내용)");
                    return response;
                });
            } catch (error) {
                console.error("소설 내용 생성 실패 - 상세 에러:", {
                    message: error.message,
                    statusCode: error.statusCode,
                    status: error.status,
                    responseStatus: error.response?.status,
                    errorType: error.constructor?.name,
                    stack: error.stack?.substring(0, 500)
                });
                const statusCode = error.statusCode || error.status || error.response?.status;
                if (statusCode === 429) {
                    throw new Error("OpenAI API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.");
                }
                if (statusCode === 401) {
                    throw new Error("OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요.");
                }
                if (statusCode === 500 || statusCode === 503) {
                    throw new Error("OpenAI 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
                }
                throw new Error(`소설 내용 생성 실패: ${error.message || error.toString()}`);
            }
            if (!contentResponse?.choices?.[0]?.message?.content) {
                throw new Error("소설 내용 생성 응답이 올바르지 않습니다.");
            }
            const novelContent = contentResponse.choices[0].message.content;
            console.log("소설 내용 생성 완료, 길이:", novelContent.length);

            // 3. 소설 제목 생성
            console.log("소설 제목 생성 시작...");
            const { titlePrompt } = getPrompts(genre, diaryContents, novelContent, targetLanguage);
            let titleResponse;
            try {
                titleResponse = await retryWithBackoff(async () => {
                    return await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: titlePrompt }],
                        temperature: 0.8,
                        max_tokens: 60,
                    });
                });
            } catch (error) {
                console.error("소설 제목 생성 실패 - 상세 에러:", {
                    message: error.message,
                    statusCode: error.statusCode,
                    status: error.status,
                    responseStatus: error.response?.status,
                    errorType: error.constructor?.name
                });
                const statusCode = error.statusCode || error.status || error.response?.status;
                if (statusCode === 429) {
                    throw new Error("OpenAI API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.");
                }
                if (statusCode === 401) {
                    throw new Error("OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요.");
                }
                throw new Error(`소설 제목 생성 실패: ${error.message || error.toString()}`);
            }
            if (!titleResponse?.choices?.[0]?.message?.content) {
                throw new Error("소설 제목 생성 응답이 올바르지 않습니다.");
            }
            const novelTitle = titleResponse.choices[0].message.content.replace(/"/g, '').trim();
            console.log("소설 제목 생성 완료:", novelTitle);

            // 4. 소설 표지 이미지 생성
            console.log("소설 표지 이미지 생성 시작...");
            const { imagePrompt } = getPrompts(genre, diaryContents, novelContent);
            let imageResponse;
            try {
                imageResponse = await retryWithBackoff(async () => {
                    return await openai.images.generate({
                        model: "dall-e-2",
                        prompt: imagePrompt + ` Story: ${novelContent.substring(0, 700)}`,
                        n: 1,
                        size: "512x512",
                        response_format: "b64_json",
                    });
                });
            } catch (error) {
                console.error("이미지 생성 실패 - 상세 에러:", {
                    message: error.message,
                    statusCode: error.statusCode,
                    status: error.status,
                    responseStatus: error.response?.status,
                    errorType: error.constructor?.name
                });
                const statusCode = error.statusCode || error.status || error.response?.status;
                if (statusCode === 429) {
                    throw new Error("OpenAI API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.");
                }
                if (statusCode === 401) {
                    throw new Error("OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요.");
                }
                throw new Error(`이미지 생성 실패: ${error.message || error.toString()}`);
            }

            if (!imageResponse?.data?.[0]?.b64_json) {
                throw new Error("이미지 생성 응답이 올바르지 않습니다. b64_json이 없습니다.");
            }
            const b64_json = imageResponse.data[0].b64_json;
            const imageBuffer = Buffer.from(b64_json, "base64");
            console.log("이미지 생성 완료, 크기:", imageBuffer.length, "bytes");

            // 5. Storage에 이미지 업로드
            console.log("Storage 업로드 시작...");
            try {
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
                console.log("Storage 업로드 완료:", imageUrl);

                // 6. 모든 결과 반환
                return { content: novelContent, title: novelTitle, imageUrl: imageUrl };
            } catch (error) {
                console.error("Storage 업로드 실패:", error);
                throw new Error(`Storage 업로드 실패: ${error.message}`);
            }
        } catch (error) {
            console.error("=== 소설 생성 함수 에러 발생 ===");
            console.error("에러 타입:", error.constructor?.name);
            console.error("에러 메시지:", error.message);
            console.error("에러 스택:", error.stack);
            console.error("에러 코드:", error.code);
            console.error("상태 코드:", error.statusCode || error.status || error.response?.status);
            console.error("전체 에러 객체:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

            // 에러 메시지 구성
            let errorMessage = "AI 소설 생성에 실패했습니다.";
            let errorCode = "internal";

            // OpenAI API 키 관련 에러
            if (error.message?.includes("OpenAI API 키")) {
                errorMessage = "OpenAI API 키가 설정되지 않았거나 유효하지 않습니다. 관리자에게 문의하세요.";
                errorCode = "failed-precondition";
            }
            // Rate limit 에러
            else if (error.statusCode === 429 || error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
                errorMessage = "OpenAI API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.";
                errorCode = "resource-exhausted";
            }
            // 인증 에러
            else if (error.statusCode === 401 || error.status === 401) {
                errorMessage = "OpenAI API 인증에 실패했습니다. API 키를 확인해주세요.";
                errorCode = "unauthenticated";
            }
            // 서버 에러
            else if (error.statusCode === 500 || error.status === 500 || error.statusCode === 503 || error.status === 503) {
                errorMessage = "OpenAI 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
                errorCode = "unavailable";
            }
            // Storage 에러
            else if (error.message?.includes("Storage")) {
                errorMessage = `이미지 저장에 실패했습니다: ${error.message}`;
            }
            // 기타 에러
            else if (error.message) {
                errorMessage = `소설 생성 중 오류가 발생했습니다: ${error.message}`;
            }

            // 클라이언트로 전달할 상세 정보 (직렬화 가능한 형태로만)
            const safeDetails = {
                message: error.message || "알 수 없는 오류",
                code: error.code || null,
                statusCode: error.statusCode || error.status || error.response?.status || null,
                errorType: error.constructor?.name || "Error",
                originalMessage: error.message || "알 수 없는 오류",
            };

            // 에러 메시지에 상세 정보 포함 (details가 전달되지 않을 경우 대비)
            // 원본 에러 메시지가 있으면 포함, 없으면 간단한 메시지만
            const fullErrorMessage = error.message && error.message !== errorMessage
                ? `${errorMessage} (원인: ${error.message})`
                : errorMessage;

            console.error("클라이언트로 전달할 에러 메시지:", fullErrorMessage);
            console.error("클라이언트로 전달할 상세 정보:", JSON.stringify(safeDetails, null, 2));
            console.error("에러 코드:", errorCode);

            // HttpsError 던지기
            throw new functions.https.HttpsError(
                errorCode,
                fullErrorMessage,
                safeDetails,
            );
        }
    } catch (outerError) {
        // 최상위 레벨에서 모든 예상치 못한 에러를 잡음
        console.error("=== 최상위 레벨 에러 발생 ===");
        console.error("에러 타입:", outerError.constructor?.name);
        console.error("에러 메시지:", outerError.message);
        console.error("에러 스택:", outerError.stack);

        // 이미 HttpsError인 경우 그대로 던지기
        if (outerError instanceof functions.https.HttpsError) {
            console.error("HttpsError로 전달:", outerError.message);
            throw outerError;
        }

        // 그 외의 에러는 HttpsError로 변환
        const errorMessage = outerError.message || "알 수 없는 오류가 발생했습니다.";
        console.error("일반 에러를 HttpsError로 변환:", errorMessage);

        throw new functions.https.HttpsError(
            "internal",
            `소설 생성 중 오류가 발생했습니다: ${errorMessage}`,
            {
                message: errorMessage,
                errorType: outerError.constructor?.name || "Error",
                originalError: outerError.toString()
            }
        );
    }
});

// 일기 작성 리마인더 예약 푸시 함수
exports.sendDiaryReminders = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const utcNow = DateTime.now().setZone('UTC');
    const kstNow = DateTime.now().setZone('Asia/Seoul');
    console.log('리마인더 함수 실행 시작');
    console.log('UTC 시간:', utcNow.toFormat('yyyy-MM-dd HH:mm:ss'));
    console.log('한국 시간:', kstNow.toFormat('yyyy-MM-dd HH:mm:ss'));

    try {
        const usersSnapshot = await admin.firestore().collection('users')
            .where('reminderEnabled', '==', true)
            .get();

        if (usersSnapshot.empty) {
            console.log('리마인더 활성화된 사용자 없음');
            return null;
        }

        console.log(`리마인더 활성화된 사용자: ${usersSnapshot.size}명`);

        const messages = [];

        // 각 사용자에 대해 비동기로 처리
        const userPromises = usersSnapshot.docs.map(async (userDoc) => {
            const user = userDoc.data();
            const userId = userDoc.id;
            const token = user.fcmToken;
            const reminderTime = user.reminderTime;

            if (!token || !reminderTime) {
                console.log(`사용자 ${userId}: FCM 토큰 또는 알림 시간 없음 (토큰: ${!!token}, 시간: ${reminderTime})`);
                return null;
            }

            const timezone = user.reminderTimezone || 'Asia/Seoul';
            const now = DateTime.now().setZone(timezone);
            const reminderHourMinute = DateTime.fromFormat(reminderTime, 'HH:mm', { zone: timezone });

            // 현재 시간과 알림 시간 비교
            const currentTimeInMinutes = now.hour * 60 + now.minute;
            const reminderTimeInMinutes = reminderHourMinute.hour * 60 + reminderHourMinute.minute;

            // 디버깅 로그
            console.log(`사용자 ${userId}: 현재 시간(${timezone}): ${now.toFormat('HH:mm:ss')}, 알림 시간: ${reminderTime}, 차이: ${Math.abs(currentTimeInMinutes - reminderTimeInMinutes)}분`);

            // 정확히 같은 분인지 확인 (함수가 1분마다 실행되므로, 현재 분이 알림 시간의 분과 일치해야 함)
            // 예: 알림 시간이 21:00이면, 21:00:00 ~ 21:00:59 사이에 실행될 때만 알림 발송
            if (currentTimeInMinutes !== reminderTimeInMinutes) {
                // 알림 시간이 아님
                return null;
            }

            // 오늘 날짜를 yyyy-mm-dd 형식으로 생성
            const todayStr = now.toFormat('yyyy-MM-dd');

            // 오늘 일기를 이미 작성했는지 확인
            const diariesRef = admin.firestore().collection('diaries');
            const todayDiaryQuery = await diariesRef
                .where('userId', '==', userId)
                .where('date', '==', todayStr)
                .limit(1)
                .get();

            if (!todayDiaryQuery.empty) {
                console.log(`사용자 ${userId}: 오늘(${todayStr}) 일기 이미 작성됨 - 알림 건너뜀`);
                return null;
            }

            // 오늘 일기를 작성하지 않았고, 알림 시간이 맞으면 알림 추가
            console.log(`✅ 사용자 ${userId}: 리마인더 알림 추가 (시간: ${reminderTime}, 타임존: ${timezone}, 현재: ${now.toFormat('HH:mm:ss')})`);
            return {
                token,
                notification: {
                    title: '일기 작성 리마인더',
                    body: user.message || '오늘의 일기를 잊지 마세요!',
                },
                data: {
                    type: 'diary_reminder',
                    userId: userId
                }
            };
        });

        // 모든 사용자 확인 완료 대기
        const results = await Promise.all(userPromises);

        // null이 아닌 결과만 messages에 추가
        results.forEach(result => {
            if (result) {
                messages.push(result);
            }
        });

        if (messages.length === 0) {
            console.log('리마인더 대상자 없음 (모두 오늘 일기 작성 완료 또는 시간 불일치)');
            return null;
        }

        console.log(`${messages.length}명에게 리마인더 푸시 발송 시도`);

        // FCM으로 알림 전송
        let successCount = 0;
        let failureCount = 0;

        if (messages.length === 1) {
            // 메시지가 1개일 때는 send() 사용
            try {
                const message = messages[0];
                console.log('메시지 형식 확인:', JSON.stringify({
                    token: message.token ? '있음' : '없음',
                    notification: message.notification ? '있음' : '없음',
                    data: message.data ? '있음' : '없음'
                }));

                const result = await admin.messaging().send(message);
                successCount = 1;
                console.log('1명에게 리마인더 푸시 발송 완료, 메시지 ID:', result);
            } catch (error) {
                failureCount = 1;
                console.error('리마인더 푸시 발송 실패:', error);
                console.error('에러 상세:', {
                    code: error.code,
                    message: error.message,
                    stack: error.stack
                });
            }
        } else {
            // 여러 메시지는 sendAll() 사용
            try {
                const response = await admin.messaging().sendAll(messages);
                successCount = response.successCount;
                failureCount = response.failureCount;
                console.log(`${response.successCount}명에게 리마인더 푸시 발송 완료`);

                if (response.failureCount > 0) {
                    console.warn(`${response.failureCount}명에게 리마인더 푸시 발송 실패`);
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            console.error(`사용자 ${idx} 알림 실패:`, resp.error);
                        }
                    });
                }
            } catch (error) {
                failureCount = messages.length;
                console.error('리마인더 푸시 발송 실패:', error);
            }
        }

        return null;
    } catch (error) {
        console.error('리마인더 함수 실행 오류:', error);
        return null;
    }
});

// 월간 프리미엄 자동 갱신 함수 (매일 자정에 실행)
exports.renewMonthlyPremium = functions.pubsub.schedule('every day 00:00').timeZone('Asia/Seoul').onRun(async (context) => {
    console.log('월간 프리미엄 자동 갱신 시작...');
    const now = admin.firestore.Timestamp.now();
    const nowDate = new Date();

    try {
        // 월간 프리미엄 회원 중 갱신일이 지난 사용자 조회
        const usersSnapshot = await admin.firestore().collection('users')
            .where('isMonthlyPremium', '==', true)
            .where('premiumRenewalDate', '<=', now)
            .get();

        if (usersSnapshot.empty) {
            console.log('갱신 대상자 없음');
            return null;
        }

        let renewedCount = 0;
        const batchSize = 500; // Firestore 배치 제한
        let batch = admin.firestore().batch();
        let currentBatchCount = 0;
        const batches = [];

        usersSnapshot.forEach((userDoc) => {
            const userData = userDoc.data();

            // premiumRenewalDate가 실제로 지났는지 확인
            let renewalDate;
            if (userData.premiumRenewalDate?.seconds) {
                renewalDate = new Date(userData.premiumRenewalDate.seconds * 1000);
            } else if (userData.premiumRenewalDate?.toDate) {
                renewalDate = userData.premiumRenewalDate.toDate();
            } else {
                renewalDate = new Date(userData.premiumRenewalDate);
            }

            // 갱신일이 지났고, 해지되지 않은 경우에만 갱신
            // premiumCancelled 필드가 없거나 false인 경우 갱신
            if (renewalDate <= nowDate && userData.isMonthlyPremium && userData.premiumCancelled !== true) {
                // 다음 갱신일 계산 (1개월 후)
                const nextRenewalDate = new Date(renewalDate);
                nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);

                const userRef = admin.firestore().collection('users').doc(userDoc.id);
                batch.update(userRef, {
                    premiumRenewalDate: admin.firestore.Timestamp.fromDate(nextRenewalDate),
                    premiumStartDate: admin.firestore.Timestamp.fromDate(nowDate),
                    updatedAt: admin.firestore.Timestamp.now()
                });

                renewedCount++;
                currentBatchCount++;

                // 배치 크기 제한 체크
                if (currentBatchCount >= batchSize) {
                    batches.push(batch);
                    batch = admin.firestore().batch();
                    currentBatchCount = 0;
                }
            }
        });

        // 남은 배치 추가
        if (currentBatchCount > 0) {
            batches.push(batch);
        }

        // 모든 배치 커밋
        await Promise.all(batches.map(b => b.commit()));

        console.log(`월간 프리미엄 자동 갱신 완료: ${renewedCount}명`);
        return null;
    } catch (error) {
        console.error('월간 프리미엄 자동 갱신 실패:', error);
        throw error;
    }
});

// 마케팅 알림 발송 함수 (관리자용)
exports.sendMarketingNotification = functions.https.onCall(async (data, context) => {
    // 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            '인증이 필요합니다.'
        );
    }

    // 관리자 권한 확인 (필요시 추가)
    // const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    // if (!userDoc.exists() || userDoc.data().role !== 'admin') {
    //     throw new functions.https.HttpsError(
    //         'permission-denied',
    //         '관리자 권한이 필요합니다.'
    //     );
    // }

    const { title, message, imageUrl, linkUrl } = data;

    if (!title || !message) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            '제목과 메시지는 필수입니다.'
        );
    }

    try {
        console.log('마케팅 알림 발송 시작:', { title, message });

        // marketingEnabled가 true인 사용자들 조회
        const usersSnapshot = await admin.firestore().collection('users')
            .where('marketingEnabled', '==', true)
            .get();

        if (usersSnapshot.empty) {
            console.log('마케팅 알림 수신 동의한 사용자 없음');
            return { success: true, sentCount: 0, message: '마케팅 알림 수신 동의한 사용자가 없습니다.' };
        }

        const messages = [];
        const notificationPromises = [];

        usersSnapshot.forEach((userDoc) => {
            const user = userDoc.data();
            const userId = userDoc.id;
            const token = user.fcmToken;

            if (!token) {
                console.log(`사용자 ${userId}: FCM 토큰 없음`);
                return;
            }

            // FCM 메시지 추가
            const fcmMessage = {
                token,
                notification: {
                    title: title,
                    body: message,
                },
                data: {
                    type: 'marketing',
                    title: title,
                    message: message,
                    ...(imageUrl && { imageUrl }),
                    ...(linkUrl && { linkUrl }),
                },
                ...(imageUrl && {
                    android: {
                        notification: {
                            imageUrl: imageUrl
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                'mutable-content': 1
                            }
                        },
                        fcm_options: {
                            image: imageUrl
                        }
                    }
                })
            };
            messages.push(fcmMessage);

            // Firestore에 알림 저장
            const notificationData = {
                type: 'marketing',
                title: title,
                message: message,
                data: {
                    ...(imageUrl && { imageUrl }),
                    ...(linkUrl && { linkUrl }),
                },
                isRead: false,
                createdAt: admin.firestore.Timestamp.now(),
            };
            notificationPromises.push(
                admin.firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('notifications')
                    .add(notificationData)
            );
        });

        if (messages.length === 0) {
            return { success: true, sentCount: 0, message: 'FCM 토큰이 있는 사용자가 없습니다.' };
        }

        console.log(`${messages.length}명에게 마케팅 알림 발송 시도`);

        // FCM으로 알림 전송 (500개씩 배치로 전송)
        const batchSize = 500;
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            try {
                const response = await admin.messaging().sendAll(batch);
                successCount += response.successCount;
                failureCount += response.failureCount;

                if (response.failureCount > 0) {
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            console.error(`사용자 ${i + idx} 알림 실패:`, resp.error);
                        }
                    });
                }
            } catch (error) {
                console.error(`배치 ${i} 전송 실패:`, error);
                failureCount += batch.length;
            }
        }

        // Firestore 알림 저장 완료 대기
        await Promise.all(notificationPromises);

        console.log(`마케팅 알림 발송 완료: 성공 ${successCount}건, 실패 ${failureCount}건`);

        return {
            success: true,
            sentCount: successCount,
            failureCount: failureCount,
            totalUsers: usersSnapshot.size,
            message: `${successCount}명에게 마케팅 알림이 발송되었습니다.`
        };
    } catch (error) {
        console.error('마케팅 알림 발송 오류:', error);
        throw new functions.https.HttpsError(
            'internal',
            '마케팅 알림 발송 중 오류가 발생했습니다.',
            error.message
        );
    }
});

// 이벤트 알림 발송 함수 (관리자용)
exports.sendEventNotification = functions.https.onCall(async (data, context) => {
    // 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            '인증이 필요합니다.'
        );
    }

    const { title, message, imageUrl, linkUrl } = data;

    if (!title || !message) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            '제목과 메시지는 필수입니다.'
        );
    }

    try {
        console.log('이벤트 알림 발송 시작:', { title, message });

        // eventEnabled가 true인 사용자들 조회
        const usersSnapshot = await admin.firestore().collection('users')
            .where('eventEnabled', '==', true)
            .get();

        if (usersSnapshot.empty) {
            console.log('이벤트 알림 수신 동의한 사용자 없음');
            return { success: true, sentCount: 0, message: '이벤트 알림 수신 동의한 사용자가 없습니다.' };
        }

        const messages = [];
        const notificationPromises = [];

        usersSnapshot.forEach((userDoc) => {
            const user = userDoc.data();
            const userId = userDoc.id;
            const token = user.fcmToken;

            if (!token) {
                console.log(`사용자 ${userId}: FCM 토큰 없음`);
                return;
            }

            // FCM 메시지 추가
            const fcmMessage = {
                token,
                notification: {
                    title: title,
                    body: message,
                },
                data: {
                    type: 'event',
                    title: title,
                    message: message,
                    ...(imageUrl && { imageUrl }),
                    ...(linkUrl && { linkUrl }),
                },
                ...(imageUrl && {
                    android: {
                        notification: {
                            imageUrl: imageUrl
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                'mutable-content': 1
                            }
                        },
                        fcm_options: {
                            image: imageUrl
                        }
                    }
                })
            };
            messages.push(fcmMessage);

            // Firestore에 알림 저장
            const notificationData = {
                type: 'event',
                title: title,
                message: message,
                data: {
                    ...(imageUrl && { imageUrl }),
                    ...(linkUrl && { linkUrl }),
                },
                isRead: false,
                createdAt: admin.firestore.Timestamp.now(),
            };
            notificationPromises.push(
                admin.firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('notifications')
                    .add(notificationData)
            );
        });

        if (messages.length === 0) {
            return { success: true, sentCount: 0, message: 'FCM 토큰이 있는 사용자가 없습니다.' };
        }

        console.log(`${messages.length}명에게 이벤트 알림 발송 시도`);

        // FCM으로 알림 전송 (500개씩 배치로 전송)
        const batchSize = 500;
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            try {
                const response = await admin.messaging().sendAll(batch);
                successCount += response.successCount;
                failureCount += response.failureCount;

                if (response.failureCount > 0) {
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            console.error(`사용자 ${i + idx} 알림 실패:`, resp.error);
                        }
                    });
                }
            } catch (error) {
                console.error(`배치 ${i} 전송 실패:`, error);
                failureCount += batch.length;
            }
        }

        // Firestore 알림 저장 완료 대기
        await Promise.all(notificationPromises);

        console.log(`이벤트 알림 발송 완료: 성공 ${successCount}건, 실패 ${failureCount}건`);

        return {
            success: true,
            sentCount: successCount,
            failureCount: failureCount,
            totalUsers: usersSnapshot.size,
            message: `${successCount}명에게 이벤트 알림이 발송되었습니다.`
        };
    } catch (error) {
        console.error('이벤트 알림 발송 오류:', error);
        throw new functions.https.HttpsError(
            'internal',
            '이벤트 알림 발송 중 오류가 발생했습니다.',
            error.message
        );
    }
});