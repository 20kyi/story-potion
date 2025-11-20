/**
 * GiftIcon.js - 포션 선물 아이콘 컴포넌트
 * 
 * 선물 상자 모양의 SVG 아이콘
 */

import React from 'react';

const GiftIcon = ({ width = 24, height = 24, color = "#e46262" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 선물 상자 */}
      <rect 
        x="4" 
        y="6" 
        width="16" 
        height="12" 
        rx="2" 
        fill={color}
        opacity="0.9"
      />
      
      {/* 리본 (세로) */}
      <rect 
        x="11" 
        y="6" 
        width="2" 
        height="12" 
        fill="rgba(255, 255, 255, 0.8)"
      />
      
      {/* 리본 (가로) */}
      <rect 
        x="4" 
        y="11" 
        width="16" 
        height="2" 
        fill="rgba(255, 255, 255, 0.8)"
      />
      
      {/* 리본 장식 (왼쪽) */}
      <path 
        d="M4 11 L8 8 L8 11 Z" 
        fill="rgba(255, 255, 255, 0.6)"
      />
      
      {/* 리본 장식 (오른쪽) */}
      <path 
        d="M20 11 L16 8 L16 11 Z" 
        fill="rgba(255, 255, 255, 0.6)"
      />
      
      {/* 리본 장식 (위) */}
      <path 
        d="M11 6 L13 6 L12 4 Z" 
        fill="rgba(255, 255, 255, 0.6)"
      />
    </svg>
  );
};

export default GiftIcon;

