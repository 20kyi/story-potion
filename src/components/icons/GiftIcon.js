/**
 * GiftIcon.js - 포션 선물 아이콘 컴포넌트
 * 
 * 테두리만 있는 미니멀한 선물 상자 SVG 아이콘
 */

import React from 'react';

const GiftIcon = ({ width = 24, height = 24, color = "#222" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 선물 상자 본체 (둥근 모서리) */}
      <rect 
        x="5" 
        y="9" 
        width="14" 
        height="11" 
        rx="1.5" 
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* 선물 상자 뚜껑 */}
      <rect 
        x="5" 
        y="6" 
        width="14" 
        height="4" 
        rx="1.5" 
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* 리본 (세로 - 중앙) */}
      <line 
        x1="12" 
        y1="6" 
        x2="12" 
        y2="20" 
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* 리본 (가로 - 중앙) */}
      <line 
        x1="5" 
        y1="13.5" 
        x2="19" 
        y2="13.5" 
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* 리본 매듭 - 왼쪽 루프 */}
      <path 
        d="M10 6 Q7.5 6 7.5 8 Q7.5 10 10 10" 
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* 리본 매듭 - 오른쪽 루프 */}
      <path 
        d="M14 6 Q16.5 6 16.5 8 Q16.5 10 14 10" 
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* 리본 매듭 - 왼쪽 꼬리 */}
      <path 
        d="M8 9.5 L7.5 11" 
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* 리본 매듭 - 오른쪽 꼬리 */}
      <path 
        d="M16 9.5 L16.5 11" 
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default GiftIcon;

