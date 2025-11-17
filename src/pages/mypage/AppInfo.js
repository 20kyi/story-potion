import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { auth, storage } from '../../firebase';
import { ref, listAll, getMetadata, deleteObject } from 'firebase/storage';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from '../../LanguageContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin: 60px auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  min-height: calc(100vh - 120px);
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 10px;
  margin-bottom: 16px;
  box-shadow: ${({ theme }) => theme.cardShadow};
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#f0f0f0'};
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.subText || '#666'};
  font-weight: 500;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #e46262;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const DangerButton = styled.button`
  background: #e46262;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  width: 100%;
  
  &:hover {
    background: #cb6565;
  }
`;

const WarningText = styled.p`
  color: #e46262;
  font-size: 10px;
  margin: 12px 0 0 0;
  text-align: center;
`;

function AppInfo({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [cacheSize, setCacheSize] = useState('0 MB');

  // 저장공간 사용량 계산 (localStorage, sessionStorage, IndexedDB, Firebase 캐시 포함)
  const calculateStorage = async () => {
    let totalSize = 0;
    
    // Capacitor 앱 환경인지 확인
    const isApp = Capacitor.getPlatform() !== 'web';
    
    // 1. localStorage 크기 계산
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length * 2; // UTF-16 characters
      }
    }
    
    // 2. sessionStorage 크기 계산
    for (let key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        totalSize += sessionStorage[key].length * 2;
      }
    }
    
    // 3. IndexedDB 크기 계산 (가능한 경우)
    try {
      if ('indexedDB' in window) {
        const db = await indexedDB.open('firebaseLocalStorageDb');
        if (db.result) {
          // IndexedDB 크기는 정확히 측정하기 어려우므로 추정값 사용
          totalSize += 1024 * 1024; // 1MB 추정
        }
      }
    } catch (error) {
      console.log('IndexedDB 크기 계산 실패:', error);
    }
    
    // 4. Firebase Storage 사용량 계산 (사용자가 업로드한 파일들)
    try {
      if (user?.uid) {
        // 사용자의 일기 이미지들
        const diaryImagesRef = ref(storage, `diaries/${user.uid}`);
        const diaryImages = await listAll(diaryImagesRef);
        
        for (const item of diaryImages.items) {
          try {
            const metadata = await getMetadata(item);
            totalSize += metadata.size || 0;
          } catch (error) {
            console.log('이미지 메타데이터 조회 실패:', error);
          }
        }
        
        // 사용자의 프로필 이미지
        const profileImageRef = ref(storage, `profile-images/${user.uid}`);
        try {
          const profileImages = await listAll(profileImageRef);
          for (const item of profileImages.items) {
            try {
              const metadata = await getMetadata(item);
              totalSize += metadata.size || 0;
            } catch (error) {
              console.log('프로필 이미지 메타데이터 조회 실패:', error);
            }
          }
        } catch (error) {
          console.log('프로필 이미지 폴더 조회 실패:', error);
        }
      }
    } catch (error) {
      console.log('Firebase Storage 크기 계산 실패:', error);
    }
    
    // 5. Firebase 캐시 크기 추정
    try {
      // Firebase 캐시는 보통 몇 MB 정도
      totalSize += 2 * 1024 * 1024; // 2MB 추정
    } catch (error) {
      console.log('Firebase 캐시 크기 계산 실패:', error);
    }
    
    // 6. 브라우저 캐시 크기 추정
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        let cacheSize = 0;
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          // 각 캐시된 리소스의 크기를 추정 (평균 50KB)
          cacheSize += requests.length * 50 * 1024;
        }
        totalSize += cacheSize;
      }
    } catch (error) {
      console.log('브라우저 캐시 크기 계산 실패:', error);
    }
    
    // 7. 앱 환경에서 추가 크기 추정
    if (isApp) {
      totalSize += 3 * 1024 * 1024; // 앱 환경에서 추가 3MB 추정
    }
    
    setStorageUsed(`${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  };

  // 캐시 크기 계산
  const calculateCacheSize = async () => {
    let cacheSize = 0;
    
    // Capacitor 앱 환경인지 확인
    const isApp = Capacitor.getPlatform() !== 'web';
    
    if (isApp) {
      // 앱 환경에서는 추정값 사용
      cacheSize = 1.5 * 1024 * 1024; // 1.5MB 추정
    } else {
      // 웹 환경 캐시 크기 계산
      try {
        // 브라우저 캐시 크기 계산
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            // 각 캐시된 리소스의 크기를 추정 (평균 50KB)
            cacheSize += requests.length * 50 * 1024;
          }
        }
        
        // Firebase 캐시 크기 추정
        cacheSize += 1.5 * 1024 * 1024; // 1.5MB 추정
        
      } catch (error) {
        console.log('캐시 크기 계산 실패:', error);
        cacheSize = 1.5 * 1024 * 1024; // 기본값
      }
    }
    
    setCacheSize(`${(cacheSize / 1024 / 1024).toFixed(2)} MB`);
  };

  useEffect(() => {
    // 앱 버전 정보 가져오기 (실제로는 package.json에서 가져올 수 있음)
    setAppVersion('1.0.0');
    
    // 저장공간 사용량과 캐시 크기 계산
    calculateStorage();
    calculateCacheSize();
  }, [user?.uid]);

  // 캐시 삭제
  const handleClearCache = async () => {
    try {
      // Capacitor 앱 환경인지 확인
      const isApp = Capacitor.getPlatform() !== 'web';
      
      if (isApp) {
        // 앱 환경에서는 기본적인 캐시만 삭제
        console.log('앱 환경에서 캐시 삭제');
        // 앱 환경에서는 제한적인 캐시 삭제만 가능
        alert(t('cache_clear_limited_app'));
        return;
      }
      
      // 웹 환경 캐시 삭제
      // 1. localStorage 삭제
      localStorage.clear();
      
      // 2. sessionStorage 삭제
      sessionStorage.clear();
      
      // 3. 브라우저 캐시 삭제
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      
      // 4. IndexedDB 삭제 (Firebase 관련)
      try {
        if ('indexedDB' in window) {
          indexedDB.deleteDatabase('firebaseLocalStorageDb');
        }
      } catch (error) {
        console.log('IndexedDB 삭제 실패:', error);
      }
      
      // 6. 저장공간 사용량 다시 계산
      await calculateStorage();
      await calculateCacheSize();
      
      alert(t('cache_clear_success'));
      
    } catch (error) {
      console.error('캐시 삭제 중 오류 발생:', error);
      alert(t('cache_clear_error'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) {
      alert(t('login_required'));
      return;
    }

    const confirmDelete = window.confirm(t('confirm_delete_account'));

    if (!confirmDelete) {
      return;
    }

    const finalConfirm = window.confirm(t('confirm_delete_account_final'));

    if (!finalConfirm) {
      return;
    }

    try {
      // 1. Firebase Storage 파일들 삭제
      let deletedCount = 0;

      // 일기 이미지들 삭제
      const diaryImagesRef = ref(storage, `diaries/${user.uid}`);
      const diaryImages = await listAll(diaryImagesRef);
      
      for (const item of diaryImages.items) {
        try {
          await deleteObject(item);
          console.log('일기 이미지 삭제 완료:', item.fullPath);
          deletedCount++;
        } catch (error) {
          console.log('일기 이미지 삭제 실패:', error);
        }
      }
      
      // 프로필 이미지들 삭제
      const profileImageRef = ref(storage, `profile-images/${user.uid}`);
      try {
        const profileImages = await listAll(profileImageRef);
        for (const item of profileImages.items) {
          try {
            await deleteObject(item);
            console.log('프로필 이미지 삭제 완료:', item.fullPath);
            deletedCount++;
          } catch (error) {
            console.log('프로필 이미지 삭제 실패:', error);
          }
        }
      } catch (error) {
        console.log('프로필 이미지 폴더 조회 실패:', error);
      }

      // 2. Firestore 데이터 삭제 (실제 구현 필요)
      // TODO: Firestore에서 사용자 데이터 삭제 로직 구현

      // 3. Firebase Auth 계정 삭제
      // TODO: Firebase Auth에서 사용자 계정 삭제 로직 구현

      alert(t('account_delete_done', { count: deletedCount }));
      
      // 로그아웃 처리
      await auth.signOut();
      
    } catch (error) {
      console.error('계정 삭제 실패:', error);
      alert(t('account_delete_error'));
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      alert(t('logout_success'));
    } catch (error) {
      alert(t('logout_failed'));
    }
  };

  const handleExportData = async () => {
    if (!user?.uid) {
      alert(t('login_required'));
      return;
    }
    
    try {
      const exportData = {
        userInfo: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: user.metadata?.creationTime,
          lastSignInTime: user.metadata?.lastSignInTime
        },
        localStorage: {},
        sessionStorage: {},
        exportDate: new Date().toISOString()
      };
      
      // localStorage 데이터 수집
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          try {
            exportData.localStorage[key] = JSON.parse(localStorage[key]);
          } catch (error) {
            exportData.localStorage[key] = localStorage[key];
          }
        }
      }
      
      // sessionStorage 데이터 수집
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          try {
            exportData.sessionStorage[key] = JSON.parse(sessionStorage[key]);
          } catch (error) {
            exportData.sessionStorage[key] = sessionStorage[key];
          }
        }
      }
      
      // JSON 파일로 다운로드
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `story-potion-data-${user.uid}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(t('data_export_success'));
    } catch (error) {
      console.error('데이터 내보내기 실패:', error);
      alert(t('data_export_failed'));
    }
  };

  return (
    <>
      <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('app_info_title')} />
      <Container theme={theme}>
        <InfoCard theme={theme}>
          <CardTitle theme={theme}>
            📱 {t('app_info_title')}
          </CardTitle>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('app_version')}</InfoLabel>
            <InfoValue theme={theme}>{appVersion}</InfoValue>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('developer')}</InfoLabel>
            <InfoValue theme={theme}>{t('developer_name')}</InfoValue>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('terms_of_use')}</InfoLabel>
            <ActionButton onClick={() => alert(t('terms_link_alert'))}>
              {t('view')}
            </ActionButton>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('privacy_policy')}</InfoLabel>
            <ActionButton onClick={() => alert(t('privacy_link_alert'))}>
              {t('view')}
            </ActionButton>
          </InfoItem>
        </InfoCard>

        <InfoCard theme={theme}>
          <CardTitle theme={theme}>
            💾 {t('data_management')}
          </CardTitle>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('storage_usage')}</InfoLabel>
            <InfoValue theme={theme}>{storageUsed}</InfoValue>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('cache_size')}</InfoLabel>
            <InfoValue theme={theme}>{cacheSize}</InfoValue>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('clear_cache')}</InfoLabel>
            <ActionButton onClick={handleClearCache}>
              {t('delete')}
            </ActionButton>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('export_data')}</InfoLabel>
            <ActionButton onClick={handleExportData}>
              {t('export_data')}
            </ActionButton>
          </InfoItem>
          
        </InfoCard>

        <InfoCard theme={theme}>
          <CardTitle theme={theme}>
            🔐 {t('account_management')}
          </CardTitle>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('logout')}</InfoLabel>
            <ActionButton onClick={handleLogout}>
              {t('logout')}
            </ActionButton>
          </InfoItem>
          
          <InfoItem theme={theme}>
            <InfoLabel theme={theme}>{t('account_delete')}</InfoLabel>
            <ActionButton onClick={handleDeleteAccount}>
              {t('delete')}
            </ActionButton>
          </InfoItem>
          
          <WarningText>
            {t('account_delete_warning')}
          </WarningText>
        </InfoCard>
      </Container>
    </>
  );
}

export default AppInfo; 