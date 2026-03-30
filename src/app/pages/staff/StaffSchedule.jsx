import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.jsx';
import { Tabs, TabsContent } from '../../components/ui/tabs.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar.jsx';
import { Search, Eye, Edit, Plus } from 'lucide-react';
import connection from '../../connected/connection.js';

export function StaffSchedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);

  const [activeTab, setActiveTab] = useState('appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [resultTitle, setResultTitle] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    assignedTo: '',
    status: 'scheduled',
  });

  const UNASSIGNED_VALUE = '__unassigned__';

  const getUserLabel = (u) => {
    if (!u) return '';
    const first = u.firstName ?? u.first_name ?? '';
    const last = u.lastName ?? u.last_name ?? '';
    const name = `${first} ${last}`.trim();
    return name || u.email || '';
  };

  const getInitials = (value) => {
    const str = String(value || '').trim();
    if (!str) return '?';
    const parts = str.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '?';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
  };

  const parseDateOnly = (dateStr) => {
    if (!dateStr) return null;
    const normalized = String(dateStr).slice(0, 10);
    const [y, m, d] = normalized.split('-').map((v) => Number(v));
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - diff);
    return d;
  };

  const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const getStartOfMonth = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfMonth = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Pending';
      case 'in_progress':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Pending';
    }
  };

  const statusVariant = (status) => {
    switch (status) {
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      case 'in_progress':
        return 'default';
      case 'scheduled':
      default:
        return 'secondary';
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      assignedTo: '',
      status: 'scheduled',
    });
    setSelectedAppointment(null);
  };

  const filteredAppointments = useMemo(() => {
    const today = new Date();
    const start =
      dateFilter === 'today'
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
        : dateFilter === 'this_week'
          ? getStartOfWeek(today)
          : dateFilter === 'this_month'
            ? getStartOfMonth(today)
            : null;
    const end =
      dateFilter === 'today'
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
        : dateFilter === 'this_week'
          ? getEndOfWeek(today)
          : dateFilter === 'this_month'
            ? getEndOfMonth(today)
            : null;

    const query = searchQuery.trim().toLowerCase();

    return appointments
      .filter((apt) => {
        if (!apt) return false;
        if (statusFilter !== 'all' && String(apt.status || 'scheduled') !== statusFilter) return false;
        if (assigneeFilter !== 'all') {
          const tenantId = String(apt.tenantId ?? apt.tenant_id ?? '');
          if (tenantId !== String(assigneeFilter)) return false;
        }
        if (start && end) {
          const aptDate = parseDateOnly(apt.date);
          if (!aptDate) return false;
          const ms = aptDate.getTime();
          if (ms < start.getTime() || ms > end.getTime()) return false;
        }
        if (query) {
          const hay = [apt.title, apt.location, apt.assignedTo, apt.date, apt.time, apt.status]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!hay.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = parseDateOnly(a.date)?.getTime() ?? 0;
        const db = parseDateOnly(b.date)?.getTime() ?? 0;
        if (da !== db) return db - da;
        return String(b.time || '').localeCompare(String(a.time || ''), undefined, { numeric: true });
      });
  }, [appointments, searchQuery, dateFilter, statusFilter, assigneeFilter]);

  // Load appointments when component mounts
  useEffect(() => {
    // Redirect if user is not staff
    if (user?.role !== 'staff') {
      navigate('/');
      return;
    }
    
    // Async function to fetch appointments from API
    const load = async () => {
      try {
        const resp = await connection.schedule.getAppointments({ tenant_id: user?.id });
        const list = Array.isArray(resp) ? resp : (resp?.results || []);
        setAppointments(list);
        try {
          const usersResp = await connection.users.getUsers();
          const usersList = Array.isArray(usersResp) ? usersResp : (usersResp?.results || []);
          setAssignableUsers(usersList);
        } catch (e) {
          console.error("Could not fetch user list", e);
        }
      } catch (e) {
        // Set empty array on error to prevent undefined issues
        setAppointments([]);
      }
    };
    load();
  }, [user, navigate]);

  const handleCreateAppointment = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      setResultTitle('Missing Required Fields');
      setResultMessage('Please fill in Title, Date, and Time.');
      setIsResultDialogOpen(true);
      return;
    }
    try {
      const payload = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: formData.status || 'scheduled',
        tenant_id: formData.assignedTo ? String(formData.assignedTo) : undefined
      };
      const created = await connection.schedule.createAppointment(payload);
      setAppointments((prev) => [...prev, created]);
      setActiveTab('appointments');
      setIsCreateDialogOpen(false);
      resetForm();
      setResultTitle('Adding Appointment Successful');
      setResultMessage('The appointment has been scheduled successfully.');
      setIsResultDialogOpen(true);
    } catch (error) {
      console.error('Error creating appointment:', error);
      setResultTitle('Failed Adding Appointment');
      setResultMessage('Failed adding appointment. Please try again.');
      setIsResultDialogOpen(true);
    }
  };

  const openEditDialog = (apt) => {
    setSelectedAppointment(apt);
    setFormData({
      title: apt.title || '',
      date: apt.date || '',
      time: apt.time || '',
      location: apt.location || '',
      assignedTo: String(apt.tenantId ?? apt.tenant_id ?? ''),
      status: apt.status || 'scheduled',
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (apt) => {
    setSelectedAppointment(apt);
    setIsViewDialogOpen(true);
  };
  
  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;
    if (!formData.title || !formData.date || !formData.time) {
      setResultTitle('Missing Required Fields');
      setResultMessage('Please fill in Title, Date, and Time.');
      setIsResultDialogOpen(true);
      return;
    }
    try {
      const payload = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: formData.status,
        tenant_id: formData.assignedTo ? String(formData.assignedTo) : null,
      };
      const updated = await connection.schedule.updateAppointment(String(selectedAppointment.id), payload);
      setAppointments((prev) => prev.map((a) => (String(a.id) === String(selectedAppointment.id) ? updated : a)));
      setIsEditDialogOpen(false);
      resetForm();
      setResultTitle('Updating Appointment Successful');
      setResultMessage('The appointment has been updated successfully.');
      setIsResultDialogOpen(true);
    } catch (error) {
      console.error('Error updating appointment:', error);
      setResultTitle('Failed Updating Appointment');
      setResultMessage('Failed updating appointment. Please try again.');
      setIsResultDialogOpen(true);
    }
  };

  return (
    <Layout role="staff">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#2E3192]">My Schedule</h1>
            <p className="text-gray-600 mt-1">
              View and manage your appointments
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
<Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <TabsContent value="appointments">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-[#2E3192]">Appointments</CardTitle>
                <CardDescription>
                  {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search appointments..."
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-full sm:w-[170px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Date: All</SelectItem>
                        <SelectItem value="today">Date: Today</SelectItem>
                        <SelectItem value="this_week">Date: This Week</SelectItem>
                        <SelectItem value="this_month">Date: This Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Status: All</SelectItem>
                        <SelectItem value="scheduled">Pending</SelectItem>
                        <SelectItem value="in_progress">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Assigned: All</SelectItem>
                        {assignableUsers.map((s) => (
                          <SelectItem key={String(s.id)} value={String(s.id)}>
                            {getUserLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
<TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="text-[#2E3192] font-semibold">Time / Date</TableHead>
                        <TableHead className="text-[#2E3192] font-semibold">Client / Event</TableHead>
                        <TableHead className="text-[#2E3192] font-semibold">Assigned To</TableHead>
                        <TableHead className="text-[#2E3192] font-semibold">Status</TableHead>
                        <TableHead className="text-right text-[#2E3192] font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-sm text-gray-500">
                            No appointments match your filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAppointments.map((apt) => {
                          const assigned = apt.assignedTo || 'Unassigned';
                          return (
                            <TableRow key={apt.id} className="hover:bg-[#F9E81B]/5">
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{apt.time || '-'}</span>
                                  <span className="text-xs text-gray-500">{apt.date || '-'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{apt.title || '-'}</span>
                                  <span className="text-xs text-gray-500">{apt.location || ''}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarImage src={apt.assigneeAvatar || ''} alt={assigned} />
                                    <AvatarFallback className="text-[10px] bg-[#F9E81B] text-[#2E3192]">{getInitials(assigned)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{assigned}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={apt.status || 'scheduled'}
                                  onValueChange={async (value) => {
                                    try {
                                      const updated = await connection.schedule.updateAppointment(String(apt.id), { status: value });
                                      setAppointments((prev) =>
                                        prev.map((a) => (String(a.id) === String(apt.id) ? updated : a))
                                      );
                                    } catch {}
                                  }}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="scheduled">Pending</SelectItem>
                                    <SelectItem value="in_progress">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
<Button variant="ghost" size="sm" onClick={() => openViewDialog(apt)} className="hover:bg-[#F9E81B]/20 hover:text-[#2E3192]">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(apt)} className="hover:bg-[#F9E81B]/20 hover:text-[#2E3192]">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">New Appointment</DialogTitle>
              <DialogDescription>Create a new schedule entry.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Title <span className="text-[#ED1C24]">*</span></Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Unit inspection"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Date <span className="text-[#ED1C24]">*</span></Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Time <span className="text-[#ED1C24]">*</span></Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Unit A-101"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Assigned To</Label>
                  <Select
                    value={formData.assignedTo ? String(formData.assignedTo) : UNASSIGNED_VALUE}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assignedTo: value === UNASSIGNED_VALUE ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                      {assignableUsers.map((s) => (
                        <SelectItem key={String(s.id)} value={String(s.id)}>
                          {getUserLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Pending</SelectItem>
                      <SelectItem value="in_progress">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
<Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-gray-300">
                Cancel
              </Button>
              <Button onClick={handleCreateAppointment} className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isViewDialogOpen}
          onOpenChange={(open) => {
            setIsViewDialogOpen(open);
            if (!open) setSelectedAppointment(null);
          }}
        >
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">Appointment Details</DialogTitle>
              <DialogDescription>View appointment information.</DialogDescription>
            </DialogHeader>
            {selectedAppointment ? (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Title</Label>
                  <Input value={selectedAppointment.title || ''} readOnly className="bg-gray-50/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#2E3192] font-medium">Date</Label>
                    <Input value={selectedAppointment.date || ''} readOnly className="bg-gray-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#2E3192] font-medium">Time</Label>
                    <Input value={selectedAppointment.time || ''} readOnly className="bg-gray-50/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Location</Label>
                  <Input value={selectedAppointment.location || ''} readOnly className="bg-gray-50/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Assigned To</Label>
                  <Input value={selectedAppointment.assignedTo || 'Unassigned'} readOnly className="bg-gray-50/50" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={statusVariant(selectedAppointment.status)}>
                    {statusLabel(selectedAppointment.status)}
                  </Badge>
                  <div className="flex gap-2">
<Button variant="outline" onClick={() => openEditDialog(selectedAppointment)} className="border-gray-300 hover:bg-[#F9E81B]/10 hover:text-[#2E3192]">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            <DialogFooter>
<Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="border-gray-300">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">Edit Appointment</DialogTitle>
              <DialogDescription>Update appointment details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Title <span className="text-[#ED1C24]">*</span></Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Date <span className="text-[#ED1C24]">*</span></Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Time <span className="text-[#ED1C24]">*</span></Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Assigned To</Label>
                  <Select
                    value={formData.assignedTo ? String(formData.assignedTo) : UNASSIGNED_VALUE}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assignedTo: value === UNASSIGNED_VALUE ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                      {assignableUsers.map((s) => (
                        <SelectItem key={String(s.id)} value={String(s.id)}>
                          {getUserLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Pending</SelectItem>
                      <SelectItem value="in_progress">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
<Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-gray-300">
                Cancel
              </Button>
              <Button onClick={handleUpdateAppointment} className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold">Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">{resultTitle}</DialogTitle>
              <DialogDescription>{resultMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setIsResultDialogOpen(false)} className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold">OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}