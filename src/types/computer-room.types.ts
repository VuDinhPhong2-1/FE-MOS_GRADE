export interface ComputerRoom {
  id: string;
  schoolId: string;
  ownerId: string;
  name: string;
  studentMachineCount: number;
  teacherMachineCount: number;
  brokenMachineCount: number;
  brokenMachinesDetail?: string;
  availableStudentMachines: number;
  totalMachineCount: number;
  totalMachinesText: string;
  netSupportStatus: string;
  audioStatus: string;
  coolingStatus: string;
  devicesPoweredOffStatus: string;
  seatingOrderStatus: string;
  roomHygieneStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateComputerRoomRequest {
  schoolId: string;
  name: string;
  studentMachineCount: number;
  teacherMachineCount?: number;
  brokenMachineCount?: number;
  brokenMachinesDetail?: string;
  netSupportStatus?: string;
  audioStatus?: string;
  coolingStatus?: string;
  devicesPoweredOffStatus?: string;
  seatingOrderStatus?: string;
  roomHygieneStatus?: string;
}

export interface UpdateComputerRoomRequest {
  name?: string;
  studentMachineCount?: number;
  teacherMachineCount?: number;
  brokenMachineCount?: number;
  brokenMachinesDetail?: string;
  netSupportStatus?: string;
  audioStatus?: string;
  coolingStatus?: string;
  devicesPoweredOffStatus?: string;
  seatingOrderStatus?: string;
  roomHygieneStatus?: string;
  isActive?: boolean;
}