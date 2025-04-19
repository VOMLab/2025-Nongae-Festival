import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleTouchStart = () => {
    navigate('/about');
  }

  return (
    <div className="home bg-main-bg" onClick={handleTouchStart}>
      <div className='flex justify-center items-center h-screen'>
        <img src={"/UI/UI_01.png"} alt="UI_01" className='w-full h-full object-cover' />
      </div>
    </div>
  );
}

export default Home; 