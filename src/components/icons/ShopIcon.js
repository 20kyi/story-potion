/**
 * ShopIcon.js - 상점 아이콘 컴포넌트
 * 
 * 포션 상점을 나타내는 쇼핑백 모양의 SVG 아이콘
 */

import React from 'react';

const ShopIcon = ({ width = 20, height = 20, color = "#222" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 쇼핑백 손잡이 */}
      <path 
        d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* 쇼핑백 내부 */}
      <path 
        d="M3 6H21" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* 쇼핑백 손잡이 */}
      <path 
        d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default ShopIcon; 