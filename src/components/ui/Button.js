import React from 'react';

const Button = ({ children, onClick, style, type = 'button', ...rest }) => (
    <button
        type={type}
        onClick={onClick}
        style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: '#cb6565',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'background 0.15s',
            ...style
        }}
        {...rest}
        onMouseDown={e => e.currentTarget.style.background = '#fff9f9'}
        onMouseUp={e => e.currentTarget.style.background = 'transparent'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        onFocus={e => e.currentTarget.style.background = '#fff9f9'}
        onBlur={e => e.currentTarget.style.background = 'transparent'}
    >
        {children}
    </button>
);

export default Button; 