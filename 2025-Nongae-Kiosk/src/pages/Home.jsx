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
        <h1 className='font-myeongjo-bold text-center text-2xl'>화면을 터치하여 시작해주세요</h1>
      </div>
    </div>
  );
}

export default Home; 