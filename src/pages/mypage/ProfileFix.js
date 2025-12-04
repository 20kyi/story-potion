import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import {
    checkGoogleUserProfiles,
    forceUpdateGoogleUserProfiles,
    updateGoogleProfilesByEmail
} from '../../utils/fixGoogleProfiles';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 16px;
  margin-top: 70px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  background: transparent;
  color: ${({ theme }) => theme.text};
`;

const Section = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.text};
`;

const Button = styled.button`
  background: #e46262;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 12px;
  margin-bottom: 12px;
  width: 100%;

  &:hover {
    background: #d45555;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const InfoText = styled.div`
  color: ${({ theme }) => theme.subText || '#666'};
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const StatusText = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  margin-top: 12px;
  padding: 12px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  max-height: 300px;
  overflow-y: auto;
`;

const LoadingText = styled.div`
  color: #e46262;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;

function ProfileFix({ user }) {
    const theme = useTheme();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');

    const handleCheckGoogleProfiles = async () => {
        setIsLoading(true);
        setStatus('구글 사용자 프로필 상태를 확인하는 중...');

        try {
            const result = await checkGoogleUserProfiles();
            if (result.success) {
                setStatus(`✅ 확인 완료!\n\n📊 구글 사용자 현황:\n- 총 구글 사용자: ${result.totalGoogleUsers}명\n- 프로필 사진 있음: ${result.hasProfileImage}명\n- 기본 이미지: ${result.hasDefaultImage}명\n- 이미지 없음: ${result.noImage}명\n\n⚠️ 문제가 있는 사용자: ${result.problematicUsers}명`);
                toast.showToast('구글 사용자 프로필 상태 확인 완료', 'success');
            } else {
                setStatus(`❌ 확인 실패: ${result.message}`);
                toast.showToast('확인에 실패했습니다', 'error');
            }
        } catch (error) {
            setStatus(`❌ 오류 발생: ${error.message}`);
            toast.showToast('오류가 발생했습니다', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForceUpdateProfiles = async () => {
        setIsLoading(true);
        setStatus('구글 사용자 프로필을 강제로 업데이트하는 중...');

        try {
            const result = await forceUpdateGoogleUserProfiles();
            if (result.success) {
                setStatus(`✅ 강제 업데이트 완료!\n\n📊 결과:\n- 총 구글 사용자: ${result.totalGoogleUsers}명\n- 업데이트된 사용자: ${result.updatedCount}명\n\n${result.message}`);
                toast.showToast('프로필 강제 업데이트 완료', 'success');
            } else {
                setStatus(`❌ 업데이트 실패: ${result.message}`);
                toast.showToast('업데이트에 실패했습니다', 'error');
            }
        } catch (error) {
            setStatus(`❌ 오류 발생: ${error.message}`);
            toast.showToast('오류가 발생했습니다', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateByEmail = async () => {
        setIsLoading(true);
        setStatus('이메일 기반으로 구글 사용자 프로필을 업데이트하는 중...');

        try {
            const result = await updateGoogleProfilesByEmail();
            if (result.success) {
                setStatus(`✅ 이메일 기반 업데이트 완료!\n\n📊 결과:\n- 총 구글 이메일 사용자: ${result.totalGoogleUsers}명\n- 업데이트된 사용자: ${result.updatedCount}명\n\n${result.message}`);
                toast.showToast('이메일 기반 프로필 업데이트 완료', 'success');
            } else {
                setStatus(`❌ 업데이트 실패: ${result.message}`);
                toast.showToast('업데이트에 실패했습니다', 'error');
            }
        } catch (error) {
            setStatus(`❌ 오류 발생: ${error.message}`);
            toast.showToast('오류가 발생했습니다', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container theme={theme}>
            <Header user={user} title="프로필 복구" />

            <Section theme={theme}>
                <SectionTitle theme={theme}>🔧 구글 사용자 프로필 복구</SectionTitle>
                <InfoText theme={theme}>
                    구글 연동 회원들의 프로필 이미지가 기본 이미지로 표시되는 문제를 해결할 수 있습니다.
                    아래 버튼들을 순서대로 실행해보세요.
                </InfoText>

                <Button
                    onClick={handleCheckGoogleProfiles}
                    disabled={isLoading}
                >
                    1. 구글 사용자 프로필 상태 확인
                </Button>

                <Button
                    onClick={handleForceUpdateProfiles}
                    disabled={isLoading}
                >
                    2. 구글 사용자 프로필 강제 업데이트
                </Button>

                <Button
                    onClick={handleUpdateByEmail}
                    disabled={isLoading}
                >
                    3. 이메일 기반 프로필 업데이트
                </Button>

                {isLoading && (
                    <LoadingText>처리 중...</LoadingText>
                )}

                {status && (
                    <StatusText theme={theme}>
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                            {status}
                        </pre>
                    </StatusText>
                )}
            </Section>

            <Navigation />
        </Container>
    );
}

export default ProfileFix; 