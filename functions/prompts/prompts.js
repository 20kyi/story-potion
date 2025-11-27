/**
 * 프롬프트 템플릿 모듈
 * 각 장르별 프롬프트를 함수로 관리하여 유지보수 용이성 향상
 */

// 공통 헬퍼 함수들
function getNarrativeSummaryGuidance(genreType, isEng) {
    const genreSpecific = {
        'romance': isEng ? 'romantic moments or relationship milestones' : '로맨틱한 순간이나 관계의 이정표',
        'mystery': isEng ? 'clues or plot points' : '단서나 플롯 포인트',
        'historical': isEng ? 'historical moments or period details' : '역사적 순간이나 시대적 세부사항',
        'fairytale': isEng ? 'magical moments or lessons' : '마법적 순간이나 교훈',
        'fantasy': isEng ? 'magical elements or adventure points' : '마법적 요소나 모험 포인트',
        'horror': isEng ? 'tension points or eerie moments' : '긴장 포인트나 섬뜩한 순간',
    };
    const keywordGuide = genreSpecific[genreType] || (isEng ? 'key plot points' : '핵심 플롯 포인트');

    if (isEng) {
        return `**STEP 1: Create a 7-Day Narrative Summary Table**

Before writing the novel, first create a comprehensive narrative summary table that tracks:
- **Day-by-day core events**: What happened each day?
- **Key characters**: Who appeared each day? Track character names and their roles.
- **Emotional trajectory**: How did emotions change from Day 1 to Day 7? Use the emotion tags provided.
- **Key keywords/phrases**: Extract 2-3 key keywords or phrases from each day that could become ${keywordGuide}.
- **Causal connections**: How does Day 1 connect to Day 7? What subtle details from early days become crucial in later days?

Format your analysis as a structured table, then proceed to write the novel based on this analysis.`;
    } else {
        return `**1단계: 7일간의 서사 요약표 생성**

소설을 작성하기 전에, 먼저 다음을 추적하는 포괄적인 서사 요약표를 작성하세요:
- **일별 핵심 사건**: 매일 무슨 일이 일어났나요?
- **주요 인물**: 매일 누가 등장했나요? 인물 이름과 역할을 추적하세요.
- **감정 변화 궤적**: 1일차부터 7일차까지 감정이 어떻게 변화했나요? 제공된 감정 태그를 활용하세요.
- **핵심 키워드/구문**: 각 날짜에서 2-3개의 핵심 키워드나 구문을 추출하여 ${keywordGuide}로 활용할 수 있도록 하세요.
- **인과관계 연결**: 1일차가 7일차와 어떻게 연결되나요? 초기 날짜의 미묘한 세부사항이 나중 날짜에서 중요한 요소가 되는지 분석하세요.

분석을 구조화된 표 형식으로 작성한 후, 이 분석을 바탕으로 소설을 작성하세요.`;
    }
}

// 공통 창작 지침 (일기 요약 방지)
function getCreativeTransformationGuidance(isEng) {
    if (isEng) {
        return `**CRITICAL: Creative Transformation - Do NOT Summarize Diaries**

**IMPORTANT: You must create a completely original fictional story. Do NOT simply summarize or retell the diary entries.**

* **Narrative Perspective**: The protagonist is "I" (first person). Write the entire story from the first-person perspective of the diary writer.
* **Characters from Diary**: Use the characters mentioned in the diary entries as they appear. Extract all character names, relationships, and roles from the diary and incorporate them into the story. Do not create entirely new characters - use the people mentioned in the diary.
* **Use diary entries as foundation**: Extract the emotional essence, relationship dynamics, and narrative structure from the diaries, but transform them into a compelling fictional narrative with dramatic scenes and dialogues.
* **Build a fictional world**: Create a unique setting, atmosphere, and context that transforms the diary's real-life events into a fictional story appropriate for the genre.
* **Write original dialogues**: Create natural, engaging conversations that reveal character depth and advance the plot. Transform diary content into dramatic dialogue and scenes.
* **Add fictional elements**: Introduce conflicts, obstacles, surprises, and resolutions that enhance the story while staying true to the core relationships and events from the diary.
* **Show, don't tell**: Use vivid descriptions, sensory details, and dramatic scenes instead of simply narrating what happened.
* **Create dramatic tension**: Build suspense, conflict, and emotional intensity through original plot developments.
* **First-person narrative style**: Write in first person ("I") throughout. Use natural, literary first-person narration appropriate for the genre, not diary-style writing.`;
    } else {
        return `**중요: 창의적 변환 - 일기 요약 금지**

**반드시 완전히 독창적인 소설을 창작해야 합니다. 일기 내용을 단순히 요약하거나 재현하지 마세요.**

* **서술 시점**: 주인공은 "나"입니다. 소설 전체를 일기 작성자인 "나"의 1인칭 시점으로 작성하세요.
* **일기 인물 활용**: 일기에 언급된 인물들을 그대로 사용하세요. 일기에서 등장하는 모든 인물의 이름, 관계, 역할을 추출하여 소설에 반영하세요. 완전히 새로운 인물을 만들지 말고, 일기에 언급된 인물들을 사용하세요.
* **일기는 기반으로 사용**: 일기에서 감정의 본질, 관계의 역학, 서사 구조를 추출하되, 이를 극적인 장면과 대화가 있는 매력적인 소설로 변환하세요.
* **가상의 세계 구축**: 일기의 실제 사건을 장르에 맞는 가상의 이야기로 변환하는 독특한 배경, 분위기, 맥락을 만들어내세요.
* **독창적인 대화 작성**: 인물의 깊이를 드러내고 플롯을 발전시키는 자연스럽고 매력적인 대화를 창작하세요. 일기 내용을 극적인 대화와 장면으로 변환하세요.
* **가상의 요소 추가**: 일기의 핵심 관계와 사건을 유지하면서 이야기를 풍성하게 만드는 갈등, 장애물, 놀라움, 해결책을 도입하세요.
* **보여주기, 말하지 않기**: 단순히 무슨 일이 일어났는지 서술하는 대신 생생한 묘사, 감각적 세부사항, 극적인 장면을 사용하세요.
* **극적인 긴장감 조성**: 독창적인 플롯 전개를 통해 서스펜스, 갈등, 감정적 강도를 구축하세요.
* **1인칭 서술체**: 소설 전체를 "나"의 1인칭 시점으로 작성하세요. 일기체가 아닌 장르에 적합한 자연스러운 문학적 1인칭 서술체를 사용하세요.`;
    }
}

// 공통 섹션 템플릿
const COMMON_SECTIONS = {
    responseStructure: {
        en: `IMPORTANT: Your response must be structured in two clear sections:

1. **Narrative Summary Table Section**: Start with "## 서사 요약표" (Korean) or "## Narrative Summary Table" (English), then provide the comprehensive 7-day narrative summary table.

2. **Novel Section**: After the summary table, start a new section with "## 소설 시작" (Korean) or "## Begin the Novel" (English), then write the novel.`,
        ko: `중요: 응답은 반드시 두 개의 명확한 섹션으로 구성되어야 합니다:

1. **서사 요약표 섹션**: "## 서사 요약표"로 시작하여 포괄적인 7일간의 서사 요약표를 제공하세요.

2. **소설 섹션**: 요약표 이후 "## 소설 시작"으로 새 섹션을 시작한 후 소설을 작성하세요.`
    }
};

// 로맨스 장르 프롬프트
function getRomancePrompts(diaryContents, novelContent, isEnglish, diaryInfoSection) {
    if (isEnglish) {
        return {
            contentPrompt: `You are a professional romance novelist with exceptional storytelling and analytical abilities. Your task is to analyze the week-long diary entries below and create a high-quality romance novel that readers can immerse themselves in.

**STEP 1: Create a 7-Day Narrative Summary Table**

Before writing the novel, first create a comprehensive narrative summary table that tracks:
- **Day-by-day core events**: What happened each day?
- **Key characters**: Who appeared each day? Track character names and their roles.
- **Emotional trajectory**: How did emotions change from Day 1 to Day 7? Use the emotion tags provided to track the emotional journey of love and relationships.
- **Key keywords/phrases**: Extract 2-3 key keywords or phrases from each day that could become romantic moments or relationship milestones.
- **Causal connections**: How does Day 1 connect to Day 7? What subtle emotions and encounters from early days become the foundation of the romantic climax?

Format your analysis as a structured table, then proceed to write the novel based on this analysis.

${getCreativeTransformationGuidance(true)}

**STEP 2: Data Analysis and Narrative Cohesion:**

* Analyze the core events, emotions, and characters that appear in the 7 diary entries to establish plot continuity and causality.
* Connect the subtle emotions and encounters from Day 1 to become the foundation of the romantic climax in Day 7, creating a meticulously woven narrative of love and relationships.
* Track the emotional journey using the emotion tags: analyze how emotions evolve and how this emotional trajectory influences the development of relationships.

**STEP 4: Genre and Style:**

* **Selected Genre:** Romance Novel
* **Protagonist and Perspective:** The protagonist is "I" (first person). Write the entire story from the first-person perspective. Use the characters mentioned in the diary entries as they appear.
* **Style Guidelines:** Transform the emotions and relationships from the diary entries into a compelling love story. Develop the progression of feelings, create tension-filled romantic moments, and reveal the depth of relationships through powerful emotional revelations. The writing style should be warm and emotional with rich psychological descriptions. Delicately portray the subtle changes in excitement and emotions, and vividly depict non-verbal communication such as conversations, eye contact, and gestures between characters.

**STEP 4: Output Requirements:**

* Length: Minimum 2,000 characters, maximum 4,000 characters.
* Do NOT include a novel title in the story content. Write only the story itself.
* The novel should be structured as one continuous, natural story without separating introduction/body/conclusion.

**STEP 5: Diary Content (Input Data):**

Below is a week of diary entries. Analyze these entries to extract core events, emotions, and characters, then transform them into a cohesive romance novel with strong narrative continuity.
${diaryInfoSection}
[Diary entries]
${diaryContents}

**STEP 6: Begin the novel:**

${COMMON_SECTIONS.responseStructure.en}

First, create the narrative summary table, then write a romance novel that transforms the diary entries into a cohesive narrative with strong plot continuity and natural flow. The protagonist is "I" (first person), and use the characters mentioned in the diary entries as they appear. Focus on love, excitement, and the changes in relationships.`,
            titlePrompt: `Read the following romance novel carefully and suggest only one most fitting title in English that captures the essence, emotions, and key themes of the story. The title should be meaningful, memorable, and directly related to the story's content. Do not include any explanation, only the title.

[Novel Content]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A warm, dreamy romantic illustration of a couple or symbolic objects, soft colors, gentle atmosphere. No text, no words, no violence.`
        };
    } else {
        return {
            contentPrompt: `당신은 최고 수준의 스토리텔링 능력을 갖춘 전문 소설가이자 분석가입니다. 아래의 일주일 일기 데이터를 분석하여, 독자가 몰입할 수 있는 완성도 높은 단편 소설을 창작해야 합니다.

**1단계: 7일간의 서사 요약표 생성**

소설을 작성하기 전에, 먼저 다음을 추적하는 포괄적인 서사 요약표를 작성하세요:
- **일별 핵심 사건**: 매일 무슨 일이 일어났나요?
- **주요 인물**: 매일 누가 등장했나요? 인물 이름과 역할을 추적하세요.
- **감정 변화 궤적**: 1일차부터 7일차까지 감정이 어떻게 변화했나요? 제공된 감정 태그를 활용하여 사랑과 관계의 감정적 여정을 추적하세요.
- **핵심 키워드/구문**: 각 날짜에서 2-3개의 핵심 키워드나 구문을 추출하여 로맨틱한 순간이나 관계의 이정표로 활용할 수 있도록 하세요.
- **인과관계 연결**: 1일차가 7일차와 어떻게 연결되나요? 초기 날짜의 미묘한 감정과 만남이 로맨틱 클라이맥스의 기초가 되는지 분석하세요.

분석을 구조화된 표 형식으로 작성한 후, 이 분석을 바탕으로 소설을 작성하세요.

${getCreativeTransformationGuidance(false)}

**2단계: 데이터 분석 및 관계성 부여:**

* 일기 7개에 등장하는 핵심 사건, 감정, 인물을 분석하여 플롯의 연속성과 인과관계를 설정하세요.
* 일기 1일차의 미묘한 감정과 만남이 7일차 로맨틱 클라이맥스의 기초가 되도록 치밀하게 연결하세요.
* 감정 태그를 활용하여 감정의 여정을 추적하세요: 감정이 어떻게 진화하는지, 그리고 이 감정적 궤적이 관계의 발전에 어떤 영향을 미치는지 분석하세요.

**3단계: 장르 및 스타일:**

* **선택 장르:** 로맨스 소설
* **주인공 및 시점:** 주인공은 "나"이며, 소설 전체를 1인칭 시점으로 작성하세요. 일기에 언급된 인물들을 등장인물로 사용하세요.
* **스타일 지침:** 일기 속 감정과 관계를 매력적인 사랑 이야기로 발전시키고, 감정의 변화 과정을 그려내며, 강력한 감정적 계시를 통해 관계의 깊이를 드러내는 플롯을 구성해야 합니다. 문체는 따뜻하고 감성적이며, 심리 묘사는 풍부해야 합니다. 설렘과 감정의 미묘한 변화를 섬세하게 묘사하고, 인물 간의 대화와 눈빛, 손짓 같은 비언어적 소통도 생생하게 그려내세요.

**4단계: 출력 조건:**

* 길이는 최소 2,000자 이상, 최대 4,000자 이내입니다.
* 소설 제목은 포함하지 마세요. 소설 본문만 작성하세요.
* 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

**5단계: 일기 내용 (입력 데이터):**

아래는 한 주간의 일기입니다. 이 일기들을 분석하여 핵심 사건, 감정, 인물을 추출하고, 이를 서사적 관계성과 자연스러운 연속성을 가진 로맨스 소설로 변환하세요.
${diaryInfoSection}
[일기 내용]
${diaryContents}

**6단계: 소설 시작:**

${COMMON_SECTIONS.responseStructure.ko}

먼저 서사 요약표를 작성한 후, 일기 데이터를 바탕으로 서사적 관계성과 자연스러운 연속성을 가진 로맨스 소설을 작성하세요. 주인공은 "나"이며 1인칭 시점으로, 일기에 언급된 인물들을 등장인물로 사용하세요. 사랑, 설렘, 감정의 변화, 인물 간의 관계와 대화, 내면 묘사를 적극적으로 활용해 주세요.`,
            titlePrompt: `다음 로맨스 소설을 자세히 읽고, 이야기의 본질, 감정, 핵심 주제를 담은 가장 어울리는 제목 하나만 추천해줘. 제목은 의미 있고 기억에 남으며, 소설 내용과 직접적으로 연관되어야 해. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A warm, dreamy romantic illustration of a couple or symbolic objects, soft colors, gentle atmosphere. No text, no words, no violence.`
        };
    }
}

// 추리 장르 프롬프트
function getMysteryPrompts(diaryContents, novelContent, isEnglish, diaryInfoSection) {
    if (isEnglish) {
        return {
            contentPrompt: `You are a professional mystery novelist with exceptional storytelling and analytical abilities. Your task is to analyze the week-long diary entries below and create a high-quality mystery novel that readers can immerse themselves in.

${getNarrativeSummaryGuidance('mystery', true)}

${getCreativeTransformationGuidance(true)}

**STEP 2: Data Analysis and Narrative Cohesion:**

* Analyze the core events, emotions, and characters that appear in the 7 diary entries to establish plot continuity and causality.
* Connect the trivial details from Day 1 to become crucial clues in Day 7's climax, creating a meticulously woven narrative.
* Track the emotional journey using the emotion tags: analyze how emotions evolve and how this emotional trajectory influences the mystery's development.

**STEP 3: Genre and Style:**

* **Selected Genre:** Mystery Novel
* **Protagonist and Perspective:** The protagonist is "I" (first person). Write the entire story from the first-person perspective. Use the characters mentioned in the diary entries as they appear.
* **Style Guidelines:** Develop minor questions from the diary entries into key clues, lay down tension-filled foreshadowing, and reveal hidden truths through powerful plot twists. The writing style should be dry but with sharp psychological descriptions. Vividly portray "I"'s reasoning process, suspicions, and observations, and structure the story so that clues are gradually revealed. Delicately describe the process of understanding the hidden meanings in characters' words and actions.

**STEP 4: Output Requirements:**

* Length: Minimum 2,000 characters, maximum 4,000 characters.
* Do NOT include a novel title in the story content. Write only the story itself.
* The novel should be structured as one continuous, natural story without separating introduction/body/conclusion.

**STEP 5: Diary Content (Input Data):**

Below is a week of diary entries. Analyze these entries to extract core events, emotions, and characters, then transform them into a cohesive mystery novel with strong narrative continuity.
${diaryInfoSection}
[Diary entries]
${diaryContents}

**STEP 6: Begin the novel:**

${COMMON_SECTIONS.responseStructure.en}

First, create the narrative summary table, then write a mystery novel that transforms the diary entries into a cohesive narrative with strong plot continuity and natural flow. The protagonist is "I" (first person), and use the characters mentioned in the diary entries as they appear. Vividly portray "I"'s reasoning process, observations, and suspicions, and structure the story so that clues are gradually revealed.`,
            titlePrompt: `Read the following mystery novel carefully and suggest only one most fitting title in English that captures the essence, key clues, and mysterious atmosphere of the story. The title should be intriguing, memorable, and directly related to the story's content. Do not include any explanation, only the title.

[Novel Content]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A classic, peaceful illustration inspired by detective stories. Use soft colors and gentle atmosphere. No people, no violence, no text.`
        };
    } else {
        return {
            contentPrompt: `당신은 최고 수준의 스토리텔링 능력을 갖춘 전문 소설가이자 분석가입니다. 아래의 일주일 일기 데이터를 분석하여, 독자가 몰입할 수 있는 완성도 높은 단편 소설을 창작해야 합니다.

${getNarrativeSummaryGuidance('mystery', false)}

${getCreativeTransformationGuidance(false)}

**2단계: 데이터 분석 및 관계성 부여:**

* 일기 7개에 등장하는 핵심 사건, 감정, 인물을 분석하여 플롯의 연속성과 인과관계를 설정하세요.
* 일기 1일차의 사소한 내용이 7일차 클라이맥스의 핵심 단서가 되도록 치밀하게 연결하세요.
* 감정 태그를 활용하여 감정의 여정을 추적하세요: 감정이 어떻게 진화하는지, 그리고 이 감정적 궤적이 추리의 발전에 어떤 영향을 미치는지 분석하세요.

**3단계: 장르 및 스타일:**

* **선택 장르:** 추리 소설
* **주인공 및 시점:** 주인공은 "나"이며, 소설 전체를 1인칭 시점으로 작성하세요. 일기에 언급된 인물들을 등장인물로 사용하세요.
* **스타일 지침:** 일기 속 사소한 의문을 핵심 단서로 발전시키고, 긴장감 있는 복선을 깔아 강력한 반전을 통해 숨겨진 진실을 밝히는 치밀한 플롯을 구성해야 합니다. 문체는 건조하지만 심리 묘사는 날카로워야 합니다. "나"의 추리 과정과 의심, 관찰을 생생하게 그려내고, 단서들이 점진적으로 드러나도록 구성하세요. 인물들의 말과 행동에 숨겨진 의미를 파악하는 과정을 섬세하게 묘사하세요.

**4단계: 출력 조건:**

* 길이는 최소 2,000자 이상, 최대 4,000자 이내입니다.
* 소설 제목은 포함하지 마세요. 소설 본문만 작성하세요.
* 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

**5단계: 일기 내용 (입력 데이터):**

아래는 한 주간의 일기입니다. 이 일기들을 분석하여 핵심 사건, 감정, 인물을 추출하고, 이를 서사적 관계성과 자연스러운 연속성을 가진 추리 소설로 변환하세요.
${diaryInfoSection}
[일기 내용]
${diaryContents}

**6단계: 소설 시작:**

${COMMON_SECTIONS.responseStructure.ko}

먼저 서사 요약표를 작성한 후, 일기 데이터를 바탕으로 서사적 관계성과 자연스러운 연속성을 가진 추리 소설을 작성하세요. 주인공은 "나"이며 1인칭 시점으로, 일기에 언급된 인물들을 등장인물로 사용하세요. "나"의 추리 과정과 관찰, 의심을 생생하게 그려내고, 단서들이 점진적으로 드러나도록 구성하세요.`,
            titlePrompt: `다음 추리 소설을 자세히 읽고, 이야기의 본질, 핵심 단서, 미스터리한 분위기를 담은 가장 어울리는 제목 하나만 추천해줘. 제목은 흥미롭고 기억에 남으며, 소설 내용과 직접적으로 연관되어야 해. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A classic, peaceful illustration inspired by detective stories. Use soft colors and gentle atmosphere. No people, no violence, no text.`
        };
    }
}

// 역사 장르 프롬프트
function getHistoricalPrompts(diaryContents, novelContent, isEnglish, diaryInfoSection) {
    if (isEnglish) {
        return {
            contentPrompt: `You are a professional historical novelist with exceptional storytelling and analytical abilities. Your task is to analyze the week-long diary entries below and create a high-quality historical novel that readers can immerse themselves in.

${getNarrativeSummaryGuidance('historical', true)}

${getCreativeTransformationGuidance(true)}

**STEP 2: Data Analysis and Narrative Cohesion:**

* Analyze the core events, emotions, and characters that appear in the 7 diary entries to establish plot continuity and causality.
* Connect the daily experiences from Day 1 to become significant historical moments in Day 7's climax, creating a meticulously woven narrative set in a historical period.
* Track the emotional journey using the emotion tags: analyze how emotions evolve and how this emotional trajectory influences the historical narrative's development.

**STEP 3: Genre and Style:**

* **Selected Genre:** Historical Novel
* **Protagonist and Perspective:** The protagonist is "I" (first person). Write the entire story from the first-person perspective. Use the characters mentioned in the diary entries as they appear.
* **Style Guidelines:** Transform the events and emotions from the diary entries into a vivid historical setting. Develop the progression of historical events, create rich period details, and reveal the depth of characters' lives through powerful historical context. The writing style should be immersive with accurate historical details and rich descriptions. Vividly describe the atmosphere of the era, clothing, architecture, and way of life, and depict how "I" and the surrounding characters' lives unfold within historical events.

**STEP 4: Output Requirements:**

* Length: Minimum 2,000 characters, maximum 4,000 characters.
* Do NOT include a novel title in the story content. Write only the story itself.
* The novel should be structured as one continuous, natural story without separating introduction/body/conclusion.

**STEP 5: Diary Content (Input Data):**

Below is a week of diary entries. Analyze these entries to extract core events, emotions, and characters, then transform them into a cohesive historical novel with strong narrative continuity.
${diaryInfoSection}
[Diary entries]
${diaryContents}

**STEP 6: Begin the novel:**

${COMMON_SECTIONS.responseStructure.en}

First, create the narrative summary table, then write a historical novel that transforms the diary entries into a cohesive narrative with strong plot continuity and natural flow. The protagonist is "I" (first person), and use the characters mentioned in the diary entries as they appear. Set the story in a vivid historical period with accurate details and rich descriptions of people's lives and events.`,
            titlePrompt: `Read the following historical novel carefully and suggest only one most fitting title in English that captures the essence, historical period, and key events of the story. The title should be meaningful, memorable, and directly related to the story's content. Do not include any explanation, only the title.

[Novel Content]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A beautiful, classic historical illustration with traditional buildings and nature. Use warm colors and peaceful mood. No people, no violence, no text.`
        };
    } else {
        return {
            contentPrompt: `당신은 최고 수준의 스토리텔링 능력을 갖춘 전문 소설가이자 분석가입니다. 아래의 일주일 일기 데이터를 분석하여, 독자가 몰입할 수 있는 완성도 높은 단편 소설을 창작해야 합니다.

${getNarrativeSummaryGuidance('historical', false)}

${getCreativeTransformationGuidance(false)}

**2단계: 데이터 분석 및 관계성 부여:**

* 일기 7개에 등장하는 핵심 사건, 감정, 인물을 분석하여 플롯의 연속성과 인과관계를 설정하세요.
* 일기 1일차의 일상적 경험이 7일차 역사적 클라이맥스의 중요한 순간이 되도록 치밀하게 연결하세요.
* 감정 태그를 활용하여 감정의 여정을 추적하세요: 감정이 어떻게 진화하는지, 그리고 이 감정적 궤적이 역사적 서사의 발전에 어떤 영향을 미치는지 분석하세요.

**3단계: 장르 및 스타일:**

* **선택 장르:** 역사 소설
* **주인공 및 시점:** 주인공은 "나"이며, 소설 전체를 1인칭 시점으로 작성하세요. 일기에 언급된 인물들을 등장인물로 사용하세요.
* **스타일 지침:** 일기 속 사건과 감정을 생생한 역사적 배경으로 발전시키고, 시대적 세부사항을 풍부하게 그려내며, 강력한 역사적 맥락을 통해 인물의 삶의 깊이를 드러내는 플롯을 구성해야 합니다. 문체는 몰입감 있게, 정확한 역사적 세부사항과 풍부한 묘사가 있어야 합니다. 시대의 분위기, 복식, 건축물, 생활 방식 등을 생생하게 묘사하고, 역사적 사건 속에서 "나"와 주변 인물들의 삶이 어떻게 펼쳐지는지 그려내세요.

**4단계: 출력 조건:**

* 길이는 최소 2,000자 이상, 최대 4,000자 이내입니다.
* 소설 제목은 포함하지 마세요. 소설 본문만 작성하세요.
* 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

**5단계: 일기 내용 (입력 데이터):**

아래는 한 주간의 일기입니다. 이 일기들을 분석하여 핵심 사건, 감정, 인물을 추출하고, 이를 서사적 관계성과 자연스러운 연속성을 가진 역사 소설로 변환하세요.
${diaryInfoSection}
[일기 내용]
${diaryContents}

**6단계: 소설 시작:**

${COMMON_SECTIONS.responseStructure.ko}

먼저 서사 요약표를 작성한 후, 일기 데이터를 바탕으로 서사적 관계성과 자연스러운 연속성을 가진 역사 소설을 작성하세요. 주인공은 "나"이며 1인칭 시점으로, 일기에 언급된 인물들을 등장인물로 사용하세요. 시대적 배경과 고증, 인물의 삶과 사건, 대화와 내면 묘사가 풍부하게 드러나도록 해주세요.`,
            titlePrompt: `다음 역사 소설을 자세히 읽고, 이야기의 본질, 역사적 시대, 핵심 사건을 담은 가장 어울리는 제목 하나만 추천해줘. 제목은 의미 있고 기억에 남으며, 소설 내용과 직접적으로 연관되어야 해. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A beautiful, classic historical illustration with traditional buildings and nature. Use warm colors and peaceful mood. No people, no violence, no text.`
        };
    }
}

// 동화 장르 프롬프트
function getFairytalePrompts(diaryContents, novelContent, isEnglish, diaryInfoSection) {
    if (isEnglish) {
        return {
            contentPrompt: `You are a professional children's fairy tale writer with exceptional storytelling and analytical abilities. Your task is to analyze the week-long diary entries below and create a high-quality fairy tale that readers can immerse themselves in.

${getNarrativeSummaryGuidance('fairytale', true)}

${getCreativeTransformationGuidance(true)}

**STEP 2: Data Analysis and Narrative Cohesion:**

* Analyze the core events, emotions, and characters that appear in the 7 diary entries to establish plot continuity and causality.
* Connect the simple moments from Day 1 to become meaningful lessons in Day 7's conclusion, creating a meticulously woven narrative with warmth and imagination.
* Track the emotional journey using the emotion tags: analyze how emotions evolve and how this emotional trajectory influences the fairy tale's development.

**STEP 3: Genre and Style:**

* **Selected Genre:** Fairy Tale
* **Protagonist and Perspective:** The protagonist is "I" (first person). Write the entire story from the first-person perspective. Use the characters mentioned in the diary entries as they appear.
* **Style Guidelines:** Transform the events and emotions from the diary entries into a bright and heartwarming fairy tale. Develop the progression of magical adventures, create gentle lessons, and reveal the depth of characters through meaningful storytelling. The writing style should be bright, imaginative, and heartwarming with rich descriptions. Naturally incorporate magical elements and lessons, and vividly depict the growth, friendship, and warm moments between "I" and the surrounding characters.

**STEP 4: Output Requirements:**

* Length: Minimum 2,000 characters, maximum 4,000 characters.
* Do NOT include a novel title in the story content. Write only the story itself.
* The novel should be structured as one continuous, natural story without separating introduction/body/conclusion.

**STEP 5: Diary Content (Input Data):**

Below is a week of diary entries. Analyze these entries to extract core events, emotions, and characters, then transform them into a cohesive fairy tale with strong narrative continuity.
${diaryInfoSection}
[Diary entries]
${diaryContents}

**STEP 6: Begin the novel:**

${COMMON_SECTIONS.responseStructure.en}

First, create the narrative summary table, then write a fairy tale that transforms the diary entries into a cohesive narrative with strong plot continuity and natural flow. The protagonist is "I" (first person), and use the characters mentioned in the diary entries as they appear. Focus on imagination, gentle lessons, and heartwarming moments.`,
            titlePrompt: `Read the following fairy tale carefully and suggest only one most fitting title in English that captures the essence, magical elements, and heartwarming moments of the story. The title should be charming, memorable, and directly related to the story's content. Do not include any explanation, only the title.

[Novel Content]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A cute, adorable fairy tale illustration in soft pastel colors. The illustration should be directly related to the story content, featuring key characters, magical elements, or important scenes from the story. Use gentle, warm colors like soft pink, light blue, pale yellow, and lavender. The style should be charming and whimsical, like a children's book illustration. Include friendly characters, magical elements, or symbolic objects that represent the story. No text, no scary elements, no violence.`
        };
    } else {
        return {
            contentPrompt: `당신은 최고 수준의 스토리텔링 능력을 갖춘 전문 소설가이자 분석가입니다. 아래의 일주일 일기 데이터를 분석하여, 독자가 몰입할 수 있는 완성도 높은 단편 소설을 창작해야 합니다.

${getNarrativeSummaryGuidance('fairytale', false)}

${getCreativeTransformationGuidance(false)}

**2단계: 데이터 분석 및 관계성 부여:**

* 일기 7개에 등장하는 핵심 사건, 감정, 인물을 분석하여 플롯의 연속성과 인과관계를 설정하세요.
* 일기 1일차의 단순한 순간들이 7일차 결말의 의미 있는 교훈이 되도록 치밀하게 연결하세요.
* 감정 태그를 활용하여 감정의 여정을 추적하세요: 감정이 어떻게 진화하는지, 그리고 이 감정적 궤적이 동화의 발전에 어떤 영향을 미치는지 분석하세요.

**3단계: 장르 및 스타일:**

* **선택 장르:** 동화
* **주인공 및 시점:** 주인공은 "나"이며, 소설 전체를 1인칭 시점으로 작성하세요. 일기에 언급된 인물들을 등장인물로 사용하세요.
* **스타일 지침:** 일기 속 사건과 감정을 밝고 따뜻한 동화로 발전시키고, 마법적 모험의 진행을 그려내며, 의미 있는 스토리텔링을 통해 인물의 깊이를 드러내는 플롯을 구성해야 합니다. 문체는 밝고 상상력이 풍부하며, 따뜻하고 풍부한 묘사가 있어야 합니다. 마법적 요소와 교훈을 자연스럽게 녹여내고, "나"와 주변 인물들의 성장과 우정, 따뜻한 순간들을 생생하게 그려내세요.

**4단계: 출력 조건:**

* 길이는 최소 2,000자 이상, 최대 4,000자 이내입니다.
* 소설 제목을 반드시 포함해야 합니다.
* 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 이야기로 이어지게 해주세요.

**5단계: 일기 내용 (입력 데이터):**

아래는 한 주간의 일기입니다. 이 일기들을 분석하여 핵심 사건, 감정, 인물을 추출하고, 이를 서사적 관계성과 자연스러운 연속성을 가진 동화로 변환하세요.
${diaryInfoSection}
[일기 내용]
${diaryContents}

**6단계: 소설 시작:**

${COMMON_SECTIONS.responseStructure.ko}

먼저 서사 요약표를 작성한 후, 일기 데이터를 바탕으로 서사적 관계성과 자연스러운 연속성을 가진 동화를 작성하세요. 주인공은 "나"이며 1인칭 시점으로, 일기에 언급된 인물들을 등장인물로 사용하세요. 상상력과 교훈, 따뜻한 분위기, 인물 간의 대화와 내면 묘사를 적극적으로 활용해 주세요.`,
            titlePrompt: `다음 동화를 자세히 읽고, 이야기의 본질, 마법적 요소, 따뜻한 순간들을 담은 가장 어울리는 제목 하나만 추천해줘. 제목은 매력적이고 기억에 남으며, 소설 내용과 직접적으로 연관되어야 해. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A cute, adorable fairy tale illustration in soft pastel colors. The illustration should be directly related to the story content, featuring key characters, magical elements, or important scenes from the story. Use gentle, warm colors like soft pink, light blue, pale yellow, and lavender. The style should be charming and whimsical, like a children's book illustration. Include friendly characters, magical elements, or symbolic objects that represent the story. No text, no scary elements, no violence.`
        };
    }
}

// 판타지 장르 프롬프트
function getFantasyPrompts(diaryContents, novelContent, isEnglish, diaryInfoSection) {
    if (isEnglish) {
        return {
            contentPrompt: `You are a professional fantasy novelist with exceptional storytelling and analytical abilities. Your task is to analyze the week-long diary entries below and create a high-quality fantasy novel that readers can immerse themselves in.

${getNarrativeSummaryGuidance('fantasy', true)}

${getCreativeTransformationGuidance(true)}

**STEP 2: Data Analysis and Narrative Cohesion:**

* Analyze the core events, emotions, and characters that appear in the 7 diary entries to establish plot continuity and causality.
* Connect the ordinary moments from Day 1 to become magical adventures in Day 7's climax, creating a meticulously woven narrative in a rich fantasy world.
* Track the emotional journey using the emotion tags: analyze how emotions evolve and how this emotional trajectory influences the fantasy narrative's development.

**STEP 3: Genre and Style:**

* **Selected Genre:** Fantasy Novel
* **Protagonist and Perspective:** The protagonist is "I" (first person). Write the entire story from the first-person perspective. Use the characters mentioned in the diary entries as they appear.
* **Style Guidelines:** Transform the events and emotions from the diary entries into a rich fantasy world. Develop the progression of magical elements, create mysterious beings and adventures, and reveal the depth of the fantasy world through powerful narrative revelations. The writing style should be immersive with rich world-building and magical descriptions. Consistently build the rules and magic system of the fantasy world, and dynamically portray "I"'s adventures, growth, and relationships with surrounding characters.

**STEP 4: Output Requirements:**

* Length: Minimum 2,000 characters, maximum 4,000 characters.
* Do NOT include a novel title in the story content. Write only the story itself.
* The novel should be structured as one continuous, natural story without separating introduction/body/conclusion.

**STEP 5: Diary Content (Input Data):**

Below is a week of diary entries. Analyze these entries to extract core events, emotions, and characters, then transform them into a cohesive fantasy novel with strong narrative continuity.
${diaryInfoSection}
[Diary entries]
${diaryContents}

**STEP 6: Begin the novel:**

${COMMON_SECTIONS.responseStructure.en}

First, create the narrative summary table, then write a fantasy novel that transforms the diary entries into a cohesive narrative with strong plot continuity and natural flow. The protagonist is "I" (first person), and use the characters mentioned in the diary entries as they appear. Feature a rich world, magic, mysterious beings, and adventures.`,
            titlePrompt: `Read the following fantasy novel carefully and suggest only one most fitting title in English that captures the essence, magical world, and key adventures of the story. The title should be mysterious, memorable, and directly related to the story's content. Do not include any explanation, only the title.

[Novel Content]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A dreamy, magical fantasy landscape with bright colors and gentle light. No creatures, no people, no violence, no text.`
        };
    } else {
        return {
            contentPrompt: `당신은 최고 수준의 스토리텔링 능력을 갖춘 전문 소설가이자 분석가입니다. 아래의 일주일 일기 데이터를 분석하여, 독자가 몰입할 수 있는 완성도 높은 단편 소설을 창작해야 합니다.

${getNarrativeSummaryGuidance('fantasy', false)}

${getCreativeTransformationGuidance(false)}

**2단계: 데이터 분석 및 관계성 부여:**

* 일기 7개에 등장하는 핵심 사건, 감정, 인물을 분석하여 플롯의 연속성과 인과관계를 설정하세요.
* 일기 1일차의 평범한 순간들이 7일차 판타지 클라이맥스의 마법적 모험이 되도록 치밀하게 연결하세요.
* 감정 태그를 활용하여 감정의 여정을 추적하세요: 감정이 어떻게 진화하는지, 그리고 이 감정적 궤적이 판타지 서사의 발전에 어떤 영향을 미치는지 분석하세요.

**3단계: 장르 및 스타일:**

* **선택 장르:** 판타지 소설
* **주인공 및 시점:** 주인공은 "나"이며, 소설 전체를 1인칭 시점으로 작성하세요. 일기에 언급된 인물들을 등장인물로 사용하세요.
* **스타일 지침:** 일기 속 사건과 감정을 풍부한 판타지 세계로 발전시키고, 마법적 요소의 진행을 그려내며, 강력한 서사적 계시를 통해 판타지 세계의 깊이를 드러내는 플롯을 구성해야 합니다. 문체는 몰입감 있게, 풍부한 세계관 구축과 마법적 묘사가 있어야 합니다. 판타지 세계의 규칙과 마법 시스템을 일관되게 구축하고, "나"의 모험과 성장, 주변 인물들과의 관계를 역동적으로 그려내세요.

**4단계: 출력 조건:**

* 길이는 최소 2,000자 이상, 최대 4,000자 이내입니다.
* 소설 제목은 포함하지 마세요. 소설 본문만 작성하세요.
* 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

**5단계: 일기 내용 (입력 데이터):**

아래는 한 주간의 일기입니다. 이 일기들을 분석하여 핵심 사건, 감정, 인물을 추출하고, 이를 서사적 관계성과 자연스러운 연속성을 가진 판타지 소설로 변환하세요.
${diaryInfoSection}
[일기 내용]
${diaryContents}

**6단계: 소설 시작:**

${COMMON_SECTIONS.responseStructure.ko}

먼저 서사 요약표를 작성한 후, 일기 데이터를 바탕으로 서사적 관계성과 자연스러운 연속성을 가진 판타지 소설을 작성하세요. 주인공은 "나"이며 1인칭 시점으로, 일기에 언급된 인물들을 등장인물로 사용하세요. 세계관, 마법, 신비로운 존재, 모험, 인물 간의 관계와 대화, 내면 묘사가 풍부하게 드러나도록 해주세요.`,
            titlePrompt: `다음 판타지 소설을 자세히 읽고, 이야기의 본질, 마법적 세계, 핵심 모험을 담은 가장 어울리는 제목 하나만 추천해줘. 제목은 신비롭고 기억에 남으며, 소설 내용과 직접적으로 연관되어야 해. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A dreamy, magical fantasy landscape with bright colors and gentle light. No creatures, no people, no violence, no text.`
        };
    }
}

// 공포 장르 프롬프트
function getHorrorPrompts(diaryContents, novelContent, isEnglish, diaryInfoSection) {
    if (isEnglish) {
        return {
            contentPrompt: `You are a professional horror novelist with exceptional storytelling and analytical abilities. Your task is to analyze the week-long diary entries below and create a high-quality psychological horror novel that readers can immerse themselves in.

${getNarrativeSummaryGuidance('horror', true)}

${getCreativeTransformationGuidance(true)}

**STEP 2: Data Analysis and Narrative Cohesion:**

* Analyze the core events, emotions, and characters that appear in the 7 diary entries to establish plot continuity and causality.
* Connect the subtle unease and strange moments from Day 1 to become terrifying revelations in Day 7's climax, creating a meticulously woven narrative of psychological horror.
* Track the emotional journey using the emotion tags: analyze how emotions evolve and how this emotional trajectory influences the horror narrative's development, especially focusing on negative emotions like fear, unease, and anxiety.

**STEP 3: Genre and Style:**

* **Selected Genre:** Horror Novel
* **Protagonist and Perspective:** The protagonist is "I" (first person). Write the entire story from the first-person perspective. Use the characters mentioned in the diary entries as they appear.
* **Style Guidelines:** Transform the events and emotions from the diary entries into a psychological horror story. Develop the progression of tension and unease, create subtle supernatural hints, and reveal hidden fears through powerful psychological revelations. The writing style should focus on tension, unease, and atmosphere rather than gore. Avoid explicit violence, blood, ghosts, or corpses. Use strange memories, odd behaviors, subtle supernatural hints, dialogues, and inner monologues. Vividly portray "I"'s fear, anxiety, and suspicion, and heighten tension through the strange behaviors or changes of surrounding characters.

**STEP 4: Output Requirements:**

* Length: Minimum 2,000 characters, maximum 4,000 characters.
* Do NOT include a novel title in the story content. Write only the story itself.
* The novel should be structured as one continuous, natural story without separating introduction/body/conclusion.

**STEP 5: Diary Content (Input Data):**

Below is a week of diary entries. Analyze these entries to extract core events, emotions, and characters, then transform them into a cohesive horror novel with strong narrative continuity.
${diaryInfoSection}
[Diary entries]
${diaryContents}

**STEP 6: Begin the novel:**

${COMMON_SECTIONS.responseStructure.en}

First, create the narrative summary table, then write a psychological horror novel that transforms the diary entries into a cohesive narrative with strong plot continuity and natural flow. The protagonist is "I" (first person), and use the characters mentioned in the diary entries as they appear. Focus on tension, unease, and atmosphere, vividly portraying "I"'s fear, anxiety, and suspicion.`,
            titlePrompt: `Read the following horror novel carefully and suggest only one most fitting title in English that captures the essence, psychological tension, and key mysterious elements of the story. The title should be atmospheric, memorable, and directly related to the story's content. Do not include any explanation, only the title.

[Novel Content]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A calm, atmospheric illustration with subtle shadows and soft colors. No scary elements, no people, no violence, no text.`
        };
    } else {
        return {
            contentPrompt: `당신은 최고 수준의 스토리텔링 능력을 갖춘 전문 소설가이자 분석가입니다. 아래의 일주일 일기 데이터를 분석하여, 독자가 몰입할 수 있는 완성도 높은 단편 소설을 창작해야 합니다.

${getNarrativeSummaryGuidance('horror', false)}

${getCreativeTransformationGuidance(false)}

**2단계: 데이터 분석 및 관계성 부여:**

* 일기 7개에 등장하는 핵심 사건, 감정, 인물을 분석하여 플롯의 연속성과 인과관계를 설정하세요.
* 일기 1일차의 미묘한 불안과 이상한 순간들이 7일차 공포 클라이맥스의 무서운 계시가 되도록 치밀하게 연결하세요.
* 감정 태그를 활용하여 감정의 여정을 추적하세요: 감정이 어떻게 진화하는지, 그리고 이 감정적 궤적이 공포 서사의 발전에 어떤 영향을 미치는지 분석하세요. 특히 두려움, 불안, 불안감 같은 부정적 감정에 집중하세요.

**3단계: 장르 및 스타일:**

* **선택 장르:** 공포 소설
* **주인공 및 시점:** 주인공은 "나"이며, 소설 전체를 1인칭 시점으로 작성하세요. 일기에 언급된 인물들을 등장인물로 사용하세요.
* **스타일 지침:** 일기 속 사건과 감정을 심리적 공포 이야기로 발전시키고, 긴장과 불안의 진행을 그려내며, 강력한 심리적 계시를 통해 숨겨진 공포를 드러내는 플롯을 구성해야 합니다. 문체는 긴장감, 불안, 분위기에 집중해야 하며, 직접적인 폭력, 피, 유령, 시체 등은 피하고, 심리적 공포와 분위기, 내면 묘사에 집중해 주세요. 정체불명의 존재, 이상한 기억의 공백, 반복되는 꿈, 사진 속 괴이한 형체, 이상한 말투 등 공포 요소를 자유롭게 활용해 주세요. 배경은 일상적일수록 좋지만, 점점 이상한 기운이나 초자연적 사건이 드러나도록 구성해 주세요. "나"의 두려움과 불안, 의심을 생생하게 그려내고, 주변 인물들의 이상한 행동이나 변화를 통해 긴장감을 높이세요.

**4단계: 출력 조건:**

* 길이는 최소 2,000자 이상, 최대 4,000자 이내입니다.
* 소설 제목은 포함하지 마세요. 소설 본문만 작성하세요.
* 구성은 서론/본론/결말 등 구분 없이, 자연스럽게 한 편의 소설로 이어지게 해주세요.

**5단계: 일기 내용 (입력 데이터):**

아래는 한 주간의 일기입니다. 이 일기들을 분석하여 핵심 사건, 감정, 인물을 추출하고, 이를 서사적 관계성과 자연스러운 연속성을 가진 공포 소설로 변환하세요.
${diaryInfoSection}
[일기 내용]
${diaryContents}

**6단계: 소설 시작:**

${COMMON_SECTIONS.responseStructure.ko}

먼저 서사 요약표를 작성한 후, 일기 데이터를 바탕으로 서사적 관계성과 자연스러운 연속성을 가진 공포 소설을 작성하세요. 주인공은 "나"이며 1인칭 시점으로, 일기에 언급된 인물들을 등장인물로 사용하세요. 심리적 긴장감, 불안, 이상함, 인물의 내면 변화와 대화, 분위기 묘사가 풍부하게 드러나도록 해주세요.`,
            titlePrompt: `다음 공포 소설을 자세히 읽고, 이야기의 본질, 심리적 긴장감, 핵심 미스터리 요소를 담은 가장 어울리는 제목 하나만 추천해줘. 제목은 분위기 있고 기억에 남으며, 소설 내용과 직접적으로 연관되어야 해. 설명 없이 제목만 말해줘.

[소설 내용]
${novelContent?.substring(0, 2000)}`,
            imagePrompt: `A calm, atmospheric illustration with subtle shadows and soft colors. No scary elements, no people, no violence, no text.`
        };
    }
}

// 메인 함수: 장르에 따라 적절한 프롬프트 반환
function getPrompts(genre, diaryContents, novelContent, lang, diaryData = null) {
    const isEnglish = lang === 'en';

    // 감정 매핑
    const emotionMap = {
        'love': isEnglish ? 'Very happy' : '완전행복',
        'good': isEnglish ? 'Good' : '기분좋음',
        'normal': isEnglish ? 'Normal' : '평범함',
        'surprised': isEnglish ? 'Surprised' : '놀람',
        'angry': isEnglish ? 'Angry' : '화남',
        'cry': isEnglish ? 'Sad' : '슬픔',
    };

    // 일기 데이터를 구조화된 형식으로 변환
    let structuredDiaryInfo = '';
    if (diaryData && Array.isArray(diaryData) && diaryData.length > 0) {
        structuredDiaryInfo = diaryData.map((diary, index) => {
            const dayNum = index + 1;
            const emotionText = diary.emotion ? emotionMap[diary.emotion] || diary.emotion : (isEnglish ? 'Not specified' : '미지정');
            const dateText = diary.date || `Day ${dayNum}`;
            return `**Day ${dayNum} (${dateText}):**
- Emotion: ${emotionText}
- Content: ${diary.content || ''}`;
        }).join('\n\n');
    }

    const diaryInfoSection = structuredDiaryInfo ? (isEnglish
        ? `\n\n**Structured Diary Data with Emotions:**\n${structuredDiaryInfo}\n\n`
        : `\n\n**구조화된 일기 데이터 (감정 포함):**\n${structuredDiaryInfo}\n\n`) : '';

    // 장르별 프롬프트 반환
    switch (genre) {
        case '로맨스':
            return getRomancePrompts(diaryContents, novelContent, isEnglish, diaryInfoSection);
        case '추리':
            return getMysteryPrompts(diaryContents, novelContent, isEnglish, diaryInfoSection);
        case '역사':
            return getHistoricalPrompts(diaryContents, novelContent, isEnglish, diaryInfoSection);
        case '동화':
            return getFairytalePrompts(diaryContents, novelContent, isEnglish, diaryInfoSection);
        case '판타지':
            return getFantasyPrompts(diaryContents, novelContent, isEnglish, diaryInfoSection);
        case '공포':
            return getHorrorPrompts(diaryContents, novelContent, isEnglish, diaryInfoSection);
        default:
            // 정의되지 않은 장르는 에러 발생
            throw new Error(`Unsupported genre: ${genre}. Supported genres are: 로맨스, 추리, 역사, 동화, 판타지, 공포`);
    }
}

module.exports = {
    getPrompts,
    getNarrativeSummaryGuidance,
    COMMON_SECTIONS
};

