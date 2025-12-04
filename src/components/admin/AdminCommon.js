/**
 * AdminCommon.js - 관리자 페이지 공통 스타일 컴포넌트
 */

import styled from 'styled-components';

export const Section = styled.div`
  background: ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : 'white'};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.3' : '0.1'});
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#e0e0e0'};
  
  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 6px;
  }
`;

export const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.text};
  margin-bottom: 15px;
  border-bottom: 2px solid #3498f3;
  padding-bottom: 10px;
  font-size: 18px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 12px;
    padding-bottom: 8px;
  }
`;

export const AccordionIcon = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  transition: transform 0.3s ease;
  transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
  margin-left: 10px;
`;

export const SectionContent = styled.div`
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: ${props => props.isOpen ? '10000px' : '0'};
  opacity: ${props => props.isOpen ? '1' : '0'};
`;

export const Button = styled.button`
  background: ${props => props.variant === 'danger' ? '#e74c3c' : '#3498f3'};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin: 5px;
  font-size: 14px;
  min-height: 44px;
  touch-action: manipulation;
  flex-shrink: 0;
  max-width: 100%;
  box-sizing: border-box;
  
  &:hover {
    background: ${props => props.variant === 'danger' ? '#c0392b' : '#2980b9'};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 13px;
    margin: 4px;
    min-height: 48px;
    flex: 1 1 auto;
    min-width: 120px;
    max-width: calc(100% - 8px);
  }
`;

export const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#ddd'};
  border-radius: 4px;
  margin: 5px;
  font-size: 14px;
  background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : 'white'};
  color: ${({ theme }) => theme.text};
  
  &:focus {
    outline: none;
    border-color: #3498f3;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 16px;
    margin: 4px 0;
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
  }
`;

export const Select = styled.select`
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#ddd'};
  border-radius: 4px;
  margin: 5px;
  font-size: 13px;
  background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : 'white'};
  color: ${({ theme }) => theme.theme === 'dark' ? '#fff' : '#333'} !important;
  height: 32px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #3498f3;
  }
  
  option {
    background: ${({ theme }) => theme.theme === 'dark' ? '#34495e' : 'white'};
    color: ${({ theme }) => theme.theme === 'dark' ? '#fff' : '#333'} !important;
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    font-size: 14px;
    margin: 4px 0;
    width: 100%;
    min-height: 44px;
    height: auto;
  }
`;

export const InfoText = styled.div`
  color: ${({ theme }) => theme.subText || '#666'};
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 15px;
  }
`;

export const ButtonGroupTitle = styled.div`
  font-size: 15px;
  font-weight: bold;
  color: ${({ theme }) => theme.text};
  margin-bottom: 10px;
  font-size: 14px;
  width: 100%;
  
  @media (max-width: 768px) {
    font-size: 13px;
    margin-bottom: 8px;
  }
`;

