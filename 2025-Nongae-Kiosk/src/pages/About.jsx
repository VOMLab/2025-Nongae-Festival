import React from 'react';
import { useNavigate } from 'react-router-dom';

function About() {
  const navigate = useNavigate();

  const handleTouchSelect = (role) => {
    navigate(`/photo`, {
      state: {
        selectedRole : role
      }
    });
  }

  return (
    <div className="about font-myeongjo-bold bg-main-bg">
      <div className="h-screen flex flex-col justify-center items-center gap-24">
        <div className='text-center'>
          <p>논개의 혼을 기리고 진주의 멋과 흥을 알리는</p>
          <p>논개제에 오신 것을 환영하오</p>
        </div>
        <h1 className='text-center text-2xl'>역할을 골라주세요</h1>
        <div className='flex justify-center items-center gap-24'>
          <button onClick={() => handleTouchSelect('춤꾼')}>춤꾼</button>
          <button onClick={() => handleTouchSelect('소리꾼')}>소리꾼</button>
          <button onClick={() => handleTouchSelect('관람꾼')}>관람꾼</button>
        </div>
      </div>
    </div>
  );
}

export default About; 