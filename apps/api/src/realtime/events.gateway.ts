import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway {
  @WebSocketServer() server!: Server;

  @SubscribeMessage('join')
  join(@ConnectedSocket() client: Socket, @MessageBody() data: { rooms: string[] }) {
    (data?.rooms || []).forEach(r => client.join(r));
    return { ok: true, joined: data?.rooms || [] };
  }

  emitComplaintCreated(c: any) {
    this.server.emit('complaint.created', c); // broadcast (MVP)
    if (c?.societyId) this.server.to(`society:${c.societyId}`).emit('complaint.created', c);
    if (c?.orgId) this.server.to(`org:${c.orgId}`).emit('complaint.created', c);
  }

  emitComplaintUpdated(c: any) {
    this.server.emit('complaint.updated', c);
    if (c?.societyId) this.server.to(`society:${c.societyId}`).emit('complaint.updated', c);
    if (c?.orgId) this.server.to(`org:${c.orgId}`).emit('complaint.updated', c);
  }
}