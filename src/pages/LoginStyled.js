import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding-top: 0;
  width: 100%;
  
  @media (min-width: 1024px) {
    flex-direction: row;
    justify-content: space-between;
    max-width: 1000px;
    gap: 0px;
  }
`;

export const FormSection = styled.div`
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

export const LogoSection = styled.div`
  margin-bottom: 40px;

  @media (min-width: 1024px) {
    margin-bottom: 0;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

export const Logo = styled.img`
  width: 150px;
  @media (min-width: 1024px) {
    width: 250px;
  }
`;

export const Title = styled.h1`
  font-size: 28px;
  color: #e46262;
  margin-bottom: 30px;
  font-weight: 700;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 400px;
`;

export const PasswordContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

export const PasswordInput = styled.input`
  padding: 14px 20px;
  padding-right: 45px;
  border-radius: 15px;
  border: 1px solid #f1f1f1;
  font-size: 16px;
  color: #222;
  background-color: #fff;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s;
  width: 100%;

  &:focus {
    border-color: #e46262;
    background-color: #fff;
  }
`;

export const EyeIcon = styled.div`
  position: absolute;
  right: 15px;
  cursor: pointer;
  color: #aaa;
  font-size: 20px;
  display: flex;
  align-items: center;
`;

export const Input = styled.input`
  padding: 14px 20px;
  border-radius: 15px;
  border: 1px solid #f1f1f1;
  font-size: 16px;
  color: #222;
  background-color: #fff;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s;

  &:focus {
    border-color: #e46262;
    background-color: #fff;
  }
`;

export const Button = styled.button`
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

export const ErrorMessage = styled.p`
  color: #d9534f;
  font-size: 14px;
  text-align: center;
`;

export const SignupLink = styled.div`
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

export const Divider = styled.div`
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

export const SocialLoginContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 30px;
`;

export const SocialButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid #eee;
  background-color: #fff;
  cursor: pointer;
  color: ${props => props.color};
  transition: all 0.2s;

  // 소셜 버튼 아이콘 크기
  svg {
    width: 26px;
    height: 26px;
  }

  &:hover {
    opacity: 0.8;
    transform: translateY(-2px);
  }
`;

export const NaverIcon = styled.div`
  color: #fff;
  font-weight: 700;
  font-size: 26px;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #03c75a;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
`; 