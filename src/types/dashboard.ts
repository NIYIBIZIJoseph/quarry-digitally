export interface RevenueTrend { date: string; total: number; }
export interface Ticket { id: number; subject: string; status: string; priority: string; created_at: string; }
export interface AttendanceSummary { presentToday: number; absentToday: number; lateToday: number; onLeaveToday: number; totalWorkers: number; }
export interface Product { id: number; name: string; stock_quantity: number; reorder_level: number; is_active: boolean; }
export interface Order { id: number; order_number: string; client_name: string; status: string; created_at: string; }