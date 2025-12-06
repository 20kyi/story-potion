/**
 * SimplePencilIcon.js - 간단한 연필 아이콘 컴포넌트
 * 
 * 일기를 작성할 수 있는 날을 표시하는 아이콘
 */

import React from 'react';

const SimplePencilIcon = ({ width = 18, height = 18, color = "#2196F3" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill={color}
      />
    </svg>
  );
};

export default SimplePencilIcon;
