import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Calendar, ClipboardList, FileCheck, CheckCircle, ArrowRight } from 'lucide-react';
import connection from '../../connected/connection.js';

export function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for storing staff's appointments and requests
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);

  // Load staff data when component mounts
  useEffect(() => {
    // Redirect if not staff
    if (user?.role !== 'staff') {
      navigate('/');
      return;
    }
    
    const load = async () => {
      try {
        // Fetch appointments and requests in parallel
        const appts = await connection.schedule.getAppointments({ tenant_id: user?.id });
        const apptList = Array.isArray(appts) ? appts : (appts?.results || []);
        setAppointments(apptList);
        
        const reqs = await connection.operations.getRequests({ tenant_id: user?.id });
        const reqList = Array.isArray(reqs) ? reqs : (reqs?.results || []);
        setRequests(reqList);
      } catch (e) {
        // Set empty arrays on error
        setAppointments([]); 
        setRequests([]);
      }
    };
    load();
  }, [user, navigate]);

  // Calculate pending tasks
  const pendingTasks = requests.filter(req => req.status === 'pending');

  return (
    <Layout role="staff">
      <div className="space-y-8">
        {/* Header with welcome message */}
        <div>
          <h1 className="text-3xl font-bold text-[#2E3192]">
            Staff Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName}! Here&apos;s your work overview.
          </p>
        </div>

        {/* Stats cards grid - each card shows a key metric */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* My Tasks Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-[#F9E81B] border-2 border-transparent" onClick={() => navigate('/staff/operations')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                My Tasks
                <ClipboardList className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{requests.length}</div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                assigned to you
                <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          {/* Appointments Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-[#F9E81B] border-2 border-transparent" onClick={() => navigate('/staff/schedule')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Appointments
                <Calendar className="h-4 w-4 text-[#F9E81B]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{appointments.length}</div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                view schedule
                <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          {/* Pending Reviews Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-[#F9E81B] border-2 border-transparent" onClick={() => navigate('/staff/compliance')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Pending Reviews
                <FileCheck className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ED1C24]">0</div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                Compliance documents
                <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          {/* Active Requests Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-[#F9E81B] border-2 border-transparent" onClick={() => navigate('/staff/operations')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Active Requests
                <CheckCircle className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{requests.length}</div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                Operation requests
                <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main content grid - Appointments and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Appointments section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#2E3192]">My Appointments</CardTitle>
                <CardDescription>Your upcoming appointments</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff/schedule')} className="gap-1 text-[#2E3192] hover:text-[#2E3192] hover:bg-[#F9E81B]/20">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.slice(0, 3).map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[#F9E81B]/10 transition-colors"
                    onClick={() => navigate('/staff/schedule')}
                  >
                    <Calendar className="h-5 w-5 text-[#F9E81B] mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{appointment.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {appointment.date} at {appointment.time}
                      </p>
                      <Badge className="mt-2 bg-[#2E3192] text-white">
                        Scheduled
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Tasks section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#2E3192]">Assigned Tasks</CardTitle>
                <CardDescription>Operation requests assigned to you</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff/operations')} className="gap-1 text-[#2E3192] hover:text-[#2E3192] hover:bg-[#F9E81B]/20">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.slice(0, 3).map((request) => (
                  <div 
                    key={request.id} 
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[#F9E81B]/10 transition-colors"
                    onClick={() => navigate('/staff/operations')}
                  >
                    <ClipboardList className="h-5 w-5 text-[#2E3192] mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{request.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Priority: {request.priority}
                      </p>
                      <Badge 
                        className={`mt-2 ${request.status === 'completed' ? 'bg-[#2E3192] text-white' : request.status === 'pending' ? 'bg-[#ED1C24] text-white' : 'bg-[#F9E81B]/30 text-[#2E3192]'}`}
                      >
                        {request.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
