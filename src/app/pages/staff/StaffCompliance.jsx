import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import { FileText, Download, CheckCircle, XCircle, Clock, FileCheck, AlertTriangle } from 'lucide-react';
import connection from '../../connected/connection.js';

export function StaffCompliance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for storing compliance documents
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');

  // Format date to show only date (no time)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Redirect if not staff and load documents
  useEffect(() => {
    if (user?.role !== 'staff') {
      navigate('/');
      return;
    }
    
    const load = async () => {
      const data = await connection.compliance.getDocuments();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setDocuments(list);
    };
    load();
  }, [user, navigate]);

  // Helper function to determine badge color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-[#2E3192] text-white hover:bg-[#2E3192]/90';
      case 'pending':
        return 'bg-[#F9E81B]/30 text-[#2E3192] hover:bg-[#F9E81B]/40';
      case 'expiring_soon':
        return 'bg-[#ED1C24]/10 text-[#ED1C24] hover:bg-[#ED1C24]/20';
      case 'rejected':
        return 'bg-[#ED1C24] text-white hover:bg-[#ED1C24]/90';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Helper function to get appropriate icon based on document status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'expiring_soon':
        return <AlertTriangle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Open review dialog with selected document
  const openReviewDialog = (document) => {
    setSelectedDocument(document);
    setReviewStatus(document.status);
    setReviewNotes(document.notes || '');
    setIsReviewDialogOpen(true);
  };

  // Handle submission of document review
  const handleReviewSubmit = async () => {
    if (!selectedDocument) return;
    
    // Update document status via API
    await connection.compliance.updateDocumentStatus(String(selectedDocument.id), reviewStatus, reviewNotes);
    
    // Update local state
    setDocuments(documents.map(doc => 
      String(doc.id) === String(selectedDocument.id) 
        ? { ...doc, status: reviewStatus, notes: reviewNotes }
        : doc
    ));
    
    setIsReviewDialogOpen(false);
  };

  // Placeholder for download functionality
  const handleDownload = (doc) => {};

  return (
    <Layout role="staff">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#2E3192]">
            Compliance Documents
          </h1>
          <p className="text-gray-600 mt-1">
            Review and manage tenant compliance documents
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Total Documents
                <FileText className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{documents.length}</div>
              <p className="text-xs text-gray-500 mt-1">All submissions</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Pending Review
                <Clock className="h-4 w-4 text-[#F9E81B]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">
                {documents.filter(d => d.status === 'pending').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting validation</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Approved
                <FileCheck className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">
                {documents.filter(d => d.status === 'approved').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Verified documents</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Expiring Soon
                <AlertTriangle className="h-4 w-4 text-[#ED1C24]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ED1C24]">
                {documents.filter(d => d.status === 'expiring_soon').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#2E3192]">Compliance Documents ({documents.length})</CardTitle>
            <CardDescription>All tenant compliance documents</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="rounded-md border border-gray-200">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-[#2E3192] font-semibold">Tenant</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Document Type</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Upload Date</TableHead>
                    <TableHead className="text-[#2E3192] font-semibold">Status</TableHead>
                    <TableHead className="text-right text-[#2E3192] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center">
                        <FileText className="h-10 w-10 mx-auto mb-3 text-[#2E3192]/30" />
                        <p className="text-sm text-gray-500">No documents found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-[#F9E81B]/5">
                        <TableCell className="font-medium text-[#2E3192]">{doc.tenantName}</TableCell>
                        <TableCell>{doc.documentType}</TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(doc.uploadDate)}</TableCell>
                        <TableCell>
                          <Badge className={`flex items-center gap-1 w-fit capitalize ${getStatusColor(doc.status)}`}>
                            {getStatusIcon(doc.status)}
                            {doc.status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              className="text-[#2E3192] hover:text-[#2E3192] hover:bg-[#F9E81B]/20"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openReviewDialog(doc)}
                              className="text-[#2E3192] hover:text-[#2E3192] hover:bg-[#F9E81B]/20"
                            >
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Review Document Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">Review Document</DialogTitle>
              <DialogDescription>
                Update document status and add notes
              </DialogDescription>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4 py-2">
                {/* Document info summary */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold text-[#2E3192]">{selectedDocument.tenantName}</p>
                  <p className="text-sm text-gray-600 mt-1">Document: {selectedDocument.documentType}</p>
                  <p className="text-sm text-gray-500">File: {selectedDocument.fileName}</p>
                </div>

                {/* Document Preview */}
                {(selectedDocument.fileUrl || selectedDocument.file_url || selectedDocument.file) && (() => {
                  const url = selectedDocument.fileUrl || selectedDocument.file_url || selectedDocument.file;
                  const fullUrl = url.startsWith('/') ? `http://localhost:8000${url}` : url;
                  return (
                    <div className="rounded-lg overflow-hidden border border-[#F9E81B] bg-[#F9E81B]/5 flex items-center justify-center p-3 min-h-32 max-h-64">
                      {String(url).match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <img 
                          src={fullUrl} 
                          alt="Document Preview" 
                          className="max-w-full h-full object-contain rounded"
                        />
                      ) : (
                        <a 
                          href={fullUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#2E3192] hover:underline flex items-center gap-2"
                        >
                          <FileText className="h-5 w-5" /> View/Download Document
                        </a>
                      )}
                    </div>
                  );
                })()}
                
                {/* Status selector */}
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Status</Label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Accepted</SelectItem>
                      <SelectItem value="pending">Under Validation</SelectItem>
                      <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Review notes */}
                <div className="space-y-2">
                  <Label className="text-[#2E3192] font-medium">Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes..."
                    rows={4}
                    className="border-gray-200 focus:border-[#F9E81B] focus:ring-[#F9E81B]"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)} className="border-gray-300">
                Cancel
              </Button>
              <Button onClick={handleReviewSubmit} className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold">
                Save Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}