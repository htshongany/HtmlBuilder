
import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  ariaHidden?: boolean;
}

const Icon: React.FC<IconProps> = ({ name, className = '', ariaHidden = true }) => {
  return <i className={`${name} ${className}`} aria-hidden={ariaHidden}></i>;
};

export default Icon;
