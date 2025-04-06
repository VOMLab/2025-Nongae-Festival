import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Generation = () => {
    const [tempLoading, setTempLoading] = useState(100);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setTempLoading(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    navigate('/result');
                    return 0;
                }
                return prev - 1;
            })
        }, 50);
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
                        {tempLoading}%
                    </div>
                </div>
            </div>


        </main>
    )
}

export default Generation;
