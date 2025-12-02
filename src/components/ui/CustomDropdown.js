import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../ThemeContext';
import styled from 'styled-components';

const DropdownContainer = styled.div`
    position: relative;
    width: ${props => props.width || '160px'};
    margin-left: auto;
`;

const DropdownButton = styled.button`
    width: 100%;
    padding: ${props => props.padding || '6px 12px'};
    font-size: ${props => props.fontSize || '14px'};
    border-radius: ${props => props.borderRadius || '8px'};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    font-family: inherit;
    outline: none;
    border: ${props => {
        if (props.$actualTheme === 'diary') {
            return '1px solid rgba(139, 111, 71, 0.3)';
        } else if (props.$actualTheme === 'glass') {
            return '2px solid rgba(255, 255, 255, 0.7)';
        } else if (props.$actualTheme === 'dark') {
            return '1px solid #333333';
        } else {
            return '1px solid #e0e0e0';
        }
    }};
    background: ${props => {
        if (props.$actualTheme === 'diary') {
            return '#fff';
        } else if (props.$actualTheme === 'glass') {
            return 'rgba(255, 255, 255, 0.15)';
        } else if (props.$actualTheme === 'dark') {
            return '#232323';
        } else {
            return '#fff';
        }
    }};
    color: ${props => {
        if (props.$actualTheme === 'diary') {
            return '#8B6F47';
        } else if (props.$actualTheme === 'glass') {
            return '#000000';
        } else if (props.$actualTheme === 'dark') {
            return '#f1f1f1';
        } else {
            return '#222';
        }
    }};
    backdrop-filter: ${props => props.$actualTheme === 'glass' ? 'blur(15px)' : 'none'};
    -webkit-backdrop-filter: ${props => props.$actualTheme === 'glass' ? 'blur(15px)' : 'none'};
    box-shadow: ${props => props.$actualTheme === 'glass' ? '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none'};
    
    &:hover {
        border-color: ${props => {
        if (props.$actualTheme === 'glass') {
            return 'rgba(255, 255, 255, 0.9)';
        } else if (props.$actualTheme === 'dark') {
            return '#444444';
        } else {
            return '#cb6565';
        }
    }};
        background: ${props => {
        if (props.$actualTheme === 'glass') {
            return 'rgba(255, 255, 255, 0.2)';
        }
        return 'inherit';
    }};
    }
    
    &:focus {
        border-color: ${props => {
        if (props.$actualTheme === 'glass') {
            return 'rgba(255, 255, 255, 0.9)';
        } else if (props.$actualTheme === 'dark') {
            return '#555555';
        } else {
            return '#cb6565';
        }
    }};
        box-shadow: ${props => {
        if (props.$actualTheme === 'glass') {
            return '0 0 0 3px rgba(255, 255, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
        } else if (props.$actualTheme === 'dark') {
            return '0 0 0 2px rgba(203, 101, 101, 0.3)';
        } else {
            return '0 0 0 2px rgba(203, 101, 101, 0.15)';
        }
    }};
        background: ${props => {
        if (props.$actualTheme === 'glass') {
            return 'rgba(255, 255, 255, 0.2)';
        }
        return 'inherit';
    }};
    }
    
    &:active {
        transform: scale(0.98);
    }
`;

const DropdownArrow = styled.span`
    display: inline-block;
    width: 0;
    height: 0;
    margin-left: 8px;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: ${props => {
        const color = props.$actualTheme === 'diary' ? '#8B6F47' :
            props.$actualTheme === 'glass' ? 'rgba(255, 255, 255, 0.9)' :
                props.$actualTheme === 'dark' ? '#f1f1f1' : '#222';
        return `6px solid ${color}`;
    }};
    filter: ${props => props.$actualTheme === 'glass' ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))' : 'none'};
    transition: transform 0.2s ease;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DropdownList = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 1000;
    max-height: 200px;
    overflow-y: auto;
    border-radius: ${props => props.$borderRadius || '8px'};
    box-shadow: ${props => {
        if (props.$actualTheme === 'glass') {
            return '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
        } else if (props.$actualTheme === 'dark') {
            return '0 4px 16px rgba(0, 0, 0, 0.5)';
        } else {
            return '0 2px 8px rgba(0, 0, 0, 0.1)';
        }
    }};
    border: ${props => {
        if (props.$actualTheme === 'diary') {
            return '1px solid rgba(139, 111, 71, 0.3)';
        } else if (props.$actualTheme === 'glass') {
            return '2px solid rgba(255, 255, 255, 0.7)';
        } else if (props.$actualTheme === 'dark') {
            return '1px solid #333333';
        } else {
            return '1px solid #e0e0e0';
        }
    }};
    background: ${props => {
        if (props.$actualTheme === 'diary') {
            return '#fff';
        } else if (props.$actualTheme === 'glass') {
            return 'rgba(255, 255, 255, 0.25)';
        } else if (props.$actualTheme === 'dark') {
            return '#232323';
        } else {
            return '#fff';
        }
    }};
    backdrop-filter: ${props => props.$actualTheme === 'glass' ? 'blur(20px)' : 'none'};
    -webkit-backdrop-filter: ${props => props.$actualTheme === 'glass' ? 'blur(20px)' : 'none'};
    opacity: ${props => props.$isOpen ? 1 : 0};
    visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
    transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
    transition: all 0.2s ease;
    pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
`;

const DropdownItem = styled.div`
    padding: ${props => props.$padding || '10px 12px'};
    cursor: pointer;
    font-size: ${props => props.$fontSize || '14px'};
    color: ${props => {
        if (props.$actualTheme === 'diary') {
            return '#8B6F47';
        } else if (props.$actualTheme === 'glass') {
            return '#000000';
        } else if (props.$actualTheme === 'dark') {
            return '#f1f1f1';
        } else {
            return '#222';
        }
    }};
    background: ${props => props.$isSelected ?
        (props.$actualTheme === 'glass' ? 'rgba(255, 255, 255, 0.3)' :
            props.$actualTheme === 'dark' ? 'rgba(203, 101, 101, 0.3)' :
                'rgba(203, 101, 101, 0.1)') : 'transparent'};
    transition: all 0.15s ease;
    border-left: ${props => props.$isSelected && props.$actualTheme === 'glass' ? '3px solid rgba(255, 255, 255, 0.8)' : '3px solid transparent'};
    
    &:hover {
        background: ${props => {
        if (props.$actualTheme === 'glass') {
            return 'rgba(255, 255, 255, 0.2)';
        } else if (props.$actualTheme === 'dark') {
            return 'rgba(255, 255, 255, 0.1)';
        } else {
            return 'rgba(203, 101, 101, 0.1)';
        }
    }};
        border-left: ${props => props.$actualTheme === 'glass' ? '3px solid rgba(255, 255, 255, 0.6)' : '3px solid transparent'};
    }
    
    &:active {
        background: ${props => {
        if (props.$actualTheme === 'glass') {
            return 'rgba(255, 255, 255, 0.35)';
        } else if (props.$actualTheme === 'dark') {
            return 'rgba(203, 101, 101, 0.4)';
        } else {
            return 'rgba(203, 101, 101, 0.15)';
        }
    }};
        border-left: ${props => props.$actualTheme === 'glass' ? '3px solid rgba(255, 255, 255, 1)' : '3px solid transparent'};
    }
    
    &:first-child {
        border-top-left-radius: ${props => props.$borderRadius || '8px'};
        border-top-right-radius: ${props => props.$borderRadius || '8px'};
    }
    
    &:last-child {
        border-bottom-left-radius: ${props => props.$borderRadius || '8px'};
        border-bottom-right-radius: ${props => props.$borderRadius || '8px'};
    }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    background: transparent;
    display: ${props => props.$isOpen ? 'block' : 'none'};
`;

function CustomDropdown({
    value,
    onChange,
    options,
    width,
    padding,
    fontSize,
    borderRadius,
    placeholder
}) {
    const { actualTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    // 현재 선택된 옵션의 라벨 찾기
    const selectedOption = options.find(opt => {
        if (typeof opt === 'object') {
            return opt.value === value;
        }
        return opt === value;
    });

    const displayText = selectedOption
        ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
        : (placeholder || '선택하세요');

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    // 드롭다운 열기/닫기
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // 옵션 선택
    const handleSelect = (option) => {
        const optionValue = typeof option === 'object' ? option.value : option;
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <>
            <Overlay $isOpen={isOpen} onClick={() => setIsOpen(false)} />
            <DropdownContainer ref={dropdownRef} width={width}>
                <DropdownButton
                    ref={buttonRef}
                    onClick={toggleDropdown}
                    $actualTheme={actualTheme}
                    padding={padding}
                    fontSize={fontSize}
                    borderRadius={borderRadius}
                    type="button"
                >
                    <span>{displayText}</span>
                    <DropdownArrow $isOpen={isOpen} $actualTheme={actualTheme} />
                </DropdownButton>
                <DropdownList
                    $isOpen={isOpen}
                    $actualTheme={actualTheme}
                    $borderRadius={borderRadius}
                >
                    {options.map((option, index) => {
                        const optionValue = typeof option === 'object' ? option.value : option;
                        const optionLabel = typeof option === 'object' ? option.label : option;
                        const isSelected = optionValue === value;

                        return (
                            <DropdownItem
                                key={index}
                                onClick={() => handleSelect(option)}
                                $isSelected={isSelected}
                                $actualTheme={actualTheme}
                                $padding={padding}
                                $fontSize={fontSize}
                                $borderRadius={borderRadius}
                            >
                                {optionLabel}
                            </DropdownItem>
                        );
                    })}
                </DropdownList>
            </DropdownContainer>
        </>
    );
}

export default CustomDropdown;

