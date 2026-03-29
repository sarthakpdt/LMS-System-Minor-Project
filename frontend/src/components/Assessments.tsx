import { useState } from 'react';
import { Shield, Camera, Clock, AlertTriangle, CheckCircle, Monitor, User } from 'lucide-react';

const assessmentsData = [
  { 
    id: 1, 
    title: 'Mathematics Midterm Exam', 
    course: 'Mathematics 101', 
    date: '2026-02-10',
    duration: '120 min',
    students: 156,
    completed: 0,
    status: 'scheduled',
    securityLevel: 'high',
    proctoring: true,
    tabSwitching: false
  },
  { 
    id: 2, 
    title: 'Physics Quiz 3', 
    course: 'Physics 202', 
    date: '2026-02-03',
    duration: '45 min',
    students: 124,
    completed: 118,
    status: 'active',
    securityLevel: 'medium',
    proctoring: true,
    tabSwitching: true
  },
  { 
    id: 3, 
    title: 'Chemistry Lab Test', 
    course: 'Chemistry 301', 
    date: '2026-01-25',
    duration: '60 min',
    students: 98,
    completed: 98,
    status: 'completed',
    securityLevel: 'high',
    proctoring: true,
    tabSwitching: false
  },
  { 
    id: 4, 
    title: 'English Literature Essay', 
    course: 'English Literature', 
    date: '2026-02-08',
    duration: '90 min',
    students: 187,
    completed: 45,
    status: 'active',
    securityLevel: 'low',
    proctoring: false,
    tabSwitching: true
  },
];

const securityFeatures = [
  { 
    icon: Camera, 
    title: 'AI-Powered Proctoring', 
    description: 'Detects suspicious behavior using webcam monitoring',
    color: 'bg-red-100 text-red-600'
  },
  { 
    icon: Monitor, 
    title: 'Tab Switching Detection', 
    description: 'Alerts when student switches browser tabs during exam',
    color: 'bg-orange-100 text-orange-600'
  },
  { 
    icon: Shield, 
    title: 'Copy-Paste Prevention', 
    description: 'Blocks copy-paste actions to prevent cheating',
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    icon: Clock, 
    title: 'Time Limit Enforcement', 
    description: 'Automatically submits exam when time expires',
    color: 'bg-purple-100 text-purple-600'
  },
  { 
    icon: User, 
    title: 'Identity Verification', 
    description: 'Verifies student identity before exam begins',
    color: 'bg-green-100 text-green-600'
  },
  { 
    icon: AlertTriangle, 
    title: 'Anomaly Detection', 
    description: 'Flags unusual patterns and irregular behavior',
    color: 'bg-yellow-100 text-yellow-600'
  },
];

export function Assessments() {
  const [selectedTab, setSelectedTab] = useState('all');

  const filteredAssessments = assessmentsData.filter(assessment => {
    if (selectedTab === 'all') return true;
    return assessment.status === selectedTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSecurityBadge = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Online Assessments</h2>
        <p className="text-gray-600">Secure online exams with AI-powered proctoring and academic integrity monitoring.</p>
      </div>

      {/* Security Features Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Integrity & Security Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex gap-2">
          {['all', 'scheduled', 'active', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        {filteredAssessments.map((assessment) => (
          <div key={assessment.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                    <p className="text-sm text-gray-600">{assessment.course}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(assessment.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="text-sm font-medium text-gray-900">{assessment.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Students</p>
                    <p className="text-sm font-medium text-gray-900">{assessment.students}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Completed</p>
                    <p className="text-sm font-medium text-gray-900">{assessment.completed}/{assessment.students}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                    {assessment.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                    {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getSecurityBadge(assessment.securityLevel)}`}>
                    <Shield className="w-3 h-3" />
                    {assessment.securityLevel.toUpperCase()} Security
                  </span>
                  {assessment.proctoring && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <Camera className="w-3 h-3" />
                      AI Proctoring
                    </span>
                  )}
                  {!assessment.tabSwitching && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      <AlertTriangle className="w-3 h-3" />
                      Tab Lock Enabled
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  View Details
                </button>
                {assessment.status === 'active' && (
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    Monitor Live
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {assessment.status !== 'scheduled' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Completion Progress</span>
                  <span className="font-medium text-gray-900">
                    {Math.round((assessment.completed / assessment.students) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(assessment.completed / assessment.students) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
