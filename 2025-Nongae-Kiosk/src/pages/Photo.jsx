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

  const renderTextFromRole = (role) => {
    switch (role) {
      case '춤꾼':
        return '춤추는 포즈를 취해보세요';
      case '소리꾼':
        return '악기를 연주하는 포즈를 취해보세요';
      case '관람꾼':
        return '구경하는 포즈를 취해보세요'
    }
  }


  const takePhoto = () => {
    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      
      // 여기에 사진 저장 로직 추가
      const photoData = canvas.toDataURL('image/jpeg');
      console.log('사진 촬영 완료:', photoData.substring(0,50));

      const socket = socketService.getSocket();
      if(!socket || !socket.connected) {
        console.error('서버와 연결이 안되었습니다.');
        return;
      }
     
      try {
        socket.emit('photo', photoData);
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
    <div className="relative flex flex-col min-h-screen bg-main-bg">
      {/* HOME 버튼 */}
      <div className="absolute top-4 right-4 z-50">
        <Link 
          to="/" 
          className="px-4 py-2 bg-[#C4B5A5] text-white rounded-full font-myeongjo text-sm"
        >
          🏠HOME
        </Link>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* 카메라 뷰어 */}
        <div className="relative w-full max-w-md aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>
        {/* 역할 텍스트 */}
        {isStarted &&
        <div>
            <p className="text-black font-myeongjo text-lg mb-2">
                {renderTextFromRole(selectedRole)}
            </p>
            <p className='text-black font-myeongjo text-2xl text-center'>{countdown}</p>
        </div>
        }
      </div>
        {/* 시작 전 오버레이 */}
          {!isStarted && (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black-opacity-50">
              <p className="text-black font-myeongjo text-lg mb-8">
                버튼을 누르면 5초 후에 사진이 촬영됩니다
              </p>
              <button
                onClick={startCamera}
                className="px-8 py-2 bg-[#8B7355] text-white rounded-full font-myeongjo text-lg hover:bg-[#6D5D45] transition-colors"
              >
                시작
              </button>
            </div>
          )}
    </div>
  );
};

export default Photo;
