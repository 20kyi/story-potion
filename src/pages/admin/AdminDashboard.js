/**
 * AdminDashboard.js - 관리자 대시보드 페이지
 * 매일 아침 확인용: 매출, 비용, DAU, 신규 가입자 수
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import { requireAdmin } from '../../utils/adminAuth';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Section, SectionTitle, SectionContent } from '../../components/admin/AdminCommon';
import { db } from '../../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : 'white'};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.3' : '0.1'});
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#e0e0e0'};
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const StatCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const StatIcon = styled.div`
  font-size: 32px;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const StatTitle = styled.h3`
  color: ${({ theme }) => theme.text};
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const StatValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const StatSubValue = styled.div`
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  font-size: 14px;
  margin-bottom: 4px;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const StatChange = styled.div`
  color: ${({ positive }) => positive ? '#27ae60' : '#e74c3c'};
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const LoadingText = styled.div`
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  font-size: 14px;
  text-align: center;
  padding: 20px;
`;

const ErrorText = styled.div`
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
  padding: 20px;
`;

function AdminDashboard({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 오늘의 통계
    const [todayRevenue, setTodayRevenue] = useState({ amount: 0, count: 0 });
    const [todayCost, setTodayCost] = useState({ amount: 0, count: 0 });
    const [todayDAU, setTodayDAU] = useState(0);
    const [todayNewUsers, setTodayNewUsers] = useState(0);

    // 어제의 통계 (비교용)
    const [yesterdayRevenue, setYesterdayRevenue] = useState({ amount: 0, count: 0 });
    const [yesterdayNewUsers, setYesterdayNewUsers] = useState(0);

    useEffect(() => {
        if (!requireAdmin(user, navigate)) {
            return;
        }

        fetchDashboardData();
    }, [user, navigate]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            const now = new Date();

            // 오늘의 시작 (00:00:00)
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);

            // 오늘의 끝 (23:59:59.999)
            const todayEnd = new Date(now);
            todayEnd.setHours(23, 59, 59, 999);

            // 어제의 시작
            const yesterdayStart = new Date(now);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            yesterdayStart.setHours(0, 0, 0, 0);

            // 어제의 끝
            const yesterdayEnd = new Date(now);
            yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
            yesterdayEnd.setHours(23, 59, 59, 999);

            const todayStartTs = Timestamp.fromDate(todayStart);
            const todayEndTs = Timestamp.fromDate(todayEnd);
            const yesterdayStartTs = Timestamp.fromDate(yesterdayStart);
            const yesterdayEndTs = Timestamp.fromDate(yesterdayEnd);

            // 1. 오늘의 매출 (인앱 결제)
            const todayRevenueData = await fetchTodayRevenue(todayStartTs, todayEndTs);
            setTodayRevenue(todayRevenueData);

            // 2. 어제의 매출
            const yesterdayRevenueData = await fetchTodayRevenue(yesterdayStartTs, yesterdayEndTs);
            setYesterdayRevenue(yesterdayRevenueData);

            // 3. 오늘의 비용 (AI 소설 생성)
            const todayCostData = await fetchTodayCost(todayStartTs, todayEndTs);
            setTodayCost(todayCostData);

            // 4. DAU (오늘 접속한 유저 수)
            const dau = await fetchDAU(todayStartTs, todayEndTs);
            setTodayDAU(dau);

            // 5. 오늘의 신규 가입자
            const newUsers = await fetchNewUsers(todayStartTs, todayEndTs);
            setTodayNewUsers(newUsers);

            // 6. 어제의 신규 가입자
            const yesterdayNewUsers = await fetchNewUsers(yesterdayStartTs, yesterdayEndTs);
            setYesterdayNewUsers(yesterdayNewUsers);

        } catch (err) {
            console.error('대시보드 데이터 조회 실패:', err);
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 오늘의 매출 조회 (인앱 결제)
    const fetchTodayRevenue = async (startTs, endTs) => {
        try {
            let totalAmount = 0;
            let count = 0;

            // 모든 사용자의 pointHistory에서 type: 'charge'인 항목 조회
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);

            const startDate = startTs.toDate();
            const endDate = endTs.toDate();

            const promises = [];
            usersSnapshot.forEach((userDoc) => {
                const pointHistoryRef = collection(db, 'users', userDoc.id, 'pointHistory');
                const q = query(
                    pointHistoryRef,
                    where('type', '==', 'charge')
                );
                promises.push(getDocs(q));
            });

            const results = await Promise.all(promises);
            results.forEach((snapshot) => {
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // createdAt 필드 처리 (Timestamp 또는 Date)
                    let createdAt = null;
                    if (data.createdAt) {
                        if (data.createdAt.toDate) {
                            createdAt = data.createdAt.toDate();
                        } else if (data.createdAt instanceof Date) {
                            createdAt = data.createdAt;
                        } else {
                            createdAt = new Date(data.createdAt);
                        }
                    }

                    // 날짜 범위 확인
                    if (createdAt && createdAt >= startDate && createdAt <= endDate) {
                        // amount가 양수인 경우만 매출로 계산
                        if (data.amount && data.amount > 0) {
                            totalAmount += data.amount;
                            count++;
                        }
                    }
                });
            });

            return { amount: totalAmount, count };
        } catch (err) {
            console.error('매출 조회 실패:', err);
            return { amount: 0, count: 0 };
        }
    };

    // 오늘의 비용 조회 (AI 소설 생성)
    const fetchTodayCost = async (startTs, endTs) => {
        try {
            const novelsRef = collection(db, 'novels');
            const startDate = startTs.toDate();
            const endDate = endTs.toDate();

            // createdAt 필드로 쿼리 시도
            let snapshot;
            try {
                const q = query(
                    novelsRef,
                    where('createdAt', '>=', startTs),
                    where('createdAt', '<=', endTs)
                );
                snapshot = await getDocs(q);
            } catch (queryErr) {
                // 인덱스가 없는 경우 전체 조회 후 필터링
                snapshot = await getDocs(novelsRef);
            }

            let count = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                let createdAt = null;
                if (data.createdAt) {
                    if (data.createdAt.toDate) {
                        createdAt = data.createdAt.toDate();
                    } else if (data.createdAt instanceof Date) {
                        createdAt = data.createdAt;
                    } else {
                        createdAt = new Date(data.createdAt);
                    }
                }

                if (createdAt && createdAt >= startDate && createdAt <= endDate) {
                    count++;
                }
            });

            // 평균 단가: 소설 생성 1건당 약 $0.10 (추정)
            // 실제 비용은 OpenAI API 사용량에 따라 다를 수 있음
            const averageCostPerNovel = 0.10; // USD
            const estimatedCost = count * averageCostPerNovel;

            return { amount: estimatedCost, count };
        } catch (err) {
            console.error('비용 조회 실패:', err);
            return { amount: 0, count: 0 };
        }
    };

    // DAU 조회 (오늘 접속한 유저 수)
    const fetchDAU = async (startTs, endTs) => {
        try {
            const usersRef = collection(db, 'users');
            // lastLoginAt이 있는 사용자만 조회
            const q = query(
                usersRef,
                where('lastLoginAt', '>=', startTs),
                where('lastLoginAt', '<=', endTs)
            );

            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (err) {
            // 인덱스가 없거나 필드가 없는 경우를 대비해 전체 조회 후 필터링
            try {
                const usersRef = collection(db, 'users');
                const allUsersSnapshot = await getDocs(usersRef);
                let count = 0;
                allUsersSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.lastLoginAt) {
                        const lastLoginAt = data.lastLoginAt.toDate ? data.lastLoginAt.toDate() : new Date(data.lastLoginAt);
                        if (lastLoginAt >= startTs.toDate() && lastLoginAt <= endTs.toDate()) {
                            count++;
                        }
                    }
                });
                return count;
            } catch (fallbackErr) {
                console.error('DAU 조회 실패:', fallbackErr);
                return 0;
            }
        }
    };

    // 신규 가입자 조회
    const fetchNewUsers = async (startTs, endTs) => {
        try {
            const usersRef = collection(db, 'users');
            const startDate = startTs.toDate();
            const endDate = endTs.toDate();

            let snapshot;
            try {
                const q = query(
                    usersRef,
                    where('createdAt', '>=', startTs),
                    where('createdAt', '<=', endTs)
                );
                snapshot = await getDocs(q);
            } catch (queryErr) {
                // 인덱스가 없는 경우 전체 조회 후 필터링
                snapshot = await getDocs(usersRef);
            }

            let count = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                let createdAt = null;
                if (data.createdAt) {
                    if (data.createdAt.toDate) {
                        createdAt = data.createdAt.toDate();
                    } else if (data.createdAt instanceof Date) {
                        createdAt = data.createdAt;
                    } else {
                        createdAt = new Date(data.createdAt);
                    }
                }

                if (createdAt && createdAt >= startDate && createdAt <= endDate) {
                    count++;
                }
            });

            return count;
        } catch (err) {
            console.error('신규 가입자 조회 실패:', err);
            return 0;
        }
    };

    const formatCurrency = (amount) => {
        // 포인트를 원화로 환산 (1포인트 = 1원 가정)
        return new Intl.NumberFormat('ko-KR').format(amount) + '원';
    };

    const formatUSD = (amount) => {
        return '$' + amount.toFixed(2);
    };

    const calculateGrowthRate = (today, yesterday) => {
        if (yesterday === 0) {
            return today > 0 ? 100 : 0;
        }
        return ((today - yesterday) / yesterday * 100).toFixed(1);
    };

    if (loading) {
        return (
            <AdminLayout user={user} title="📊 대시보드">
                <LoadingText theme={theme}>데이터를 불러오는 중...</LoadingText>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout user={user} title="📊 대시보드">
                <ErrorText>{error}</ErrorText>
            </AdminLayout>
        );
    }

    const revenueGrowth = calculateGrowthRate(todayRevenue.amount, yesterdayRevenue.amount);
    const newUsersGrowth = calculateGrowthRate(todayNewUsers, yesterdayNewUsers);

    return (
        <AdminLayout user={user} title="📊 대시보드">
            <Section theme={theme}>
                <SectionTitle theme={theme}>오늘의 통계</SectionTitle>
                <SectionContent theme={theme}>
                    <DashboardGrid>
                        {/* 오늘의 매출 */}
                        <StatCard theme={theme}>
                            <StatCardHeader>
                                <StatIcon>💰</StatIcon>
                                <StatTitle theme={theme}>오늘의 매출</StatTitle>
                            </StatCardHeader>
                            <StatValue theme={theme}>{formatCurrency(todayRevenue.amount)}</StatValue>
                            <StatSubValue theme={theme}>결제 건수: {todayRevenue.count}건</StatSubValue>
                            {yesterdayRevenue.amount > 0 && (
                                <StatChange positive={revenueGrowth >= 0}>
                                    어제 대비 {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%
                                </StatChange>
                            )}
                        </StatCard>

                        {/* 오늘의 비용 */}
                        <StatCard theme={theme}>
                            <StatCardHeader>
                                <StatIcon>💸</StatIcon>
                                <StatTitle theme={theme}>오늘의 비용 (예상)</StatTitle>
                            </StatCardHeader>
                            <StatValue theme={theme}>{formatUSD(todayCost.amount)}</StatValue>
                            <StatSubValue theme={theme}>소설 생성: {todayCost.count}건</StatSubValue>
                            <StatSubValue theme={theme} style={{ fontSize: '12px', color: '#e74c3c', marginTop: '8px' }}>
                                ⚠️ 실제 비용은 OpenAI 청구서 기준
                            </StatSubValue>
                        </StatCard>

                        {/* DAU */}
                        <StatCard theme={theme}>
                            <StatCardHeader>
                                <StatIcon>👥</StatIcon>
                                <StatTitle theme={theme}>DAU (일간 활성 유저)</StatTitle>
                            </StatCardHeader>
                            <StatValue theme={theme}>{todayDAU.toLocaleString()}명</StatValue>
                            <StatSubValue theme={theme}>오늘 접속한 유저 수</StatSubValue>
                        </StatCard>

                        {/* 신규 가입자 */}
                        <StatCard theme={theme}>
                            <StatCardHeader>
                                <StatIcon>✨</StatIcon>
                                <StatTitle theme={theme}>신규 가입자</StatTitle>
                            </StatCardHeader>
                            <StatValue theme={theme}>{todayNewUsers.toLocaleString()}명</StatValue>
                            <StatSubValue theme={theme}>오늘 가입한 유저 수</StatSubValue>
                            {yesterdayNewUsers > 0 && (
                                <StatChange positive={newUsersGrowth >= 0}>
                                    어제 대비 {newUsersGrowth >= 0 ? '+' : ''}{newUsersGrowth}%
                                </StatChange>
                            )}
                        </StatCard>
                    </DashboardGrid>
                </SectionContent>
            </Section>
        </AdminLayout>
    );
}

export default AdminDashboard;

