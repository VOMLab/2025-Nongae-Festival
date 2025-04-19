import { io } from 'socket.io-client';

class SocketService {
  socket = null;
  config = null;

  async loadConfig() {
    if(this.config) return this.config;

    try {
      this.config = await window.electronAPI.getConfig();
      return this.config;
    } catch (error) {
      console.error('설정을 불러오는데 실패했습니다:', error);
      return {
        hostAddress: '127.0.0.1',
        hostPort: 3001,
        kioskId: 'Kiosk-1',
      };
    }
  }
  
  async connect() {
    if (!this.socket) {
      const config = await this.loadConfig();
      this.socket = io(`http://${config.hostAddress}:${config.hostPort}`);
      
      this.socket.on('connect', () => {
        console.log('ComfyUI 서버와 연결되었습니다.');

        this.socket.emit('register', this.config.kioskId);
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    } 
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  async getSocket() {
    if (!this.socket) {
      return await this.connect();
    }
    return this.socket;
  }

  async getKioskId() {
    const config = await this.loadConfig();
    return config.kioskId;
  }
  
  async sendImage(imageData) {
    const socket = await this.getSocket();
    socket.emit('photo', imageData);
  }
}

// 싱글톤 인스턴스 생성
const socketService = new SocketService();
export default socketService;