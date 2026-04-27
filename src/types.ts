export interface Student {
  id: string;
  nim: string;
  name: string;
  subject: string;
  className: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface Assignment {
  nim: string;
  name: string;
  subject: string;
  className: string;
  roomName: string;
  seatNumber: number;
}
