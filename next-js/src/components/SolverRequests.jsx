import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { 
  UserPlus, 
  CheckCircle, 
  X, 
  Clock, 
  Mail, 
  BookOpen,
  Loader2,
  AlertCircle,
  Check,
  XCircle,
  Phone,
  FileText,
  Download,
  User,
  Calendar,
  FileCheck,
  Eye,
  ExternalLink
} from 'lucide-react';

const SolverRequests = ({ onRequestProcessed }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
    // Refresh every 10 seconds
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const status = filter === 'all' ? null : filter;
      const data = await adminService.getSolverRequests(status);
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching solver requests:', err);
      setError('Failed to load solver requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await adminService.approveSolverRequest(requestId);
      await fetchRequests();
      if (onRequestProcessed) {
        onRequestProcessed();
      }
    } catch (err) {
      alert(err.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const notes = prompt('Enter rejection reason (optional):');
    if (notes === null) return; // User cancelled

    try {
      setProcessingId(requestId);
      await adminService.rejectSolverRequest(requestId, notes || '');
      await fetchRequests();
      if (onRequestProcessed) {
        onRequestProcessed();
      }
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200'
    };
    return badges[status] || badges.pending;
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    
    // Normalize backslashes to forward slashes
    let normalizedPath = filePath.replace(/\\/g, '/');
    
    // Handle absolute Windows paths (C:/Users/... or C:\Users\...)
    if (normalizedPath.match(/^[A-Z]:/i)) {
      // Extract only the relative path from uploads/
      if (normalizedPath.includes('uploads/')) {
        const parts = normalizedPath.split('uploads/');
        if (parts.length > 1) {
          // Get the part after 'uploads/' (e.g., solver-requests/filename.pdf)
          const relativePath = parts[parts.length - 1];
          return `/uploads/${relativePath}`;
        }
      }
      // If it contains solver-requests directly, extract from there
      if (normalizedPath.includes('solver-requests/')) {
        const parts = normalizedPath.split('solver-requests/');
        if (parts.length > 1) {
          const fileName = parts[parts.length - 1];
          return `/uploads/solver-requests/${fileName}`;
        }
      }
      // If we can't extract, return null
      console.error('Unable to extract relative path from:', filePath);
      return null;
    }
    
    // Handle relative paths
    if (normalizedPath.includes('uploads/')) {
      // Extract everything after 'uploads/'
      const parts = normalizedPath.split('uploads/');
      return `/uploads/${parts[parts.length - 1]}`;
    } else if (normalizedPath.includes('solver-requests/')) {
      // Handle solver-requests path
      const parts = normalizedPath.split('solver-requests/');
      return `/uploads/solver-requests/${parts[parts.length - 1]}`;
    } else if (!normalizedPath.startsWith('/')) {
      // If it's a relative path without uploads/, assume it's in solver-requests
      if (normalizedPath.includes('resume-') || normalizedPath.includes('marksheet-')) {
        return `/uploads/solver-requests/${normalizedPath}`;
      }
      return `/uploads/${normalizedPath}`;
    } else if (normalizedPath.startsWith('/uploads')) {
      // Already has /uploads prefix
      return normalizedPath;
    }
    
    // Default: assume it's in solver-requests
    return `/uploads/solver-requests/${normalizedPath}`;
  };

  const viewFile = (filePath, fileName) => {
    const fileUrl = getFileUrl(filePath);
    if (!fileUrl) {
      alert('File not available');
      return;
    }
    
    // Open file in new tab for viewing
    window.open(fileUrl, '_blank');
  };

  const downloadFile = async (filePath, fileName) => {
    const fileUrl = getFileUrl(filePath);
    if (!fileUrl) {
      alert('File not available');
      return;
    }
    
    try {
      // Fetch the file and trigger download
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('File not found');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading solver requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white/80 backdrop-blur-lg rounded-xl p-1 shadow-lg border border-white/50">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all capitalize ${
              filter === status
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status === 'all' ? 'All Requests' : status}
            {status === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-white/50">
          <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Solver Requests</h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'No pending solver requests at the moment.'
              : `No ${filter} requests found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <UserPlus className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{request.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Personal Information Section */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <UserPlus className="w-4 h-4" />
                          Personal Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-indigo-600" />
                            <div>
                              <p className="text-xs text-gray-500">Email Address</p>
                              <p className="text-sm font-semibold text-gray-900">{request.email}</p>
                            </div>
                          </div>
                          {request.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-indigo-600" />
                              <div>
                                <p className="text-xs text-gray-500">Phone Number</p>
                                <p className="text-sm font-semibold text-gray-900">{request.phoneNumber}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <div>
                              <p className="text-xs text-gray-500">Request Date</p>
                              <p className="text-sm font-semibold text-gray-900">{formatDate(request.createdAt)}</p>
                            </div>
                          </div>
                          {request.user_id && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              <div>
                                <p className="text-xs text-gray-500">User ID</p>
                                <p className="text-sm font-semibold text-gray-900 font-mono">{request.user_id._id || request.user_id}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expertise Areas Section */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                          Expertise Areas ({request.subjects.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {request.subjects.map((subject, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold shadow-sm"
                            >
                              <BookOpen className="w-3 h-3 inline mr-1.5" />
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Documents Section */}
                      {(request.resume || request.marksheet) && (
                        <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Documents
                          </h4>
                          
                          {/* Resume Section */}
                          {request.resume && (
                            <div className="mb-4 p-3 bg-white rounded-lg border border-indigo-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-indigo-600" />
                                  <span className="text-sm font-semibold text-gray-700">Resume</span>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">{request.resume.split('/').pop()}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => viewFile(request.resume, `${request.name}_Resume.pdf`)}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Resume
                                </button>
                                <button
                                  onClick={() => downloadFile(request.resume, `${request.name}_Resume.pdf`)}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Download Resume
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Marksheet Section */}
                          {request.marksheet && (
                            <div className="p-3 bg-white rounded-lg border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <FileCheck className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-semibold text-gray-700">Marksheet</span>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">{request.marksheet.split('/').pop()}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => viewFile(request.marksheet, `${request.name}_Marksheet.pdf`)}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Marksheet
                                </button>
                                <button
                                  onClick={() => downloadFile(request.marksheet, `${request.name}_Marksheet.pdf`)}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Download Marksheet
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin Notes Section */}
                      {request.admin_notes && (
                        <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                          <p className="text-xs font-bold text-yellow-800 mb-2">Admin Notes:</p>
                          <p className="text-sm text-yellow-900">{request.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleApprove(request._id)}
                      disabled={processingId === request._id}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {processingId === request._id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Approve Request
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      disabled={processingId === request._id}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {processingId === request._id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Reject Request
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SolverRequests;

