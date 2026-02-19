import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, GraduationCap, Calendar, BookOpen, Hash } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { StudentUser } from '../../contexts/AuthContext';

export function StudentApprovals() {
  const [pendingStudents, setPendingStudents] = useState<(StudentUser & { password: string })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingStudents();
  }, []);

  const loadPendingStudents = () => {
    const storedUsers = localStorage.getItem('lms_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    const pending = users.filter((u: any) => u.role === 'student' && u.approvalStatus === 'pending');
    setPendingStudents(pending);
  };

  const handleApprove = (studentId: string) => {
    setLoading(true);
    try {
      const storedUsers = localStorage.getItem('lms_users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      const updatedUsers = users.map((u: any) => {
        if (u.id === studentId) {
          return {
            ...u,
            approvalStatus: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: 'Admin', // In production, this would be the current admin's ID
          };
        }
        return u;
      });

      localStorage.setItem('lms_users', JSON.stringify(updatedUsers));
      loadPendingStudents();
      
      toast.success('Student approved!', {
        description: 'The student can now login and access the platform.',
      });
    } catch (error) {
      toast.error('Approval failed', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (studentId: string) => {
    setLoading(true);
    try {
      const storedUsers = localStorage.getItem('lms_users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      const updatedUsers = users.map((u: any) => {
        if (u.id === studentId) {
          return {
            ...u,
            approvalStatus: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: 'Admin',
          };
        }
        return u;
      });

      localStorage.setItem('lms_users', JSON.stringify(updatedUsers));
      loadPendingStudents();
      
      toast.success('Student rejected', {
        description: 'The student registration has been rejected.',
      });
    } catch (error) {
      toast.error('Rejection failed', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Approvals</h1>
        <p className="text-gray-600 mt-2">Review and approve student registrations for the current semester</p>
      </div>

      <div className="grid gap-4">
        {pendingStudents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
              <p className="text-gray-600">All student registrations have been processed.</p>
            </CardContent>
          </Card>
        ) : (
          pendingStudents.map((student) => (
            <Card key={student.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{student.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Approval
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(student.id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(student.id)}
                      disabled={loading}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p className="text-gray-900 font-medium">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p className="text-gray-900 font-medium">{student.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">Date of Birth</p>
                          <p className="text-gray-900 font-medium">{student.dateOfBirth}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      Academic Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">Student ID</p>
                          <p className="text-gray-900 font-medium">{student.studentId}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">Department</p>
                          <p className="text-gray-900 font-medium">{student.department}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">Course</p>
                          <p className="text-gray-900 font-medium">{student.course}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Semester Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">Current Semester</p>
                          <p className="text-gray-900 font-medium">Semester {student.semester}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-500">Academic Year</p>
                          <p className="text-gray-900 font-medium">{student.year}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
