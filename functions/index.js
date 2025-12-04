const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");
const { DateTime } = require('luxon');
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true });

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

        const { diaryContents, diaryData, genre, userName, language } = data;
        console.log("요청 데이터:", {
            diaryContentsLength: diaryContents?.length || 0,
            diaryDataCount: diaryData?.length || 0,
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

            // 프롬프트 모듈 불러오기
            const { getPrompts } = require('./prompts/prompts');

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
            console.log("일기 데이터 개수:", diaryData?.length || 0);
            const { contentPrompt } = getPrompts(genre, diaryContents, null, targetLanguage, diaryData);
            console.log("프롬프트 길이:", contentPrompt?.length || 0);
            let contentResponse;
            try {
                contentResponse = await retryWithBackoff(async () => {
                    console.log("OpenAI API 호출 시작 (소설 내용)...");
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o",
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
            const fullResponse = contentResponse.choices[0].message.content;
            console.log("소설 내용 생성 완료, 길이:", fullResponse.length);

            // 요약표와 소설 본문 분리
            let narrativeSummary = '';
            let novelContent = fullResponse;

            // 요약표가 포함되어 있는지 확인하고 추출
            const summaryMarkers = [
                /##?\s*서사\s*요약표/i,
                /##?\s*Narrative\s*Summary\s*Table/i,
                /##?\s*7일간의\s*서사\s*요약표/i,
                /##?\s*7-Day\s*Narrative\s*Summary/i,
                /##?\s*요약표/i,
                /##?\s*Summary\s*Table/i,
            ];

            // 요약표 시작 지점 찾기
            let summaryStartIndex = -1;
            let summaryMarker = '';
            for (const marker of summaryMarkers) {
                const match = fullResponse.match(marker);
                if (match) {
                    summaryStartIndex = match.index;
                    summaryMarker = match[0];
                    break;
                }
            }

            // 소설 본문 시작 지점 찾기 (제목이나 본문 시작 표시)
            const novelStartMarkers = [
                /##?\s*소설\s*시작/i,
                /##?\s*Begin\s*the\s*Novel/i,
                /##?\s*소설\s*제목/i,
                /##?\s*Novel\s*Title/i,
                /^#\s+[^#]/m, // 제목 형식 (# 제목) - 단, ##가 아닌 #로 시작
            ];

            let novelStartIndex = -1;
            for (const marker of novelStartMarkers) {
                const match = fullResponse.match(marker);
                if (match && match.index > (summaryStartIndex || 0)) {
                    novelStartIndex = match.index;
                    break;
                }
            }

            // 요약표와 소설 본문 분리
            if (summaryStartIndex >= 0 && novelStartIndex > summaryStartIndex) {
                // 요약표와 소설 시작 마커가 모두 있는 경우
                narrativeSummary = fullResponse.substring(summaryStartIndex, novelStartIndex).trim();
                novelContent = fullResponse.substring(novelStartIndex).trim();

                // 소설 본문에서 마커 제거
                novelContent = novelContent.replace(/^##?\s*(소설\s*시작|Begin\s*the\s*Novel|소설\s*제목|Novel\s*Title)[\s:]*/i, '').trim();
            } else if (summaryStartIndex >= 0) {
                // 요약표만 있고 소설 시작 마커가 없는 경우
                // 요약표 다음에 실제 소설이 시작되는 부분 찾기
                // 요약표 섹션은 보통 500-1500자 정도
                const summarySectionEnd = summaryStartIndex + 1500;
                const possibleNovelStart = fullResponse.indexOf('\n\n##', summaryStartIndex + 200);

                if (possibleNovelStart > summaryStartIndex && possibleNovelStart < summarySectionEnd) {
                    // 다른 섹션이 발견된 경우
                    narrativeSummary = fullResponse.substring(summaryStartIndex, possibleNovelStart).trim();
                    novelContent = fullResponse.substring(possibleNovelStart).trim();
                } else {
                    // 요약표 다음에 빈 줄이 2개 이상 있는 부분 찾기
                    const doubleNewlineIndex = fullResponse.indexOf('\n\n\n', summaryStartIndex + 200);
                    if (doubleNewlineIndex > summaryStartIndex && doubleNewlineIndex < summarySectionEnd) {
                        narrativeSummary = fullResponse.substring(summaryStartIndex, doubleNewlineIndex).trim();
                        novelContent = fullResponse.substring(doubleNewlineIndex).trim();
                    } else {
                        // 요약표가 전체 응답의 일부인 경우, 요약표 이후를 소설로 간주
                        const estimatedSummaryEnd = summaryStartIndex + 1200;
                        narrativeSummary = fullResponse.substring(summaryStartIndex, estimatedSummaryEnd).trim();
                        novelContent = fullResponse.substring(estimatedSummaryEnd).trim();
                    }
                }
            }

            // 요약표 마커 제거
            if (narrativeSummary) {
                narrativeSummary = narrativeSummary.replace(/^##?\s*(서사\s*요약표|Narrative\s*Summary\s*Table|7일간의\s*서사\s*요약표|7-Day\s*Narrative\s*Summary|요약표|Summary\s*Table)[\s:]*/i, '').trim();
            }

            // 요약표가 없으면 전체를 소설로 간주
            if (!narrativeSummary || narrativeSummary.length < 50) {
                novelContent = fullResponse;
                narrativeSummary = '';
            }

            // 소설 본문에서 제목 제거 (다양한 패턴 처리)
            // 1. 마크다운 제목 형식 제거 (# 제목, ## 제목 등)
            novelContent = novelContent.replace(/^#{1,3}\s+[^\n]+\n+/gm, '');

            // 2. "제목:", "Title:" 같은 패턴 제거
            novelContent = novelContent.replace(/^(제목|Title|소설\s*제목|Novel\s*Title)[\s:：]\s*[^\n]+\n+/gim, '');

            // 3. 따옴표로 감싼 제목 제거 (첫 줄에 있는 경우)
            const lines = novelContent.split('\n');
            if (lines.length > 0) {
                const firstLine = lines[0].trim();
                // 첫 줄이 따옴표로 시작하고 끝나며, 길이가 50자 이하인 경우 제목으로 간주
                if ((firstLine.startsWith('"') && firstLine.endsWith('"')) ||
                    (firstLine.startsWith("'") && firstLine.endsWith("'")) ||
                    (firstLine.startsWith('「') && firstLine.endsWith('」')) ||
                    (firstLine.startsWith('『') && firstLine.endsWith('』'))) {
                    if (firstLine.length <= 50) {
                        lines.shift();
                        novelContent = lines.join('\n').trim();
                    }
                }
                // 첫 줄이 짧고(30자 이하) 마침표나 느낌표로 끝나지 않는 경우 제목으로 간주
                else if (firstLine.length <= 30 && !firstLine.match(/[。.!?]$/)) {
                    // 다음 줄이 빈 줄이거나 소설 본문이 시작되는 경우에만 제거
                    if (lines.length > 1 && (lines[1].trim() === '' || lines[1].match(/^[가-힣a-zA-Z]/))) {
                        lines.shift();
                        novelContent = lines.join('\n').trim();
                    }
                }
            }

            // 4. 앞뒤 공백 정리
            novelContent = novelContent.trim();

            console.log("요약표 추출 완료, 길이:", narrativeSummary.length);
            console.log("소설 본문 길이:", novelContent.length);

            // 3. 소설 제목 생성
            console.log("소설 제목 생성 시작...");
            const { titlePrompt } = getPrompts(genre, diaryContents, novelContent, targetLanguage, diaryData);
            let titleResponse;
            try {
                titleResponse = await retryWithBackoff(async () => {
                    return await openai.chat.completions.create({
                        model: "gpt-4o",
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

            // DALL-E 2 프롬프트 최대 길이: 1000자
            const MAX_PROMPT_LENGTH = 1000;
            const storyPrefix = " Story: ";
            const imagePromptLength = imagePrompt.length;
            const prefixLength = storyPrefix.length;
            const availableLength = MAX_PROMPT_LENGTH - imagePromptLength - prefixLength;

            // 사용 가능한 길이만큼만 novelContent 추가
            const storyContent = availableLength > 0
                ? novelContent.substring(0, availableLength)
                : '';

            const fullImagePrompt = storyContent
                ? imagePrompt + storyPrefix + storyContent
                : imagePrompt;

            // 최종 프롬프트 길이 확인 및 제한
            const finalPrompt = fullImagePrompt.length > MAX_PROMPT_LENGTH
                ? fullImagePrompt.substring(0, MAX_PROMPT_LENGTH)
                : fullImagePrompt;

            console.log("이미지 프롬프트 길이:", {
                imagePromptLength: imagePromptLength,
                storyContentLength: storyContent.length,
                finalPromptLength: finalPrompt.length
            });

            let imageResponse;
            try {
                imageResponse = await retryWithBackoff(async () => {
                    return await openai.images.generate({
                        model: "dall-e-2",
                        prompt: finalPrompt,
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

                // 6. 모든 결과 반환 (요약표 포함)
                return {
                    content: novelContent,
                    title: novelTitle,
                    imageUrl: imageUrl,
                    narrativeSummary: narrativeSummary || null // 요약표 추가
                };
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

// 프리미엄 회원 일기 AI 일기기 함수
exports.enhanceDiary = functions.runWith({
    timeoutSeconds: 60,
    memory: '512MB'
}).https.onCall(async (data, context) => {
    try {
        console.log("=== enhanceDiary 함수 호출 시작 ===");
        console.log("요청 시간:", new Date().toISOString());
        console.log("사용자 ID:", context.auth?.uid || "인증되지 않음");

        if (!context.auth) {
            console.error("❌ 인증되지 않은 사용자");
            throw new functions.https.HttpsError(
                "unauthenticated",
                "ai 일기를 작성하려면 로그인이 필요합니다.",
            );
        }

        const { diaryContent, language } = data;
        console.log("요청 데이터:", {
            diaryContentLength: diaryContent?.length || 0,
            language: language
        });

        if (!diaryContent || diaryContent.trim().length < 10) {
            console.error("❌ 일기 내용이 너무 짧습니다.");
            throw new functions.https.HttpsError(
                "invalid-argument",
                "일기 내용이 필요합니다.",
            );
        }

        // 프리미엄 회원 확인
        const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                "not-found",
                "사용자 정보를 찾을 수 없습니다.",
            );
        }

        const userData = userDoc.data();
        const isPremium = userData.isMonthlyPremium || userData.isYearlyPremium;

        if (!isPremium) {
            throw new functions.https.HttpsError(
                "permission-denied",
                "이 기능은 프리미엄 회원만 사용할 수 있습니다.",
            );
        }

        try {
            // OpenAI 클라이언트 확인
            if (!openai) {
                const apiKey = functions.config().openai?.key;
                console.error("❌ OpenAI 클라이언트가 초기화되지 않았습니다.");
                throw new functions.https.HttpsError(
                    "failed-precondition",
                    "OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.",
                );
            }

            const targetLanguage = language === 'en' ? 'en' : 'ko';
            const isEnglish = targetLanguage === 'en';

            // ai일기 프롬프트 생성
            const enhancePrompt = isEnglish
                ? `You are a sentimental and literary writer. Your mission is to take the simple, core content provided by the user and expand and refine it into a rich, detailed, and captivating diary entry while preserving the original emotion and experience.

## Style and Goal
1. **Tone:** Write in a warm, introspective, and sentimental essay style.
2. **Length:** The entry must be structured into a minimum of 3 paragraphs, aiming for 200-400 words.
3. **Core Focus:** Absolutely maintain the core subject and emotion of the original entry, augmenting it with detailed descriptions and personal reflection.

## Writing Style Guidelines
1. **Formal Written Style:** Write in a formal written style (문어체), not conversational or casual.
2. **Sentence Endings:** All sentences must end in declarative form (e.g., "~했다", "~이었다").
3. **Avoid Excessive Emotion:** Prohibit excessive emotional expressions, exclamations, and colloquialisms.
4. **Simple Language:** Minimize difficult literary words, metaphors, and similes.
5. **Fact-Based:** Record facts concisely and clearly.
6. **No Distortion:** Do not distort content. Naturally supplement context based on the information provided by the user.
7. **Professional Tone:** Prohibit friendly or playful speech patterns.

## Mandatory Content Expansion
* **Setting Description:** Add sensory details (sight, sound, smell, etc.) to paint a vivid picture of the atmosphere or location where the event took place.
* **Emotional Depth:** Expand upon the user's emotion, exploring the 'why' and the 'internal thoughts' surrounding the event.
* **Reflective Conclusion:** Conclude the entry with a deep, reflective statement about the meaning or realization gained from the day.

## Output Format
Output ONLY the refined diary text. Do not include any titles, introductory phrases, or explanations.

[Original Diary]
${diaryContent}`
                : `당신의 임무는 사용자가 제공한 간단하고 핵심적인 일기 내용을 바탕으로, 그 감정과 경험을 최대한 살려 더 풍부하고 구체적인 일기로 확장하고 수정하는 것입니다.

## 스타일 및 목표
1. 문체: 따뜻하고, 회고적이며, 감성적인 에세이 문체로 작성합니다.
2. 길이: 최소 2~3문단, 200~400자 분량으로 작성합니다.
3. 핵심: 원본 일기의 핵심 내용과 감정을 절대 놓치지 않고, 이를 구체적인 묘사와 개인적인 성찰로 보강해야 합니다.

## 문체 지침
1. **문어체 기반 서술:** 구어체나 대화체가 아닌 문어체로 작성합니다.
2. **평서체 마무리:** 모든 문장은 "~했다", "~이었다"와 같은 평서체로 마무리합니다.
3. **과도한 표현 금지:** 과도한 감정표현, 감탄사, 구어체를 사용하지 않습니다.
4. **단순한 어휘:** 어려운 문학적 단어나 은유, 비유를 최소화합니다.
5. **사실 위주 기록:** 사실을 위주로 간결하게 기록합니다.
6. **내용 왜곡 금지:** 내용을 왜곡하지 않으며, 사용자가 제공한 정보를 기반으로 자연스럽게 맥락을 보완합니다.
7. **정중한 말투:** 친근하거나 장난스러운 말투를 사용하지 않습니다.

## 확장할 내용 (필수 포함)
* 주변 묘사: 사건이 일어난 장소의 분위기나 오감을 자극하는 디테일을 추가합니다.
* 감정 심화: 일기에 언급된 감정을 느끼게 된 이유와 그로 인한 내면의 움직임을 설명합니다.
* 성찰적 마무리: 일의 의미나 깨달음을 담은 깊이 있는 문장으로 마무리합니다.

## 출력 형식
오직 수정된 일기 텍스트만 출력합니다. 다른 설명이나 제목은 포함하지 않습니다.

[원본 일기]
${diaryContent}`;

            console.log("OpenAI API 호출 시작 (ai 일기)...");
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: enhancePrompt }],
                temperature: 0.7,
                max_tokens: 2000,
            });

            if (!response?.choices?.[0]?.message?.content) {
                throw new Error("ai 일기 응답이 올바르지 않습니다.");
            }

            const enhancedContent = response.choices[0].message.content.trim();
            console.log("ai 일기 완료, 길이:", enhancedContent.length);

            // 일기 제목 생성
            console.log("일기 제목 생성 시작...");
            const titlePrompt = isEnglish
                ? `Based on the following diary entry, suggest only one most fitting title in English. The title should be concise, meaningful, and reflect the core emotion or event of the diary. Do not include any explanation, only the title.

[Diary Entry]
${enhancedContent}`
                : `다음 일기 내용을 바탕으로 가장 어울리는 제목 하나만 추천해줘. 제목은 간결하고 의미 있으며, 일기의 핵심 감정이나 사건을 반영해야 해. 설명 없이 제목만 말해줘.

[일기 내용]
${enhancedContent}`;

            let titleResponse;
            try {
                titleResponse = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: titlePrompt }],
                    temperature: 0.8,
                    max_tokens: 60,
                });
            } catch (error) {
                console.error("일기 제목 생성 실패:", error.message);
                // 제목 생성 실패해도 일기 내용은 반환
                return { enhancedContent, enhancedTitle: null };
            }

            if (!titleResponse?.choices?.[0]?.message?.content) {
                console.warn("일기 제목 생성 응답이 올바르지 않습니다.");
                return { enhancedContent, enhancedTitle: null };
            }

            const enhancedTitle = titleResponse.choices[0].message.content.replace(/"/g, '').trim();
            console.log("일기 제목 생성 완료:", enhancedTitle);

            return { enhancedContent, enhancedTitle };
        } catch (error) {
            console.error("ai 일기 실패 - 상세 에러:", {
                message: error.message,
                statusCode: error.statusCode,
                status: error.status,
                responseStatus: error.response?.status,
                errorType: error.constructor?.name
            });

            const statusCode = error.statusCode || error.status || error.response?.status;
            if (statusCode === 429) {
                throw new functions.https.HttpsError(
                    "resource-exhausted",
                    "OpenAI API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요."
                );
            }
            if (statusCode === 401) {
                throw new functions.https.HttpsError(
                    "unauthenticated",
                    "OpenAI API 키가 유효하지 않습니다."
                );
            }
            throw new functions.https.HttpsError(
                "internal",
                `ai 일기 실패: ${error.message || error.toString()}`
            );
        }
    } catch (outerError) {
        console.error("=== 최상위 레벨 에러 발생 ===");
        console.error("에러 타입:", outerError.constructor?.name);
        console.error("에러 메시지:", outerError.message);

        if (outerError instanceof functions.https.HttpsError) {
            throw outerError;
        }

        throw new functions.https.HttpsError(
            "internal",
            `ai 일기 중 오류가 발생했습니다: ${outerError.message || "알 수 없는 오류"}`,
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

// 프리미엄 무료권 자동 충전 함수 (매 시간마다 실행)
exports.chargePremiumFreeNovel = functions.pubsub.schedule('every 1 hours').timeZone('Asia/Seoul').onRun(async (context) => {
    console.log('프리미엄 무료권 자동 충전 시작...');
    const now = admin.firestore.Timestamp.now();
    const nowDate = new Date();

    try {
        // 프리미엄 회원 중 다음 충전 시점이 지난 사용자 조회
        const usersSnapshot = await admin.firestore().collection('users')
            .where('premiumFreeNovelNextChargeDate', '<=', now)
            .get();

        if (usersSnapshot.empty) {
            console.log('충전 대상자 없음');
            return null;
        }

        let chargedCount = 0;
        const batchSize = 500; // Firestore 배치 제한
        let batch = admin.firestore().batch();
        let currentBatchCount = 0;
        const batches = [];

        usersSnapshot.forEach((userDoc) => {
            const userData = userDoc.data();

            // 프리미엄 회원인지 확인
            const isPremium = userData.isMonthlyPremium || userData.isYearlyPremium;
            if (!isPremium) {
                return; // 프리미엄 회원이 아니면 스킵
            }

            // premiumFreeNovelNextChargeDate가 실제로 지났는지 확인
            let nextChargeDate;
            if (userData.premiumFreeNovelNextChargeDate?.seconds) {
                nextChargeDate = new Date(userData.premiumFreeNovelNextChargeDate.seconds * 1000);
            } else if (userData.premiumFreeNovelNextChargeDate?.toDate) {
                nextChargeDate = userData.premiumFreeNovelNextChargeDate.toDate();
            } else {
                nextChargeDate = new Date(userData.premiumFreeNovelNextChargeDate);
            }

            // 충전 시점이 지났고, 프리미엄 회원인 경우에만 충전
            if (nextChargeDate <= nowDate && isPremium) {
                // 프리미엄 시작일 확인
                let premiumStartDate;
                if (userData.premiumStartDate?.seconds) {
                    premiumStartDate = new Date(userData.premiumStartDate.seconds * 1000);
                } else if (userData.premiumStartDate?.toDate) {
                    premiumStartDate = userData.premiumStartDate.toDate();
                } else if (userData.premiumStartDate) {
                    premiumStartDate = new Date(userData.premiumStartDate);
                } else {
                    // premiumStartDate가 없으면 현재 시점으로 설정
                    premiumStartDate = nowDate;
                }

                // 다음 충전 시점 계산 (프리미엄 시작일로부터 한 달 후)
                const nextChargeDateNew = new Date(premiumStartDate);
                nextChargeDateNew.setMonth(nextChargeDateNew.getMonth() + 1);
                nextChargeDateNew.setHours(0, 0, 0, 0);

                // 만약 다음 충전 시점이 현재보다 과거라면, 한 달씩 더 추가
                while (nextChargeDateNew <= nowDate) {
                    nextChargeDateNew.setMonth(nextChargeDateNew.getMonth() + 1);
                }

                // 현재 보유 개수 확인 (없으면 0)
                const currentCount = userData.premiumFreeNovelCount || 0;
                const newCount = currentCount + 6; // 한 달에 6개 추가

                const userRef = admin.firestore().collection('users').doc(userDoc.id);
                batch.update(userRef, {
                    premiumFreeNovelNextChargeDate: admin.firestore.Timestamp.fromDate(nextChargeDateNew),
                    premiumFreeNovelCount: newCount, // 무료권 6개 추가
                    updatedAt: admin.firestore.Timestamp.now()
                });

                chargedCount++;
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

        console.log(`프리미엄 무료권 자동 충전 완료: ${chargedCount}명`);
        return null;
    } catch (error) {
        console.error('프리미엄 무료권 자동 충전 실패:', error);
        throw error;
    }
});

// 기존 프리미엄 사용자 무료 생성권 마이그레이션 함수
exports.migratePremiumFreeNovelCount = functions.https.onCall(async (data, context) => {
    console.log('프리미엄 무료 생성권 마이그레이션 시작...');

    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            '인증이 필요합니다.'
        );
    }

    // 관리자만 실행 가능하도록 체크 (필요시)
    const userId = context.auth.uid;
    const targetUserId = data.userId || userId;

    try {
        const userRef = admin.firestore().collection('users').doc(targetUserId);
        const userDoc = await userRef.get();

        if (!userDoc.exists()) {
            throw new functions.https.HttpsError(
                'not-found',
                '사용자를 찾을 수 없습니다.'
            );
        }

        const userData = userDoc.data();
        const isPremium = userData.isMonthlyPremium || userData.isYearlyPremium;

        if (!isPremium) {
            return {
                success: false,
                message: '프리미엄 회원이 아닙니다.'
            };
        }

        // premiumStartDate 확인
        let startDate;
        if (userData.premiumStartDate) {
            if (userData.premiumStartDate.seconds) {
                startDate = new Date(userData.premiumStartDate.seconds * 1000);
            } else if (userData.premiumStartDate.toDate) {
                startDate = userData.premiumStartDate.toDate();
            } else {
                startDate = new Date(userData.premiumStartDate);
            }
        } else {
            // premiumStartDate가 없으면 현재 시점으로 설정
            startDate = new Date();
        }

        const now = new Date();

        // 시작일과 현재일의 년/월 차이 계산
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();
        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth();

        // 경과 개월 수 계산 (시작일이 속한 달도 포함)
        const elapsedMonths = (nowYear - startYear) * 12 + (nowMonth - startMonth) + 1;

        // 총 충전 횟수 계산 (매월 6개씩)
        const totalCharged = elapsedMonths * 6;

        // 무료 사용 기록 확인
        const freeNovelHistoryRef = admin.firestore()
            .collection('users')
            .doc(targetUserId)
            .collection('freeNovelHistory');
        const freeNovelHistorySnapshot = await freeNovelHistoryRef.get();
        const usedCount = freeNovelHistorySnapshot.size;

        // 현재 보유 개수 계산
        const currentCount = Math.max(0, totalCharged - usedCount);

        // 다음 충전 시점 계산 (프리미엄 시작일로부터 한 달 후)
        const nextChargeDate = new Date(startDate);
        nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
        nextChargeDate.setHours(0, 0, 0, 0);

        // 만약 다음 충전 시점이 현재보다 과거라면, 한 달씩 더 추가
        while (nextChargeDate <= now) {
            nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
        }

        // 사용자 데이터 업데이트
        await userRef.update({
            premiumFreeNovelCount: currentCount,
            premiumFreeNovelNextChargeDate: admin.firestore.Timestamp.fromDate(nextChargeDate),
            updatedAt: admin.firestore.Timestamp.now()
        });

        console.log(`마이그레이션 완료: ${targetUserId}`, {
            startDate: startDate.toISOString(),
            elapsedDays,
            totalCharged,
            usedCount,
            currentCount,
            nextChargeDate: nextChargeDate.toISOString()
        });

        return {
            success: true,
            message: '마이그레이션 완료',
            data: {
                startDate: startDate.toISOString(),
                elapsedDays,
                totalCharged,
                usedCount,
                currentCount,
                nextChargeDate: nextChargeDate.toISOString()
            }
        };
    } catch (error) {
        console.error('마이그레이션 실패:', error);
        throw new functions.https.HttpsError(
            'internal',
            `마이그레이션 실패: ${error.message}`
        );
    }
});

// 모든 프리미엄 사용자 무료 생성권 일괄 마이그레이션 함수
exports.migrateAllPremiumFreeNovelCount = functions.https.onCall(async (data, context) => {
    console.log('모든 프리미엄 사용자 무료 생성권 일괄 마이그레이션 시작...');

    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            '인증이 필요합니다.'
        );
    }

    try {
        // 모든 프리미엄 회원 조회
        const monthlyPremiumUsers = await admin.firestore().collection('users')
            .where('isMonthlyPremium', '==', true)
            .get();

        const yearlyPremiumUsers = await admin.firestore().collection('users')
            .where('isYearlyPremium', '==', true)
            .get();

        const allUserIds = new Set();
        monthlyPremiumUsers.forEach(doc => allUserIds.add(doc.id));
        yearlyPremiumUsers.forEach(doc => allUserIds.add(doc.id));

        console.log(`마이그레이션 대상: ${allUserIds.size}명`);

        let successCount = 0;
        let failCount = 0;
        const results = [];

        for (const userId of allUserIds) {
            try {
                const userRef = admin.firestore().collection('users').doc(userId);
                const userDoc = await userRef.get();

                if (!userDoc.exists()) {
                    continue;
                }

                const userData = userDoc.data();

                // 이미 마이그레이션된 사용자는 스킵 (premiumFreeNovelCount가 있으면)
                if (userData.premiumFreeNovelCount !== undefined) {
                    console.log(`이미 마이그레이션됨: ${userId}`);
                    continue;
                }

                // premiumStartDate 확인
                let startDate;
                if (userData.premiumStartDate) {
                    if (userData.premiumStartDate.seconds) {
                        startDate = new Date(userData.premiumStartDate.seconds * 1000);
                    } else if (userData.premiumStartDate.toDate) {
                        startDate = userData.premiumStartDate.toDate();
                    } else {
                        startDate = new Date(userData.premiumStartDate);
                    }
                } else {
                    // premiumStartDate가 없으면 현재 시점으로 설정
                    startDate = new Date();
                }

                const now = new Date();

                // 시작일과 현재일의 년/월 차이 계산
                const startYear = startDate.getFullYear();
                const startMonth = startDate.getMonth();
                const nowYear = now.getFullYear();
                const nowMonth = now.getMonth();

                // 경과 개월 수 계산 (시작일이 속한 달도 포함)
                const elapsedMonths = (nowYear - startYear) * 12 + (nowMonth - startMonth) + 1;

                // 총 충전 횟수 계산 (매월 6개씩)
                const totalCharged = elapsedMonths * 6;

                // 무료 사용 기록 확인
                const freeNovelHistoryRef = admin.firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('freeNovelHistory');
                const freeNovelHistorySnapshot = await freeNovelHistoryRef.get();
                const usedCount = freeNovelHistorySnapshot.size;

                // 현재 보유 개수 계산
                const currentCount = Math.max(0, totalCharged - usedCount);

                // 다음 충전 시점 계산 (프리미엄 시작일로부터 한 달 후)
                const nextChargeDate = new Date(startDate);
                nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
                nextChargeDate.setHours(0, 0, 0, 0);

                // 만약 다음 충전 시점이 현재보다 과거라면, 한 달씩 더 추가
                while (nextChargeDate <= now) {
                    nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
                }

                // 사용자 데이터 업데이트
                await userRef.update({
                    premiumFreeNovelCount: currentCount,
                    premiumFreeNovelNextChargeDate: admin.firestore.Timestamp.fromDate(nextChargeDate),
                    updatedAt: admin.firestore.Timestamp.now()
                });

                successCount++;
                results.push({
                    userId,
                    success: true,
                    currentCount,
                    totalCharged,
                    usedCount
                });

                console.log(`마이그레이션 완료: ${userId}`, {
                    currentCount,
                    totalCharged,
                    usedCount
                });
            } catch (error) {
                failCount++;
                results.push({
                    userId,
                    success: false,
                    error: error.message
                });
                console.error(`마이그레이션 실패: ${userId}`, error);
            }
        }

        console.log(`일괄 마이그레이션 완료: 성공 ${successCount}명, 실패 ${failCount}명`);

        return {
            success: true,
            message: `마이그레이션 완료: 성공 ${successCount}명, 실패 ${failCount}명`,
            successCount,
            failCount,
            totalCount: allUserIds.size,
            results: results.slice(0, 100) // 결과는 최대 100개만 반환
        };
    } catch (error) {
        console.error('일괄 마이그레이션 실패:', error);
        throw new functions.https.HttpsError(
            'internal',
            `일괄 마이그레이션 실패: ${error.message}`
        );
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

        console.log(`마케팅 알림 수신 동의한 사용자 수: ${usersSnapshot.size}명`);

        if (usersSnapshot.empty) {
            console.log('마케팅 알림 수신 동의한 사용자 없음');
            return { success: true, sentCount: 0, message: '마케팅 알림 수신 동의한 사용자가 없습니다.' };
        }

        const messages = [];
        const notificationPromises = [];
        let tokenMissingCount = 0;
        let tokenEmptyCount = 0;

        usersSnapshot.forEach((userDoc) => {
            const user = userDoc.data();
            const userId = userDoc.id;
            const token = user.fcmToken;

            if (!token || token.trim() === '') {
                tokenMissingCount++;
                if (tokenMissingCount <= 10) { // 처음 10개만 로그
                    console.log(`사용자 ${userId} (${user.email || '이메일 없음'}): FCM 토큰 없음`);
                }
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
            console.log(`FCM 토큰이 있는 사용자가 없습니다. (토큰 없음: ${tokenMissingCount}명)`);
            return {
                success: true,
                sentCount: 0,
                message: `FCM 토큰이 있는 사용자가 없습니다. (토큰 없음: ${tokenMissingCount}명)`,
                tokenMissingCount: tokenMissingCount
            };
        }

        console.log(`${messages.length}명에게 마케팅 알림 발송 시도 (토큰 없음: ${tokenMissingCount}명)`);

        // FCM으로 알림 전송 (개별 전송 방식 - sendAll의 404 에러 회피)
        let successCount = 0;
        let failureCount = 0;
        const failureDetails = [];
        const failureReasons = {};

        // 개별 메시지를 순차적으로 전송 (배치 전송의 404 에러 문제 해결)
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            try {
                await admin.messaging().send(message);
                successCount++;

                // 진행 상황 로그 (100개마다)
                if ((i + 1) % 100 === 0) {
                    console.log(`[마케팅] 진행 상황: ${i + 1}/${messages.length} 전송 완료`);
                }
            } catch (error) {
                failureCount++;
                const errorCode = error.code || 'unknown';
                const errorMessage = error.message || '알 수 없는 오류';

                failureReasons[errorCode] = (failureReasons[errorCode] || 0) + 1;

                // 처음 10개만 상세 정보 저장
                if (failureDetails.length < 10) {
                    failureDetails.push({
                        index: i,
                        code: errorCode,
                        message: errorMessage
                    });
                }

                // 처음 10개만 상세 로그
                if (failureCount <= 10) {
                    console.error(`[마케팅] 인덱스 ${i} 알림 실패:`, {
                        error: errorMessage,
                        code: errorCode
                    });
                }
            }
        }

        if (failureCount > 0) {
            console.log(`[마케팅] 실패 원인 통계:`, failureReasons);
        }

        // Firestore 알림 저장 완료 대기
        await Promise.all(notificationPromises);

        console.log(`마케팅 알림 발송 완료: 성공 ${successCount}건, 실패 ${failureCount}건, 토큰 없음 ${tokenMissingCount}명`);

        // 실패 원인 요약 메시지 생성
        let failureSummary = '';
        if (failureCount > 0) {
            const reasonList = Object.entries(failureReasons)
                .map(([code, count]) => `${code}: ${count}건`)
                .join(', ');
            failureSummary = ` 실패 원인: ${reasonList}`;
        }

        return {
            success: true,
            sentCount: successCount,
            failureCount: failureCount,
            totalUsers: usersSnapshot.size,
            tokenMissingCount: tokenMissingCount,
            failureReasons: failureReasons,
            failureDetails: failureDetails.slice(0, 5), // 처음 5개만 반환
            message: `${successCount}명에게 마케팅 알림이 발송되었습니다.${tokenMissingCount > 0 ? ` (FCM 토큰 없음: ${tokenMissingCount}명)` : ''}${failureCount > 0 ? ` (전송 실패: ${failureCount}건${failureSummary})` : ''}`
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

// 비밀번호 재설정을 위한 이메일 인증 코드 발송
exports.sendPasswordResetCode = functions.https.onCall(async (data, context) => {
    const { email } = data;

    if (!email) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            '이메일 주소가 필요합니다.'
        );
    }

    try {
        // 사용자 존재 확인
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                throw new functions.https.HttpsError(
                    'not-found',
                    '해당 이메일로 가입된 계정을 찾을 수 없습니다.'
                );
            }
            throw error;
        }

        // 6자리 인증 코드 생성
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Firestore에 인증 코드 저장 (5분 만료)
        const codeRef = admin.firestore().collection('passwordResetCodes').doc();
        await codeRef.set({
            email: email,
            code: code,
            userId: userRecord.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)), // 5분 후 만료
            used: false
        });

        // 이메일 발송 (nodemailer 사용)
        const emailSubject = '[Story Potion] 비밀번호 재설정 인증 코드';
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e46262; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .code { background-color: #fff; border: 2px solid #e46262; border-radius: 5px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #e46262; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Story Potion</h1>
        </div>
        <div class="content">
            <h2>비밀번호 재설정 인증 코드</h2>
            <p>안녕하세요.</p>
            <p>비밀번호 재설정을 요청하셨습니다. 아래 인증 코드를 입력해주세요.</p>
            <div class="code">${code}</div>
            <p>이 코드는 <strong>5분간</strong> 유효합니다.</p>
            <p>만약 본인이 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.</p>
        </div>
        <div class="footer">
            <p>감사합니다.<br>Story Potion 팀</p>
        </div>
    </div>
</body>
</html>
        `;

        const emailText = `안녕하세요.

비밀번호 재설정을 요청하셨습니다.
아래 인증 코드를 입력해주세요.

인증 코드: ${code}

이 코드는 5분간 유효합니다.
만약 본인이 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.

감사합니다.
Story Potion 팀`;

        // Gmail SMTP 설정 (Firebase Functions Config에서 설정 필요)
        // firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-password"
        const gmailEmail = functions.config().gmail?.email;
        const gmailPassword = functions.config().gmail?.password;

        if (gmailEmail && gmailPassword) {
            // nodemailer를 사용한 이메일 발송
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailEmail,
                    pass: gmailPassword
                }
            });

            const mailOptions = {
                from: `"Story Potion" <${gmailEmail}>`,
                to: email,
                subject: emailSubject,
                text: emailText,
                html: emailHtml
            };

            await transporter.sendMail(mailOptions);
            console.log('이메일 발송 성공:', email);
        } else {
            // Gmail 설정이 없으면 Firestore에 저장 (개발 환경)
            console.warn('Gmail 설정이 없습니다. Firestore에 저장합니다.');
            await admin.firestore().collection('emailQueue').add({
                to: email,
                subject: emailSubject,
                body: emailText,
                html: emailHtml,
                code: code,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                sent: false
            });

            // 개발 환경에서는 코드를 반환
            if (process.env.NODE_ENV === 'development' || !gmailEmail) {
                console.log('개발 환경 - 인증 코드:', code);
            }
        }

        return {
            success: true,
            message: '인증 코드가 이메일로 발송되었습니다.',
            // 개발 환경에서는 코드를 반환 (프로덕션에서는 제거)
            code: process.env.NODE_ENV === 'development' ? code : undefined
        };
    } catch (error) {
        console.error('이메일 인증 코드 발송 실패:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            '인증 코드 발송에 실패했습니다. 다시 시도해주세요.'
        );
    }
});

// 회원가입용 이메일 인증 코드 발송
exports.sendSignupVerificationCode = functions.https.onCall(async (data, context) => {
    const { email } = data;

    if (!email) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            '이메일 주소가 필요합니다.'
        );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            '유효하지 않은 이메일 형식입니다.'
        );
    }

    try {
        // 이미 가입된 이메일인지 확인
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            // 이미 가입된 이메일이면 에러
            throw new functions.https.HttpsError(
                'already-exists',
                '이미 사용 중인 이메일입니다.'
            );
        } catch (error) {
            // 사용자가 없으면 정상 (회원가입 가능)
            if (error.code === 'auth/user-not-found') {
                // 계속 진행
            } else if (error instanceof functions.https.HttpsError) {
                throw error;
            } else {
                // 다른 에러는 무시하고 계속 진행
                console.warn('이메일 확인 중 오류:', error);
            }
        }

        // Firestore에서도 중복 확인
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();

        if (!usersSnapshot.empty) {
            throw new functions.https.HttpsError(
                'already-exists',
                '이미 사용 중인 이메일입니다.'
            );
        }

        // 6자리 인증 코드 생성
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Firestore에 인증 코드 저장 (10분 만료)
        const codeRef = admin.firestore().collection('signupVerificationCodes').doc();
        await codeRef.set({
            email: email.toLowerCase(),
            code: code,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)), // 10분 후 만료
            used: false
        });

        // 이메일 발송 (nodemailer 사용)
        const emailSubject = '[Story Potion] 회원가입 이메일 인증 코드';
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e46262; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .code { background-color: #fff; border: 2px solid #e46262; border-radius: 5px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #e46262; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Story Potion</h1>
        </div>
        <div class="content">
            <h2>회원가입 이메일 인증</h2>
            <p>안녕하세요.</p>
            <p>회원가입을 위해 아래 인증 코드를 입력해주세요.</p>
            <div class="code">${code}</div>
            <p>이 코드는 <strong>10분간</strong> 유효합니다.</p>
            <p>만약 본인이 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.</p>
        </div>
        <div class="footer">
            <p>감사합니다.<br>Story Potion 팀</p>
        </div>
    </div>
</body>
</html>
        `;

        const emailText = `안녕하세요.

회원가입을 위해 아래 인증 코드를 입력해주세요.

인증 코드: ${code}

이 코드는 10분간 유효합니다.
만약 본인이 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.

감사합니다.
Story Potion 팀`;

        // Gmail SMTP 설정 (Firebase Functions Config에서 설정 필요)
        const gmailEmail = functions.config().gmail?.email;
        const gmailPassword = functions.config().gmail?.password;

        if (gmailEmail && gmailPassword) {
            try {
                // nodemailer를 사용한 이메일 발송
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: gmailEmail,
                        pass: gmailPassword
                    }
                });

                const mailOptions = {
                    from: `"Story Potion" <${gmailEmail}>`,
                    to: email,
                    subject: emailSubject,
                    text: emailText,
                    html: emailHtml
                };

                await transporter.sendMail(mailOptions);
                console.log('회원가입 인증 코드 이메일 발송 성공:', email);
            } catch (emailError) {
                console.error('이메일 발송 실패:', emailError);
                // 이메일 발송 실패해도 코드는 생성되었으므로 Firestore에 저장하고 계속 진행
                await admin.firestore().collection('emailQueue').add({
                    to: email,
                    subject: emailSubject,
                    body: emailText,
                    html: emailHtml,
                    code: code,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    sent: false,
                    error: emailError.message
                });
                console.warn('이메일 발송 실패, Firestore에 저장:', email);
            }
        } else {
            // Gmail 설정이 없으면 Firestore에 저장 (개발 환경)
            console.warn('Gmail 설정이 없습니다. Firestore에 저장합니다.');
            await admin.firestore().collection('emailQueue').add({
                to: email,
                subject: emailSubject,
                body: emailText,
                html: emailHtml,
                code: code,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                sent: false
            });

            // 개발 환경에서는 코드를 반환
            if (process.env.NODE_ENV === 'development' || !gmailEmail) {
                console.log('개발 환경 - 회원가입 인증 코드:', code);
            }
        }

        // 개발 환경에서도 코드를 확인할 수 있도록 항상 코드를 반환
        // (보안상 문제 없음 - 코드는 이미 Firestore에 저장되고 이메일로도 발송됨)
        console.log('인증 코드 생성 완료:', {
            email: email,
            code: code,
            gmailEmail: !!gmailEmail,
            gmailPassword: !!gmailPassword
        });

        return {
            success: true,
            message: gmailEmail && gmailPassword
                ? '인증 코드가 이메일로 발송되었습니다.'
                : '인증 코드가 생성되었습니다. (이메일 발송 설정이 필요합니다)',
            // 항상 코드를 반환 (개발/테스트 편의를 위해)
            code: code
        };
    } catch (error) {
        console.error('회원가입 인증 코드 발송 실패:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            '인증 코드 발송에 실패했습니다. 다시 시도해주세요.'
        );
    }
});

// 회원가입용 이메일 인증 코드 확인
exports.verifySignupCode = functions.https.onCall(async (data, context) => {
    const { email, code } = data;

    if (!email || !code) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            '이메일과 인증 코드가 모두 필요합니다.'
        );
    }

    try {
        // 디버깅: 입력값 로그
        console.log('인증 코드 확인 요청:', {
            email: email,
            emailLowercase: email.toLowerCase(),
            code: code,
            codeType: typeof code
        });

        // Firestore에서 인증 코드 조회
        // orderBy 없이 먼저 시도 (인덱스 문제 방지)
        let codesSnapshot = await admin.firestore()
            .collection('signupVerificationCodes')
            .where('email', '==', email.toLowerCase())
            .where('code', '==', code.toString()) // 문자열로 변환하여 비교
            .where('used', '==', false)
            .get();

        // 결과가 없으면 orderBy를 사용하여 재시도 (인덱스가 있는 경우)
        if (codesSnapshot.empty) {
            try {
                codesSnapshot = await admin.firestore()
                    .collection('signupVerificationCodes')
                    .where('email', '==', email.toLowerCase())
                    .where('code', '==', code.toString())
                    .where('used', '==', false)
                    .orderBy('createdAt', 'desc')
                    .limit(1)
                    .get();
            } catch (orderByError) {
                // orderBy 실패 시 (인덱스 없음) - 이미 가져온 결과 사용
                console.warn('orderBy 실패 (인덱스 없을 수 있음), 모든 결과 사용:', orderByError.message);
            }
        }

        // 모든 결과를 가져온 경우, createdAt으로 정렬하여 최신 것 선택
        let codeDoc = null;
        if (!codesSnapshot.empty) {
            const docs = codesSnapshot.docs;
            if (docs.length === 1) {
                codeDoc = docs[0];
            } else {
                // 여러 개가 있으면 createdAt이 가장 최근인 것 선택
                codeDoc = docs.sort((a, b) => {
                    const aTime = a.data().createdAt?.toMillis() || 0;
                    const bTime = b.data().createdAt?.toMillis() || 0;
                    return bTime - aTime; // 내림차순
                })[0];
            }
        }

        if (!codeDoc) {
            console.error('인증 코드를 찾을 수 없음:', {
                email: email.toLowerCase(),
                code: code.toString(),
                codesFound: codesSnapshot.size
            });
            throw new functions.https.HttpsError(
                'invalid-argument',
                '유효하지 않은 인증 코드입니다.'
            );
        }

        const codeData = codeDoc.data();

        // 디버깅: 찾은 코드 정보 로그
        console.log('인증 코드 찾음:', {
            email: codeData.email,
            code: codeData.code,
            used: codeData.used,
            createdAt: codeData.createdAt?.toDate(),
            expiresAt: codeData.expiresAt?.toDate()
        });

        // 만료 시간 확인
        const expiresAt = codeData.expiresAt.toDate();
        if (new Date() > expiresAt) {
            await codeDoc.ref.update({ used: true });
            throw new functions.https.HttpsError(
                'deadline-exceeded',
                '인증 코드가 만료되었습니다. 다시 요청해주세요.'
            );
        }

        // 인증 코드 사용 처리
        await codeDoc.ref.update({ used: true });

        return {
            success: true,
            message: '이메일 인증이 완료되었습니다.'
        };
    } catch (error) {
        console.error('회원가입 인증 코드 확인 실패:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            '인증 코드 확인에 실패했습니다. 다시 시도해주세요.'
        );
    }
});

// 이메일 인증 코드 확인 및 비밀번호 재설정
exports.verifyPasswordResetCode = functions.https.onCall(async (data, context) => {
    const { email, code, newPassword } = data;

    if (!email || !code || !newPassword) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            '이메일, 인증 코드, 새 비밀번호가 모두 필요합니다.'
        );
    }

    // 비밀번호 유효성 검사
    if (newPassword.length < 6) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            '비밀번호는 최소 6자 이상이어야 합니다.'
        );
    }

    try {
        // Firestore에서 인증 코드 조회
        const codesSnapshot = await admin.firestore()
            .collection('passwordResetCodes')
            .where('email', '==', email)
            .where('code', '==', code)
            .where('used', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (codesSnapshot.empty) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                '유효하지 않은 인증 코드입니다.'
            );
        }

        const codeDoc = codesSnapshot.docs[0];
        const codeData = codeDoc.data();

        // 만료 시간 확인
        const expiresAt = codeData.expiresAt.toDate();
        if (new Date() > expiresAt) {
            await codeDoc.ref.update({ used: true });
            throw new functions.https.HttpsError(
                'deadline-exceeded',
                '인증 코드가 만료되었습니다. 다시 요청해주세요.'
            );
        }

        // 인증 코드 사용 처리
        await codeDoc.ref.update({ used: true });

        // 비밀번호 재설정
        await admin.auth().updateUser(codeData.userId, {
            password: newPassword
        });

        // Firestore 사용자 정보 업데이트
        await admin.firestore().collection('users').doc(codeData.userId).update({
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        };
    } catch (error) {
        console.error('비밀번호 재설정 실패:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            '비밀번호 재설정에 실패했습니다. 다시 시도해주세요.'
        );
    }
});

// 고아 Auth 계정 삭제 (Firestore에 없지만 Auth에 남아있는 계정)
exports.deleteOrphanAuthAccount = functions.https.onCall(async (data, context) => {
    const { email } = data;

    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', '이메일이 필요합니다.');
    }

    try {
        // 1. Firestore에서 사용자 확인
        const firestore = admin.firestore();
        const usersSnapshot = await firestore
            .collection('users')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();

        // Firestore에 사용자가 있으면 삭제하지 않음
        if (!usersSnapshot.empty) {
            return {
                success: false,
                message: 'Firestore에 사용자가 존재합니다.'
            };
        }

        // 2. Firebase Auth에서 사용자 찾기
        let authUser;
        try {
            authUser = await admin.auth().getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return {
                    success: false,
                    message: 'Auth에 사용자가 없습니다.'
                };
            }
            throw error;
        }

        // 3. Auth 계정 삭제
        await admin.auth().deleteUser(authUser.uid);

        return {
            success: true,
            message: '고아 Auth 계정이 삭제되었습니다.',
            uid: authUser.uid
        };
    } catch (error) {
        console.error('고아 Auth 계정 삭제 실패:', error);
        throw new functions.https.HttpsError('internal', '계정 삭제 중 오류가 발생했습니다.');
    }
});

// 여러 Auth 계정 일괄 삭제 (관리자용)
exports.deleteAuthAccounts = functions.https.onCall(async (data, context) => {
    const { userIds } = data;

    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', '사용자 ID 목록이 필요합니다.');
    }

    try {
        const results = {
            total: userIds.length,
            success: 0,
            failed: 0,
            errors: []
        };

        for (const userId of userIds) {
            try {
                await admin.auth().deleteUser(userId);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    userId,
                    error: error.message
                });
                console.error(`사용자 ${userId} Auth 계정 삭제 실패:`, error);
            }
        }

        return {
            success: true,
            ...results,
            message: `Auth 계정 삭제 완료: 성공 ${results.success}명, 실패 ${results.failed}명`
        };
    } catch (error) {
        console.error('Auth 계정 일괄 삭제 실패:', error);
        throw new functions.https.HttpsError('internal', '계정 삭제 중 오류가 발생했습니다.');
    }
});

// 카카오 로그인 인증 처리
exports.kakaoAuth = functions.https.onCall(async (data, context) => {
    try {
        const { code, redirectUri } = data;

        if (!code) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                '카카오 인증 코드가 필요합니다.'
            );
        }

        // 카카오 REST API 키 (Firebase Functions 설정에서 가져오기)
        // 우선순위: 1) 환경 변수, 2) Functions 설정, 3) 하드코딩 (테스트용)
        const KAKAO_REST_API_KEY =
            process.env.KAKAO_REST_API_KEY ||
            functions.config().kakao?.rest_api_key ||
            '10c127c108feaa420dc5331b6ff00a8e'; // 테스트용 - 나중에 제거 필요

        if (!KAKAO_REST_API_KEY) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                '카카오 REST API 키가 설정되지 않았습니다.'
            );
        }

        console.log('카카오 REST API 키 사용:', KAKAO_REST_API_KEY ? '설정됨' : '설정되지 않음');

        // 1. code를 access_token으로 교환
        const finalRedirectUri = redirectUri || 'https://story-potion.web.app/auth/kakao/callback';
        console.log('토큰 교환 시 사용할 리다이렉트 URI:', finalRedirectUri);
        console.log('인증 코드:', code);
        console.log('클라이언트 ID:', KAKAO_REST_API_KEY ? '설정됨' : '설정되지 않음');

        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: KAKAO_REST_API_KEY,
                redirect_uri: finalRedirectUri,
                code: code,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('카카오 토큰 교환 실패:', errorText);
            console.error('사용된 리다이렉트 URI:', finalRedirectUri);
            console.error('카카오 REST API 키:', KAKAO_REST_API_KEY ? '설정됨' : '설정되지 않음');
            console.error('HTTP 상태 코드:', tokenResponse.status);

            // 에러 메시지에 카카오 API 응답 포함
            let errorMessage = '카카오 인증 토큰 교환에 실패했습니다.';
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error_description) {
                    errorMessage += ` (${errorJson.error_description})`;
                } else if (errorJson.error) {
                    errorMessage += ` (${errorJson.error})`;
                }
            } catch (e) {
                // JSON 파싱 실패 시 원본 텍스트 사용
                errorMessage += ` (${errorText})`;
            }

            throw new functions.https.HttpsError(
                'internal',
                errorMessage
            );
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            throw new functions.https.HttpsError(
                'internal',
                '카카오 액세스 토큰을 받지 못했습니다.'
            );
        }

        // 2. access_token으로 사용자 정보 가져오기
        const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!userInfoResponse.ok) {
            const errorText = await userInfoResponse.text();
            console.error('카카오 사용자 정보 조회 실패:', errorText);
            throw new functions.https.HttpsError(
                'internal',
                '카카오 사용자 정보를 가져오는데 실패했습니다.'
            );
        }

        const userInfo = await userInfoResponse.json();
        const kakaoId = userInfo.id.toString();
        const kakaoEmail = userInfo.kakao_account?.email || `kakao_${kakaoId}@kakao.temp`;
        const kakaoNickname = userInfo.kakao_account?.profile?.nickname || userInfo.properties?.nickname || '카카오 사용자';
        const kakaoPhotoURL = userInfo.kakao_account?.profile?.profile_image_url || userInfo.properties?.profile_image || null;

        // 3. Firestore에서 기존 사용자 찾기 (카카오 ID로만 검색 - 이메일과 무관하게 별도 계정)
        const db = admin.firestore();
        const usersRef = db.collection('users');
        const existingUserQuery = await usersRef.where('kakaoId', '==', kakaoId).limit(1).get();

        let uid;
        let isNewUser = false;
        let existingUserDoc = null;

        if (!existingUserQuery.empty) {
            // 카카오 ID로 기존 사용자 찾음
            existingUserDoc = existingUserQuery.docs[0];
            uid = existingUserDoc.id;
            console.log('카카오 ID로 기존 사용자 찾음:', uid);
        } else {
            // 신규 사용자 - 카카오 ID가 없으면 항상 새 계정 생성 (이메일과 무관)
            uid = db.collection('users').doc().id;
            isNewUser = true;
            console.log('신규 카카오 사용자 생성 (이메일과 별도 계정):', uid);
        }

        // 4. Firebase 커스텀 토큰 생성
        // 참고: 커스텀 토큰 생성에는 Service Account Token Creator 권한이 필요합니다
        let customToken;
        try {
            // 현재 사용 중인 서비스 계정 정보 로깅
            const app = admin.app();
            console.log('Firebase Admin 앱 이름:', app.name);

            customToken = await admin.auth().createCustomToken(uid, {
                provider: 'kakao',
                kakaoId: kakaoId,
            });
            console.log('커스텀 토큰 생성 성공');
        } catch (tokenError) {
            console.error('커스텀 토큰 생성 실패:', tokenError);
            console.error('에러 코드:', tokenError.code);
            console.error('에러 메시지:', tokenError.message);
            console.error('에러 상세:', JSON.stringify(tokenError, null, 2));

            // 권한 오류인 경우 더 자세한 안내
            if (tokenError.code === 'auth/insufficient-permission' ||
                tokenError.message?.includes('Permission') ||
                tokenError.message?.includes('iam.serviceAccounts.signBlob')) {

                // 권한 오류이지만, Firestore에 사용자 정보는 저장할 수 있으므로
                // 커스텀 토큰 없이 사용자 정보만 반환하고 클라이언트에서 처리하도록 변경
                console.warn('⚠️ 커스텀 토큰 생성 권한이 없습니다. 사용자 정보만 반환합니다.');

                // Firestore에 사용자 정보는 저장
                const userRef = db.collection('users').doc(uid);
                const userData = {
                    email: kakaoEmail,
                    displayName: kakaoNickname,
                    photoURL: kakaoPhotoURL,
                    authProvider: 'kakao',
                    kakaoId: kakaoId,
                    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                if (isNewUser) {
                    await userRef.set({
                        ...userData,
                        point: 100,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        emailVerified: false,
                        isActive: true,
                    });

                    await db.collection('users').doc(uid).collection('pointHistory').add({
                        type: 'earn',
                        amount: 100,
                        desc: '회원가입 축하 포인트',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    await userRef.update(userData);
                }

                // 커스텀 토큰 없이 사용자 정보만 반환
                // 클라이언트에서 Firebase Auth 없이 Firestore에서 직접 사용자 정보를 사용하도록 처리
                return {
                    success: true,
                    userInfo: userInfo,
                    uid: uid,
                    customToken: null, // 권한 문제로 생성 불가
                    requiresManualAuth: true, // 수동 인증 필요
                };
            }
            throw tokenError;
        }

        // 5. Firestore에 사용자 정보 저장/업데이트
        const userRef = db.collection('users').doc(uid);
        const userData = {
            email: kakaoEmail,
            displayName: kakaoNickname,
            photoURL: kakaoPhotoURL,
            authProvider: 'kakao',
            kakaoId: kakaoId,
            lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (isNewUser) {
            // 신규 사용자 - 이메일 로그인과 별도 계정으로 생성
            await userRef.set({
                ...userData,
                point: 100,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                emailVerified: false,
                isActive: true,
            });

            // 회원가입 축하 포인트 히스토리 추가
            await db.collection('users').doc(uid).collection('pointHistory').add({
                type: 'earn',
                amount: 100,
                desc: '회원가입 축하 포인트',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        } else {
            // 기존 카카오 사용자 - 정보 업데이트
            await userRef.update(userData);
        }

        return {
            success: true,
            userInfo: userInfo,
            customToken: customToken || null, // 권한 문제로 null일 수 있음
            uid: uid,
        };
    } catch (error) {
        console.error('카카오 인증 처리 실패:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError(
            'internal',
            '카카오 인증 처리에 실패했습니다: ' + (error.message || '알 수 없는 오류')
        );
    }
});

// 개별 사용자에게 푸시 알림 전송 함수 (onCall 방식 - CORS 자동 처리)
exports.sendPushNotificationToUser = functions.https.onCall(async (data, context) => {
    // CORS는 onCall이 자동으로 처리하므로 별도 설정 불필요
    try {
        const { userId, title, message, data: notificationData } = data;

        if (!userId || !title || !message) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'userId, title, message는 필수입니다.'
            );
        }

        // 사용자 정보 조회
        const userDoc = await admin.firestore().collection('users').doc(userId).get();

        if (!userDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                '사용자를 찾을 수 없습니다.'
            );
        }

        const user = userDoc.data();
        const fcmToken = user.fcmToken;

        if (!fcmToken) {
            console.log(`사용자 ${userId}: FCM 토큰 없음`);
            return { success: false, message: 'FCM 토큰이 없습니다.' };
        }

        // FCM 메시지 생성
        const fcmMessage = {
            token: fcmToken,
            notification: {
                title: title,
                body: message,
            },
            data: {
                type: notificationData?.type || 'general',
                title: title,
                message: message,
                ...(notificationData || {})
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                    color: '#000000',
                    imageUrl: 'https://story-potion.web.app/app_logo/logo.png'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            }
        };

        // FCM 메시지 전송
        const result = await admin.messaging().send(fcmMessage);
        console.log(`사용자 ${userId}에게 푸시 알림 전송 완료:`, result);

        return { success: true, messageId: result };
    } catch (error) {
        console.error('개별 사용자 푸시 알림 전송 실패:', error);
        throw new functions.https.HttpsError(
            'internal',
            '푸시 알림 전송 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류')
        );
    }
});