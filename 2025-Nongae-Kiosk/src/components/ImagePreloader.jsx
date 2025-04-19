import { useEffect } from "react";

const imagesToPreload = [
            '/UI/UI_01.png',
            '/UI/UI_02.png',
            '/UI/UI_03.png',
            '/UI/UI_02_button_Choice_01.png',
            '/UI/UI_02_button_Choice_02.png',
            '/UI/UI_02_button_Choice_03.png',
            '/UI/UI_03_button_Home.png',
];

const ImagePreloader = () => {
    useEffect(() => {
        const preloadImages = () => {
            imagesToPreload.forEach(src => {
                const img = new Image();
                img.src = src;
            });
        };

        preloadImages();
    }, []);

    return null;
}

export default ImagePreloader;
