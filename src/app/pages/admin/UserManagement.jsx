import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import { Search, Plus, Edit, Trash2, Download, FileText, Table as TableIcon } from 'lucide-react';
import connection from '../../connected/connection.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu.jsx';
import { exportToCSV, exportToExcel, exportToWord, exportToDocx, printToPDF } from '../../exporting/export.js';

export function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for storing users data
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Loading states for async operations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [resultTitle, setResultTitle] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Form state for creating/editing users
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'staff',
    phone: '',
    unitNumber: '',
    department: '',
    password: '',
  });

  const normalizeUser = (u) => ({
    ...u,
    firstName: u.firstName ?? u.first_name ?? '',
    lastName: u.lastName ?? u.last_name ?? '',
  });

  const sortUsersDesc = (list) => {
    return [...list].sort((a, b) => {
      const aNum = Number(a?.id);
      const bNum = Number(b?.id);
      const aFinite = Number.isFinite(aNum);
      const bFinite = Number.isFinite(bNum);
      if (aFinite && bFinite) return bNum - aNum;
      return String(b?.id ?? '').localeCompare(String(a?.id ?? ''), undefined, { numeric: true });
    });
  };

  // Load users when component mounts
  useEffect(() => {
    // Redirect if user is not an admin
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    const normalizeUsers = (data) => {
      const arr = Array.isArray(data) ? data : (data?.results || []);
      return arr.map((u) => normalizeUser(u));
    };
    
    const load = async () => {
      try {
        const resp = await connection.users.getUsers();
        const list = sortUsersDesc(normalizeUsers(resp));
        setUsers(list);
        setFilteredUsers(list);
      } catch (e) {
        // Set empty arrays on error
        setUsers([]);
        setFilteredUsers([]);
      }
    };
    load();
  }, [user, navigate]);

  // Filter users when search query or role filter changes
  useEffect(() => {
    let filtered = users;
    
    // Apply search filter (search by name or email)
    if (searchQuery) {
      filtered = filtered.filter(u =>
        (u.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  // Handle creating a new user
  const handleCreateUser = async () => {
    try {
      setIsCreating(true);
      const created = await connection.users.createUser(formData);
      setUsers((prev) => sortUsersDesc([...prev, normalizeUser(created)]));
      setIsCreateDialogOpen(false);
      resetForm();
      setResultTitle('Adding User Successful');
      setResultMessage('The user has been added successfully.');
      setIsResultDialogOpen(true);
    } catch (error) {
      console.error('Error creating user:', error);
      setResultTitle('Failed Adding User');
      setResultMessage('Failed adding user. Please try again.');
      setIsResultDialogOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle updating an existing user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsUpdating(true);
      const updated = await connection.users.updateUser(String(selectedUser.id), formData);
      setUsers((prev) =>
        sortUsersDesc(
          prev.map((u) => (String(u.id) === String(selectedUser.id) ? normalizeUser(updated) : u))
        )
      );
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await connection.users.deleteUser(String(userId));
        setUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  // Handle exporting users with format choice
  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      
      // Fetch all users data
      const allUsersResp = await connection.users.getUsers();
      const allUsers = Array.isArray(allUsersResp) ? allUsersResp : (allUsersResp?.results || []);
      const rowsUsers = sortUsersDesc(
        allUsers.map((user) => ({
          ...user,
          firstName: user.firstName ?? user.first_name ?? '',
          lastName: user.lastName ?? user.last_name ?? '',
        }))
      );
      
      const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Phone', 'Department', 'Unit Number'];
      const rows = rowsUsers.map(user => [
        user.id,
        user.email,
        user.firstName || '',
        user.lastName || '',
        user.role || '',
        user.phone || '',
        user.department || '',
        user.unitNumber || ''
      ]);

      if (format === 'csv') {
        exportToCSV(headers, rows, 'users_export.csv');
      } else if (format === 'excel') {
        exportToExcel(headers, rows, 'users_export.xls', 'Users Export');
      } else if (format === 'word') {
        exportToWord(headers, rows, 'users_export.doc', 'Users Export');
      } else if (format === 'docx') {
        await exportToDocx(headers, rows, 'users_export.docx', 'Users Export');
      } else if (format === 'pdf') {
        printToPDF(headers, rows, 'Users Export');
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Failed to export users. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'staff',
      phone: '',
      unitNumber: '',
      department: '',
    });
    setSelectedUser(null);
  };

  // Open edit dialog with selected user's data
  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'staff',
      phone: user.phone || '',
      unitNumber: user.unitNumber || '',
      department: user.department || '',
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Header with title and action buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2E3192]">
              User Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage system users and their access levels
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300" disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF (Print)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('docx')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('word')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Word (.doc)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <TableIcon className="h-4 w-4 mr-2" />
                  Excel (.xls)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <TableIcon className="h-4 w-4 mr-2" />
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Add user button */}
            <Button
              className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Filters card */}
        <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
          <CardHeader>
            <CardTitle className="text-[#2E3192]">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Role filter dropdown */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[#2E3192]">Users ({filteredUsers.length})</CardTitle>
            <CardDescription>List of all system users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-[#2E3192] font-semibold">User</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Email</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Role</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Phone</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Unit/Department</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Status</TableHead>
                    <TableHead className="text-right text-[#2E3192] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-[#F9E81B]/5">
                      {/* User avatar and name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-[#2E3192]/10 text-[#2E3192] text-xs font-semibold">
                              {(user.firstName || '?')[0]}{(user.lastName || '?')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-[#2E3192]">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* User email */}
                      <TableCell className="text-sm">{user.email}</TableCell>
                      
                      {/* User role badge */}
                      <TableCell>
                        <Badge className={
                          user.role === 'staff'
                            ? 'bg-[#2E3192] text-white hover:bg-[#2E3192]/90 capitalize'
                            : 'bg-[#F9E81B]/30 text-[#2E3192] hover:bg-[#F9E81B]/40 capitalize'
                        }>
                          {user.role}
                        </Badge>
                      </TableCell>
                      
                      {/* User phone */}
                      <TableCell className="text-sm">{user.phone || '-'}</TableCell>
                      
                      {/* User unit or department */}
                      <TableCell className="text-sm">
                        {user.unitNumber || user.department || '-'}
                      </TableCell>
                      
                      {/* User status */}
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 capitalize">
                          {user.status || 'active'}
                        </Badge>
                      </TableCell>
                      
                      {/* Action buttons */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-[#F9E81B]/20 text-[#2E3192]"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-[#ED1C24]/10"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-[#ED1C24]" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            
            {/* Form fields in a 2-column grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* First name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#2E3192] font-medium">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Last name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[#2E3192] font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Email (full width) */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email" className="text-[#2E3192] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Password (full width) */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="password" className="text-[#2E3192] font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Role select */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-[#2E3192] font-medium">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#2E3192] font-medium">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Conditional fields based on role */}
              {formData.role === 'tenant' && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="unitNumber" className="text-[#2E3192] font-medium">Unit Number</Label>
                  <Input
                    id="unitNumber"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
              )}
              
              {formData.role === 'staff' && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="department" className="text-[#2E3192] font-medium">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" className="border-gray-300" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
                onClick={handleCreateUser}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create User'}
              </Button>
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
              <Button
                className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
                onClick={() => setIsResultDialogOpen(false)}
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">Edit User</DialogTitle>
              <DialogDescription>
                Update user information
              </DialogDescription>
            </DialogHeader>
            
            {/* Form fields in a 2-column grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* First name */}
              <div className="space-y-2">
                <Label htmlFor="editFirstName" className="text-[#2E3192] font-medium">First Name</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Last name */}
              <div className="space-y-2">
                <Label htmlFor="editLastName" className="text-[#2E3192] font-medium">Last Name</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Email (full width) */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="editEmail" className="text-[#2E3192] font-medium">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Role select */}
              <div className="space-y-2">
                <Label htmlFor="editRole" className="text-[#2E3192] font-medium">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="editPhone" className="text-[#2E3192] font-medium">Phone</Label>
                <Input
                  id="editPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                />
              </div>
              
              {/* Conditional fields based on role */}
              {formData.role === 'tenant' && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="editUnitNumber" className="text-[#2E3192] font-medium">Unit Number</Label>
                  <Input
                    id="editUnitNumber"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
              )}
              
              {formData.role === 'staff' && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="editDepartment" className="text-[#2E3192] font-medium">Department</Label>
                  <Input
                    id="editDepartment"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" className="border-gray-300" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
                onClick={handleUpdateUser}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}