import { useEffect, useState } from 'react';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AlertBar from '@/components/dashboard/AlertBar';
import QuickActions from '@/components/dashboard/QuickActions';
import AISummary from '@/components/dashboard/AISummary';

import BusinessKPIs from '@/components/dashboard/KPICards/BusinessKPIs';
import WorkforceKPIs from '@/components/dashboard/KPICards/WorkforceKPIs';
import InventoryKPIs from '@/components/dashboard/KPICards/InventoryKPIs';
import SupportKPIs from '@/components/dashboard/KPICards/SupportKPIs';

import RecentActivity from '@/components/dashboard/OperationalPanel/RecentActivity';
import AttendanceSnapshot from '@/components/dashboard/OperationalPanel/AttendanceSnapshot';
import RecentOrders from '@/components/dashboard/OperationalPanel/RecentOrders';
import SupportQueue from '@/components/dashboard/OperationalPanel/SupportQueue';

import RevenueChart from '@/components/dashboard/AnalyticsPanel/RevenueChart';
import OrderStatusPie from '@/components/dashboard/AnalyticsPanel/OrderStatusPie';
import InventoryHealthChart from '@/components/dashboard/AnalyticsPanel/InventoryHealthChart';
import AttendanceTrendChart from '@/components/dashboard/AnalyticsPanel/AttendanceTrendChart';
import BranchPerformance from '@/components/dashboard/BranchPerformance';
import PendingApprovals from '@/components/dashboard/PendingApprovals';

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(getUserRoleFromToken());
  }, []);

  const isSupervisor = userRole === 'supervisor';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (!userRole) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
      <DashboardHeader />
      
      {/* AISummary only for admin/superadmin */}
      {isAdmin && <AISummary />}

      {/* Business KPIs – hide for supervisor */}
      {!isSupervisor && (
        <div style={{ marginBottom: '2rem' }}><h2>Business</h2><BusinessKPIs /></div>
      )}

      {/* Workforce KPIs – all roles */}
      <div style={{ marginBottom: '2rem' }}><h2>Workforce</h2><WorkforceKPIs /></div>

      {/* Inventory KPIs – hide for supervisor */}
      {!isSupervisor && (
        <div style={{ marginBottom: '2rem' }}><h2>Inventory</h2><InventoryKPIs /></div>
      )}

      {/* Support KPIs – all roles */}
      <div style={{ marginBottom: '2rem' }}><h2>Support</h2><SupportKPIs /></div>

      <QuickActions />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div>
          <RecentActivity />
          <div style={{ marginTop: '1.5rem' }}><AttendanceSnapshot /></div>
          {/* RecentOrders – hide for supervisor */}
          {!isSupervisor && <div style={{ marginTop: '1.5rem' }}><RecentOrders /></div>}
          <div style={{ marginTop: '1.5rem' }}><SupportQueue /></div>
          <div style={{ marginTop: '1.5rem' }}><AlertBar /></div>
        </div>
        <div>
          {/* RevenueChart – only admin/superadmin */}
          {isAdmin && <RevenueChart />}
          {/* OrderStatusPie – only admin/superadmin */}
          {isAdmin && <div style={{ marginTop: '1.5rem' }}><OrderStatusPie /></div>}
          {/* InventoryHealthChart – only admin/superadmin */}
          {isAdmin && <div style={{ marginTop: '1.5rem' }}><InventoryHealthChart /></div>}
          {/* AttendanceTrendChart – all roles */}
          <div style={{ marginTop: '1.5rem' }}><AttendanceTrendChart /></div>
        </div>
      </div>

      {/* BranchPerformance – only admin/superadmin */}
      {isAdmin && <BranchPerformance />}
      {/* PendingApprovals – only admin/superadmin */}
      {isAdmin && <PendingApprovals />}
    </DashboardLayout>
  );
}