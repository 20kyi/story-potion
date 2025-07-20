/**
 * PointIcon.js - 포인트 아이콘 컴포넌트 (동전)
 * 
 * 깔끔하고 단순한 동전 모양의 SVG 아이콘
 * 포인트를 직관적으로 표현하는 디자인
 */

import React from 'react';

const PointIcon = ({ width = 20, height = 20, color = "#3498f3" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 동전 그라데이션 */}
      <defs>
        <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        
        {/* 동전 내부 그라데이션 */}
        <radialGradient id="coinInnerGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF8DC" />
          <stop offset="70%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFA500" />
        </radialGradient>
      </defs>

      {/* 동전 외곽선 */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        fill="url(#coinGradient)"
        stroke="#DAA520"
        strokeWidth="0.5"
      />
      
      {/* 동전 내부 */}
      <circle 
        cx="12" 
        cy="12" 
        r="8" 
        fill="url(#coinInnerGradient)"
      />
      
      {/* 동전 중앙 원 */}
      <circle 
        cx="12" 
        cy="12" 
        r="3" 
        fill="none"
        stroke="#DAA520"
        strokeWidth="1"
      />
      
      {/* 동전 하이라이트 */}
      <ellipse 
        cx="10" 
        cy="10" 
        rx="3" 
        ry="2" 
        fill="rgba(255, 255, 255, 0.6)"
      />
    </svg>
  );
};

export default PointIcon; 