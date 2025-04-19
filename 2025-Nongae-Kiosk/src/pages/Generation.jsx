import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';

const Generation = () => {
    const [loading, setLoading] = useState(0);
    const navigate = useNavigate();
    const resultImagesRef = useRef(null);
    const targetProgressRef = useRef(100);
    const animationRef = useRef(null);

    const animationProgress = () => {
        setLoading(prev => {
            if (prev < targetProgressRef.current) {
                const increment = Math.max(0.2, (targetProgressRef.current - prev) * 0.02);
                return Math.min(prev + increment, targetProgressRef.current);
            }
            return prev;
        });

        animationRef.current = requestAnimationFrame(animationProgress);
    };

    useEffect(() => {
        // 소켓 설정을 위한 비동기 함수
        async function setupSocket() {
            const socket = await socketService.getSocket();
            
            // 진행률 이벤트 리스너
            const progressHandler = (progress) => {
                console.log('서버 진행률:', progress);
                
                // 객체로 들어오는 경우와 단순 숫자로 들어오는 경우 모두 처리
                const progressValue = typeof progress === 'object' ? progress.percent : progress;
                targetProgressRef.current = progressValue;

                if(!animationRef.current) {
                    animationRef.current = requestAnimationFrame(animationProgress);
                }
            };

            // 결과 이미지 이벤트 리스너
            const resultHandler = (data) => {
                console.log('결과 이미지 수신:', data);
                resultImagesRef.current = data.resultImage;
                setLoading(100);

                setTimeout(() => {
                    console.log('결과 페이지로 이동 중');
                    navigate('/result', {
                        state: {
                            images: [data.resultImage],
                        },
                    });
                }, 1000);
            };

            // 에러처리
            const errorHandler = (error) => {
                console.error('Error from server:', error.message);
                navigate('/result');
            };

            // 이벤트 리스너 등록
            socket.on('progress', progressHandler);
            socket.on('result-for-kiosk', resultHandler);
            socket.on('error', errorHandler);

            // 클린업 함수 반환
            return () => {
                socket.off('progress', progressHandler);
                socket.off('result-for-kiosk', resultHandler);
                socket.off('error', errorHandler);

                if(animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        }

        // 비동기 함수 실행 및 클린업 설정
        const socketPromise = setupSocket();
        
        return () => {
            // 클린업 시 비동기 작업 처리
            socketPromise.then(cleanup => {
                if (typeof cleanup === 'function') {
                    cleanup();
                }
            });
        };
    }, [navigate]);

    return (
        <main className='bg-main-bg'>
            <div className='flex flex-col items-center justify-center h-screen'>
                <p className="font-myeongjo mb-4">촬영한 사진을 AI 이미지로 생성하고 있습니다.</p>
                <p className="font-myeongjo mb-24">잠시만 기다려주세요.</p>
                <div className="relative w-40 h-40">
                {/* 방사형 선들 */}
                    <div className="absolute inset-0">
                        {[...Array(8)].map((_, index) => (
                            <div
                                key={index}
                                className="absolute top-1/3 left-1/2 w-[1px] h-12 bg-black origin-center"
                                style={{
                                    transform: `rotate(${index * 45}deg) translateY(-130%)`,
                                }}
                            />
                        ))}
                    </div> 
                    {/* 퍼센트 표시 */}
                    <div className="absolute top-1/2 left-1/2 font-bold -translate-x-1/2 -translate-y-1/2 text-2xl font-myeongjo">
                        {Math.round(loading)}%
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Generation;
