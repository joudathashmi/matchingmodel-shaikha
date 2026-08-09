import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import typography from '../../common/typography';

// Define types for our props
interface Option {
  value: string;
  label: string;
}

interface HeatMapCustomSelectProps {
  options: Option[];
  defaultValue?: string;
  onChange?: (value: string) => void;
}

const SelectWrapper = styled.div`
  position: relative;
  width: 120px;
  font-size: 0.75rem;
  
  @media (min-width: 2560px) {
    font-size: 1.4rem;
    width: 220px;
  }
`;

const SelectHeader = styled.div<{ isOpen: boolean }>`
  background: rgba(42, 51, 59, 1);
  border-radius: 8px;
  color: white;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (min-width: 2560px) {
    padding: 13px 19px;
  }
  

`;

const SelectList = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: rgba(42, 51, 59, 1);
  
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: ${props => props.isOpen ? '90px' : '0'};
  height: ${props => props.isOpen ? 'auto' : '0'};
  overflow-y: auto;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: ${props => props.isOpen ? '0 4px 15px rgba(0, 0, 0, 0.5)' : 'none'};
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  -ms-overflow-style: none;  
  scrollbar-width: none;  
  
  @media (min-width: 2560px) {
    max-height: ${props => props.isOpen ? '100px' : '0'};
  }
`;

const SelectItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 255, 136, 0.2);
    color: #00ff88;
  }
  
  @media (min-width: 2560px) {
    padding: 12px 16px;
  }
`;

const Arrow = styled.span<{ isOpen: boolean }>`
  transition: transform 0.3s ease;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
`;

const HeatMapCustomSelect: React.FC<HeatMapCustomSelectProps> = ({
  options,
  defaultValue = '',
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const selectRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(option => option.value === selectedValue) || options[0];

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    setIsOpen(false);
    if (onChange) {
      onChange(value);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <SelectWrapper ref={selectRef}>
      <SelectHeader isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption.label}</span>
        <Arrow isOpen={isOpen}>▼</Arrow>
      </SelectHeader>
      <SelectList isOpen={isOpen}>
        {options.map(option => (
          <SelectItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectList>
    </SelectWrapper>
  );
};

export default HeatMapCustomSelect;