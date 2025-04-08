from flask import Flask, request, jsonify
from flask_socketio import SocketIO
import base64
import requests
import json
import os
import uuid
import time
import io
import logging
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# ComfyUI API settings
COMFY_API_URL = 'http://127.0.0.1:8000/api'
WORKFLOW_PATH = 'workflows/nongae_workflow.json'  # Path to your ComfyUI workflow JSON
COMFY_INPUT_FOLDER = os.path.expanduser('~/comfyInput')

# Load the workflow file
def load_workflow():
    try:
        with open(WORKFLOW_PATH, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        logger.error(f"Error loading workflow file: {e}")
        return None

# Process image with ComfyUI
def process_image_with_comfy(image_data):
    try:
        # Remove data:image/jpeg;base64, prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)

        os.makedirs(COMFY_INPUT_FOLDER, exist_ok=True)

        # ComfyUI 폴더에 바로 저장
        input_filename = f"nongae_input_{uuid.uuid4()}.jpg"
        input_path = os.path.join(COMFY_INPUT_FOLDER, input_filename)

        with open(input_path, 'wb') as f:
            f.write(image_bytes)

        logger.info(f"Saved input image to {input_path}")
        
        # Load workflow template
        workflow = load_workflow()
        if not workflow:
            return None
        
        # Upload the input image to ComfyUI
        with open(input_path, 'rb') as file:
            response = requests.post(f"{COMFY_API_URL}/upload/image", files={"image": file})
            
        if response.status_code != 200:
            logger.error(f"Failed to upload image: {response.text}")
            return None
            
        upload_data = response.json()
        filename = upload_data.get('name')

        if "16" in workflow and "inputs" in workflow["16"] and "image" in workflow["16"]["inputs"]:
            workflow["16"]["inputs"]["image"] = filename
            logger.info(f"Updated workflow with image filename: {filename}")
        else:
            logger.warning("Workflow structure does not match expected format")
        
        
        # Send the prompt to ComfyUI API
        prompt_response = requests.post(f"{COMFY_API_URL}/prompt", json={"prompt": workflow})
        
        if prompt_response.status_code != 200:
            logger.error(f"Failed to send prompt: {prompt_response.text}")
            return None
            
        prompt_id = prompt_response.json().get('prompt_id')
        
        # Wait for the workflow to complete
        output_images = wait_for_generation(prompt_id)
        
        # Clean up the input image
        os.remove(input_path)
        
        return output_images
        
    except Exception as e:
        logger.error(f"Error processing image with ComfyUI: {e}")
        return None

def encode_image_to_base64(image_path):
    try:
        import base64
        if os.path.exists(image_path):
            with open(image_path, 'rb') as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                return f"data:image/jpeg;base64,{encoded_string}"
        else:
            logger.error(f"Image file not found at {image_path}")
            return None
    except Exception as e:
        logger.error(f"Error encoding image to base64: {e}")
        return None

# Wait for the ComfyUI generation to complete
def wait_for_generation(prompt_id, timeout=120):

    start_time = time.time()
    output_images = []
    base64_images = []
    last_progress = 0
    
    comfy_output_dir = os.path.normpath(r"C:\Users\yty07\Documents\output") 

    while time.time() - start_time < timeout:
        try:
            # 진행 상태 확인
            progress_response = requests.get(f"{COMFY_API_URL}/progress")
            if progress_response.status_code == 200:
                progress_data = progress_response.json()

                # 전체 진행률 계산
                progress_percent = int(progress_data.get('progress', 0) * 100)
                
                if progress_percent != last_progress:
                    last_progress = progress_percent
                    # 클라이언트에 진행률 전송
                    socketio.emit('progress', {'percent': progress_percent})
                    logger.info(f"Progress updated: {progress_percent}%")

            # 완료된 진행률 확인
            history_response = requests.get(f"{COMFY_API_URL}/history/{prompt_id}")
            if history_response.status_code != 200:
                time.sleep(1)
                continue
                
            history_data = history_response.json()
            
            if prompt_id in history_data:
                # Get output images from the result
                outputs = history_data[prompt_id].get('outputs', {})
                for node_id, node_output in outputs.items():
                    if 'images' in node_output:
                        for image in node_output['images']:
                            image_url = f"{COMFY_API_URL}/view/{image['filename']}"
                            logger.info(f"Image URL: {image_url}")

                            # 이미지 파일 경로 구성
                            image_path = os.path.join(comfy_output_dir, image['filename'])
                            logger.info(f"Image path: {image_path}")

                            # 이미지 파일이 존재하는지 확인
                            if os.path.exists(image_path):
                                logger.info(f"Image file exists at {image_path}")
                                base64_image = encode_image_to_base64(image_path)
                                if base64_image:
                                    base64_images.append(base64_image)
                                    logger.info(f"Successfully encoded image to base64")
                                else:
                                    logger.error(f"Failed to encode image to base64")
                            else:
                                logger.error(f"Image file not found at {image_path}")
                        else:
                            logger.error(f"No images found in the output")
                    else:
                        logger.info(f"Image file not found locally, trying to download from ComfyUI server")
                        try:
                            img_response = requests.get(image_url)
                            if img_response.status_code == 200:
                                img_data = base64.b64encode(img_response.content).decode('utf-8')
                                base64_images.append(f"data:image/png;base64,{img_data}")
                                logger.info(f"Successfully downloaded and encoded image")
                            else:
                                logger.error(f"Failed to download image from ComfyUI server")
                        except Exception as e:
                            logger.error(f"Error downloading image from ComfyUI server: {e}")
                if base64_images:
                    socketio.emit('progress', {'percent': 100})
                    return base64_images
            
            time.sleep(1)
        except Exception as e:
            logger.error(f"Error while waiting for generation: {e}")
            time.sleep(1)
    
    logger.warning("Timeout waiting for ComfyUI generation")
    return None

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

@socketio.on('message')
def handle_message(data):
    logger.info('Received image data')

    socketio.emit('progress', {'percent': 0})
    
    # Process the image with ComfyUI
    output_images = process_image_with_comfy(data)
    
    if output_images:
        # Send the result back to the client
        socketio.emit('result', {'images': output_images})
        logger.info(f"Generated {len(output_images)} images and sent to client")
    else:
        socketio.emit('error', {'message': 'Image generation failed'})
        logger.error("Failed to generate images")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    # Create workflows directory if it doesn't exist
    os.makedirs(os.path.dirname(WORKFLOW_PATH), exist_ok=True)
    
    # Check if workflow file exists, create a placeholder if not
    if not os.path.exists(WORKFLOW_PATH):
        logger.warning(f"Workflow file not found at {WORKFLOW_PATH}. Creating placeholder.")
        with open(WORKFLOW_PATH, 'w') as f:
            json.dump({"placeholder": "Replace with your actual ComfyUI workflow"}, f)
    
    logger.info("Starting server...")
    socketio.run(app, host='0.0.0.0', port=3001, debug=True)
