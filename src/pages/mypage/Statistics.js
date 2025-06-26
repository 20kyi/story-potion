import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function Statistics({ user }) {
    const navigate = useNavigate();
    const [diaryCount, setDiaryCount] = useState(0);
    const [novelCount, setNovelCount] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            // 1. 총 일기 수
            const diariesRef = collection(db, 'diaries');
            const diariesQ = query(diariesRef, where('userId', '==', user.uid));
            const diariesSnap = await getDocs(diariesQ);
            setDiaryCount(diariesSnap.size);

            // 2. 총 소설 수
            const novelsRef = collection(db, 'novels');
            const novelsQ = query(novelsRef, where('userId', '==', user.uid));
            const novelsSnap = await getDocs(novelsQ);
            setNovelCount(novelsSnap.size);

            // 3. 연속 작성일 계산
            const diaryDates = diariesSnap.docs.map(doc => doc.data().date).filter(Boolean).sort();
            let maxStreak = 0, currentStreak = 0, prevDate = null;
            for (let dateStr of diaryDates) {
                const date = new Date(dateStr);
                if (prevDate) {
                    const diff = (date - prevDate) / (1000 * 60 * 60 * 24);
                    if (diff === 1) {
                        currentStreak += 1;
                    } else if (diff > 1) {
                        currentStreak = 1;
                    }
                } else {
                    currentStreak = 1;
                }
                if (currentStreak > maxStreak) maxStreak = currentStreak;
                prevDate = date;
            }
            setMaxStreak(maxStreak);
            setLoading(false);
        };
        fetchData();
    }, [user]);

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, paddingTop: 40, minHeight: '100vh', paddingBottom: 120 }}>
                <h2 style={{ color: '#e46262', marginBottom: 32, textAlign: 'center', fontWeight: 600 }}>내 통계</h2>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>로딩 중...</div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: 16 }}>
                            지금까지 당신이 남긴 소중한 하루의 기록은 <br /> {diaryCount}개예요.
                        </li>
                        <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: 16 }}>
                            당신의 상상으로 완성된 이야기는 <br /> {novelCount}개예요.
                        </li>
                        <li style={{ borderBottom: '1px solid #f1f1f1', padding: '18px 0', fontWeight: 400, fontSize: 16 }}>
                            가장 오래 연속으로 마음을 기록한 날은 <br /> {maxStreak}일이에요.
                        </li>
                    </ul>
                )}
            </div>
        </>
    );
}

export default Statistics; 