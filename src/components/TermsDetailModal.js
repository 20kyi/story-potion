import React from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
  
  body.dark & {
    background-color: #2a2a2a;
    color: #fff;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f1f1;
  
  body.dark & {
    border-bottom: 1px solid #444;
  }
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #222;
  
  body.dark & {
    color: #fff;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  body.dark & {
    color: #ccc;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  color: #222;
  line-height: 1.8;
  font-size: 14px;
  
  body.dark & {
    color: #ccc;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #222;
  
  body.dark & {
    color: #fff;
  }
`;

const SectionContent = styled.div`
  font-size: 14px;
  color: #222;
  white-space: pre-line;
  line-height: 1.8;
  
  body.dark & {
    color: #ccc;
  }
`;

const List = styled.ul`
  margin: 8px 0;
  padding-left: 20px;
`;

const ListItem = styled.li`
  margin-bottom: 8px;
`;

const termsContent = {
  service: {
    // title: '서비스 이용약관',
    content: `제1조 목적

본 약관은 Story Potion(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 용어의 정의

"이용자"란 본 약관에 따라 서비스에 접속하여 이용하는 자를 말합니다.

"계정"이란 이용자가 서비스를 이용하기 위해 생성한 로그인 정보를 말합니다.

제3조 약관의 효력 및 변경

본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.

회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.

제4조 서비스의 제공 및 변경

회사는 이용자에게 일기 생성, 콘텐츠 저장 등의 기능을 제공합니다.

회사는 운영상 필요에 따라 서비스 내용을 변경할 수 있습니다.

제5조 서비스의 중단

천재지변, 시스템 점검 등 불가피한 경우 서비스 제공이 일시 중단될 수 있습니다.

제6조 회원가입

이용자는 회사가 정한 절차에 따라 회원가입을 신청합니다.

회사는 정당한 사유가 없는 한 회원가입을 승낙합니다.

제7조 회원 탈퇴 및 자격 상실

이용자는 언제든지 서비스 내 설정을 통해 탈퇴할 수 있습니다.

회사는 부정 이용, 법령 위반 등의 경우 회원 자격을 제한하거나 상실시킬 수 있습니다.

제8조 이용자의 의무

타인의 개인정보를 도용해서는 안 됩니다.

서비스 운영을 방해해서는 안 됩니다.

제9조 저작권 및 콘텐츠 관리

이용자가 생성한 콘텐츠의 저작권은 이용자에게 있으며, 회사는 서비스 운영을 위해 필요한 범위 내에서 이를 이용할 수 있습니다.

제10조 개인정보 보호

회사는 관련 법령에 따라 이용자의 개인정보를 보호합니다.

제11조 책임 제한

서비스 이용 과정에서 발생한 문제에 대해 회사의 고의 또는 중과실이 없는 경우 책임을 지지 않습니다.

제12조 준거법 및 분쟁 해결

본 약관은 대한민국 법령을 따르며, 분쟁 발생 시 회사 소재지 관할 법원에 따릅니다.`
  },
  privacy: {
    title: '개인정보 처리방침',
    content: `1. 총칙

회사는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.

2. 수집하는 개인정보 항목

• 이메일, 비밀번호(또는 소셜 로그인 정보)
• 프로필 이미지(선택)
• 서비스 이용 기록, 접속 로그, 기기 정보

3. 개인정보의 수집 및 이용 목적

• 회원가입 및 계정 관리
• 일기 생성 및 콘텐츠 저장
• 서비스 개선 및 오류 분석
• CS 응대

4. 보유 및 이용기간

• 회원 탈퇴 시 즉시 삭제
• 단, 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관

5. 개인정보의 제3자 제공

회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.

다만 법률에 의해 요구되는 경우 예외적으로 제공될 수 있습니다.

6. 개인정보 처리 위탁

서비스 운영에 필요한 경우 일부 업무를 외부 업체에 위탁할 수 있습니다.

위탁 시 필요한 보호조치를 취합니다.

7. 이용자의 권리

이용자는 언제든 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.

8. 쿠키의 이용

회사는 이용자 경험 개선을 위해 쿠키를 사용할 수 있습니다.

9. 개인정보 보호 책임자

storypotion.team@gmail.com`
  },
  collection: {
    title: '개인정보 수집 및 이용 동의',
    content: `[필수] 개인정보 수집 및 이용 동의

1. 수집 항목

• 이메일, 비밀번호(또는 소셜 로그인 정보)
• 프로필 이미지(선택)
• 접속 기록, 행동 로그, 기기 정보

2. 수집 목적

• 회원가입 및 본인 확인
• 개인화된 서비스 제공
• 서비스 운영 및 품질 개선
• 보안 관리 및 부정 이용 방지

3. 보유 기간

• 회원 탈퇴 후 즉시 삭제
• 법령에 따라 필요 시 일정 기간 보관

4. 동의 거부 시 불이익

필수 항목에 동의하지 않을 경우 회원가입이 제한될 수 있습니다.`
  },
  marketing: {
    title: '광고성 정보 수신 동의',
    content: `[선택] 광고성 정보 수신 동의

회사는 프로모션, 이벤트, 신규 기능 업데이트 등의 정보를
이메일·푸시 알림 등으로 발송할 수 있습니다.

선택 동의이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다.

언제든 앱 설정에서 철회할 수 있습니다.`
  }
};

function TermsDetailModal({ termType, onClose }) {
  const term = termsContent[termType];

  if (!term) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{term.title}</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <Section>
            <SectionContent>{term.content}</SectionContent>
          </Section>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

export default TermsDetailModal;

