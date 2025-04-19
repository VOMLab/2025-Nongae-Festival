import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';

const Photo = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const selectedRole = location.state?.selectedRole;
    const [countdown, setCountdown] = useState(0);
    const [isCounting, setIsCounting] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // 사진 촬영 여부 한 번 체크
    const [isPhotoTaken, setIsPhotoTaken] = useState(false);

    useEffect(() => {
      if(isPhotoTaken) {
        navigate('/generation');
      }
    }, [isPhotoTaken, navigate]);


  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStarted(true);
      // 카메라가 시작되면 바로 카운트다운 시작
      startCountdown();
    } catch (err) {
      console.error('카메라 접근 오류:', err);
    }
  };

  const startCountdown = () => {
    setIsCounting(true);
    setCountdown(5);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCounting(false);
          takePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const renderPoseImageFromRole = (role) => {
    switch (role) {
      case '춤꾼':
        return '/UI/UI_04_floating_Pose_01.png';
      case '소리꾼':
        return '/UI/UI_04_floating_Pose_02.png';
      case '관람꾼':
        return '/UI/UI_04_floating_Pose_03.png';
    }
  }

  const renderBackgroundImageFromRole = (role) => {
    switch (role) {
      case '춤꾼':
        return '/UI/UI_04-1.png';
      case '소리꾼':
        return '/UI/UI_04-2.png';
      case '관람꾼':
        return '/UI/UI_04-3.png';
    }
  }

  const convertRoleToNumber = (role) => {
    // 춤꾼, 소리꾼, 관람꾼 순서대로 0, 1, 2로 변환
    switch (role) {
      case '춤꾼':
        return 0;
      case '소리꾼':
        return 1;
      case '관람꾼':
        return 2;
    }
  }


  const takePhoto = async () => {
    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      
      // 여기에 사진 저장 로직 추가
      const photoData = canvas.toDataURL('image/jpeg');
      console.log('사진 촬영 완료:', photoData.substring(0,50));

      const socket = await socketService.getSocket();
      if(!socket || !socket.connected) {
        console.error('서버와 연결이 안되었습니다.');
        return;
      }

      const roleNumber = convertRoleToNumber(selectedRole);
     
      try {
        socket.emit('photo', photoData, roleNumber, socketService.config.kioskId);
        console.log('사진 전송 완료');

      // 카메라 스트림 정지
        streamRef.current.getTracks().forEach(track => track.stop());

        setIsPhotoTaken(true);
      } catch (error) {
        console.error('사진 전송 오류:', error);
      }
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* 배경 */}
      {!isStarted ? (
        <img src={'/UI/UI_03.png'} alt="UI_03" className='w-full h-full object-cover absolute top-0 left-0 -z-10' />
      ) : (
        <img src={renderBackgroundImageFromRole(selectedRole)} alt="UI_04_floating_Pose" className='w-full h-full object-cover absolute top-0 left-0 -z-10' />
      )}
      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center w-full h-full p-10">
        {/* 카메라 뷰어 */}
        <div className="w-full h-full aspect-[1/1.63] overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <img src={'/UI/UI_04_floating_Frame.png'} alt="UI_04_floating_Frame" className='w-full h-full object-cover' />
        </div>
        {/* 역할 포즈 이미지 */}
        {isStarted && (
          <div className='absolute inset-0 w-full h-full flex flex-col justify-end pb-40 items-center'>
            <img src={renderPoseImageFromRole(selectedRole)} alt="UI_04_floating_Pose" className='w-1/4 h-1/4 object-contain' />
          </div>
        )}

      </div>
        {/* 시작 전 오버레이 */}
          {!isStarted && (
            <div className="absolute inset-0 w-full h-full flex flex-col justify-center items-center pb-36">
              <button
                onClick={startCamera}
              >
                <img src={'/UI/UI_03_button_Start.png'} alt="UI_03_button_Start" className='w-46 h-12' />
              </button>
            </div>
          )}

        {/* 카운트 텍스트 */}
        {isStarted &&
        <div className='absolute inset-0 w-full h-full flex flex-col justify-end items-center pb-11 cursor-default'>
            <p className='text-black font-myeongjo text-2xl text-center'>{countdown}</p>
        </div>
        }
          {/* 홈 버튼 */}
          {!isStarted && (
            <Link to="/" className='absolute bottom-28 left-12'>
              <img src={'/UI/UI_03_button_Home.png'} alt="UI_03_button_Home" className='w-1/4 h-1/4' />
            </Link>
          )}
    </div>
  );
};

export default Photo;
