import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Calendar, FileCheck, CreditCard, Wrench, Building, ArrowRight } from 'lucide-react';
import connection from '../../connected/connection.js';

export function TenantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for tenant's data
  const [invoices, setInvoices] = useState([]);
  const [requests, setRequests] = useState([]);

  // Redirect if not tenant
  useEffect(() => {
    if (user?.role !== 'tenant') navigate('/');
  }, [user, navigate]);

  // Load tenant's invoices and maintenance requests
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch invoices for this tenant
        const inv = await connection.financial.getInvoices({ tenant_id: user?.id });
        setInvoices(inv.results || []);
        
        // Fetch maintenance requests for this tenant
        const req = await connection.maintenance.getRequests({ tenant_id: user?.id });
        setRequests(req.results || []);
      } catch (e) {
        setInvoices([]); 
        setRequests([]);
      }
    };
    load();
  }, [user]);

  // Navigation handlers
  const handleMyUnitClick = () => navigate('/tenant/commercial-space');
  const handlePendingPaymentsClick = () => navigate('/tenant/payments');
  const handleMaintenanceRequestsClick = () => navigate('/tenant/maintenance');
  const handleDocumentsClick = () => navigate('/tenant/compliance');

  // Calculate unpaid invoices total
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <Layout role="tenant">
      <div className="space-y-8">
        {/* Header with welcome message */}
        <div>
          <h1 className="text-3xl font-bold text-[#2E3192]">Tenant Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome, {user?.firstName}! Unit {user?.unitNumber}
          </p>
        </div>

        {/* Stats cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* My Unit Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-[#F9E81B] border-2 border-transparent" onClick={handleMyUnitClick}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                My Unit
                <Building className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{user?.unitNumber || 'A-105'}</div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                Commercial Space
                <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          {/* Pending Payments Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-[#F9E81B] border-2 border-transparent" onClick={handlePendingPaymentsClick}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Pending Payments
                <CreditCard className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ED1C24]">
                ₱{unpaidTotal.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                {unpaidInvoices.length} unpaid invoice(s)
                <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          {/* Maintenance Requests Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-[#F9E81B] border-2 border-transparent" onClick={handleMaintenanceRequestsClick}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Maintenance Requests
                <Wrench className="h-4 w-4 text-[#F9E81B]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{requests.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {requests.filter(req => req.status === 'pending').length} pending
              </p>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-[#F9E81B] border-2 border-transparent" onClick={handleDocumentsClick}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Documents
                <FileCheck className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">3</div>
              <p className="text-xs text-gray-500 mt-1">
                Compliance documents
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main content grid - Recent Invoices and Maintenance Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#2E3192]">Recent Invoices</CardTitle>
                <CardDescription>Your recent billing statements</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tenant/payments')} className="gap-1 text-[#2E3192] hover:text-[#2E3192] hover:bg-[#F9E81B]/20">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.slice(0, 3).map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-[#F9E81B]/10 transition-colors"
                    onClick={() => navigate('/tenant/payments')}
                  >
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-[#2E3192] mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{invoice.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Due: {invoice.dueDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₱{(invoice.amount || 0).toLocaleString()}</p>
                      <Badge 
                        className={`mt-1 ${invoice.status === 'paid' ? 'bg-[#2E3192] text-white' : 'bg-[#ED1C24] text-white'}`}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Requests section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#2E3192]">My Maintenance Requests</CardTitle>
                <CardDescription>Track your maintenance requests</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tenant/maintenance')} className="gap-1 text-[#2E3192] hover:text-[#2E3192] hover:bg-[#F9E81B]/20">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.slice(0, 3).map((request) => (
                  <div 
                    key={request.id} 
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[#F9E81B]/10 transition-colors"
                    onClick={() => navigate('/tenant/maintenance')}
                  >
                    <Wrench className="h-5 w-5 text-[#F9E81B] mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{request.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {request.createdAt}
                      </p>
                      <Badge 
                        className={`mt-2 ${request.status === 'completed' ? 'bg-[#2E3192] text-white' : 'bg-[#F9E81B]/30 text-[#2E3192]'}`}
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