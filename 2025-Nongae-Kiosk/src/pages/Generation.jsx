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
        const socket = socketService.getSocket();

        
        // 진행률 이벤트 리스너
        const progressHandler = (progress) => {
            console.log('서버 진행률:', progress);

            targetProgressRef.current = progress;

            if(!animationRef.current) {
                animationRef.current = requestAnimationFrame(animationProgress);
            }
        };

        // 결과 이미지 이벤트 리스너
        const resultHandler = (data) => {
            // clearTimeout(fallbackTimer);
            resultImagesRef.current = data.resultImage;
            setLoading(100);

            setTimeout(() => {
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
            // clearTimeout(fallbackTimer);
            navigate('/result');
        };

        // 이벤트 리스너 등록
        socket.on('progress', progressHandler);
        socket.on('result-for-kiosk', resultHandler);
        socket.on('error', errorHandler);

        return () => {
            // clearTimeout(fallbackTimer);
            socket.off('progress', progressHandler);
            socket.off('result-for-kiosk', resultHandler);
            socket.off('error', errorHandler);

            if(animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
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
