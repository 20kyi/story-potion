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
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : 'white'};
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.3' : '0.1'});
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#e0e0e0'};
  display: flex;
  flex-direction: column;
  overflow: visible;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const StatTitle = styled.h3`
  color: ${({ theme }) => theme.text};
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 16px 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const StatValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const StatSubValue = styled.div`
  color: ${({ theme }) => theme.theme === 'dark' ? '#bdc3c7' : '#666'};
  font-size: 14px;
  margin-bottom: 4px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const StatChange = styled.div`
  color: ${({ positive }) => positive ? '#27ae60' : '#e74c3c'};
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  
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

const ChartContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.theme === 'dark' ? '#2c3e50' : 'white'};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,${({ theme }) => theme.theme === 'dark' ? '0.3' : '0.1'});
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#34495e' : '#e0e0e0'};
  height: 300px;
  overflow: hidden;
  box-sizing: border-box;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    height: 250px;
    padding: 15px;
  }
`;

const ChartWrapper = styled.div`
  flex: 1;
  position: relative;
  min-height: 0;
`;

const ChartTitle = styled.h3`
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 15px 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  
  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 10px;
  }
`;

function AdminDashboard({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 오늘의 통계
    const [todayRevenue, setTodayRevenue] = useState({ amount: 0, subscriptionCount: 0, pointCount: 0 });
    const [todayCost, setTodayCost] = useState({ amount: 0, novelCount: 0, coverCount: 0 });
    const [todayDAU, setTodayDAU] = useState(0);
    const [todayNewUsers, setTodayNewUsers] = useState(0);

    // 어제의 통계 (비교용)
    const [yesterdayRevenue, setYesterdayRevenue] = useState({ amount: 0, subscriptionCount: 0, pointCount: 0 });
    const [yesterdayDAU, setYesterdayDAU] = useState(0);
    const [yesterdayNewUsers, setYesterdayNewUsers] = useState(0);

    // 지난 7일간의 트렌드 데이터
    const [trendData, setTrendData] = useState({
        revenue: [],
        cost: [],
        diaries: [],
        novels: [],
        labels: []
    });

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

            console.log('대시보드 데이터 조회 시작');

            // 각 데이터를 개별적으로 조회하고 에러가 발생해도 계속 진행
            try {
                const todayRevenueData = await fetchTodayRevenue(todayStartTs, todayEndTs);
                setTodayRevenue(todayRevenueData);
                console.log('오늘의 매출:', todayRevenueData);
            } catch (err) {
                console.error('매출 조회 실패:', err);
                setTodayRevenue({ amount: 0, subscriptionCount: 0, pointCount: 0 });
            }

            try {
                const yesterdayRevenueData = await fetchTodayRevenue(yesterdayStartTs, yesterdayEndTs);
                setYesterdayRevenue(yesterdayRevenueData);
            } catch (err) {
                console.error('어제 매출 조회 실패:', err);
                setYesterdayRevenue({ amount: 0, subscriptionCount: 0, pointCount: 0 });
            }

            try {
                const todayCostData = await fetchTodayCost(todayStartTs, todayEndTs);
                setTodayCost(todayCostData);
                console.log('오늘의 비용:', todayCostData);
            } catch (err) {
                console.error('비용 조회 실패:', err);
                setTodayCost({ amount: 0, novelCount: 0, coverCount: 0 });
            }

            try {
                const dau = await fetchDAU(todayStartTs, todayEndTs);
                setTodayDAU(dau);
                console.log('DAU:', dau);
            } catch (err) {
                console.error('DAU 조회 실패:', err);
                setTodayDAU(0);
            }

            try {
                const yesterdayDAU = await fetchDAU(yesterdayStartTs, yesterdayEndTs);
                setYesterdayDAU(yesterdayDAU);
            } catch (err) {
                console.error('어제 DAU 조회 실패:', err);
                setYesterdayDAU(0);
            }

            try {
                const newUsers = await fetchNewUsers(todayStartTs, todayEndTs);
                setTodayNewUsers(newUsers);
                console.log('오늘의 신규 가입자:', newUsers);
            } catch (err) {
                console.error('신규 가입자 조회 실패:', err);
                setTodayNewUsers(0);
            }

            try {
                const yesterdayNewUsers = await fetchNewUsers(yesterdayStartTs, yesterdayEndTs);
                setYesterdayNewUsers(yesterdayNewUsers);
            } catch (err) {
                console.error('어제 신규 가입자 조회 실패:', err);
                setYesterdayNewUsers(0);
            }

            console.log('대시보드 데이터 조회 완료');

            // 지난 7일간의 트렌드 데이터 조회
            try {
                const trend = await fetchTrendData();
                setTrendData(trend);
                console.log('트렌드 데이터:', trend);
            } catch (err) {
                console.error('트렌드 데이터 조회 실패:', err);
            }
        } catch (err) {
            console.error('대시보드 데이터 조회 실패:', err);
            setError('데이터를 불러오는 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 지난 7일간의 트렌드 데이터 조회
    const fetchTrendData = async () => {
        const labels = [];
        const revenueData = [];
        const costData = [];
        const diariesData = [];
        const novelsData = [];

        // 지난 7일간의 날짜 배열 생성
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const dateEnd = new Date(date);
            dateEnd.setHours(23, 59, 59, 999);

            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            labels.push(dateStr);

            const startTs = Timestamp.fromDate(date);
            const endTs = Timestamp.fromDate(dateEnd);

            // 해당 날짜의 매출 조회
            const revenue = await fetchTodayRevenue(startTs, endTs);
            revenueData.push(revenue.amount);

            // 해당 날짜의 비용 조회
            const cost = await fetchTodayCost(startTs, endTs);
            costData.push(cost.amount);

            // 해당 날짜의 일기 작성 수 조회
            const diaries = await fetchDiaryCount(date, dateEnd);
            diariesData.push(diaries);

            // 해당 날짜의 소설 생성 수 조회
            const novels = await fetchNovelCount(startTs, endTs);
            novelsData.push(novels);
        }

        return {
            labels,
            revenue: revenueData,
            cost: costData,
            diaries: diariesData,
            novels: novelsData
        };
    };

    // 일기 작성 수 조회
    const fetchDiaryCount = async (startDate, endDate) => {
        try {
            const formatDateToString = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startStr = formatDateToString(startDate);
            const endStr = formatDateToString(endDate);

            const diariesRef = collection(db, 'diaries');
            const q = query(
                diariesRef,
                where('date', '>=', startStr),
                where('date', '<=', endStr)
            );

            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (err) {
            console.error('일기 수 조회 실패:', err);
            return 0;
        }
    };

    // 소설 생성 수 조회
    const fetchNovelCount = async (startTs, endTs) => {
        try {
            const novelsRef = collection(db, 'novels');
            const startDate = startTs.toDate();
            const endDate = endTs.toDate();

            let snapshot;
            try {
                const q = query(
                    novelsRef,
                    where('createdAt', '>=', startTs),
                    where('createdAt', '<=', endTs)
                );
                snapshot = await getDocs(q);
            } catch (queryErr) {
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

            return count;
        } catch (err) {
            console.error('소설 수 조회 실패:', err);
            return 0;
        }
    };

    // 포인트 패키지 가격 매핑
    const getPointPackagePrice = (points) => {
        // desc에서 포인트 수를 파싱하여 실제 결제 금액 계산
        // 포인트 100개: 1,000원, 500개: 5,000원, 1000개: 9,900원, 2000개: 19,800원
        if (points >= 2000) return 19800;
        if (points >= 1000) return 9900;
        if (points >= 500) return 5000;
        if (points >= 100) return 1000;
        return 0;
    };

    // 오늘의 매출 조회 (인앱 결제)
    const fetchTodayRevenue = async (startTs, endTs) => {
        try {
            let totalAmount = 0;
            let subscriptionCount = 0;
            let pointCount = 0;

            const startDate = startTs.toDate();
            const endDate = endTs.toDate();

            console.log('매출 조회 시작:', { startDate, endDate });

            // 1. 구독 결제 조회 (purchases 컬렉션에서 실제 구매 내역 확인)
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);

            console.log('전체 사용자 수:', usersSnapshot.size);

            // 구독 구매 내역 조회
            const subscriptionPromises = [];
            usersSnapshot.forEach((userDoc) => {
                const purchasesRef = collection(db, 'users', userDoc.id, 'purchases');
                subscriptionPromises.push(getDocs(purchasesRef));
            });

            const subscriptionResults = await Promise.all(subscriptionPromises);
            subscriptionResults.forEach((snapshot, userIndex) => {
                snapshot.forEach((purchaseDoc) => {
                    const purchaseData = purchaseDoc.data();
                    const products = purchaseData.products || [];

                    // 구독 상품 확인
                    const isSubscription = products.some(productId =>
                        productId === 'premium_monthly' || productId === 'premium_yearly'
                    );

                    if (isSubscription) {
                        let purchaseTime = null;
                        if (purchaseData.purchaseTime) {
                            if (purchaseData.purchaseTime.toDate) {
                                purchaseTime = purchaseData.purchaseTime.toDate();
                            } else if (purchaseData.purchaseTime instanceof Date) {
                                purchaseTime = purchaseData.purchaseTime;
                            } else {
                                purchaseTime = new Date(purchaseData.purchaseTime);
                            }
                        } else if (purchaseData.createdAt) {
                            if (purchaseData.createdAt.toDate) {
                                purchaseTime = purchaseData.createdAt.toDate();
                            } else if (purchaseData.createdAt instanceof Date) {
                                purchaseTime = purchaseData.createdAt;
                            } else {
                                purchaseTime = new Date(purchaseData.createdAt);
                            }
                        }

                        if (purchaseTime && purchaseTime >= startDate && purchaseTime <= endDate) {
                            subscriptionCount++;
                            // 구독 가격 (월간 5,900원, 연간 49,560원)
                            const isYearly = products.includes('premium_yearly');
                            totalAmount += isYearly ? 49560 : 5900;
                            console.log('구독 구매 발견:', {
                                uid: usersSnapshot.docs[userIndex].id,
                                purchaseTime,
                                isYearly,
                                products
                            });
                        }
                    }
                });
            });

            console.log('구독 집계 결과:', { subscriptionCount, subscriptionAmount: totalAmount });

            // 2. 포인트 충전 조회
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
                            // 실제 결제 금액 계산 (포인트 수로 패키지 가격 매핑)
                            const actualPrice = getPointPackagePrice(data.amount);
                            console.log('포인트 충전 발견:', {
                                amount: data.amount,
                                actualPrice,
                                createdAt,
                                desc: data.desc
                            });
                            totalAmount += actualPrice;
                            pointCount++;
                        }
                    }
                });
            });

            console.log('포인트 충전 집계 결과:', { pointCount, pointAmount: totalAmount - (subscriptionCount > 0 ? (subscriptionCount * 9900) : 0) });
            console.log('최종 매출 집계:', { totalAmount, subscriptionCount, pointCount });

            return { amount: totalAmount, subscriptionCount, pointCount };
        } catch (err) {
            console.error('매출 조회 실패:', err);
            return { amount: 0, subscriptionCount: 0, pointCount: 0 };
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

            let novelCount = 0;
            let coverCount = 0;

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
                    novelCount++;
                    // imageUrl이 있으면 표지 이미지 생성된 것으로 간주
                    if (data.imageUrl) {
                        coverCount++;
                    }
                }
            });

            // 실제 API 비용 계산 (2024년 기준)
            // GPT-4o: 입력 $2.50/1M tokens, 출력 $10/1M tokens
            // 소설 생성 시 평균: 입력 5,000 tokens, 출력 8,000 tokens
            // 입력 비용: 5,000 * $2.50/1M = $0.0125
            // 출력 비용: 8,000 * $10/1M = $0.08
            // 총: 약 $0.09-0.10 = 약 ₩120-130 (환율 1,300원 기준)
            // DALL-E 3: $0.04 per image (1024x1024) = 약 ₩50-55
            const GPT4oCostPerNovel = 130; // 원화 (보수적 추정)
            const DALLE3CostPerImage = 55; // 원화

            const gpt4oCost = novelCount * GPT4oCostPerNovel;
            const dalle3Cost = coverCount * DALLE3CostPerImage;
            const totalCost = gpt4oCost + dalle3Cost;

            return { amount: totalCost, novelCount, coverCount };
        } catch (err) {
            console.error('비용 조회 실패:', err);
            return { amount: 0, novelCount: 0, coverCount: 0 };
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
                <Section theme={theme}>
                    <SectionContent theme={theme} isOpen={true}>
                        <LoadingText theme={theme}>데이터를 불러오는 중...</LoadingText>
                    </SectionContent>
                </Section>
            </AdminLayout>
        );
    }

    const revenueGrowth = calculateGrowthRate(todayRevenue.amount, yesterdayRevenue.amount);
    const dauGrowth = calculateGrowthRate(todayDAU, yesterdayDAU);
    const newUsersGrowth = calculateGrowthRate(todayNewUsers, yesterdayNewUsers);

    const formatCurrencyWithWon = (amount) => {
        return '₩' + new Intl.NumberFormat('ko-KR').format(amount);
    };

    // 매출 대비 비용 비율 계산
    const costPercentage = todayRevenue.amount > 0
        ? ((todayCost.amount / todayRevenue.amount) * 100).toFixed(0)
        : 0;

    return (
        <AdminLayout user={user} title="📊 대시보드">
            <Section theme={theme}>
                {error && (
                    <div style={{ padding: '10px', background: '#fff3cd', color: '#856404', borderRadius: '4px', marginBottom: '20px' }}>
                        ⚠️ {error}
                    </div>
                )}
                <SectionContent theme={theme} isOpen={true}>
                    <DashboardGrid>
                        {/* 오늘의 매출 */}
                        <StatCard theme={theme}>
                            <StatTitle theme={theme}>💰 오늘의 매출</StatTitle>
                            <StatValue theme={theme}>{formatCurrencyWithWon(todayRevenue.amount)}</StatValue>
                            <StatSubValue theme={theme}>
                                (구독 {todayRevenue.subscriptionCount}건, 포인트 {todayRevenue.pointCount}건)
                            </StatSubValue>
                        </StatCard>

                        {/* 예상 API 비용 */}
                        <StatCard theme={theme}>
                            <StatTitle theme={theme}>💎 예상 API 비용</StatTitle>
                            <StatSubValue theme={theme} style={{ marginBottom: '8px' }}>
                                (GPT-4o + DALL-E)
                            </StatSubValue>
                            <StatValue theme={theme}>
                                {formatCurrencyWithWon(-todayCost.amount)}
                                {costPercentage > 0 && (
                                    <span style={{ fontSize: '18px', fontWeight: 'normal', marginLeft: '8px' }}>
                                        ({costPercentage}%)
                                    </span>
                                )}
                            </StatValue>
                            <StatSubValue theme={theme} style={{ marginTop: '8px' }}>
                                (소설 {todayCost.novelCount}건, 표지 {todayCost.coverCount}장)
                            </StatSubValue>
                        </StatCard>

                        {/* DAU */}
                        <StatCard theme={theme}>
                            <StatTitle theme={theme}>👥 오늘의 방문자(DAU)</StatTitle>
                            <StatValue theme={theme}>{todayDAU.toLocaleString()}명</StatValue>
                            <StatChange positive={dauGrowth >= 0}>
                                (어제 대비 {dauGrowth >= 0 ? '+' : ''}{dauGrowth}%)
                            </StatChange>
                        </StatCard>

                        {/* 신규 가입자 */}
                        <StatCard theme={theme}>
                            <StatTitle theme={theme}>✨ 신규 가입자</StatTitle>
                            <StatValue theme={theme}>{todayNewUsers.toLocaleString()}명</StatValue>
                            <StatChange positive={newUsersGrowth >= 0}>
                                (어제 대비 {newUsersGrowth >= 0 ? '+' : ''}{newUsersGrowth}%)
                            </StatChange>
                            {yesterdayNewUsers > 0 && (
                                <StatChange positive={newUsersGrowth >= 0}>
                                    어제 대비 {newUsersGrowth >= 0 ? '+' : ''}{newUsersGrowth}%
                                </StatChange>
                            )}
                        </StatCard>
                    </DashboardGrid>
                </SectionContent>
            </Section>

            {/* 활동 그래프 */}
            <Section theme={theme}>
                <SectionTitle theme={theme}>📈 활동 그래프 (Trend)</SectionTitle>
                <SectionContent theme={theme} isOpen={true}>
                    <ChartContainer>
                        {/* 매출 vs 비용 그래프 */}
                        <ChartCard theme={theme}>
                            <ChartTitle theme={theme}>매출(💙) vs 비용(🩷) 추이</ChartTitle>
                            <ChartWrapper>
                                <Line
                                    data={{
                                        labels: trendData.labels,
                                        datasets: [
                                            {
                                                label: '💙 매출',
                                                data: trendData.revenue.map(val => val / 100), // 백원 단위로 변환
                                                borderColor: '#3498f3',
                                                backgroundColor: 'rgba(52, 152, 243, 0.1)',
                                                tension: 0.4,
                                                fill: false,
                                                pointStyle: false
                                            },
                                            {
                                                label: '🩷 비용',
                                                data: trendData.cost.map(val => val / 100), // 백원 단위로 변환
                                                borderColor: '#ff69b4',
                                                backgroundColor: 'rgba(255, 105, 180, 0.1)',
                                                tension: 0.4,
                                                fill: false,
                                                pointStyle: false
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        layout: {
                                            padding: {
                                                top: 5,
                                                bottom: 5,
                                                left: 0,
                                                right: 5
                                            }
                                        },
                                        plugins: {
                                            legend: {
                                                display: false
                                            },
                                            title: {
                                                display: false
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        const value = context.parsed.y;
                                                        return '₩' + new Intl.NumberFormat('ko-KR').format(Math.round(value * 100));
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    stepSize: 2,
                                                    padding: 0
                                                },
                                                grid: {
                                                    drawBorder: false
                                                }
                                            },
                                            x: {
                                                title: {
                                                    display: false
                                                },
                                                ticks: {
                                                    padding: 0
                                                },
                                                grid: {
                                                    drawBorder: false
                                                }
                                            }
                                        },
                                        elements: {
                                            point: {
                                                radius: 0
                                            }
                                        }
                                    }}
                                />
                            </ChartWrapper>
                        </ChartCard>

                        {/* 일기 작성 vs 소설 생성 그래프 */}
                        <ChartCard theme={theme}>
                            <ChartTitle theme={theme}>일기작성(💚) vs 소설생성(💜)</ChartTitle>
                            <ChartWrapper>
                                <Line
                                    data={{
                                        labels: trendData.labels,
                                        datasets: [
                                            {
                                                label: '💜 일기 작성',
                                                data: trendData.diaries,
                                                borderColor: '#27ae60',
                                                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                                                tension: 0.4,
                                                fill: false,
                                                pointStyle: false
                                            },
                                            {
                                                label: '💚 소설 생성',
                                                data: trendData.novels,
                                                borderColor: '#9b59b6',
                                                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                                                tension: 0.4,
                                                fill: false,
                                                pointStyle: false
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        layout: {
                                            padding: {
                                                top: 5,
                                                bottom: 5,
                                                left: 0,
                                                right: 5
                                            }
                                        },
                                        plugins: {
                                            legend: {
                                                display: false
                                            },
                                            title: {
                                                display: false
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    stepSize: 1,
                                                    padding: 0
                                                },
                                                grid: {
                                                    drawBorder: false
                                                }
                                            },
                                            x: {
                                                title: {
                                                    display: false
                                                },
                                                ticks: {
                                                    padding: 0
                                                },
                                                grid: {
                                                    drawBorder: false
                                                }
                                            }
                                        },
                                        elements: {
                                            point: {
                                                radius: 0
                                            }
                                        }
                                    }}
                                />
                            </ChartWrapper>
                        </ChartCard>
                    </ChartContainer>
                </SectionContent>
            </Section>
        </AdminLayout>
    );
}

export default AdminDashboard;

