// COMFYUI 처리시 필요한 기능
const fs = require('fs');
const path = require('path');

const COMFYUI_INPUT_IMAGES = ['Dance.png', 'Sori.png', 'Watch.png'];
const COMFYUI_INPUT_POSES = ['DancePose.png', 'SoriPose.png', 'WatchPose.png'];

function loadStyleImageUsingRoleNumber(roleNumber, workflowTemplate) {
    const styleImageLoaderNodeId = '13';
    const styleImage = COMFYUI_INPUT_IMAGES[roleNumber];

    if(workflowTemplate && workflowTemplate[styleImageLoaderNodeId] && workflowTemplate[styleImageLoaderNodeId]['inputs']) {
        workflowTemplate[styleImageLoaderNodeId]['inputs']['image'] = styleImage;
    } else {
        throw new Error("이미지 로더 노드를 찾을 수 없습니다.");
    }
}

function loadInputUserImage(inputFilename, workflowTemplate) {
    const imageLoaderNodeId = '16';

    if(workflowTemplate && workflowTemplate[imageLoaderNodeId] && workflowTemplate[imageLoaderNodeId]['inputs']) {
        workflowTemplate[imageLoaderNodeId]['inputs']['image'] = inputFilename;
    } else {
        throw new Error("이미지 로더 노드를 찾을 수 없습니다.");
    }
}

function loadInputPoseImage(roleNumber, workflowTemplate) {
    const poseImageLoaderNodeId = '28';
    const poseImage = COMFYUI_INPUT_POSES[roleNumber];

    if(workflowTemplate && workflowTemplate[poseImageLoaderNodeId] && workflowTemplate[poseImageLoaderNodeId]['inputs']) {
        workflowTemplate[poseImageLoaderNodeId]['inputs']['image'] = poseImage;
    } else {
        throw new Error("포즈 이미지 로더 노드를 찾을 수 없습니다.");
    }
}

function getComfyProgress(io, clients, kioskId, ws) {
        ws.on('message', (message) => {
            const data = JSON.parse(message);
            if(data.type === 'progress') {
                const value = data.data.value || 0;
                const max = data.data.max || 1;

                const progressPercent = Math.floor((value / max) * 100);

                if(clients.kiosk[kioskId]) {
                    io.to(clients.kiosk[kioskId].id).emit('progress', {
                        percent: progressPercent,
                        kioskId: kioskId
                    });
                }
                console.log(`${kioskId || '알 수 없는 키오스크'} 진행 상황: ${progressPercent}%`);
            }
        })
}

function getProcessedImage(outputImages, outputDir) {
        // 결과 이미지 처리
        const outputNodeIds = Object.keys(outputImages);
        console.log(outputNodeIds);

        if(outputNodeIds.length === 0) {
            throw new Error("결과 이미지를 찾을 수 없습니다.");
        }

        const resultImageNode = outputNodeIds[0];
        const resultImageFilename = outputImages[resultImageNode].images[0].filename;
        const resultImagePath = path.join(outputDir, resultImageFilename);

        return `data:image/png;base64,${fs.readFileSync(resultImagePath, 'base64')}`;
}


module.exports = {
    loadStyleImageUsingRoleNumber,
    loadInputUserImage,
    loadInputPoseImage,
    getComfyProgress,
    getProcessedImage
};