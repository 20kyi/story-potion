import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import TermsDetailModal from '../components/TermsDetailModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 500px;
`;

const LogoSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
`;

const Logo = styled.img`
  width: 150px;
  
  @media (max-width: 480px) {
    width: 120px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  color: #e46262;
  margin-bottom: 30px;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const AgreementSection = styled.div`
  background-color: #fff;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #f1f1f1;
  
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const AllAgreementItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 2px solid #f1f1f1;
  margin-bottom: 16px;
  gap: 8px;
`;

const AgreementItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #f1f1f1;
  gap: 8px;
  min-width: 0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  margin: 0;
  cursor: pointer;
  accent-color: #e46262;
  flex-shrink: 0;
`;

const Label = styled.label`
  font-size: 14px;
  color: #222;
  cursor: pointer;
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  word-break: keep-all;
  line-height: 1.4;
  gap: 6px;
  
  @media (max-width: 480px) {
    font-size: 13px;
    gap: 5px;
  }
`;

const RequiredBadge = styled.span`
  color: #e46262;
  font-size: 12px;
  margin: 0;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const OptionalBadge = styled.span`
  color: #888;
  font-size: 12px;
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const ViewButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  font-weight: 400;
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  
  @media (max-width: 480px) {
    font-size: 16px;
    width: 22px;
    height: 22px;
    padding: 4px 6px;
  }
  
  &:hover {
    opacity: 0.7;
  }
`;

const Button = styled.button`
  background: ${({ disabled }) =>
        disabled
            ? 'linear-gradient(135deg, #ccc 0%, #aaa 100%)'
            : 'linear-gradient(135deg, #ff8a8a 0%, #e46262 100%)'};
  color: #fff;
  padding: 15px;
  border-radius: 15px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  margin-top: 20px;
  transition: all 0.3s;
  
  &:hover {
    ${({ disabled }) => !disabled && `
      box-shadow: 0 4px 15px rgba(228, 98, 98, 0.4);
    `}
  }
`;

const AllAgreementLabel = styled.label`
  font-size: 15px;
  font-weight: 600;
  color: #222;
  cursor: pointer;
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  word-break: keep-all;
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  z-index: 10;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 480px) {
    top: 15px;
    right: 15px;
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
`;

function TermsAgreement() {
    const navigate = useNavigate();
    const [agreements, setAgreements] = useState({
        service: false,        // 서비스 이용약관 (필수)
        privacy: false,       // 개인정보 처리방침 (필수)
        collection: false,    // 개인정보 수집 및 이용 (필수)
        marketing: false     // 광고성 정보 수신 (선택)
    });
    const [selectedTerm, setSelectedTerm] = useState(null);

    // 라이트 모드 강제 적용
    useEffect(() => {
        const originalTheme = document.body.className;
        document.body.className = 'light';

        return () => {
            document.body.className = originalTheme;
        };
    }, []);

    const handleAllAgreement = (checked) => {
        setAgreements({
            service: checked,
            privacy: checked,
            collection: checked,
            marketing: checked
        });
    };

    const handleAgreement = (key, checked) => {
        setAgreements(prev => ({
            ...prev,
            [key]: checked
        }));
    };

    const handleViewDetail = (termType) => {
        setSelectedTerm(termType);
    };

    const handleCloseModal = () => {
        setSelectedTerm(null);
    };

    const handleClose = () => {
        navigate('/login');
    };

    const handleNext = () => {
        // 필수 약관 모두 동의했는지 확인
        if (agreements.service && agreements.privacy && agreements.collection) {
            // 약관 동의 정보를 sessionStorage에 저장
            sessionStorage.setItem('termsAgreement', JSON.stringify(agreements));
            navigate('/signup');
        }
    };

    const allAgreed = agreements.service && agreements.privacy && agreements.collection && agreements.marketing;
    const requiredAgreed = agreements.service && agreements.privacy && agreements.collection;

    return (
        <Container>
            <CloseButton onClick={handleClose}>
                <FaTimes />
            </CloseButton>
            <ContentWrapper>
                <LogoSection>
                    <Logo src="/app_logo/logo3.png" alt="Story Potion Logo" />
                </LogoSection>
                <Title>약관 동의</Title>
                <AgreementSection>
                    <AllAgreementItem>
                        <Checkbox
                            type="checkbox"
                            id="all"
                            checked={allAgreed}
                            onChange={(e) => handleAllAgreement(e.target.checked)}
                        />
                        <AllAgreementLabel htmlFor="all">
                            전체동의
                        </AllAgreementLabel>
                    </AllAgreementItem>

                    <AgreementItem>
                        <CheckboxWrapper>
                            <Checkbox
                                type="checkbox"
                                id="service"
                                checked={agreements.service}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleAgreement('service', e.target.checked);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Label
                                htmlFor="service"
                                onClick={(e) => {
                                    if (e.target.tagName !== 'INPUT') {
                                        handleViewDetail('service');
                                    }
                                }}
                            >
                                <RequiredBadge>[필수]</RequiredBadge>
                                서비스 이용약관 동의
                            </Label>
                        </CheckboxWrapper>
                        <ViewButton onClick={() => handleViewDetail('service')}>
                            &gt;
                        </ViewButton>
                    </AgreementItem>

                    <AgreementItem>
                        <CheckboxWrapper>
                            <Checkbox
                                type="checkbox"
                                id="privacy"
                                checked={agreements.privacy}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleAgreement('privacy', e.target.checked);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Label
                                htmlFor="privacy"
                                onClick={(e) => {
                                    if (e.target.tagName !== 'INPUT') {
                                        handleViewDetail('privacy');
                                    }
                                }}
                            >
                                <RequiredBadge>[필수]</RequiredBadge>
                                개인정보 처리방침 동의
                            </Label>
                        </CheckboxWrapper>
                        <ViewButton onClick={() => handleViewDetail('privacy')}>
                            &gt;
                        </ViewButton>
                    </AgreementItem>

                    <AgreementItem>
                        <CheckboxWrapper>
                            <Checkbox
                                type="checkbox"
                                id="collection"
                                checked={agreements.collection}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleAgreement('collection', e.target.checked);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Label
                                htmlFor="collection"
                                onClick={(e) => {
                                    if (e.target.tagName !== 'INPUT') {
                                        handleViewDetail('collection');
                                    }
                                }}
                            >
                                <RequiredBadge>[필수]</RequiredBadge>
                                개인정보 수집 및 이용 동의
                            </Label>
                        </CheckboxWrapper>
                        <ViewButton onClick={() => handleViewDetail('collection')}>
                            &gt;
                        </ViewButton>
                    </AgreementItem>

                    <AgreementItem>
                        <CheckboxWrapper>
                            <Checkbox
                                type="checkbox"
                                id="marketing"
                                checked={agreements.marketing}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleAgreement('marketing', e.target.checked);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Label
                                htmlFor="marketing"
                                onClick={(e) => {
                                    if (e.target.tagName !== 'INPUT') {
                                        handleViewDetail('marketing');
                                    }
                                }}
                            >
                                <OptionalBadge>[선택]</OptionalBadge>
                                광고성 정보 수신 동의
                            </Label>
                        </CheckboxWrapper>
                        <ViewButton onClick={() => handleViewDetail('marketing')}>
                            &gt;
                        </ViewButton>
                    </AgreementItem>
                </AgreementSection>

                <Button
                    onClick={handleNext}
                    disabled={!requiredAgreed}
                >
                    다음
                </Button>
            </ContentWrapper>

            {selectedTerm && (
                <TermsDetailModal
                    termType={selectedTerm}
                    onClose={handleCloseModal}
                />
            )}
        </Container>
    );
}

export default TermsAgreement;

