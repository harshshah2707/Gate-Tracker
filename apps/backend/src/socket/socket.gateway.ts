import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track online users
  private activeConnections = new Map<string, string>(); // socketId -> userId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.activeConnections.get(client.id);
    if (userId) {
      this.activeConnections.delete(client.id);
      this.server.emit('friend:offline', { userId });
      console.log(`User ${userId} went offline`);
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('user:online')
  handleUserOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.activeConnections.set(client.id, data.userId);
    this.server.emit('friend:online', { userId: data.userId });
    console.log(`User ${data.userId} is online`);
  }

  @SubscribeMessage('group:join')
  handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.join(`group_${data.groupId}`);
    console.log(`Socket ${client.id} joined room group_${data.groupId}`);
  }

  @SubscribeMessage('group:leave')
  handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.leave(`group_${data.groupId}`);
    console.log(`Socket ${client.id} left room group_${data.groupId}`);
  }

  // Helper helper to broadcast group events
  broadcastToGroup(groupId: string, event: string, payload: any) {
    this.server.to(`group_${groupId}`).emit(event, payload);
  }

  // Helper helper to broadcast to all users
  broadcastGlobal(event: string, payload: any) {
    this.server.emit(event, payload);
  }

  // Send event to specific user
  sendToUser(userId: string, event: string, payload: any) {
    for (const [socketId, activeUserId] of this.activeConnections.entries()) {
      if (activeUserId === userId) {
        this.server.to(socketId).emit(event, payload);
      }
    }
  }
}
