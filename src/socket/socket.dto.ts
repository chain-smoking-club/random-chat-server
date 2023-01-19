export interface SendMessage {
  roomName: string;
  content: string;
}

export interface RegisterUserName {
  userName: string;
}

export interface MakeOrJoinOrLeaveRoom {
  roomName: string;
}
