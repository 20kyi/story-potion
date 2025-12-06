/**
 * XMarkIcon.js - X 마크 아이콘 컴포넌트
 * 
 * 일기를 작성하지 않은 날을 표시하는 아이콘
 */

import React from 'react';

const XMarkIcon = ({ width = 18, height = 18, color = "#F44336" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default XMarkIcon;
