//--------------------------------------------
// 서버 설정
const PORT = 3001;

//--------------------------------------------
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

// 이미지 데이터 처리
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // API 요청 
const { v4: uuidv4 } = require('uuid'); // 파일 이름 생성

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: '*',
    methods: ['GET', 'POST']
});

// COMFYUI 서버 설정
// TODO: 환경변수 정리해야 함
const COMFYUI_SERVER_HOST = 'http://localhost:8000';
const COMFYUI_INPUT_DIR = 'C:/Users/yty07/OneDrive/바탕 화면/comfyInput';
const COMFYUI_OUTPUT_DIR = 'C:/Users/yty07/OneDrive/바탕 화면/comfyOutput';

// 서버의 진행상황을 위한 웹소켓
const comfySocket = require('ws');

// Socket ID
const clients = {
    kiosk: [],
    unity: []
}

// connection 이벤트 핸들러
io.on('connection', (socket) => {

    socket.on('register', (data) => {
        console.log(data + ' 연결 완료');
        socket.clientId = data;
        socket.clientType = 'kiosk';

        clients.kiosk.push({
            id: socket.id,
            name: data
        })
    })

    socket.on('register-for-unity', (data) => {
        console.log(data + ' 연결 완료');
        socket.clientId = data;
        socket.clientType = 'unity';

        clients.unity.push({
            id: socket.id,
            name: data
        })
    })

    // 이미지 데이터 처리
    socket.on('photo', async (photoData) => {
        console.log('**** 이미지 수신 완료 ****');

        try {
            // 이미지를 ComfyUI Input 폴더에 저장

            // Base64 형식의 이미지 데이터에서 메타데이터 부분(data:image/jpeg;base64, 등)을 제거하고
            // 실제 이미지 데이터만 추출하는 과정
            const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const filename = `${uuidv4()}.png`;
            const filepath = path.join(COMFYUI_INPUT_DIR, filename);

            fs.writeFileSync(filepath, imageBuffer);
            console.log(`이미지 저장 완료, 경로: ${filepath}`);

            // 워크플로우 실행
            const result = await runComfyWorkflow(filename, socket);

            // 실행한 결과 원본을 클라이언트에 전달
            // socket.emit('result-for-kiosk', {
            //     success: true,
            //     resultImage: result.resultImageBase64,
            // })
            io.to(clients.kiosk[0].id).emit('result-for-kiosk', {
                success: true,
                resultImage: result.resultImageBase64,
            })

            //배경이 제거된 결과를 유니티에 전달
            io.to(clients.unity[0].id).emit('result-for-unity', {
                success: true,
                resultImage: result.backgroundRemovedImageBase64,
            })
        } catch(e) {
            console.error("이미지 처리 오류", e);
        }
    })

    socket.on('disconnect', () => {
        if(socket.clientId) {
            console.log(socket.clientId + ' 연결 해제');
            // 클라이언트 타입에 따라 해당 배열에서 제거
            if (socket.clientType === 'kiosk') {
                // filter 메소드는 조건을 만족하는 요소만 포함하는 새 배열을 반환합니다.
                // 여기서는 현재 연결 해제된 소켓의 ID와 다른 ID를 가진 클라이언트만 남깁니다.
                // 즉, 연결 해제된 클라이언트를 배열에서 제거하는 역할을 합니다.
                clients.kiosk = clients.kiosk.filter(client => client.id !== socket.id);
            } else if (socket.clientType === 'unity') {
                clients.unity = clients.unity.filter(client => client.id !== socket.id);
            }
        }
    })
});




async function runComfyWorkflow(inputFilename, socket) {
    try {
        // 저장한 뒤에 해당 이미지를 Workflow에 전달
        const workflowTemplate = require('./workflow/nongae_workflow_v1.json');
        const imageLoaderNodeId = '16';

        // workflowTemplate.nodes[imageLoaderNodeId][imageLoaderParam] = inputFilename;

        if(workflowTemplate && workflowTemplate[imageLoaderNodeId] && workflowTemplate[imageLoaderNodeId]['inputs']) {
            workflowTemplate[imageLoaderNodeId]['inputs']['image'] = inputFilename;
        } else {
            throw new Error("이미지 로더 노드를 찾을 수 없습니다.");
        }

        // Workflow를 실행
        const promptResponse = await axios.post(`${COMFYUI_SERVER_HOST}/prompt`, { 
            prompt: workflowTemplate
        });

        const promptId = promptResponse.data.prompt_id;
        console.log(`Prompt ID: ${promptId}`);

        // 워크플로우 대기
        let completed = false;
        let outputImages = {};
        let lastProgress = 0;
        
        const wsHost = COMFYUI_SERVER_HOST.replace('http://', '');
        const ws = new comfySocket(`ws://${wsHost}/ws?client_id=${uuidv4()}`);

        ws.on('message', (message) => {
            const data = JSON.parse(message);
            if(data.type === 'progress') {
                const value = data.data.value || 0;
                const max = data.data.max || 1;

                const progressPercent = Math.floor((value / max) * 100);

                if(progressPercent !== lastProgress) {
                    lastProgress = progressPercent;
                    socket.emit('progress', progressPercent);
                    // console.log(`진행 상황: ${progressPercent}%`);
                }
            }
        })

        while (!completed) {
            
            const historyResponse = await axios.get(`${COMFYUI_SERVER_HOST}/history/${promptId}`);
            const historyData = historyResponse.data;

            if(historyData[promptId] && historyData[promptId].outputs) {
                completed = true;
                outputImages = historyData[promptId].outputs;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 결과 이미지 처리
        const outputNodeIds = Object.keys(outputImages);

        if(outputNodeIds.length === 0) {
            throw new Error("결과 이미지를 찾을 수 없습니다.");
        }

        // 결과 이미지 (배경 있는 원본)
        const resultImageNode = outputNodeIds[0];
        const resultImageFilename = outputImages[resultImageNode].images[0].filename;
        const resultImagePath = path.join(COMFYUI_OUTPUT_DIR, resultImageFilename);

        // 배경이 제거된 이미지
        let backgroundRemovedImageBase64 = null;
        if(outputNodeIds.length > 1) {
            const backgroundRemovedNode = outputNodeIds[1];
            const backgroundRemovedImageFilename = outputImages[backgroundRemovedNode].images[0].filename;
            const backgroundRemovedImagePath = path.join(COMFYUI_OUTPUT_DIR, backgroundRemovedImageFilename);

            backgroundRemovedImageBase64 = `data:image/png;base64,${fs.readFileSync(backgroundRemovedImagePath, 'base64')}`;
        } else {
            throw new Error("배경이 제거된 이미지를 찾을 수 없습니다.");
        }

        const resultImageBase64 = `data:image/png;base64,${fs.readFileSync(resultImagePath, 'base64')}`;

        return {
            success: true,
            resultImageBase64,
            backgroundRemovedImageBase64
        }


    } catch(e) {
        console.error("워크플로우 실행 오류:", e);

        return {
            success: false,
            error: e.message
        };
    }
}


server.listen(PORT, () => {
    console.log(`ComfyUI를 위한 서버가 ${PORT}번 포트에서 실행중입니다.`);
});


