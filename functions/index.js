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
      이 일기 내용을 바탕으로 '${genre}' 장르의 소설로 작성해주세요.
      소설의 주인공 이름은 '${userName}'입니다. 주인공의 시점에서 이야기를 풀어가거나, 주인공을 중심으로 이야기를 구성해주세요.
      자연스러운 이야기 흐름을 만들고, 문단을 나누어 가독성을 높여주세요.
      대화도 적절히 포함시켜서 생동감을 더해주세요.

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