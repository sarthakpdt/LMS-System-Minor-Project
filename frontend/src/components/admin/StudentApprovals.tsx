import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, GraduationCap, Calendar, BookOpen, Hash } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../../contexts/AuthContext';

export function StudentApprovals() {
  const { user } = useAuth();
  const [pendingStudents, setPendingStudents] = useState<any[]>([]); // will hold documents from backend
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingStudents();
  }, []);

  const loadPendingStudents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/students/pending', {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // map _id to id for easier use in UI components
        const list = (data.data || []).map((s: any) => ({ ...s, id: s._id }));
        setPendingStudents(list);
      } else {
        toast.error('Unable to load pending students', { description: data.message });
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while fetching pending students');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/students/${studentId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId: user.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Student approved!', {
          description: 'The student can now login and access the platform.',
        });
        loadPendingStudents();
      } else {
        toast.error('Approval failed', { description: data.message });
      }
    } catch (err) {
      console.error(err);
      toast.error('Approval failed', { description: 'Network or server error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (studentId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/students/${studentId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId: user.id, reason: 'Rejected via admin panel' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Student rejected', {
          description: 'The student registration has been rejected.',
        });
        loadPendingStudents();
      } else {
        toast.error('Rejection failed', { description: data.message });
      }
    } catch (err) {
      console.error(err);
      toast.error('Rejection failed', { description: 'Network or server error' });
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
                {/* … rest of display code unchanged … */}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}