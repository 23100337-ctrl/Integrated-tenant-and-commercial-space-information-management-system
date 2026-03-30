import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import connection from '../../connected/connection.js';
import {  Users, Calendar, PhilippinePeso, Building, TrendingUp,AlertCircle,CheckCircle,Clock,} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,} from 'recharts';

export function AdminDashboard() {
  // Get current user from auth context and navigation hook
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for storing dashboard statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTenants: 0,
    totalStaff: 0,
    totalRevenue: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
    pendingCompliance: 0,
    scheduledAppointments: 0,
    revenueGrowth: 0,
  });

  // State for chart data and lists
  const [revenueData, setRevenueData] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Load all dashboard data when component mounts
  useEffect(() => {
    // Redirect non-admin users
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    const loadDashboardData = async () => {
      try {
        // Fetch all data in parallel for better performance
        const [
          usersResp,
          paymentsResp,
          unitsResp,
          compResp,
          apptResp,
          revenueResp,
          notifResp
        ] = await Promise.allSettled([
          connection.users.getUsers(),
          connection.financial.getPayments(),
          connection.commercialSpace.getUnits(),
          connection.compliance.getDocuments({ status: 'pending' }),
          connection.schedule.getAppointments({ status: 'scheduled' }),
          connection.financial.getRevenueAnalytics({ period: '6months' }),
          connection.notifications.getNotifications({ read: false, limit: 5 })
        ]);

        // Process users data
        if (usersResp.status === 'fulfilled') {
          const usersData = usersResp.value;
          const users = Array.isArray(usersData) ? usersData : (usersData?.results || []);
          const totalUsers = usersData?.count || users.length;
          const totalTenants = users.filter(u => u.role === 'tenant').length;
          const totalStaff = users.filter(u => u.role === 'staff').length;

          setStats(prev => ({
            ...prev,
            totalUsers,
            totalTenants,
            totalStaff
          }));
        }

        // Process financial data
        if (paymentsResp.status === 'fulfilled') {
          const paymentsData = paymentsResp.value;
          const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.results || []);
          const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
          
          // Calculate revenue growth (compare last month with previous month)
          const sortedPayments = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
          const currentMonth = new Date().getMonth();
          const lastMonthPayments = sortedPayments.filter(p => new Date(p.date).getMonth() === currentMonth);
          const previousMonthPayments = sortedPayments.filter(p => new Date(p.date).getMonth() === currentMonth - 1);
          
          const lastMonthTotal = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const previousMonthTotal = previousMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          
          const revenueGrowth = previousMonthTotal ? 
            ((lastMonthTotal - previousMonthTotal) / previousMonthTotal * 100).toFixed(1) : 0;

          setStats(prev => ({
            ...prev,
            totalRevenue,
            revenueGrowth
          }));
        }

        // Process commercial space data
        if (unitsResp.status === 'fulfilled') {
          const unitsData = unitsResp.value;
          const units = Array.isArray(unitsData) ? unitsData : (unitsData?.results || []);
          const totalUnits = unitsData?.count || units.length;
          const occupiedUnits = units.filter(u => u.status === 'occupied' || u.status === 'leased').length;
          const occupancyRate = totalUnits ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

          setStats(prev => ({
            ...prev,
            totalUnits,
            occupiedUnits,
            occupancyRate
          }));
        }

        // Process compliance data
        if (compResp.status === 'fulfilled') {
          const compData = compResp.value;
          const pendingDocs = Array.isArray(compData) ? compData : (compData?.results || []);
          setStats(prev => ({
            ...prev,
            pendingCompliance: pendingDocs.length
          }));
        }

        // Process appointment data
        if (apptResp.status === 'fulfilled') {
          const apptData = apptResp.value;
          const appointmentsData = Array.isArray(apptData) ? apptData : (apptData?.results || []);
          setStats(prev => ({
            ...prev,
            scheduledAppointments: appointmentsData.length
          }));
          
          // Get upcoming appointments (next 3)
          const sortedAppointments = [...appointmentsData]
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);
          setAppointments(sortedAppointments);
        }

        // Process revenue analytics
        if (revenueResp.status === 'fulfilled') {
          const revenueDataValue = revenueResp.value;
          const revenueChartData = Array.isArray(revenueDataValue) 
            ? revenueDataValue 
            : (revenueDataValue?.data || revenueDataValue?.results || []);
          
          // Ensure it's an array before setting state
          setRevenueData(Array.isArray(revenueChartData) ? revenueChartData : []);
        }

        // Process notifications
        if (notifResp.status === 'fulfilled') {
          const notifData = notifResp.value;
          const notificationsData = Array.isArray(notifData) ? notifData : (notifData?.results || []);
          setNotifications(notificationsData);
        }

      } catch (e) {
        console.error('Error loading dashboard data:', e);
        // Silently fail - UI will show empty states
      }
    };
    
    loadDashboardData();
  }, [user, navigate]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatAppointmentDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-PH', options);
  };

  return (
    <Layout role="admin">
      <div className="space-y-8">
        {/* Header section with welcome message */}
        <div>
<h1 className="text-3xl font-bold text-[#2E3192]">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, admin! Here's your system overview.
          </p>
        </div>

        {/* Stats cards grid - each card shows a key metric */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-[#2E3192]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalTenants} tenants, {stats.totalStaff} staff
              </p>
            </CardContent>
          </Card>

          {/* Monthly Revenue Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Monthly Revenue
              </CardTitle>
              <PhilippinePeso className="h-4 w-4 text-[#F9E81B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue)}
              </div>
              {stats.revenueGrowth !== 0 && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${
                  stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 ${
                    stats.revenueGrowth >= 0 ? '' : 'transform rotate-180'
                  }`} />
                  {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}% from last month
                </p>
              )}
            </CardContent>
          </Card>

          {/* Occupancy Rate Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Occupancy Rate
              </CardTitle>
              <Building className="h-4 w-4 text-[#2E3192]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.occupiedUnits} of {stats.totalUnits || 0} units occupied
              </p>
            </CardContent>
          </Card>

          {/* Pending Items Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Items
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-[#ED1C24]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCompliance}</div>
              <p className="text-xs text-gray-500 mt-1">
                Compliance documents
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main content grid - Revenue chart and appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart - takes 2/3 of the grid */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-[#2E3192]">Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue and expenses (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₱${value/1000}k`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
<Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#2E3192" 
                      strokeWidth={2}
                      name="Revenue"
                    />
<Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ED1C24" 
                      strokeWidth={2}
                      name="Expenses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments - takes 1/3 of the grid */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#2E3192]">Upcoming Appointments</CardTitle>
                <CardDescription>
                  {stats.scheduledAppointments} scheduled appointments
                </CardDescription>
              </div>
<Button variant="outline" size="sm" onClick={() => navigate('/admin/schedule')} className="border-gray-300 hover:bg-[#F9E81B]/10 hover:text-[#2E3192]">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
<div 
                      key={appointment.id} 
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-[#F9E81B]/5 transition-colors"
                    >
                      <Calendar className="h-5 w-5 text-[#2E3192] mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{appointment.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatAppointmentDate(appointment.date)} at {appointment.time}
                        </p>
                        {appointment.tenant && (
                          <p className="text-xs text-gray-400 mt-1">
                            {appointment.tenant.name}
                          </p>
                        )}
                      </div>
                      <Badge variant={appointment.status === 'scheduled' ? 'default' : 'secondary'}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No upcoming appointments
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Notifications section */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#2E3192]">System Notifications</CardTitle>
                <CardDescription>Recent alerts and updates</CardDescription>
              </div>
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="rounded-full">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
<div 
                      key={notification.id} 
                      className={`flex items-start gap-3 p-3 border rounded-lg hover:bg-[#F9E81B]/5 transition-colors ${
                        !notification.read ? 'bg-[#F9E81B]/10' : ''
                      }`}
                    >
{notification.type === 'success' && <CheckCircle className="h-5 w-5 text-[#2E3192] mt-0.5 flex-shrink-0" />}
                      {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-[#ED1C24] mt-0.5 flex-shrink-0" />}
                      {notification.type === 'info' && <Clock className="h-5 w-5 text-[#F9E81B] mt-0.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No new notifications
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}