import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import { Download, FileText, CheckCircle, XCircle, Clock, Table as TableIcon, Plus, Search, User } from 'lucide-react';
import connection from '../../connected/connection.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu.jsx';
import { exportToCSV, exportToExcel, exportToWord, exportToDocx, printToPDF } from '../../exporting/export.js';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.jsx';
import { toast } from 'sonner';

export function StaffFinancial() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for storing payments and UI
  const [payments, setPayments] = useState([]);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tenant search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Transaction form state
  const [transactionData, setTransactionData] = useState({
    amount: '',
    payment_method: 'cash',
    description: '',
    payment_date: new Date().toISOString().split('T')[0]
  });

  // Redirect if not staff
  useEffect(() => {
    if (user?.role !== 'staff') navigate('/');
  }, [user, navigate]);

  // Load payments
  const loadPayments = async () => {
    try {
      const pay = await connection.financial.getPayments();
      setPayments(pay.results || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Handle tenant search
  useEffect(() => {
    const searchTenants = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const resp = await connection.users.getUsers({ role: 'tenant', search: searchQuery });
        setSearchResults(resp.results || []);
      } catch (error) {
        console.error('Tenant search failed:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchTenants, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle saving transaction
  const handleSaveTransaction = async () => {
    if (!selectedTenant) {
      toast.error('Please select a tenant');
      return;
    }
    if (!transactionData.amount || isNaN(transactionData.amount)) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await connection.financial.createPayment({
        user: selectedTenant.id,
        amount: parseFloat(transactionData.amount),
        payment_method: transactionData.payment_method,
        description: transactionData.description,
        status: 'completed',
        payment_date: transactionData.payment_date
      });

      toast.success('Transaction saved successfully');
      setIsTransactionDialogOpen(false);
      resetForm();
      loadPayments();
    } catch (error) {
      toast.error('Failed to save transaction');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedTenant(null);
    setSearchQuery('');
    setSearchResults([]);
    setTransactionData({
      amount: '',
      payment_method: 'cash',
      description: '',
      payment_date: new Date().toISOString().split('T')[0]
    });
  };

  // Export payments with format choice
  const handleExport = async (format) => {
    try {
      const headers = ['Payment ID', 'Tenant', 'Amount', 'Payment Date', 'Method', 'Status', 'Description'];
      const rows = payments.map(pay => [
        pay.id,
        pay.tenant_name,
        pay.amount,
        pay.payment_date,
        pay.payment_method,
        pay.status,
        pay.description || ''
      ]);
      if (format === 'csv') {
        exportToCSV(headers, rows, 'staff_payments.csv');
      } else if (format === 'excel') {
        exportToExcel(headers, rows, 'staff_payments.xls', 'Payments');
      } else if (format === 'word') {
        exportToWord(headers, rows, 'staff_payments.doc', 'Payments');
      } else if (format === 'docx') {
        await exportToDocx(headers, rows, 'staff_payments.docx', 'Payments');
      } else if (format === 'pdf') {
        printToPDF(headers, rows, 'Payments');
      }
    } catch (e) {
      alert('Failed to export. Please try again.');
    }
  };

  // Receipt generation logic
  const handleViewReceipt = (payment) => {
    const headers = ['Receipt Item', 'Value'];
    const rows = [
      ['Payment ID', payment.id],
      ['Tenant', payment.tenant_name],
      ['Amount', `₱${payment.amount.toLocaleString()}`],
      ['Date', payment.payment_date],
      ['Method', payment.payment_method],
      ['Status', payment.status],
      ['Description', payment.description || 'N/A']
    ];
    printToPDF(headers, rows, `Receipt - ${payment.id}`);
  };

  // Get status badge styling - consistent with tenant-compliance
  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return { className: 'bg-[#2E3192] text-white hover:bg-[#2E3192]/90', icon: <CheckCircle className="h-3 w-3 mr-1" /> };
    } else if (status === 'pending') {
      return { className: 'bg-[#F9E81B]/30 text-[#2E3192] hover:bg-[#F9E81B]/40', icon: <Clock className="h-3 w-3 mr-1" /> };
    } else {
      return { className: 'bg-[#ED1C24] text-white hover:bg-[#ED1C24]/90', icon: <XCircle className="h-3 w-3 mr-1" /> };
    }
  };

  return (
    <Layout role="staff">
      <div className="space-y-6">
        {/* Header with export and add button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2E3192]">Financial Overview</h1>
            <p className="text-gray-600 mt-1">Manage and track all payment transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF (Print)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('word')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Word (.doc)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('docx')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Word (.docx)
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
            <Button 
              onClick={() => setIsTransactionDialogOpen(true)}
              className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
        
        {/* Payments table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#2E3192]">Payment Transactions</CardTitle>
            <CardDescription>All recorded payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 mx-auto mb-3 text-[#2E3192]/30" />
                <p className="font-medium text-[#2E3192]">No transactions recorded</p>
                <p className="text-sm text-gray-500 mt-1">Add your first transaction to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => {
                  const statusBadge = getStatusBadge(payment.status);
                  return (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-[#F9E81B]/5 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-md bg-[#2E3192]/10 flex items-center justify-center flex-shrink-0 border border-[#2E3192]/20">
                          <FileText className="h-5 w-5 text-[#2E3192]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#2E3192]">{payment.tenant_name}</p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            ₱{(payment.amount || 0).toLocaleString()} via {payment.payment_method}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {payment.payment_date} {payment.description && `• ${payment.description}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusBadge.className}>
                          <span className="flex items-center">
                            {statusBadge.icon}
                            {payment.status}
                          </span>
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewReceipt(payment)}
                          className="border-gray-300"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Entry Dialog */}
        <Dialog open={isTransactionDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsTransactionDialogOpen(open);
        }}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">New Financial Transaction</DialogTitle>
              <DialogDescription>Search for a tenant and enter payment details</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Tenant Search Section */}
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Search Tenant <span className="text-[#ED1C24]">*</span></Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Start typing to search..."
                    className="pl-9 border-gray-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && !selectedTenant && (
                <div className="border border-gray-200 rounded-md divide-y max-h-[160px] overflow-y-auto">
                  {searchResults.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="p-3 hover:bg-[#F9E81B]/10 cursor-pointer flex items-center justify-between transition-colors"
                      onClick={() => {
                        setSelectedTenant(tenant);
                        setSearchQuery(tenant.first_name + ' ' + tenant.last_name);
                        setSearchResults([]);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#F9E81B] flex items-center justify-center">
                          <User className="h-4 w-4 text-[#2E3192]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#2E3192]">{tenant.first_name} {tenant.last_name}</p>
                          <p className="text-xs text-gray-500">ID: {tenant.id} | {tenant.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isSearching && <p className="text-xs text-gray-500">Searching...</p>}

              {/* Selected Tenant Info */}
              {selectedTenant && (
                <div className="p-4 bg-[#F9E81B]/10 border border-[#F9E81B] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#F9E81B] flex items-center justify-center">
                      <User className="h-5 w-5 text-[#2E3192]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2E3192]">{selectedTenant.first_name} {selectedTenant.last_name}</p>
                      <p className="text-xs text-gray-500">Unit: {selectedTenant.unitNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedTenant(null)}
                    className="text-[#2E3192]"
                  >
                    Change
                  </Button>
                </div>
              )}

              {/* Transaction Details Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Amount (PHP) <span className="text-[#ED1C24]">*</span></Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="border-gray-200"
                    value={transactionData.amount}
                    onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Payment Date <span className="text-[#ED1C24]">*</span></Label>
                  <Input
                    type="date"
                    className="border-gray-200"
                    value={transactionData.payment_date}
                    onChange={(e) => setTransactionData({ ...transactionData, payment_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Payment Method <span className="text-[#ED1C24]">*</span></Label>
                <Select
                  value={transactionData.payment_method}
                  onValueChange={(val) => setTransactionData({ ...transactionData, payment_method: val })}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Description</Label>
                <Textarea
                  placeholder="e.g., Monthly rent, Utility bills, Penalty fee..."
                  className="border-gray-200"
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                />
                <p className="text-xs text-gray-500">Optional notes about this transaction</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)} className="border-gray-300">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTransaction} 
                disabled={loading}
                className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
              >
                {loading ? 'Saving...' : 'Save Transaction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
