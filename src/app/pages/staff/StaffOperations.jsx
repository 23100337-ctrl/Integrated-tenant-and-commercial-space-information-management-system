import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import connection from '../../connected/connection.js';

export function StaffOperations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for storing operation requests
  const [requests, setRequests] = useState([]);
  const formatDate = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return String(d).split('T')[0] || '';
    }
  };

  // Redirect if not staff
  useEffect(() => {
    if (user?.role !== 'staff') navigate('/');
  }, [user, navigate]);

  // Load operation requests
  useEffect(() => {
    const load = async () => {
      const data = await connection.operations.getRequests();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setRequests(list);
    };
    load();
  }, []);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-[#ED1C24] text-white">{priority}</Badge>;
      case 'medium':
        return <Badge className="bg-[#F9E81B] text-[#2E3192]">{priority}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-[#2E3192] text-white">{status}</Badge>;
      case 'in_progress':
        return <Badge className="bg-[#F9E81B]/20 text-[#2E3192] border border-[#F9E81B]">{status.replace('_', ' ')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
      default:
        return <Badge className="bg-[#ED1C24]/10 text-[#ED1C24] border border-[#ED1C24]/30">{status}</Badge>;
    }
  };

  return (
    <Layout role="staff">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#2E3192]">Operations</h1>
          <p className="text-gray-600 mt-1">Manage and track assigned operation requests</p>
        </div>
        
        {/* Requests table */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-[#2E3192]">My Assigned Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-[#2E3192] font-semibold">Title</TableHead>
                  <TableHead className="text-[#2E3192] font-semibold">Type</TableHead>
                  <TableHead className="text-[#2E3192] font-semibold">Priority</TableHead>
                  <TableHead className="text-[#2E3192] font-semibold">Status</TableHead>
                  <TableHead className="text-[#2E3192] font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-[#F9E81B]/5 transition-colors">
                    <TableCell className="font-medium text-gray-900">{req.title}</TableCell>
                    <TableCell className="text-gray-600">{req.type || req.request_type}</TableCell>
                    <TableCell>
                      {getPriorityBadge(req.priority)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={req.status || 'pending'}
                        onValueChange={async (value) => {
                          try {
                            const updated = await connection.operations.updateRequest(String(req.id), { status: value });
                            setRequests(requests.map(r => String(r.id) === String(req.id) ? updated : r));
                          } catch (e) {}
                        }}
                      >
                        <SelectTrigger className="w-[140px] border-gray-300 focus:border-[#2E3192] focus:ring-[#2E3192]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-gray-600">{formatDate(req.createdAt || req.created_at)}</TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No assigned requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}