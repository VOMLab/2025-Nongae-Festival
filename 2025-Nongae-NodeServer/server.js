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

// --------------------------------------------
// COMFYUI Settings
// TODO: 환경변수 정리해야 함
const COMFYUI_SERVER = "http://localhost:8000"
const COMFYUI_INPUT_DIR = 'C:/Users/yty07/OneDrive/바탕 화면/comfyInput';
const COMFYUI_OUTPUT_DIR = 'C:/Users/yty07/OneDrive/바탕 화면/comfyOutput';
const { loadStyleImageUsingRoleNumber, loadInputUserImage, loadInputPoseImage, getComfyProgress, getProcessedImage } = require('./comfy.js');

const COMFYUI_WS = require('ws');
// --------------------------------------------

// Socket ID
const clients = {
    kiosk: {},
    unity: []
}

// connection 이벤트 핸들러
io.on('connection', (socket) => {

    socket.on('register', (data) => {
        console.log(data + ' 연결 완료');

        const kioskId = data;
        clients.kiosk[kioskId] = {
            id: socket.id,
            kioskId: kioskId
        }

        socket.clientType = 'kiosk';
        socket.kioskId = kioskId;
        socket.clientId = kioskId;

        console.log(`등록된 키오스크 객체 : ${Object.keys(clients.kiosk).join(', ')}`);
    })

    socket.on('register-for-unity', (data) => {
        console.log(data + ' 연결 완료');

        clients.unity.push({
            id: socket.id,
        })
    })

    // 이미지 데이터 처리
    socket.on('photo', async (photoData, roleNumber, kioskId) => {
        console.log('**** 이미지 수신 완료 ****');
        try {
            // Base64 형식의 이미지 데이터에서 메타데이터 부분(data:image/jpeg;base64, 등)을 제거하고
            // 실제 이미지 데이터만 추출하는 과정
            const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const filename = `${uuidv4()}.png`;
            const filepath = path.join(COMFYUI_INPUT_DIR, filename);

            fs.writeFileSync(filepath, imageBuffer);
            console.log(`이미지 저장 완료, 경로: ${filepath}`);

            // 워크플로우 실행
            const result = await runComfyWorkflow(filename, socket, roleNumber, COMFYUI_OUTPUT_DIR);

            // 키오스크로 처리된 이미지 전송
            if(clients.kiosk[kioskId]) {
                io.to(clients.kiosk[kioskId].id).emit('result-for-kiosk', {
                    success: true,
                    resultImage: result.resultImageBase64,
                    kioskId: kioskId
                })
            }

            // Unity로 처리된 이미지 전송
            // io.to(clients.unity[0].id).emit('result-for-unity', {
            //     success: true,
            //     resultImage: result.backgroundRemovedImageBase64,
            // })

        } catch(e) {
            console.error(`${kioskId} 워크플로우 실행 오류`, e);
        }
    })

    socket.on('disconnect', () => {
        // 1. 연결 해제 작업
        console.log(socket.kioskId + ' 연결 해제');

        // 2. Kiosk 객체에서 해당 소켓 ID 제거
        delete clients.kiosk[socket.kioskId];

        console.log(clients.kiosk);

        // // 3. Unity 객체에서 해당 소켓 ID 제거
        // clients.unity = clients.unity.filter(client => client.id !== socket.id);
    })
});

async function runComfyWorkflow(inputFilename, socket, roleNumber, outputDir) {
    try {
        // 저장한 뒤에 해당 이미지를 Workflow에 전달
        const workflowTemplate = require('./workflow/nongae_workflow_v1.02.json');

        // 역할에 따른 이미지 로더 노드에 이미지 전달
        loadStyleImageUsingRoleNumber(roleNumber, workflowTemplate);

        // 역할에 따른 포즈 이미지 로더 노드에 전달
        loadInputPoseImage(roleNumber, workflowTemplate);

        // 유저의 촬영된 이미지 인풋 로더로 전달
        loadInputUserImage(inputFilename, workflowTemplate);

        // Workflow를 실행
        const promptResponse = await axios.post(`${COMFYUI_SERVER}/prompt`, { 
            prompt: workflowTemplate
        });

        const promptId = promptResponse.data.prompt_id;
        console.log(`Prompt ID: ${promptId}`);

        // 워크플로우 대기
        let completed = false;
        let outputImages = {};
        
        const ws = new COMFYUI_WS(`ws://${COMFYUI_SERVER.replace('http://', '')}/ws?client_id=${uuidv4()}`);

        // 진행 상황 처리
        getComfyProgress(io, clients, socket.kioskId, ws);


        while (!completed) {
            
            const historyResponse = await axios.get(`${COMFYUI_SERVER}/history/${promptId}`);
            const historyData = historyResponse.data;

            if(historyData[promptId] && historyData[promptId].outputs) {
                completed = true;
                outputImages = historyData[promptId].outputs;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        ws.close();


        // 결과 이미지 처리
        const resultImageBase64 = getProcessedImage(outputImages, outputDir);

        return {
            success: true,
            resultImageBase64,
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
