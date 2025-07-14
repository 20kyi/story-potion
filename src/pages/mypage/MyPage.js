import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { auth, storage } from '../../firebase';
import { signOut } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import EditIcon from '../../components/icons/EditIcon';
import RecentActivityIcon from '../../components/icons/RecentActivityIcon';
import NotificationIcon from '../../components/icons/NotificationIcon';
import NoticeIcon from '../../components/icons/NoticeIcon';
import CustomerServiceIcon from '../../components/icons/CustomerServiceIcon';
import InviteFriendIcon from '../../components/icons/InviteFriendIcon';
import GearIcon from '../../components/icons/GearIcon';
import CrownIcon from '../../components/icons/CrownIcon';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  padding-top: 20px;
  padding-bottom: 100px;
  // margin-top: 10px;
  margin: 40px auto;
  max-width: 600px;
`;

const ProfileContainer = styled.div`
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px auto 16px auto;
`;

const ProfileImage = styled.img`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  // background: #fdd2d2;
  // border: 2px solid #e46262;
  object-fit: cover;
`;
/* 프로필 이미지 빈 공간 */
const ProfileImagePlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #fdd2d2;
  // border: 2px solid #e46262;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  // color: #e46262;
  margin-top: 10px;
  margin-bottom: 16px;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
`;

const EditIconWrapper = styled.div`
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 40px;
  height: 40px;
  background: rgba(210, 209, 209, 0.85);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  z-index: 2;
`;

const Nickname = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: #cb6565;
  margin-bottom: 8px;
  text-align: center;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 30px;
  width: 100%;
`;

const MenuButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  border-radius: 12px;
  padding: 15px 10px;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.menuHover};
  }
`;

const MenuIcon = styled.div`
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuLabel = styled.span`
  font-size: 17px;
  font-weight: 500;
  color: ${({ theme }) => theme.menuText};
  margin-top: 2px;
`;

const Info = styled.div`
  font-size: 15px;
  color: #888;
  margin-bottom: 32px;
  text-align: center;
`;

const EditProfileCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 18px;
  box-shadow: ${({ theme }) => theme.cardShadow};
  padding: 32px 24px 24px 24px;
  max-width: 380px;
  margin: 40px auto 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const EditProfileImage = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #fdd2d2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
  margin-bottom: 18px;
  overflow: hidden;
`;

const EditProfileImgTag = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  display: block;
  margin: 0;
  padding: 0;
`;

const EditImageInput = styled.input`
  display: none;
`;

const EditImageLabel = styled.label`
  position: absolute;
  right: 0;
  bottom: 0;
  background: rgba(220,220,220,0.85);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1.5px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const EditLabel = styled.label`
  font-size: 15px;
  font-weight: 500;
  color: #888;
  margin-bottom: 6px;
  margin-top: 20px;
  align-self: flex-start;
`;

const EditInputWrap = styled.div`
  width: 100%;
  max-width: 260px;
  margin-bottom: 22px;
  display: flex;
  flex-direction: column;
`;

const EditInput = styled.input`
  width: 100%;
  padding: 13px 15px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;
  &:focus {
    border-color: #e46262;
    box-shadow: 0 0 0 2px rgba(228,98,98,0.08);
  }
`;

const EditButtonRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 18px;
  gap: 15px;
`;

const EditSaveButton = styled.button`
  flex: 1 1 0;
  height: 52px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 11px;
  border: none;
  background: #e46262;
  color: #fff;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  letter-spacing: 0.01em;
  margin-right: 8px;
  &:hover, &:focus {
    background: #cb6565;
  }
`;

const EditCancelTextButton = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 0 8px;
  height: 52px;
  &:hover, &:focus {
    color: #e46262;
    text-decoration: underline;
  }
`;

function MyPage({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newProfileImageFile, setNewProfileImageFile] = useState(null);
  const [newProfileImageUrl, setNewProfileImageUrl] = useState('');
  const [point, setPoint] = useState(0);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (user) {
      setNewDisplayName(user.displayName || '');
      setNewProfileImageUrl(user.photoURL || '');
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      // Firestore에서 포인트 불러오기
      getDoc(doc(db, "users", user.uid)).then((docSnap) => {
        if (docSnap.exists()) {
          setPoint(docSnap.data().point || 0);
        }
      });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // 로그아웃 성공 시 App.js의 onAuthStateChanged가 감지하여
      // 자동으로 로그인 페이지로 리디렉션합니다.
      alert('로그아웃 되었습니다.');
    } catch (error) {
      alert('로그아웃에 실패했습니다.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfileImageFile(file);
      setNewProfileImageUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      let photoURL = user.photoURL;
      if (newProfileImageFile) {
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(storageRef, newProfileImageFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(auth.currentUser, {
        displayName: newDisplayName,
        photoURL: photoURL,
      });

      alert('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditing(false);
    } catch (error) {
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const displayName = user?.displayName || user?.email;

  return (
    <>
      <Header user={user} />
      <MainContainer className="my-page-container">
        {isEditing ? (
          <EditProfileCard>
            <EditImageLabel htmlFor="profile-image-upload" style={{ position: 'static', width: 120, height: 120, background: 'none', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {newProfileImageUrl ? (
                <EditProfileImgTag src={newProfileImageUrl} alt="Profile" />
              ) : (
                <span role="img" aria-label="profile" style={{ fontSize: '64px', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#fdd2d2', margin: 0, padding: 0 }}>😊</span>
              )}
              <EditImageInput id="profile-image-upload" type="file" accept="image/*" onChange={handleFileChange} />
            </EditImageLabel>
            <EditInputWrap>
              <EditLabel htmlFor="edit-nickname">닉네임</EditLabel>
              <EditInput
                id="edit-nickname"
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="닉네임을 입력하세요"
                maxLength={20}
                autoComplete="off"
              />
            </EditInputWrap>
            <EditButtonRow>
              <EditCancelTextButton onClick={() => setIsEditing(false)}>취소</EditCancelTextButton>
              <EditSaveButton onClick={handleProfileUpdate}>저장</EditSaveButton>
            </EditButtonRow>
          </EditProfileCard>
        ) : (
          <>
            <ProfileContainer>
              {user?.photoURL ? (
                <ProfileImage src={user.photoURL} alt="Profile" />
              ) : (
                <ProfileImagePlaceholder>😊</ProfileImagePlaceholder>
              )}
              <EditIconWrapper onClick={() => setIsEditing(true)}>
                <EditIcon width="20" height="20" color="#555555" />
              </EditIconWrapper>
            </ProfileContainer>
            <Nickname>{displayName}님!</Nickname>
            <div style={{ textAlign: "center", fontSize: 16, color: "#3498f3", fontWeight: 600, margin: '8px 0 16px 0', cursor: 'pointer' }}
              onClick={() => navigate('/my/point-history')}>
              <span role="img" aria-label="coin">🪙</span> {point.toLocaleString()}p
            </div>
            <MenuGrid>
              <MenuButton onClick={() => navigate('/my/statistics')}>
                <MenuIcon as="div">
                  <RecentActivityIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>내 통계</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/settings')}>
                <MenuIcon as="div">
                  <GearIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>개인설정</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/notice')}>
                <MenuIcon as="div">
                  <NotificationIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>공지사항</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/support')}>
                <MenuIcon as="div">
                  <CustomerServiceIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>고객지원</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/social')}>
                <MenuIcon as="div">
                  <InviteFriendIcon color={theme.theme === 'dark' ? '#fff' : '#222'} />
                </MenuIcon>
                <MenuLabel>소셜</MenuLabel>
              </MenuButton>
              <MenuButton onClick={() => navigate('/my/premium')}>
                <MenuIcon as="div">
                  <CrownIcon color={theme.theme === 'dark' ? '#fff' : '#181725'} />
                </MenuIcon>
                <MenuLabel>프리미엄</MenuLabel>
              </MenuButton>
            </MenuGrid>
          </>
        )}
        <Navigation />
      </MainContainer>
    </>
  );
}

export default MyPage; 