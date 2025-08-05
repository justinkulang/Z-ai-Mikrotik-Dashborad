"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, TrendingUp, Users, Wifi, Clock, Zap, BarChart3, PieChart } from 'lucide-react'

interface UsageStat {
  date: string
  totalUsers: number
  activeUsers: number
  totalSessions: number
  dataUsed: number
  revenue: number
}

interface TopUser {
  username: string
  sessions: number
  dataUsed: number
  duration: string
  revenue: number
}

interface RouterStat {
  name: string
  totalSessions: number
  dataUsed: number
  uptime: string
  cpuLoad: number
}

export function StatisticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data for demonstration
  const usageStats: UsageStat[] = [
    { date: '2024-01-14', totalUsers: 120, activeUsers: 25, totalSessions: 180, dataUsed: 2048000, revenue: 450 },
    { date: '2024-01-15', totalUsers: 125, activeUsers: 30, totalSessions: 195, dataUsed: 2252800, revenue: 480 },
    { date: '2024-01-16', totalUsers: 130, activeUsers: 28, totalSessions: 200, dataUsed: 2359296, revenue: 520 },
    { date: '2024-01-17', totalUsers: 135, activeUsers: 32, totalSessions: 210, dataUsed: 2560000, revenue: 550 },
    { date: '2024-01-18', totalUsers: 140, activeUsers: 35, totalSessions: 220, dataUsed: 2662416, revenue: 580 },
    { date: '2024-01-19', totalUsers: 145, activeUsers: 40, totalSessions: 235, dataUsed: 2867200, revenue: 620 },
    { date: '2024-01-20', totalUsers: 150, activeUsers: 42, totalSessions: 245, dataUsed: 2969600, revenue: 650 }
  ]

  const topUsers: TopUser[] = [
    { username: 'john_doe', sessions: 15, dataUsed: 512000, duration: '12h 30m', revenue: 85 },
    { username: 'jane_smith', sessions: 12, dataUsed: 486400, duration: '10h 15m', revenue: 72 },
    { username: 'mike_wilson', sessions: 10, dataUsed: 425984, duration: '8h 45m', revenue: 65 },
    { username: 'sarah_jones', sessions: 8, dataUsed: 385024, duration: '7h 20m', revenue: 58 },
    { username: 'david_brown', sessions: 7, dataUsed: 356352, duration: '6h 50m', revenue: 52 }
  ]

  const routerStats: RouterStat[] = [
    { name: 'Main Router', totalSessions: 150, dataUsed: 1843200, uptime: '15d 4h', cpuLoad: 25 },
    { name: 'Branch Router', totalSessions: 95, dataUsed: 1126400, uptime: '7d 12h', cpuLoad: 15 }
  ]

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const totalStats = {
    totalUsers: usageStats[usageStats.length - 1]?.totalUsers || 0,
    totalSessions: usageStats.reduce((total, stat) => total + stat.totalSessions, 0),
    totalDataUsed: usageStats.reduce((total, stat) => total + stat.dataUsed, 0),
    totalRevenue: usageStats.reduce((total, stat) => total + stat.revenue, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Statistics & Reports</h2>
          <p className="text-gray-600">Analyze usage patterns and generate reports</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalStats.totalUsers}</div>
                <p className="text-sm text-gray-600">Total Users</p>
                <div className="flex items-center text-green-600 text-xs mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last period
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalStats.totalSessions}</div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <div className="flex items-center text-green-600 text-xs mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% from last period
                </div>
              </div>
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatBytes(totalStats.totalDataUsed)}</div>
                <p className="text-sm text-gray-600">Data Used</p>
                <div className="flex items-center text-green-600 text-xs mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15% from last period
                </div>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalStats.totalRevenue)}</div>
                <p className="text-sm text-gray-600">Revenue</p>
                <div className="flex items-center text-green-600 text-xs mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +18% from last period
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="routers">Router Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Usage Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Daily usage statistics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Usage Chart Visualization</p>
                  <p className="text-sm text-gray-400">Would show interactive charts with real data</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Usage Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage Breakdown</CardTitle>
              <CardDescription>Detailed statistics for each day</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Users</TableHead>
                    <TableHead>Active Users</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Data Used</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{stat.date}</TableCell>
                      <TableCell>{stat.totalUsers}</TableCell>
                      <TableCell>{stat.activeUsers}</TableCell>
                      <TableCell>{stat.totalSessions}</TableCell>
                      <TableCell>{formatBytes(stat.dataUsed)}</TableCell>
                      <TableCell>{formatCurrency(stat.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Top Users */}
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Usage</CardTitle>
              <CardDescription>Users with highest data consumption and session counts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Data Used</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.sessions}</TableCell>
                      <TableCell>{formatBytes(user.dataUsed)}</TableCell>
                      <TableCell>{user.duration}</TableCell>
                      <TableCell>{formatCurrency(user.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* User Distribution Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>User distribution by plan type and usage patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">User Distribution Chart</p>
                  <p className="text-sm text-gray-400">Would show pie charts with user segments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routers" className="space-y-6">
          {/* Router Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Router Performance</CardTitle>
              <CardDescription>Performance metrics for each router</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Router Name</TableHead>
                    <TableHead>Total Sessions</TableHead>
                    <TableHead>Data Used</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>CPU Load</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routerStats.map((router, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{router.name}</TableCell>
                      <TableCell>{router.totalSessions}</TableCell>
                      <TableCell>{formatBytes(router.dataUsed)}</TableCell>
                      <TableCell>{router.uptime}</TableCell>
                      <TableCell>
                        <Badge variant={router.cpuLoad > 80 ? "destructive" : router.cpuLoad > 60 ? "secondary" : "default"}>
                          {router.cpuLoad}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalRevenue)}</div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalStats.totalRevenue / totalStats.totalSessions || 0)}</div>
                  <p className="text-sm text-gray-600">Average per Session</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalStats.totalRevenue / totalStats.totalUsers || 0)}</div>
                  <p className="text-sm text-gray-600">Average per User</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Daily revenue over the selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Revenue Chart Visualization</p>
                  <p className="text-sm text-gray-400">Would show revenue trends over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}