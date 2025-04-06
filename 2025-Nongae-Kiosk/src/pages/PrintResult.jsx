import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const PrintResult = () => {
    const navigate = useNavigate();
    const [countDown, setCountDown] = useState(15);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountDown(countDown - 1);
        }, 1000);

        if(countDown === 0) {
            navigate('/');
        }

        return () => clearInterval(timer);
    }, [countDown, navigate]);

    return (
        <main className='bg-main-bg'>
            <div className="flex flex-col font-bold items-center justify-center h-screen font-myeongjo">
                <p>AI 이미지를 엽서로 출력하고 있습니다.</p>
                <p className="mb-12">잠시만 기다려주세요.</p>
                <p className='mb-12'>정면의 LED에서 축제에 방문한 자신의 모습을 찾아보세요.</p>
                <p>{countDown}초 뒤, 처음 화면으로 돌아갑니다.</p>
            </div>
        </main>
    )
}

export default PrintResult;
