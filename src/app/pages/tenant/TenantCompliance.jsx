import { useState, useEffect } from 'react';
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
import { Upload, FileText, FileCheck, Clock, XCircle } from 'lucide-react';
import connection from '../../connected/connection.js';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import { toast } from 'sonner';

export function TenantCompliance() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for documents
  const [documents, setDocuments] = useState([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ documentType: '', file: null });
  const [loading, setLoading] = useState(false);

  // Redirect if not tenant
  useEffect(() => {
    if (user?.role !== 'tenant') navigate('/');
  }, [user, navigate]);

  // Load tenant's documents
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const resp = await connection.compliance.getDocuments({ tenant_id: user?.id });
        setDocuments(Array.isArray(resp) ? resp : (resp.results || []));
      } catch (err) {
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Handle document upload
  const handleUpload = async () => {
    // Validate required fields
    if (!formData.documentType || !formData.file) {
      toast.warning('Please select a type and file');
      return;
    }

    // Create FormData for file upload
    const data = new FormData();
    data.append('file', formData.file);
    data.append('document_type', formData.documentType);
    data.append('tenant', String(user?.id || ''));

    try {
      await connection.compliance.uploadDocument(data);
      toast.success('Document uploaded');
      setIsUploadDialogOpen(false);

      // Refresh document list
      const resp = await connection.compliance.getDocuments({ tenant_id: user?.id });
      setDocuments(Array.isArray(resp) ? resp : (resp.results || []));

      // Reset form
      setFormData({ documentType: '', file: null });
    } catch (err) {
      console.error("Upload error: ", err);
      toast.error(err.message || 'Upload failed');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusText = status || 'pending';
    if (statusText === 'approved' || statusText === 'accepted') {
      return { className: 'bg-[#2E3192] text-white hover:bg-[#2E3192]/90', text: 'Accepted' };
    } else if (statusText === 'rejected') {
      return { className: 'bg-[#ED1C24] text-white hover:bg-[#ED1C24]/90', text: 'Rejected' };
    } else {
      return { className: 'bg-[#F9E81B]/30 text-[#2E3192] hover:bg-[#F9E81B]/40', text: 'Under Validation' };
    }
  };

  return (
    <Layout role="tenant">
      <div className="space-y-6">
        {/* Header with upload button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2E3192]">My Documents</h1>
            <p className="text-gray-600 mt-1">
              Upload and manage compliance documents
            </p>
          </div>
          <Button 
            onClick={() => setIsUploadDialogOpen(true)}
            className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Total Documents
                <FileText className="h-4 w-4 text-[#2E3192]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2E3192]">{documents.length}</div>
              <p className="text-xs text-gray-500 mt-1">Uploaded files</p>
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
                {documents.filter(d => d.status === 'pending' || !d.status).length}
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
                {documents.filter(d => d.status === 'approved' || d.status === 'accepted').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Verified documents</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#2E3192]">My Compliance Documents</CardTitle>
            <CardDescription>All your uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                // Loading skeletons
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : documents.length === 0 ? (
                // Empty state
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-[#2E3192]/30" />
                  <p className="font-medium text-[#2E3192]">No documents uploaded</p>
                  <p className="text-sm text-gray-500 mt-1">Upload your first compliance document to get started</p>
                </div>
              ) : (
                // Document list
                documents.map((doc) => {
                  const url = doc.fileUrl || doc.file_url || doc.file || '';
                  const fullUrl = url.startsWith('/') ? `http://localhost:8000${url}` : url;
                  const isImage = String(url).match(/\.(jpeg|jpg|gif|png)$/i);
                  const statusBadge = getStatusBadge(doc.status);
                  
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-[#F9E81B]/5 transition-colors">
                      <div className="flex items-start gap-4">
                        {isImage ? (
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            <img src={fullUrl} alt={doc.documentType || doc.document_type} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-[#2E3192]/10 flex items-center justify-center flex-shrink-0 border border-[#2E3192]/20">
                            <FileText className="h-6 w-6 text-[#2E3192]" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#2E3192]">{doc.documentType || doc.document_type}</p>
                          <a href={fullUrl} target="_blank" rel="noreferrer" className="text-sm text-[#2E3192] hover:underline mt-1 block">
                            {doc.fileName || doc.file_name || 'View Document'}
                          </a>
                          <p className="text-xs text-gray-500 mt-1">
                            Uploaded: {new Date(doc.uploadDate || doc.upload_date).toLocaleDateString()}
                            {doc.expiryDate && ` • Expires: ${new Date(doc.expiryDate).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusBadge.className}>
                        {statusBadge.text}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Document Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-[#2E3192]">Upload Document</DialogTitle>
              <DialogDescription>Upload a compliance document for verification</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Document type select */}
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">Document Type <span className="text-[#ED1C24]">*</span></Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business License">Business License</SelectItem>
                    <SelectItem value="Insurance Certificate">Insurance Certificate</SelectItem>
                    <SelectItem value="Fire Safety Certificate">Fire Safety Certificate</SelectItem>
                    <SelectItem value="Health Permit">Health Permit</SelectItem>
                    <SelectItem value="Valid ID">Valid ID</SelectItem>
                    <SelectItem value="Storefront Photo">Storefront Photo</SelectItem>
                    <SelectItem value="Other Image">Other Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File input */}
              <div className="space-y-2">
                <Label className="text-[#2E3192] font-medium">File <span className="text-[#ED1C24]">*</span></Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,image/*"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  className="border-gray-200"
                />
                <p className="text-xs text-gray-500">Accepted formats: PDF, JPG, PNG (max 5MB)</p>

                {/* Image Preview */}
                {formData.file && formData.file.type.startsWith('image/') && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-[#F9E81B] bg-[#F9E81B]/5 flex items-center justify-center p-3">
                    <img
                      src={URL.createObjectURL(formData.file)}
                      alt="Preview"
                      className="max-w-full h-auto max-h-48 object-contain rounded"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} className="border-gray-300">
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                className="bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] font-semibold"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}