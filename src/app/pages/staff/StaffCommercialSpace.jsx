import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import { Edit, Save, Building, Users, CheckCircle, Wrench } from 'lucide-react';
import connection from '../../connected/connection.js';

export function StaffCommercialSpace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for storing units data
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Form state for editing unit
  const [formData, setFormData] = useState({
    unitNumber: '',
    floor: '',
    size: '',
    status: '',
    tenantId: 'none',
    monthlyRent: '',
    leaseStart: '',
    leaseEnd: '',
  });

  // Redirect if not staff
  useEffect(() => {
    if (user?.role !== 'staff') navigate('/');
  }, [user, navigate]);

  // Load all commercial units and users
  useEffect(() => {
    const load = async () => {
      try {
        const [unitsData, usersData] = await Promise.all([
          connection.commercialSpace.getUnits(),
          connection.users.getUsers()
        ]);
        
        const list = Array.isArray(unitsData) ? unitsData : (unitsData?.results || []);
        setUnits(list);
        
        const usersList = Array.isArray(usersData) ? usersData : (usersData?.results || []);
        setTenants(usersList.filter(u => 
          (u.role || '').toLowerCase() === 'tenant' || 
          (u.role || '').toLowerCase() === 'user'
        ));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    load();
  }, []);

  // Open edit dialog with selected unit's data
  const openEditDialog = (unit) => {
    setSelectedUnit(unit);
    setFormData({
      unitNumber: unit.number || unit.unitNumber || '',
      floor: String(unit.floor || ''),
      size: String(unit.size || ''),
      type: unit.type || '',
      status: unit.status || '',
      tenantId: unit.tenant_id ? String(unit.tenant_id) : 'none',
      monthlyRent: String(unit.monthlyRent || unit.rental_rate || ''),
      leaseStart: unit.leaseStart || '',
      leaseEnd: unit.leaseEnd || '',
    });
    setIsEditDialogOpen(true);
  };

  // Handle updating unit information
  const handleUpdateUnit = async () => {
    try {
      // Validate required fields
      if (!formData.unitNumber || !formData.floor || !formData.type || !formData.status) {
        alert('Please fill all required fields');
        return;
      }
      // Build payload using serializer-supported fields only
      const payload = {
        number: formData.unitNumber,
        floor: parseInt(formData.floor, 10) || 0,
        type: (formData.type || '').toLowerCase(),
        status: formData.status,
      };
      if (formData.size) payload.size = parseFloat(formData.size);
      if (formData.monthlyRent) payload.monthlyRent = parseFloat(formData.monthlyRent);
      if (formData.leaseStart) payload.leaseStartDate = formData.leaseStart;
      if (formData.leaseEnd) payload.leaseEndDate = formData.leaseEnd;
      
      // Assign tenant natively through payload
      if (formData.tenantId && formData.tenantId !== 'none') {
        payload.tenant = parseInt(formData.tenantId, 10);
        const selectedTenant = tenants.find(t => String(t.id) === String(formData.tenantId));
        if (selectedTenant) {
          payload.tenantName = (`${selectedTenant.first_name || ''} ${selectedTenant.last_name || ''}`).trim() || selectedTenant.username || selectedTenant.email;
        }
      } else {
        payload.tenant = null;
        payload.tenantName = '';
      }

      // Send update
      await connection.commercialSpace.updateUnit(String(selectedUnit.id), payload);
      
      // Refresh units list
      const refreshed = await connection.commercialSpace.getUnits();
      const list = Array.isArray(refreshed) ? refreshed : (refreshed?.results || []);
      setUnits(list);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating unit:', error);
      alert('Failed to update unit. Please check values and try again.');
    }
  };

  // Helper function to determine badge color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied':
        return 'bg-[#2E3192] text-white hover:bg-[#2E3192]/90';
      case 'available':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'reserved':
        return 'bg-[#F9E81B]/30 text-[#2E3192] hover:bg-[#F9E81B]/40';
      case 'maintenance':
        return 'bg-[#ED1C24]/10 text-[#ED1C24] hover:bg-[#ED1C24]/20';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Layout role="staff">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#2E3192]">
            Commercial Units
          </h1>
          <p className="text-gray-600 mt-1">
            View and edit commercial space units
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Total Units
                <Building className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{units.length}</div>
              <p className="text-xs text-gray-500 mt-1">All units</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Occupied
                <Users className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">
                {units.filter(u => u.status === 'occupied').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">With tenants</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Available
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {units.filter(u => u.status === 'available').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Ready for lease</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Maintenance
                <Wrench className="h-4 w-4 text-[#ED1C24]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ED1C24]">
                {units.filter(u => u.status === 'maintenance').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Under repair</p>
            </CardContent>
          </Card>
        </div>

        {/* Units table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[#2E3192]">Units ({units.length})</CardTitle>
            <CardDescription>View and manage commercial units</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[100px] text-[#2E3192] font-semibold">Unit Number</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Floor</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Type</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Status</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Tenant</TableHead>
                    <TableHead className="w-[100px] text-right text-[#2E3192] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <Building className="h-10 w-10 mx-auto mb-3 text-[#2E3192]/30" />
                        <p className="text-sm text-gray-500">No units found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    units.map((unit) => (
                      <TableRow key={unit.id} className="hover:bg-[#F9E81B]/5">
                        <TableCell className="font-medium text-[#2E3192]">{unit.number || unit.unitNumber}</TableCell>
                        <TableCell>{unit.floor}</TableCell>
                        <TableCell>
                          <Badge className="bg-[#2E3192]/10 text-[#2E3192] hover:bg-[#2E3192]/20 capitalize">
                            {unit.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`capitalize ${getStatusColor(unit.status)}`}>
                            {unit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{unit.tenant_name || unit.tenantName || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(unit)}
                            className="text-[#2E3192] hover:text-[#2E3192] hover:bg-[#F9E81B]/20"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Unit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">Update Commercial Unit</DialogTitle>
              <DialogDescription>
                Edit unit details and information
              </DialogDescription>
            </DialogHeader>
            {selectedUnit && (
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Unit Number */}
                <div className="space-y-2">
                  <Label htmlFor="unitNumber" className="text-[#2E3192] font-medium">Unit Number <span className="text-[#ED1C24]">*</span></Label>
                  <Input
                    id="unitNumber"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    placeholder="e.g., A-101"
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
                
                {/* Floor */}
                <div className="space-y-2">
                  <Label htmlFor="floor" className="text-[#2E3192] font-medium">Floor <span className="text-[#ED1C24]">*</span></Label>
                  <Input
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="e.g., 1"
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
                
                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-[#2E3192] font-medium">Type <span className="text-[#ED1C24]">*</span></Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type" className="border-gray-200">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Restaurant">Restaurant</SelectItem>
                      <SelectItem value="Warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-[#2E3192] font-medium">Status <span className="text-[#ED1C24]">*</span></Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger id="status" className="border-gray-200">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Tenant Name */}
                <div className="space-y-2">
                  <Label htmlFor="tenantName" className="text-[#2E3192] font-medium">Tenant Name</Label>
                  <Select
                    value={formData.tenantId}
                    onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                  >
                    <SelectTrigger id="tenantName" className="border-gray-200">
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Tenant</SelectItem>
                      {tenants.map(t => {
                        const fullName = `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.username;
                        return (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {fullName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-[#2E3192] font-medium">Size (sqm)</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., 100"
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
                
                {/* Monthly Rent */}
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent" className="text-[#2E3192] font-medium">Monthly Rent</Label>
                  <Input
                    id="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    placeholder="e.g., 50000"
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
                
                {/* Lease Start */}
                <div className="space-y-2">
                  <Label htmlFor="leaseStart" className="text-[#2E3192] font-medium">Lease Start Date</Label>
                  <Input
                    id="leaseStart"
                    type="date"
                    value={formData.leaseStart}
                    onChange={(e) => setFormData({ ...formData, leaseStart: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
                
                {/* Lease End */}
                <div className="space-y-2">
                  <Label htmlFor="leaseEnd" className="text-[#2E3192] font-medium">Lease End Date</Label>
                  <Input
                    id="leaseEnd"
                    type="date"
                    value={formData.leaseEnd}
                    onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-gray-300">
                Cancel
              </Button>
              <Button onClick={handleUpdateUnit} className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold">
                <Save className="h-4 w-4 mr-2" />
                Update Unit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}