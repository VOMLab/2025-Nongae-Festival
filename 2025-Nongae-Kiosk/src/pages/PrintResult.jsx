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
        <main className='overflow-hidden h-screen'>
            <img src={'/UI/UI_07.png'} alt="UI_07" className='w-full h-full object-cover' />
            <div className="absolute inset-0 flex flex-col font-bold items-center justify-center font-myeongjo">
                <p>{countDown}초 뒤, 처음 화면으로 돌아갑니다.</p>
            </div>
        </main>
    )
}

export default PrintResult;
