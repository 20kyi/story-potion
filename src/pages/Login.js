import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import { RiKakaoTalkFill } from 'react-icons/ri';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { Browser } from '@capacitor/browser';
import { Keyboard } from '@capacitor/keyboard';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
  body.dark & {
    background-color: #232323;
  }
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  
  @media (min-width: 1024px) {
    flex-direction: row;
    justify-content: space-between;
    max-width: 1000px;
    gap: 0px;
  }
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;

  @media (min-width: 1024px) {
    align-items: center;
    max-width: none;
    flex: 1;
  }
`;

const LogoSection = styled.div`
  margin-bottom: 40px;

  @media (min-width: 1024px) {
    margin-bottom: 0;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const Logo = styled.img`
  width: 150px;
  @media (min-width: 1024px) {
    width: 250px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  color: #e46262;
  margin-bottom: 30px;
  font-weight: 700;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 400px;
`;

const PasswordContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const PasswordInput = styled.input`
  padding: 14px 20px;
  padding-right: 45px;
  border-radius: 15px;
  border: 1px solid #fdd2d2;
  font-size: 16px;
  color: #40392b;
  background-color: #f9f9f9;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s;
  width: 100%;

  &:focus {
    border-color: #e46262;
    background-color: #fff;
  }
`;

const EyeIcon = styled.div`
  position: absolute;
  right: 15px;
  cursor: pointer;
  color: #aaa;
  font-size: 20px;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  padding: 14px 20px;
  border-radius: 15px;
  border: 1px solid #fdd2d2;
  font-size: 16px;
  color: #40392b;
  background-color: #f9f9f9;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s;

  &:focus {
    border-color: #e46262;
    background-color: #fff;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #ff8a8a 0%, #e46262 100%);
  color: #fff;
  padding: 15px;
  border-radius: 15px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 15px rgba(228, 98, 98, 0.4);
  }
`;

const ErrorMessage = styled.p`
  color: #d9534f;
  font-size: 14px;
  text-align: center;
`;

const SignupLink = styled.div`
  margin-top: 25px;
  font-size: 14px;
  color: #555;

  a {
    color: #e46262;
    text-decoration: none;
    font-weight: 600;
    margin-left: 5px;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  color: #ccc;
  font-size: 14px;
  margin: 30px 0;
  width: 100%;
  max-width: 400px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #eee;
  }

  &:not(:empty)::before {
    margin-right: 1em;
  }
  
  &:not(:empty)::after {
    margin-left: 1em;
  }
`;

const SocialLoginContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 30px;
`;

const SocialButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid #eee;
  background-color: #fff;
  cursor: pointer;
  font-size: 24px;
  color: ${props => props.color};
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
    transform: translateY(-2px);
  }
`;

const NaverIcon = styled.div`
  color: #fff;
  font-weight: 700;
  font-size: 20px;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #03c75a;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
`;

function Login() {
  const navigate = useNavigate();
  const [passwordShown, setPasswordShown] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const mainRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (!window.Capacitor) return;
    const onShow = Keyboard.addListener('keyboardWillShow', (info) => {
      setKeyboardHeight(info.keyboardHeight);
    });
    const onHide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/');
    } catch (error) {
      setError('이메일 또는 비밀번호가 잘못되었습니다.');
    }
  };

  const handleSocialLogin = async (provider) => {
    if (provider === 'Google') {
      const clientId = '607033226027-8f2q1anu11vdm5usbdcv418um9jsvk1e.apps.googleusercontent.com';
      const redirectUri = 'storypotion://auth';
      const scope = 'profile email openid';
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
      try {
        await Browser.open({ url: oauthUrl });
      } catch (error) {
        setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } else if (provider === 'Facebook') {
      alert(`${provider} 로그인은 현재 준비 중입니다.`);
    } else {
      alert(`${provider} 로그인은 현재 준비 중입니다.`);
    }
  };

  return (
    <div ref={mainRef} style={{ paddingBottom: keyboardHeight }}>
      <Container>
        <ContentWrapper>
          <LogoSection>
            <Logo src="/app_logo/logo3.png" alt="Story Potion Logo" />
          </LogoSection>
          <FormSection>
            {/* <Title>로그인</Title> */}
            <Form onSubmit={handleSubmit}>
              <Input
                type="email"
                name="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleChange}
                ref={inputRef}
                onFocus={e => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
              />
              <PasswordContainer>
                <PasswordInput
                  type={passwordShown ? "text" : "password"}
                  name="password"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleChange}
                  ref={inputRef}
                  onFocus={e => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                />
                <EyeIcon onClick={() => setPasswordShown(!passwordShown)}>
                  {passwordShown ? <FaEyeSlash /> : <FaEye />}
                </EyeIcon>
              </PasswordContainer>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <Button type="submit">로그인</Button>
            </Form>
            <Divider>또는</Divider>
            <SocialLoginContainer>
              <SocialButton color="#4285F4" onClick={() => handleSocialLogin('Google')}>
                <FaGoogle />
              </SocialButton>
              <SocialButton color="#1877F2" onClick={() => handleSocialLogin('Facebook')}>
                <FaFacebook />
              </SocialButton>
              <SocialButton color="#FEE500" onClick={() => handleSocialLogin('Kakao')}>
                <RiKakaoTalkFill style={{ color: '#3c1e1e' }} />
              </SocialButton>
              <SocialButton onClick={() => handleSocialLogin('Naver')}>
                <NaverIcon>N</NaverIcon>
              </SocialButton>
            </SocialLoginContainer>
            <SignupLink>
              계정이 없으신가요?
              <Link to="/signup">회원가입</Link>
            </SignupLink>
          </FormSection>
        </ContentWrapper>
      </Container>
    </div>
  );
}

export default Login; 