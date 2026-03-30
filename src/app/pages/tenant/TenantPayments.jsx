import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import { Download, FileText, Table as TableIcon, CreditCard, PhilippinePeso } from 'lucide-react';
import connection from '../../connected/connection.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu.jsx';
import { exportToCSV, exportToExcel, exportToWord, printToPDF } from '../../exporting/export.js';

export function TenantPayments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for financial data
  const [payments, setPayments] = useState([]);

  // Redirect if not tenant
  useEffect(() => {
    if (user?.role !== 'tenant') navigate('/');
  }, [user, navigate]);

  // Load tenant's invoices and payment history
  useEffect(() => {
    const load = async () => {
      // Fetch payments for this tenant
      const pay = await connection.financial.getPayments({ tenant_id: user?.id });
      setPayments(pay.results || []);
    };
    load();
  }, [user]);

  // Calculate financial summaries
  const paidTotal = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const unpaidAmount = payments.filter(p => p.status !== 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);

  // Export combined invoices and payments
  const handleExport = async (format) => {
    const headers = ['ID', 'Amount', 'Status', 'Date'];
    const rows = [
      ...payments.map(pay => ['Payment', pay.id, pay.amount, pay.status || 'completed', pay.paymentDate]),
    ];
    if (format === 'csv') {
      exportToCSV(headers, rows, 'tenant_billing.csv');
    } else if (format === 'excel') {
      exportToExcel(headers, rows, 'tenant_billing.xls', 'Billing & Payments');
    } else if (format === 'word') {
      exportToWord(headers, rows, 'tenant_billing.doc', 'Billing & Payments');
    } else if (format === 'pdf') {
      printToPDF(headers, rows, 'Billing & Payments');
    }
  };
  // Receipt generation logic
  const handleViewReceipt = (payment) => {
    const headers = ['Receipt Item', 'Value'];
    const rows = [
      ['Payment ID', payment.id],
      ['Amount', `₱${payment.amount.toLocaleString()}`],
      ['Date', payment.payment_date],
      ['Method', payment.payment_method],
      ['Status', payment.status],
      ['Description', payment.description || 'N/A']
    ];
    printToPDF(headers, rows, `Receipt - ${payment.id}`);
  };

  return (
    <Layout role="tenant">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2E3192]">Payments & Billing</h1>
            <p className="text-gray-600 mt-1">View your payment history and billing statements</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-[#2E3192] text-[#2E3192] hover:bg-[#2E3192] hover:text-white">
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
        </div>

        {/* Financial summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Total Paid
                <CreditCard className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">
                ₱{paidTotal.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Completed payments</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Unpaid Balance
                <PhilippinePeso className="h-4 w-4 text-[#ED1C24]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ED1C24]">
                ₱{unpaidAmount.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Pending payments</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Total Transactions
                <FileText className="h-4 w-4 text-[#F9E81B]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{payments.length}</div>
              <p className="text-xs text-gray-500 mt-1">All-time payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment history table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#2E3192]">Payment History</CardTitle>
            <CardDescription>Your complete payment transaction records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-[#2E3192] font-semibold">Payment ID</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Amount (PHP)</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Payment Date</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Method</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Status</TableHead>
                    <TableHead className="text-right text-[#2E3192] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <CreditCard className="h-10 w-10 mx-auto mb-3 text-[#2E3192]/30" />
                        <p className="text-sm text-gray-500">No payment records found.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-[#F9E81B]/5">
                        <TableCell className="font-medium text-[#2E3192]">{payment.id}</TableCell>
                        <TableCell className="font-semibold">{`₱${(payment.amount || 0).toLocaleString()}`}</TableCell>
                        <TableCell className="text-sm text-gray-600">{payment.payment_date}</TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell>
                          <Badge className={payment.status === 'completed' ? 'bg-[#2E3192] text-white hover:bg-[#2E3192]/90' : 'bg-[#ED1C24] text-white hover:bg-[#ED1C24]/90'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewReceipt(payment)}
                            className="text-[#2E3192] hover:text-[#2E3192] hover:bg-[#F9E81B]/20"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Receipt
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
      </div>
    </Layout>
  );
}