import React, { useState } from 'react';
import OctobotIcon from './OctobotIcon';

const Header: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleHover = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000); // Animation duration
  };

  return (
    <header className="bg-white bg-opacity-10 text-white p-4 shadow-md">
      <div 
        className="flex items-center space-x-3 cursor-pointer transition-transform duration-300 ease-in-out transform hover:scale-105"
        onMouseEnter={handleHover}
      >
        <div className={`transition-transform duration-1000 ${isAnimating ? 'animate-wiggle' : ''}`}>
          <OctobotIcon size={40} color="white" />
        </div>
        <h1 className="text-3xl font-bold tracking-wider">
          Ayush's <span className="text-yellow-300">Octa</span>bot
        </h1>
      </div>
    </header>
  );
};

export default Header;