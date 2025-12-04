import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../theme';
import { useTranslation } from '../../LanguageContext';
import { getAppTutorialNovel, getNovelCreationTutorialNovel } from '../../utils/tutorialNovel';
import { createNovelUrl } from '../../utils/novelUtils';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const SettingsContainer = styled.div`
  max-width: 600px;
  margin-top: 70px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  padding: 20px;
  background: transparent;
  min-height: 500px;
`;

const SettingsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SettingsItem = styled.li`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 18px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 400;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'};
  }
  
  &:active {
    background-color: ${({ theme }) => theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
  }
`;

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`;

const TutorialCover = styled.img`
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex-shrink: 0;
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.span`
  font-weight: 600;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  font-family: inherit;
  word-break: keep-all;
  overflow-wrap: break-word;
`;

const ItemDescription = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.subText || '#888'};
  font-weight: 400;
  font-family: inherit;
  line-height: 1.4;
  word-break: keep-all;
  overflow-wrap: break-word;
`;

const ArrowIcon = styled.span`
  font-size: 20px;
  color: ${({ theme }) => theme.subText || '#888'};
  flex-shrink: 0;
`;

function TutorialList({ user }) {
    const navigate = useNavigate();
    const { actualTheme } = useTheme();
    const theme = actualTheme === 'dark' ? darkTheme : lightTheme;
    const { t } = useTranslation();
    const [userCreatedAt, setUserCreatedAt] = useState(null);

    // 사용자 가입일 가져오기
    useEffect(() => {
        if (user?.uid) {
            const fetchUserCreatedAt = async () => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserCreatedAt(userData.createdAt || null);
                    }
                } catch (error) {
                    console.error('사용자 가입일 조회 실패:', error);
                }
            };
            fetchUserCreatedAt();
        }
    }, [user]);

    const handleTutorialClick = (tutorialType) => {
        if (!userCreatedAt) return;

        let tutorialNovel;
        if (tutorialType === 'app') {
            tutorialNovel = getAppTutorialNovel(userCreatedAt);
        } else if (tutorialType === 'novel') {
            tutorialNovel = getNovelCreationTutorialNovel(userCreatedAt);
        } else {
            return;
        }

        navigate(`/novel/${createNovelUrl(tutorialNovel.year, tutorialNovel.month, tutorialNovel.weekNum, tutorialNovel.genre, tutorialNovel.id)}?userId=${tutorialNovel.userId}`, {
            state: { tutorialNovel, returnPath: '/my/tutorial' }
        });
    };

    const appTutorial = userCreatedAt ? getAppTutorialNovel(userCreatedAt) : null;
    const novelTutorial = userCreatedAt ? getNovelCreationTutorialNovel(userCreatedAt) : null;

    return (
        <>
            <Header user={user} title={t('tutorial_again') || '튜토리얼 다시 보기'} />
            <SettingsContainer theme={theme}>
                <SettingsList>
                    {appTutorial && (
                        <SettingsItem
                            theme={theme}
                            onClick={() => handleTutorialClick('app')}
                        >
                            <ItemContent>
                                <TutorialCover
                                    src={appTutorial.imageUrl || '/bookcover.png'}
                                    alt={appTutorial.title}
                                />
                                <ItemInfo>
                                    <ItemTitle theme={theme}>{appTutorial.title}</ItemTitle>
                                    <ItemDescription theme={theme}>
                                        {t('tutorial_app_desc') || '앱의 기본 사용법을 알아보세요'}
                                    </ItemDescription>
                                </ItemInfo>
                            </ItemContent>
                            <ArrowIcon theme={theme}>›</ArrowIcon>
                        </SettingsItem>
                    )}

                    {novelTutorial && (
                        <SettingsItem
                            theme={theme}
                            onClick={() => handleTutorialClick('novel')}
                        >
                            <ItemContent>
                                <TutorialCover
                                    src={novelTutorial.imageUrl || '/bookcover2.png'}
                                    alt={novelTutorial.title}
                                />
                                <ItemInfo>
                                    <ItemTitle theme={theme}>{novelTutorial.title}</ItemTitle>
                                    <ItemDescription theme={theme}>
                                        {t('tutorial_novel_desc') || '일기를 소설로 만드는 방법을 알아보세요'}
                                    </ItemDescription>
                                </ItemInfo>
                            </ItemContent>
                            <ArrowIcon theme={theme}>›</ArrowIcon>
                        </SettingsItem>
                    )}
                </SettingsList>
            </SettingsContainer>
            <Navigation />
        </>
    );
}

export default TutorialList;

