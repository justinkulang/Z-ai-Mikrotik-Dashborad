"use client"

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Wifi, CreditCard, Activity, Settings, BarChart3, LogOut } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { DashboardOverview } from '@/components/dashboard-overview'
import { UserManagement } from '@/components/user-management'
import { VoucherManagement } from '@/components/voucher-management'
import { SessionMonitoring } from '@/components/session-monitoring'
import { RouterManagement } from '@/components/router-management'
import { StatisticsDashboard } from '@/components/statistics-dashboard'

export default function Home() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      signIn()
    }
  }, [session, status])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign in
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">MikroTik Hotspot Management</h1>
            <p className="text-gray-600 mt-2">Manage your hotspot users, vouchers, and sessions</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview />
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="vouchers" className="space-y-6">
              <VoucherManagement />
            </TabsContent>
            
            <TabsContent value="sessions" className="space-y-6">
              <SessionMonitoring />
            </TabsContent>
            
            <TabsContent value="routers" className="space-y-6">
              <RouterManagement />
            </TabsContent>
            
            <TabsContent value="statistics" className="space-y-6">
              <StatisticsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}