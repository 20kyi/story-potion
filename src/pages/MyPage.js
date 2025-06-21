import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { auth, storage } from '../firebase';
import { signOut } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import EditIcon from '../components/icons/EditIcon';
import RecentActivityIcon from '../components/icons/RecentActivityIcon';
import NotificationIcon from '../components/icons/NotificationIcon';
import InviteFriendIcon from '../components/icons/InviteFriendIcon';
import ShopIcon from '../components/icons/ShopIcon';
import CustomerServiceIcon from '../components/icons/CustomerServiceIcon';
import NoticeIcon from '../components/icons/NoticeIcon';

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fff;
  padding: 20px;
  padding-top: 70px;
  padding-bottom: 100px;
  margin-top: 10px;
`;

const ProfileContainer = styled.div`
  position: relative;
  width: 90px;
  height: 90px;
  margin: 40px auto 16px;
`;

const ProfileImage = styled.img`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  // background: #fdd2d2;
  // border: 2px solid #e46262;
  object-fit: cover;
`;

const ProfileImagePlaceholder = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #fdd2d2;
  // border: 2px solid #e46262;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  // color: #e46262;
  margin-top: 40px;
  margin-bottom: 16px;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
`;

const EditIconWrapper = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: rgba(210, 209, 209, 0.75);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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
    background-color: #f1f3f5;
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
  font-size: 13px;
  font-weight: 600;
  color: #495057;
`;

const Info = styled.div`
  font-size: 15px;
  color: #888;
  margin-bottom: 32px;
  text-align: center;
`;

const EditButton = styled.button`
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  &:hover {
    background: #e0e0e0;
  }
`;

const LogoutButton = styled.button`
  background: #e46262;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.2s;
  display: block;
  margin-left: auto;
  margin-right: auto;
  &:hover {
    background: #cb6565;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
`;

const Input = styled.input`
  width: 80%;
  max-width: 300px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
`;

const FileInput = styled.input`
  margin-top: 10px;
  margin-bottom: 20px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
`;

function MyPage({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newProfileImageFile, setNewProfileImageFile] = useState(null);
  const [newProfileImageUrl, setNewProfileImageUrl] = useState('');

  useEffect(() => {
    if (user) {
      setNewDisplayName(user.displayName || '');
      setNewProfileImageUrl(user.photoURL || '');
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // 로그아웃 성공 시 App.js의 onAuthStateChanged가 감지하여
      // 자동으로 로그인 페이지로 리디렉션합니다.
      alert('로그아웃 되었습니다.');
    } catch (error) {
      console.error('로그아웃 실패:', error);
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
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const displayName = user?.displayName || user?.email;

  return (
    <>
      <Header user={user} />
      <MainContainer className="my-page-container">
        {isEditing ? (
          <FormContainer>
            {newProfileImageUrl ? (
              <ProfileImage src={newProfileImageUrl} alt="Profile" />
            ) : (
              <ProfileImagePlaceholder>😊</ProfileImagePlaceholder>
            )}
            <FileInput type="file" onChange={handleFileChange} />
            <Input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="새로운 닉네임"
            />
            <ButtonContainer>
              <LogoutButton onClick={handleProfileUpdate}>저장</LogoutButton>
              <EditButton onClick={() => setIsEditing(false)}>취소</EditButton>
            </ButtonContainer>
          </FormContainer>
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
            <Info>오늘도 즐거운 하루!</Info>
            <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
            <MenuGrid>
              <MenuButton>
                <MenuIcon as="div">
                  <RecentActivityIcon />
                </MenuIcon>
                <MenuLabel>최근활동</MenuLabel>
              </MenuButton>
              <MenuButton>
                <MenuIcon as="div">
                  <NotificationIcon />
                </MenuIcon>
                <MenuLabel>알림</MenuLabel>
              </MenuButton>
              <MenuButton>
                <MenuIcon as="div">
                  <InviteFriendIcon />
                </MenuIcon>
                <MenuLabel>친구초대</MenuLabel>
              </MenuButton>
              <MenuButton>
                <MenuIcon as="div">
                  <ShopIcon />
                </MenuIcon>
                <MenuLabel>상점</MenuLabel>
              </MenuButton>
              <MenuButton>
                <MenuIcon as="div">
                  <CustomerServiceIcon />
                </MenuIcon>
                <MenuLabel>고객센터</MenuLabel>
              </MenuButton>
              <MenuButton>
                <MenuIcon as="div">
                  <NoticeIcon />
                </MenuIcon>
                <MenuLabel>공지사항</MenuLabel>
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