// ScheduleManagement.jsx - Admin schedule management page
// Allows administrators to view, create, and manage appointments and schedules

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import api from '../../connected/connection.js';

export function ScheduleManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  const [activeTab, setActiveTab] = useState('appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

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
    const [y, m, d] = String(dateStr).split('-').map((v) => Number(v));
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
        return 'bg-[#ED1C24]/10 text-[#ED1C24] hover:bg-[#ED1C24]/20';
      case 'completed':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'in_progress':
        return 'bg-[#2E3192] text-white hover:bg-[#2E3192]/90';
      case 'scheduled':
      default:
        return 'bg-[#F9E81B]/30 text-[#2E3192] hover:bg-[#F9E81B]/40';
    }
  };

  const appointmentKey = (apt) => String(apt?.id ?? '');
  const UNASSIGNED_VALUE = '__unassigned__';

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

  const allVisibleSelected =
    filteredAppointments.length > 0 &&
    filteredAppointments.every((a) => selectedIds.includes(appointmentKey(a)));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(filteredAppointments.map((a) => appointmentKey(a)));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
      return;
    }
    const toAdd = filteredAppointments.map((a) => appointmentKey(a));
    setSelectedIds((prev) => Array.from(new Set([...prev, ...toAdd])));
  };

  const toggleSelectOne = (id) => {
    const key = String(id);
    setSelectedIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  // Load appointments when component mounts
  useEffect(() => {
    // Redirect if user is not an admin
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    // Async function to fetch appointments from API
    const load = async () => {
      try {
        const resp = await api.schedule.getAppointments();
        const list = Array.isArray(resp) ? resp : (resp?.results || []);
        setAppointments(list);
        try {
          const usersResp = await api.users.getUsers();
          const usersList = Array.isArray(usersResp) ? usersResp : (usersResp?.results || []);
          setStaffUsers(usersList.filter(u => (u.role || '').toLowerCase() === 'staff'));
        } catch {}
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
        tenant_id: formData.assignedTo ? String(formData.assignedTo) : undefined,
      };
      const created = await api.schedule.createAppointment(payload);
      setAppointments((prev) => [...prev, created]);
      const createdTenantId = String(created?.tenantId ?? created?.tenant_id ?? '');
      const createdStatus = String(created?.status || 'scheduled');
      const createdDate = parseDateOnly(created?.date);
      const query = searchQuery.trim().toLowerCase();

      if (query) {
        const hay = [created?.title, created?.location, created?.assignedTo, created?.date, created?.time, created?.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(query)) setSearchQuery('');
      }

      if (statusFilter !== 'all' && createdStatus !== statusFilter) setStatusFilter('all');
      if (assigneeFilter !== 'all' && createdTenantId !== String(assigneeFilter)) setAssigneeFilter('all');

      if (dateFilter !== 'all' && createdDate) {
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
        if (start && end) {
          const ms = createdDate.getTime();
          if (ms < start.getTime() || ms > end.getTime()) setDateFilter('all');
        }
      }

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
      const updated = await api.schedule.updateAppointment(String(selectedAppointment.id), payload);
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

  const handleDeleteAppointment = async (id) => {
    try {
      await api.schedule.deleteAppointment(String(id));
      setAppointments((prev) => prev.filter((a) => String(a.id) !== String(id)));
      setSelectedIds((prev) => prev.filter((x) => x !== String(id)));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} appointment(s)?`)) return;
    const ids = [...selectedIds];
    for (const id of ids) {
      try {
        await api.schedule.deleteAppointment(String(id));
      } catch {}
    }
    setAppointments((prev) => prev.filter((a) => !ids.includes(String(a.id))));
    setSelectedIds([]);
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#2E3192]">Scheduling</h1>
            <p className="text-gray-600 mt-1">
              Manage appointments and schedules
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between gap-3">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  className="bg-[#ED1C24]/10 text-[#ED1C24] hover:bg-[#ED1C24]/20 border border-[#ED1C24]/20"
                  variant="ghost"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedIds.length})
                </Button>
              )}
              <Button
                className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </div>
          </div>

          <TabsContent value="appointments">
            <Card className="mt-4">
              <CardHeader className="pb-3">
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
                      className="pl-10 border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-full sm:w-[170px] border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="this_week">Date: This Week</SelectItem>
                        <SelectItem value="this_month">Date: This Month</SelectItem>
                        <SelectItem value="today">Date: Today</SelectItem>
                        <SelectItem value="all">Date: All</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[140px] border-gray-200">
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
                      <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Assigned: All</SelectItem>
                        {staffUsers.map((s) => (
                          <SelectItem key={String(s.id)} value={String(s.id)}>
                            {getUserLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-10">
                          <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAllVisible} />
                        </TableHead>
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
                          <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                            No appointments match your filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAppointments.map((apt) => {
                          const id = appointmentKey(apt);
                          const checked = selectedIds.includes(id);
                          const assigned = apt.assignedTo || 'Unassigned';
                          return (
                            <TableRow key={id} className="hover:bg-[#F9E81B]/5">
                              <TableCell>
                                <Checkbox checked={checked} onCheckedChange={() => toggleSelectOne(id)} />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-[#2E3192]">{apt.time || '-'}</span>
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
                                    <AvatarFallback className="text-[10px] bg-[#2E3192]/10 text-[#2E3192]">{getInitials(assigned)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{assigned}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={apt.status || 'scheduled'}
                                  onValueChange={async (value) => {
                                    try {
                                      const updated = await api.schedule.updateAppointment(String(apt.id), { status: value });
                                      setAppointments((prev) =>
                                        prev.map((a) => (String(a.id) === String(apt.id) ? updated : a))
                                      );
                                    } catch {}
                                  }}
                                >
                                  <SelectTrigger className="w-[140px] border-gray-200">
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
                                  <Button variant="ghost" size="sm" className="hover:bg-[#F9E81B]/20" onClick={() => openViewDialog(apt)}>
                                    <Eye className="h-4 w-4 text-gray-500" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="hover:bg-[#F9E81B]/20" onClick={() => openEditDialog(apt)}>
                                    <Edit className="h-4 w-4 text-[#2E3192]" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="hover:bg-[#ED1C24]/10" onClick={() => handleDeleteAppointment(apt.id)}>
                                    <Trash2 className="h-4 w-4 text-[#ED1C24]" />
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

        {/* Create Appointment Dialog */}
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
              <DialogDescription>Create and assign an appointment.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Unit inspection"
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Time *</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Unit A-101"
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
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
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                      {staffUsers.map((s) => (
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
                    <SelectTrigger className="border-gray-200">
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
              <Button variant="outline" className="border-gray-300" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold" onClick={handleCreateAppointment}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Appointment Dialog */}
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
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Title</div>
                  <div className="font-medium text-[#2E3192]">{selectedAppointment.title || '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">Date</div>
                    <div className="font-medium">{selectedAppointment.date || '-'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">Time</div>
                    <div className="font-medium">{selectedAppointment.time || '-'}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium">{selectedAppointment.location || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Assigned To</div>
                  <div className="font-medium">{selectedAppointment.assignedTo || 'Unassigned'}</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Badge className={statusVariant(selectedAppointment.status)}>
                    {statusLabel(selectedAppointment.status)}
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-300" onClick={() => openEditDialog(selectedAppointment)}>
                      Edit
                    </Button>
                    <Button
                      className="bg-[#ED1C24]/10 text-[#ED1C24] hover:bg-[#ED1C24]/20 border border-[#ED1C24]/20"
                      variant="ghost"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleDeleteAppointment(selectedAppointment.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" className="border-gray-300" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Appointment Dialog */}
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
                <Label className="text-[#2E3192] font-medium">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Time *</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
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
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                      {staffUsers.map((s) => (
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
                    <SelectTrigger className="border-gray-200">
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
              <Button variant="outline" className="border-gray-300" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold" onClick={handleUpdateAppointment}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Result Dialog */}
        <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">{resultTitle}</DialogTitle>
              <DialogDescription>{resultMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold" onClick={() => setIsResultDialogOpen(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}