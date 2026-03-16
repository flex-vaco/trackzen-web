export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface User {
  userId: number;
  orgId: number;
  role: UserRole;
  name: string;
  email: string;
}

export interface FullUser {
  id: number;
  organisationId: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  status: string;
  createdAt: string;
}

export interface Timesheet {
  id: number;
  userId: number;
  weekStartDate: string;
  weekEndDate: string;
  status: TimesheetStatus;
  totalHours: number;
  billableHours: number;
  approvedById?: number;
  approvedAt?: string;
  rejectedReason?: string;
  user?: { name: string; email: string };
  timeEntries?: TimeEntry[];
}

export interface TimeEntry {
  id: number;
  timesheetId: number;
  projectId: number;
  billable: boolean;
  monHours: number;
  monDesc?: string;
  monTimeOff: number;
  tueHours: number;
  tueDesc?: string;
  tueTimeOff: number;
  wedHours: number;
  wedDesc?: string;
  wedTimeOff: number;
  thuHours: number;
  thuDesc?: string;
  thuTimeOff: number;
  friHours: number;
  friDesc?: string;
  friTimeOff: number;
  satHours: number;
  satDesc?: string;
  satTimeOff: number;
  sunHours: number;
  sunDesc?: string;
  sunTimeOff: number;
  totalHours: number;
  project?: { id: number; code: string; name: string };
}

export interface Project {
  id: number;
  code: string;
  name: string;
  client: string;
  budgetHours: number;
  usedHours: number;
  status: string;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  recurring: boolean;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface OrgSettings {
  workWeekStart: string;
  standardHours: number;
  timeFormat: string;
  timeIncrement: number;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  requireApproval: boolean;
  allowBackdated: boolean;
  enableOvertime: boolean;
  mandatoryDesc: boolean;
  allowCopyWeek: boolean;
  dailyReminderTime?: string;
  weeklyDeadline?: string;
  leaveRequireApproval: boolean;
  leaveAllowBackdated: boolean;
  accrualEnabled: boolean;
  carryForwardEnabled: boolean;
  carryForwardMaxDays: number;
  leaveApprovalLevels: number;
  ssoGoogleEnabled: boolean;
  ssoMicrosoftEnabled: boolean;
  payrollType?: string;
  pmType?: string;
}

export interface LeaveType {
  id: number;
  name: string;
  annualQuota: number;
  accrualRate: number;
  carryForward: boolean;
  requiresDoc: boolean;
  paid: boolean;
  active: boolean;
}

export interface LeaveBalance {
  id: number;
  userId: number;
  leaveTypeId: number;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  carriedOver: number;
  leaveType?: LeaveType;
}

export interface LeaveRequest {
  id: number;
  userId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  businessDays: number;
  reason?: string;
  status: LeaveStatus;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  leaveType?: LeaveType;
  user?: { name: string; email: string };
  approvals?: LeaveApproval[];
}

export interface LeaveApproval {
  id: number;
  leaveRequestId: number;
  approverId: number;
  level: number;
  status: string;
  comment?: string;
  actionDate?: string;
  approver?: { name: string };
}

export interface CalendarEntry {
  userId: number;
  userName: string;
  leaveTypeName: string;
  date: string;
}

export interface ApprovalStats {
  pendingCount: number;
  approvedThisWeek: number;
  teamHours?: number;
  teamMembers?: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}
