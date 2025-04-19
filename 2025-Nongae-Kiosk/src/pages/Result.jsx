import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Hangul from 'hangul-js';

// 한글 조합을 위한 유틸리티 함수들
const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNGSUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONGSUNG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 복합 모음 매핑
const COMPLEX_JUNGSUNG_MAP = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ'
};

// 복합 종성 매핑
const COMPLEX_JONGSUNG_MAP = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
  'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ',
  'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};

const Result = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isShift, setIsShift] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isKorean, setIsKorean] = useState(true);
    const [generatedImage, setGeneratedImage] = useState('');
    
    // 현재 입력 중인 글자의 상태
    const [composingText, setComposingText] = useState('');

    useEffect(() => {
        if(location.state && location.state.images && location.state.images.length > 0) {
            setGeneratedImage(location.state.images[0]);
        } else {
            console.log('No images found');
        }
    }, [location.state]);

    // 한글 키보드 레이아웃
    const koreanFirstRow = {
        normal: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
        shift: ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅒ', 'ㅖ']
    };
    const koreanSecondRow = {
        normal: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
        shift: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ']
    };
    const koreanThirdRow = {
        normal: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
        shift: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']
    };

    // 영어 키보드 레이아웃
    const englishFirstRow = {
        normal: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        shift: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
    };
    const englishSecondRow = {
        normal: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        shift: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
    };
    const englishThirdRow = {
        normal: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
        shift: ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    };

    // 레이아웃 선택
    const firstRow = isKorean ? koreanFirstRow : englishFirstRow;
    const secondRow = isKorean ? koreanSecondRow : englishSecondRow;
    const thirdRow = isKorean ? koreanThirdRow : englishThirdRow;

    // 한글 관련 상수
    const CONSONANTS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const VOWELS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];

    // 복합 모음 매핑
    const COMPLEX_VOWELS = {
        'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
        'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
        'ㅡㅣ': 'ㅢ'
    };

    // 복합 자음 매핑 (종성용)
    const COMPLEX_CONSONANTS = {
        'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
        'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
        'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ',
        'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
    };

    // 자음/모음 판별 함수
    const isConsonant = (char) => CONSONANTS.includes(char);
    const isVowel = (char) => VOWELS.includes(char);

    // 한글 조합 함수
    const combineHangul = ({ cho, jung, jong = '' }) => {
        if (!cho || !jung) return '';
        
        const choIdx = CONSONANTS.indexOf(cho);
        const jungIdx = VOWELS.indexOf(jung);
        const jongIdx = jong ? [...'', ...CONSONANTS, 'ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ'].indexOf(jong) : 0;
        
        if (choIdx === -1 || jungIdx === -1) return '';
        
        return String.fromCharCode(0xAC00 + choIdx * 21 * 28 + jungIdx * 28 + jongIdx);
    };

    // 키 입력 처리 함수
    const handleKeyClick = (key) => {
        if (!isKorean) {
            // 영어 모드인 경우 단순 추가
            setInputText(prev => prev + key);
            return;
        }

        // 한글 모드인 경우 Hangul.js 사용
        // 현재 조합 중인 텍스트에 키 추가
        const newComposingText = composingText + key;
        setComposingText(newComposingText);
        
        // Hangul.assemble()을 사용하여 자소를 조합
        const assembled = Hangul.assemble(Hangul.disassemble(newComposingText));
        setComposingText(assembled);
    };

    const handleBackspaceClick = () => {
        if (composingText) {
            // 조합 중인 글자가 있는 경우, 마지막 자소 하나만 삭제
            const disassembled = Hangul.disassemble(composingText);
            if (disassembled.length > 0) {
                const newDisassembled = disassembled.slice(0, -1);
                if (newDisassembled.length === 0) {
                    setComposingText('');
                } else {
                    setComposingText(Hangul.assemble(newDisassembled));
                }
            }
        } else if (inputText.length > 0) {
            // 이미 입력된 텍스트의 마지막 글자 지우기
            setInputText(prev => prev.slice(0, -1));
        }
    };

    const handleShiftClick = () => {
        setIsShift(!isShift);
    };

    const handleLanguageToggle = () => {
        // 현재 조합 중인 글자 완성
        completeCurrentChar();
        setIsKorean(!isKorean);
    };

    const handleSpaceClick = () => {
        // 현재 조합 중인 글자 완성
        completeCurrentChar();
        setInputText(prev => prev + ' ');
    };

    const handleClearClick = () => {
        setInputText('');
        setComposingText('');
    };

    // 현재 조합 중인 글자를 완성하고 inputText에 추가
    const completeCurrentChar = () => {
        if (composingText) {
            setInputText(prev => prev + composingText);
            setComposingText('');
        }
    };

    const handlePrintClick = () => {
        // 현재 조합 중인 글자 완성
        completeCurrentChar();
        navigate('/print-result', { state: { name: inputText, image: generatedImage } });
    };

    return (
        <main className="h-screen overflow-hidden flex flex-col items-center justify-center font-myeongjo gap-12">
            <img src={'/UI/UI_06.png'} alt="UI_06" className='absolute inset-0 -z-10 w-full h-full object-cover' />

            {/* 완성된 이미지 영역 */}
            <div className="flex justify-center items-center h-[30%] w-[250px] border-2 border-black overflow-hidden">
                {generatedImage ? (
                    <img 
                        src={generatedImage} 
                        alt="Generated AI portrait" 
                        className="h-full object-contain"
                    />
                ) : (
                    <p>이미지를 불러오는 중...</p>
                )}
            </div>

            {/* 텍스트 입력 표시 영역 */}
            <div className="flex justify-center items-center w-[500px] h-12 rounded-lg">
                <p className="text-black font-bold text-xl">
                    {inputText}{composingText}
                </p>
            </div>

            {/* 키보드 컨테이너 */}
            <div className="bg-[#F0EDE8] p-4 rounded-lg w-[600px] mt-24">
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
                        <button 
                            className="w-16 h-10 bg-blue-500 text-white rounded-md shadow"
                            onClick={handleLanguageToggle}
                        >
                            {isKorean ? 'ENG' : '한글'}
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

                    {/* 스페이스바와 전체 지우기 */}
                    <div className="flex justify-center gap-1 mt-1">
                        <button className="w-10 h-10 bg-white rounded-md shadow hover:bg-gray-100" onClick={handleClearClick}>
                            X
                        </button>
                        <button
                            className="w-[380px] h-10 bg-white rounded-md shadow hover:bg-gray-100"
                            onClick={handleSpaceClick}
                        >
                            Space
                        </button>
                    </div>
                </div>
            </div>

            {/* 인쇄 버튼 */}
            <div className="absolute flex justify-center bottom-24 gap-36 pr-12 pl-12">
                <button className="w-42" onClick={handlePrintClick}>
                    <img src={'/UI/UI_06_button_putName.png'} alt="UI_06_button_putName" className='w-full h-full object-cover' />
                </button>
                <button className="w-42" onClick={() => {
                    setComposingText('');
                    setInputText('');
                    handlePrintClick();
                }}>
                    <img src={'/UI/UI_06_button_noName.png'} alt="UI_06_button_NoName" className='w-full h-full object-cover' />
                </button>
            </div>
        </main>
    );
};

export default Result;
