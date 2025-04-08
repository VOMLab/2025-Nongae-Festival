import { io } from 'socket.io-client';

class SocketService {
  socket = null;
  
  connect() {

    if (!this.socket) {
      this.socket = io('http://localhost:3001');
      
      this.socket.on('connect', () => {
        console.log('ComfyUI 서버와 연결되었습니다.');

        this.socket.emit('register', 'Kiosk-1');
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
  
  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }
  
  sendImage(imageData) {
    const socket = this.getSocket();
    socket.emit('photo', imageData);
  }
}

// 싱글톤 인스턴스 생성
const socketService = new SocketService();
export default socketService;