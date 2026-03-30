import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../../components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Building, MapPin, Maximize, Calendar, PhilippinePeso, Home } from 'lucide-react';
import connection from '../../connected/connection.js';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import { toast } from 'sonner';

export function TenantCommercialSpace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for units
  const [myUnit, setMyUnit] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    // Redirect if not tenant
    if (user?.role !== 'tenant') {
      navigate('/');
      return;
    }
    
    const load = async () => {
      try {
        setLoading(true);
        
        // Fetch tenant's assigned unit
        const mine = await connection.commercialSpace.getUnits({ tenant_id: user?.id });
        
        // Get first unit assigned to tenant (assuming one unit per tenant)
        const myList = Array.isArray(mine) ? mine : (mine?.results || []);
        const my = myList[0] || null;
        setMyUnit(my);
        
      } catch (err) {
        toast.error('Failed to load units');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get status color for badge
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'occupied':
        return 'bg-[#2E3192]/10 text-[#2E3192] hover:bg-[#2E3192]/20';
      case 'maintenance':
        return 'bg-[#F9E81B]/30 text-[#2E3192] hover:bg-[#F9E81B]/40';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  return (
    <Layout role="tenant">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#2E3192]">
            Commercial Spaces
          </h1>
          <p className="text-gray-600 mt-1">
            View your assigned unit 
          </p>
        </div>

        <div className="space-y-6">
          {loading ? (
            // Loading skeletons
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          ) : myUnit ? (
            // Display tenant's assigned unit
            <>
              {/* Unit stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                      Unit Number
                      <Building className="h-4 w-4 text-[#2E3192]" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#2E3192]">{myUnit.number || myUnit.unitNumber}</div>
                    <p className="text-xs text-gray-500 mt-1">Your assigned unit</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                      Floor
                      <MapPin className="h-4 w-4 text-[#2E3192]" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#2E3192]">{myUnit.floor}</div>
                    <p className="text-xs text-gray-500 mt-1">Floor level</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                      Size
                      <Maximize className="h-4 w-4 text-[#2E3192]" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#2E3192]">{myUnit.size}</div>
                    <p className="text-xs text-gray-500 mt-1">Total area</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-transparent hover:border-[#F9E81B] transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                      Monthly Rent
                      <PhilippinePeso className="h-4 w-4 text-[#F9E81B]" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#ED1C24]">
                      ₱{(myUnit.rentalRate || myUnit.monthlyRent || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Base rental rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Unit details card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#2E3192]">Unit Details</CardTitle>
                  <CardDescription>Complete information about your commercial space</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left column - Basic info */}
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-[#2E3192]/10 p-3 rounded-lg">
                          <Building className="h-6 w-6 text-[#2E3192]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Unit Type
                          </p>
                          <p className="text-xl font-semibold mt-1 text-[#2E3192]">{myUnit.type}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-[#F9E81B]/30 p-3 rounded-lg">
                          <MapPin className="h-6 w-6 text-[#2E3192]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Location
                          </p>
                          <p className="text-xl font-semibold mt-1 text-[#2E3192]">
                            Floor {myUnit.floor}, Unit {myUnit.number || myUnit.unitNumber}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-[#2E3192]/10 p-3 rounded-lg">
                          <Maximize className="h-6 w-6 text-[#2E3192]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Total Area
                          </p>
                          <p className="text-xl font-semibold mt-1 text-[#2E3192]">{myUnit.size}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right column - Financial info */}
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-[#F9E81B]/30 p-3 rounded-lg">
                          <PhilippinePeso className="h-6 w-6 text-[#2E3192]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Monthly Rental Rate
                          </p>
                          <p className="text-3xl font-bold text-[#ED1C24] mt-1">
                            ₱{(myUnit.rentalRate || myUnit.monthlyRent || 0).toLocaleString()}
                            <span className="text-sm font-normal text-gray-500 ml-1">/month</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-[#2E3192]/10 p-3 rounded-lg">
                          <Home className="h-6 w-6 text-[#2E3192]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Status
                          </p>
                          <div className="mt-1">
                            <Badge 
                              className={`text-sm px-4 py-1 capitalize ${getStatusColor(myUnit.status)}`}
                            >
                              {myUnit.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lease information card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#2E3192]">Lease Information</CardTitle>
                  <CardDescription>Your current lease period and terms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Start date */}
                    <div className="p-5 bg-[#2E3192]/5 border border-[#2E3192]/10 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-[#2E3192]" />
                        <p className="text-sm font-medium text-gray-600">
                          Start Date
                        </p>
                      </div>
                      <p className="text-xl font-bold text-[#2E3192]">
                        {formatDate(myUnit.leaseStartDate || myUnit.lease_start_date)}
                      </p>
                    </div>

                    {/* End date */}
                    <div className="p-5 bg-[#F9E81B]/10 border border-[#F9E81B]/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-[#2E3192]" />
                        <p className="text-sm font-medium text-gray-600">
                          End Date
                        </p>
                      </div>
                      <p className="text-xl font-bold text-[#2E3192]">
                        {formatDate(myUnit.leaseEndDate || myUnit.lease_end_date)}
                      </p>
                    </div>

                    {/* Security deposit */}
                    <div className="p-5 bg-[#ED1C24]/5 border border-[#ED1C24]/10 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <PhilippinePeso className="h-5 w-5 text-[#ED1C24]" />
                        <p className="text-sm font-medium text-gray-600">
                          Security Deposit
                        </p>
                      </div>
                      <p className="text-xl font-bold text-[#ED1C24]">
                        ₱{(myUnit.securityDeposit || myUnit.security_deposit || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            // No unit assigned
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-4 text-[#2E3192]/40" />
                  <p className="text-lg font-medium text-[#2E3192]">No commercial unit assigned</p>
                  <p className="text-sm mt-1">Please contact the administrator for a unit assignment.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}