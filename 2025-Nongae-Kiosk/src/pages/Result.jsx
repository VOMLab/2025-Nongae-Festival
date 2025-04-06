import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 한글 조합을 위한 유틸리티 함수들
const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNGSUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONGSUNG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const Result = () => {
    const navigate = useNavigate();
    const [isShift, setIsShift] = useState(false);
    const [inputText, setInputText] = useState('');
    const [composition, setComposition] = useState({
        chosung: '',
        jungsung: '',
        jongsung: ''
    });

    // 단자음/쌍자음 배열 정의
    const firstRow = {
        normal: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
        shift: ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅒ', 'ㅖ']
    };
    const secondRow = {
        normal: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
        shift: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ']
    };
    const thirdRow = {
        normal: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
        shift: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']
    };

    // 한글 조합 함수
    const combineHangul = (chosung, jungsung, jongsung = '') => {
        if (!chosung || !jungsung) return '';
        
        const chosungIndex = CHOSUNG.indexOf(chosung);
        const jungsungIndex = JUNGSUNG.indexOf(jungsung);
        const jongsungIndex = JONGSUNG.indexOf(jongsung || '');
        
        if (chosungIndex === -1 || jungsungIndex === -1) return '';
        
        const unicode = 0xAC00 + (chosungIndex * 21 + jungsungIndex) * 28 + jongsungIndex;
        return String.fromCharCode(unicode);
    };

    const handleKeyClick = (key) => {
        const current = { ...composition };

        if (CHOSUNG.includes(key)) {
            // 자음이 입력된 경우
            if (!current.chosung) {
                // 초성이 없는 경우
                setComposition({ chosung: key, jungsung: '', jongsung: '' });
            } else if (!current.jungsung) {
                // 초성만 있는 경우, 이전 초성을 출력하고 새로운 초성 설정
                setInputText(prev => prev + current.chosung);
                setComposition({ chosung: key, jungsung: '', jongsung: '' });
            } else if (!current.jongsung) {
                // 초성과 중성이 있는 경우, 종성으로 추가
                setComposition({ ...current, jongsung: key });
            } else {
                // 모든 조합이 완료된 경우, 현재 글자를 완성하고 새로운 초성 설정
                const combined = combineHangul(current.chosung, current.jungsung, current.jongsung);
                setInputText(prev => prev + combined);
                setComposition({ chosung: key, jungsung: '', jongsung: '' });
            }
        } else if (JUNGSUNG.includes(key)) {
            // 모음이 입력된 경우
            if (!current.chosung) {
                // 초성이 없는 경우, 모음을 그대로 출력
                setInputText(prev => prev + key);
                setComposition({ chosung: '', jungsung: '', jongsung: '' });
            } else if (!current.jungsung) {
                // 초성이 있는 경우, 중성 추가
                setComposition({ ...current, jungsung: key });
            } else if (!current.jongsung) {
                // 이미 초성과 중성이 있는 경우, 현재 글자 완성하고 모음 출력
                const combined = combineHangul(current.chosung, current.jungsung);
                setInputText(prev => prev + combined + key);
                setComposition({ chosung: '', jungsung: '', jongsung: '' });
            } else {
                // 모든 조합이 완료된 경우, 현재 글자 완성하고 모음 출력
                const combined = combineHangul(current.chosung, current.jungsung, current.jongsung);
                setInputText(prev => prev + combined + key);
                setComposition({ chosung: '', jungsung: '', jongsung: '' });
            }
        }
    };

    const handleBackspaceClick = () => {
        const current = { ...composition };
        
        if (current.jongsung) {
            setComposition({ ...current, jongsung: '' });
        } else if (current.jungsung) {
            setComposition({ ...current, jungsung: '' });
        } else if (current.chosung) {
            setComposition({ chosung: '', jungsung: '', jongsung: '' });
        } else {
            setInputText(prev => prev.slice(0, -1));
        }
    };

    const handleShiftClick = () => {
        setIsShift(!isShift);
    };

    const handlePrintClick = () => {
        navigate('/print-result');
    };

    // 현재 조합 중인 글자 표시
    const getCurrentDisplay = () => {
        if (!composition.chosung) return '';
        if (!composition.jungsung) return composition.chosung;
        return combineHangul(composition.chosung, composition.jungsung, composition.jongsung);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen font-myeongjo bg-main-bg">
            <div className="flex flex-col items-center justify-center mb-8">
                <p className="mb-2">이미지가 완성되었습니다.</p>
                <p>인물의 이름을 입력할 수 있습니다.</p>
            </div>

            {/* 완성된 이미지 영역 */}
            <div className="flex bg-[#EAE4DF] justify-center items-center h-[35%] w-[250px] rounded-lg mb-24">
                <p>이미지 들어올 부분</p>
            </div>

            {/* 텍스트 입력 표시 영역 */}
            <div className="flex justify-center items-center mb-4 bg-[#EAE4DF] w-[500px] h-12 rounded-lg">
                <p className="text-black font-bold text-xl">
                    {inputText}{getCurrentDisplay()}
                </p>
            </div>

            {/* 키보드 컨테이너 */}
            <div className="bg-[#F0EDE8] p-4 rounded-lg w-[500px]">
                {/* 키보드 레이아웃 */}
                <div className="flex flex-col gap-2">
                    {/* 첫 번째 줄 */}
                    <div className="flex justify-center gap-1">
                        {(isShift ? firstRow.shift : firstRow.normal).map((key) => (
                            <button
                                key={key}
                                className="w-10 h-10 bg-white rounded-md shadow hover:bg-gray-100"
                                onClick={() => handleKeyClick(key)}
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    {/* 두 번째 줄 */}
                    <div className="flex justify-center gap-1">
                        {(isShift ? secondRow.shift : secondRow.normal).map((key) => (
                            <button
                                key={key}
                                className="w-10 h-10 bg-white rounded-md shadow hover:bg-gray-100"
                                onClick={() => handleKeyClick(key)}
                            >
                                {key}
                            </button>
                        ))}
                        <button className="w-16 h-10 bg-blue-500 text-white rounded-md shadow">
                            입력
                        </button>
                    </div>

                    {/* 세 번째 줄 */}
                    <div className="flex justify-center gap-1">
                        <button 
                            className={`w-10 h-10 ${isShift ? 'bg-blue-500 text-white' : 'bg-white'} rounded-md shadow hover:bg-gray-100`}
                            onClick={handleShiftClick}
                        >
                            Shift
                        </button>
                        {(isShift ? thirdRow.shift : thirdRow.normal).map((key) => (
                            <button
                                key={key}
                                className="w-10 h-10 bg-white rounded-md shadow hover:bg-gray-100"
                                onClick={() => handleKeyClick(key)}
                            >
                                {key}
                            </button>
                        ))}
                        <button className="w-10 h-10 bg-white rounded-md shadow hover:bg-gray-100" onClick={handleBackspaceClick}>
                            ⌫
                        </button>
                    </div>
                </div>
            </div>

            {/* 인쇄 버튼 */}
            <div className="flex justify-center gap-4 mt-12">
                <button className="w-60 h-10 bg-[#897053] text-white rounded-full shadow hover:bg-[#725d45]" onClick={handlePrintClick}>
                    입력한 이름 넣고 인쇄하기
                </button>
                <button className="w-60 h-10 bg-[#897053] text-white rounded-full shadow hover:bg-[#725d45]" onClick={handlePrintClick}>
                    이름 없이 바로 인쇄하기
                </button>
            </div>
        </div>
    );
};

export default Result;
