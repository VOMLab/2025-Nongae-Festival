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
    <div className="about font-myeongjo-bold">
      <div className="h-screen flex flex-col justify-center items-center gap-24">
        <img src={'/UI/UI_02.png'} alt="UI_02" className='w-full h-full object-cover absolute top-0 left-0 -z-10' />
        <div className='flex justify-center items-center gap-4 pr-4 pl-4'>
          <button onClick={() => handleTouchSelect('춤꾼')}>
            <img src={'/UI/UI_02_button_Choice_01.png'} alt="UI_02_button_choice_01" className='w-full h-full' />
          </button>
          <button onClick={() => handleTouchSelect('소리꾼')}>
            <img src={'/UI/UI_02_button_Choice_02.png'} alt="UI_02_button_choice_02" className='w-full h-full' />
          </button>
          <button onClick={() => handleTouchSelect('관람꾼')}>
            <img src={'/UI/UI_02_button_Choice_03.png'} alt="UI_02_button_choice_03" className='w-full h-full' />
          </button>
        </div>
      </div>
    </div>
  );
}

export default About; 