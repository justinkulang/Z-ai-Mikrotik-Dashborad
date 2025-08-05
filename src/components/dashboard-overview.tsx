"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Wifi, CreditCard, Activity, TrendingUp, AlertCircle } from 'lucide-react'

export function DashboardOverview() {
  // Mock data for demonstration
  const stats = {
    totalUsers: 156,
    activeUsers: 42,
    totalVouchers: 89,
    usedVouchers: 67,
    activeSessions: 23,
    totalRouters: 3,
    onlineRouters: 3
  }

  const recentActivity = [
    { id: 1, user: 'john_doe', action: 'Logged in', time: '2 minutes ago', status: 'success' },
    { id: 2, user: 'jane_smith', action: 'Voucher used', time: '5 minutes ago', status: 'success' },
    { id: 3, user: 'mike_wilson', action: 'Session ended', time: '10 minutes ago', status: 'info' },
    { id: 4, user: 'sarah_jones', action: 'Login failed', time: '15 minutes ago', status: 'error' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vouchers</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usedVouchers}/{stats.totalVouchers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalVouchers - stats.usedVouchers} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              Live connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routers</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineRouters}/{stats.totalRouters}</div>
            <p className="text-xs text-muted-foreground">
              All systems online
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Database Connection</span>
                </div>
                <Badge variant="outline" className="text-green-600">Healthy</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Router API</span>
                </div>
                <Badge variant="outline" className="text-green-600">Online</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Memory Usage</span>
                </div>
                <Badge variant="outline" className="text-yellow-600">78%</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Storage</span>
                </div>
                <Badge variant="outline" className="text-green-600">45%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <CreditCard className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-sm font-medium">Generate Vouchers</p>
              <p className="text-xs text-muted-foreground">Create new vouchers</p>
            </div>
            
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-sm font-medium">Add User</p>
              <p className="text-xs text-muted-foreground">Create new user</p>
            </div>
            
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Activity className="h-8 w-8 text-orange-600 mb-2" />
              <p className="text-sm font-medium">View Sessions</p>
              <p className="text-xs text-muted-foreground">Monitor active sessions</p>
            </div>
            
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <p className="text-sm font-medium">View Reports</p>
              <p className="text-xs text-muted-foreground">Usage statistics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}