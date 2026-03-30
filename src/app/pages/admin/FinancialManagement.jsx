import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import { Download, TrendingUp, FileText, Table as TableIcon, CheckCircle, XCircle, Clock } from 'lucide-react';
import connection from '../../connected/connection.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu.jsx';
import { exportToCSV, exportToExcel, exportToWord, exportToDocx, printToPDF } from '../../exporting/export.js';

export function FinancialManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for financial data
  const [payments, setPayments] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  // Initial load - fetch all financial data
  useEffect(() => {
    // Redirect if not admin
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    const load = async () => {
      try {
        // Fetch invoices, payments, and revenue analytics in parallel
        const [pay, revenue] = await Promise.all([
          connection.financial.getPayments(),
          connection.financial.getRevenueAnalytics({ period: 'month' })
        ]);
        setPayments(pay.results || []);
        setRevenueData(revenue.data || []);
      } catch (e) {
        // Set empty arrays on error
        setPayments([]); 
        setRevenueData([]);
      }
    };
    load();
  }, [user, navigate]);

  // Calculate financial summaries
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const unpaidAmount = payments.filter(p => p.status !== 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);

  // Handle exporting financial report with format choice
  const handleExportReport = async (format) => {
    try {
      // Fetch all financial data
      const [allPayments] = await Promise.all([
          connection.financial.getPayments(),
        ]);
        
        const headers = ['ID', 'Amount (PHP)', 'Status', 'Date'];
        const rows = [
          ...(allPayments.results || []).map(pay => [pay.id, pay.amount, 'completed', pay.created_at]),
        ];

      if (format === 'csv') {
        exportToCSV(headers, rows, 'financial_report.csv');
      } else if (format === 'excel') {
        exportToExcel(headers, rows, 'financial_report.xls', 'Financial Report');
      } else if (format === 'word') {
        exportToWord(headers, rows, 'financial_report.doc', 'Financial Report');
      } else if (format === 'docx') {
        await exportToDocx(headers, rows, 'financial_report.docx', 'Financial Report');
      } else if (format === 'pdf') {
        printToPDF(headers, rows, 'Financial Report');
      }
    } catch (error) {
      console.error('Error exporting financial report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  // Receipt generation logic
  const handleViewReceipt = (payment) => {
    const headers = ['Receipt Item', 'Value'];
    const rows = [
      ['Payment ID', payment.id],
      ['Tenant', payment.tenant_name],
      ['Amount', `₱${payment.amount.toLocaleString('en-PH')}`],
      ['Date', payment.payment_date],
      ['Method', payment.payment_method],
      ['Status', payment.status],
      ['Description', payment.description || 'N/A']
    ];
    printToPDF(headers, rows, `Receipt - ${payment.id}`);
  };

  // Helper function to determine badge styling based on status
  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return { className: 'bg-[#2E3192] text-white hover:bg-[#2E3192]/90', icon: <CheckCircle className="h-3 w-3 mr-1" /> };
    } else if (status === 'pending') {
      return { className: 'bg-[#F9E81B]/30 text-[#2E3192] hover:bg-[#F9E81B]/40', icon: <Clock className="h-3 w-3 mr-1" /> };
    } else {
      return { className: 'bg-[#ED1C24]/10 text-[#ED1C24] hover:bg-[#ED1C24]/20', icon: <XCircle className="h-3 w-3 mr-1" /> };
    }
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Header with export button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2E3192]">
              Financial Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage payments, and financial reports
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-gray-300">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportReport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                PDF (Print)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReport('word')}>
                <FileText className="h-4 w-4 mr-2" />
                Word (.doc)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReport('docx')}>
                <FileText className="h-4 w-4 mr-2" />
                Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReport('excel')}>
                <TableIcon className="h-4 w-4 mr-2" />
                Excel (.xls)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReport('csv')}>
                <TableIcon className="h-4 w-4 mr-2" />
                CSV (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Financial summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">₱{totalRevenue.toLocaleString('en-PH')}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Paid Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₱{paidAmount.toLocaleString('en-PH')}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Unpaid Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ED1C24]">₱{unpaidAmount.toLocaleString('en-PH')}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{payments.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Financial records table with tabs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[#2E3192]">Financial Records</CardTitle>
            <CardDescription>All recorded payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="payments">
              
              {/* Payments tab */}
              <TabsContent value="payments" className="mt-4">
                <div className="rounded-md border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-[#2E3192] font-semibold">Payment ID</TableHead>
                        <TableHead className="text-[#2E3192] font-semibold">Tenant</TableHead>
                        <TableHead className="text-[#2E3192] font-semibold">Amount (PHP)</TableHead>
                        <TableHead className="text-[#2E3192] font-semibold">Payment Date</TableHead>
                        <TableHead className="text-[#2E3192] font-semibold">Method</TableHead>
                        <TableHead className="text-[#2E3192] font-semibold">Status</TableHead>
                        <TableHead className="text-right text-[#2E3192] font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => {
                        const statusBadge = getStatusBadge(payment.status);
                        return (
                          <TableRow key={payment.id} className="hover:bg-[#F9E81B]/5">
                            <TableCell className="font-medium text-[#2E3192]">{payment.id}</TableCell>
                            <TableCell>{payment.tenant_name}</TableCell>
                            <TableCell>₱{(payment.amount || 0).toLocaleString('en-PH')}</TableCell>
                            <TableCell className="text-sm">{payment.payment_date}</TableCell>
                            <TableCell>{payment.payment_method}</TableCell>
                            <TableCell>
                              <Badge className={statusBadge.className}>
                                <span className="flex items-center">
                                  {statusBadge.icon}
                                  {payment.status}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="hover:bg-[#F9E81B]/20 text-[#2E3192]" onClick={() => handleViewReceipt(payment)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Receipt
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}