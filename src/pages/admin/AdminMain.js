/**
 * AdminMain.js - Admin 메인 페이지
 * 각 admin 페이지로 이동할 수 있는 메인 페이지
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import { requireAdmin } from '../../utils/adminAuth';
import { AdminLayout } from '../../components/admin/AdminLayout';

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const AdminCard = styled.div`
  background: ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : 'white'};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.3' : '0.1'});
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#e0e0e0'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 180px;
  justify-content: center;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 12px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.4' : '0.15'});
    border-color: #3498f3;
  }
  
  &:active {
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 20px;
    min-height: 160px;
  }
`;

const CardIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    font-size: 40px;
    margin-bottom: 12px;
  }
`;

const CardTitle = styled.h2`
  color: ${({ theme }) => theme.text};
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 8px 0;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CardDescription = styled.p`
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

function AdminMain({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();

    useEffect(() => {
        if (!requireAdmin(user, navigate)) {
            return;
        }
    }, [user, navigate]);

    const adminPages = [
        {
            path: '/admin/dashboard',
            icon: '📊',
            title: '대시보드',
            description: '매출, 비용, DAU, 신규 가입자 수 확인'
        },
        {
            path: '/admin/users',
            icon: '👥',
            title: '사용자 목록',
            description: '사용자 검색, 정렬, 페이지네이션 및 상세 정보 조회'
        },
        {
            path: '/admin/cs',
            icon: '⭐',
            title: 'CS 관리',
            description: '유저 검색, 포인트/포션 지급·차감, 프리미엄 상태 변경'
        },
        {
            path: '/admin/notifications',
            icon: '📢',
            title: '알림 발송',
            description: '마케팅/이벤트 알림 발송 및 수신 사용자 조회'
        },
        {
            path: '/admin/tools',
            icon: '🔧',
            title: '관리 도구',
            description: '프로필 업데이트, 디버깅, 탈퇴 회원 정리'
        }
    ];

    return (
        <AdminLayout user={user} title="관리자 페이지">
            <CardGrid>
                {adminPages.map((page) => (
                    <AdminCard
                        key={page.path}
                        theme={theme}
                        onClick={() => navigate(page.path)}
                    >
                        <CardIcon>{page.icon}</CardIcon>
                        <CardTitle theme={theme}>{page.title}</CardTitle>
                        <CardDescription theme={theme}>{page.description}</CardDescription>
                    </AdminCard>
                ))}
            </CardGrid>
        </AdminLayout>
    );
}

export default AdminMain;

