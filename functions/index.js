const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");

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
        const prompt = `
        당신은 '${genre}'소설 작가입니다.
      다음은 한 주간의 일기 내용입니다.
      이 일기 내용을 바탕으로 '${genre}' 스타일의 소설로 각색해줘.
      등장인물, 사건, 분위기를 해당 장르에 맞게 재구성해줘
      핵심 내용은 유지하되, 배경·말투·서사 구조는 완전히 [장르]에 맞게 바꿔줘
      서술 톤, 문체, 대사도 [장르] 스타일로 바꿔줘
      소설은 서론, 본론, 결말로 구성해줘. 단, 서론 / 본론 / 결론" 같은 단어는 사용하지 말고, 소설처럼 매끄럽게 서술해줘
      스토리는 도입 → 전개 → 결말 구조로 자연스럽게 흘러가게 해줘
      독자가 몰입할 수 있도록 묘사와 감정선을 충분히 넣어줘
      큰따옴표와 작은따옴표를 사용한 대사, 생각 등을 꼭 포함시켜줘.

      [일기 내용]
      ${diaryContents}
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1500,
        });

        return { content: response.choices[0].message.content };
    } catch (error) {
        console.error("OpenAI API 호출 중 오류 발생:", error);
        throw new functions.https.HttpsError(
            "internal",
            "AI 소설 생성에 실패했습니다. 잠시 후 다시 시도해주세요。",
            error,
        );
    }
});

exports.generateNovelCover = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "이미지를 생성하려면 로그인이 필요합니다。",
        );
    }

    const { novelContent, title, genre } = data;
    if (!novelContent || !title || !genre) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "소설 내용, 제목, 장르 정보가 필요합니다。",
        );
    }

    try {
        const imagePrompt = `A digital painting book cover of a '${genre}' novel, titled '${title}'. The main theme is about: ${novelContent.substring(0, 300)}. Do not include any text in the image.`;

        const response = await openai.images.generate({
            model: "dall-e-2", // dall-e-3 is also available
            prompt: imagePrompt,
            n: 1,
            size: "512x512",
            response_format: "url",
        });

        const imageUrl = response.data[0].url;

        return { imageUrl };
    } catch (error) {
        console.error("OpenAI 이미지 생성 중 오류 발생:", error);
        throw new functions.https.HttpsError(
            "internal",
            "AI 표지 이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요。",
            error,
        );
    }
}); 