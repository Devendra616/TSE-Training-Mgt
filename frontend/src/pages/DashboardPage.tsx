import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getDashboardOverview } from '@/services/dashboard';
import { cn } from '@/utils/cn';

export function DashboardPage() {
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardOverview,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 text-red-500">
        Failed to load dashboard data
      </div>
    );
  }

  const { stats, compliance, recentActivity, upcomingDue } = data;

  const statCards = [
    {
      name: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'blue',
    },
    {
      name: 'Active Trainings',
      value: stats.totalTrainings,
      icon: GraduationCap,
      color: 'indigo',
    },
    {
      name: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: FileCheck,
      color: 'amber',
      onClick: () => navigate('/approvals'),
    },
    {
      name: 'Overdue',
      value: compliance.overdue,
      icon: AlertTriangle,
      color: 'red',
    },
  ];

  const complianceItems = [
    { status: 'Compliant', count: compliance.compliant, icon: CheckCircle2, color: 'green' },
    { status: 'Due Soon', count: compliance.dueSoon, icon: Clock, color: 'amber' },
    { status: 'Overdue', count: compliance.overdue, icon: XCircle, color: 'red' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
      amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[color] || colors.blue;
  };

  const compliancePercentages = {
    compliant: compliance.total > 0 ? Math.round((compliance.compliant / compliance.total) * 100) : 0,
    dueSoon: compliance.total > 0 ? Math.round((compliance.dueSoon / compliance.total) * 100) : 0,
    overdue: compliance.total > 0 ? Math.round((compliance.overdue / compliance.total) * 100) : 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Overview of training compliance and activities
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.name}
            className={cn(
              'hover:shadow-md transition-shadow',
              stat.onClick && 'cursor-pointer'
            )}
            onClick={stat.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                {stat.onClick && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Compliance Overview
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Compliance rate */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {compliance.complianceRate}%
                </div>
                <div className="text-sm text-gray-500">Compliance Rate</div>
              </div>

              {/* Progress bar */}
              <div className="h-4 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
                <div
                  className="bg-green-500 h-full transition-all"
                  style={{ width: `${compliancePercentages.compliant}%` }}
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${compliancePercentages.dueSoon}%` }}
                />
                <div
                  className="bg-red-500 h-full transition-all"
                  style={{ width: `${compliancePercentages.overdue}%` }}
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-4">
                {complianceItems.map((item) => (
                  <div key={item.status} className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <item.icon className={`w-5 h-5 ${getColorClasses(item.color).split(' ')[1]}`} />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {item.count}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Certificate approved
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {activity.employee} • {activity.training}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.timestamp && format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Due */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Due Trainings
            </h2>
            <button
              onClick={() => navigate('/certificates')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingDue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Employee
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Training
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Due Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {upcomingDue.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {item.employee?.fullName}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {item.training?.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {format(new Date(item.validUntil), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            item.complianceStatus === 'compliant' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            item.complianceStatus === 'due_soon' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                            item.complianceStatus === 'overdue' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {item.complianceStatus === 'due_soon' && <Clock className="w-3 h-3" />}
                          {item.complianceStatus === 'overdue' && <XCircle className="w-3 h-3" />}
                          {item.complianceStatus === 'compliant' && <CheckCircle2 className="w-3 h-3" />}
                          {item.daysRemaining} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No upcoming due trainings
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
