"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Plus, Edit, Trash2, Search, Wifi, Settings, Activity, AlertTriangle, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Router {
  id: string
  name: string
  ipAddress: string
  username: string
  apiPort: number
  isActive: boolean
  status: 'online' | 'offline' | 'error'
  uptime: string
  version: string
  cpuLoad: number
  memoryUsage: number
  lastSeen: string
  totalSessions: number
  activeSessions: number
  totalPlans: number
}

interface RouterConfig {
  id: string
  routerId: string
  hotspotName: string
  interfaceName: string
  ipAddressRange: string
  dnsServers: string[]
  redirectUrl: string
  welcomeMessage: string
}

export function RouterManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null)
  const [activeTab, setActiveTab] = useState('routers')
  const [routers, setRouters] = useState<Router[]>([])
  const [routerConfigs, setRouterConfigs] = useState<RouterConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchRouters()
    fetchRouterConfigs()
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(fetchRouters, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchRouters = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/routers')
      if (!response.ok) throw new Error('Failed to fetch routers')
      
      const data = await response.json()
      setRouters(data.routers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routers')
      toast({
        title: "Error",
        description: "Failed to fetch routers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRouterConfigs = async () => {
    try {
      const response = await fetch('/api/router-configs')
      if (!response.ok) throw new Error('Failed to fetch router configs')
      
      const data = await response.json()
      setRouterConfigs(data.configs || [])
    } catch (err) {
      console.error('Failed to fetch router configs:', err)
    }
  }

  const handleTestConnection = async (routerId: string) => {
    try {
      setTestingConnection(routerId)
      const response = await fetch(`/api/routers/${routerId}`, {
        method: 'POST'
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Connection Test",
          description: data.message || "Connection successful",
        })
      } else {
        toast({
          title: "Connection Test Failed",
          description: data.error || "Failed to connect to router",
          variant: "destructive",
        })
      }
      
      fetchRouters()
    } catch (err) {
      toast({
        title: "Connection Test Failed",
        description: "Failed to test connection",
        variant: "destructive",
      })
    } finally {
      setTestingConnection(null)
    }
  }

  const handleSaveRouter = async (formData: any, routerId?: string) => {
    try {
      const url = routerId ? `/api/routers/${routerId}` : '/api/routers'
      const method = routerId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save router')
      }

      toast({
        title: "Success",
        description: routerId ? "Router updated successfully" : "Router added successfully",
      })
      
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      fetchRouters()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to save router',
        variant: "destructive",
      })
    }
  }

  const handleDeleteRouter = async (routerId: string) => {
    if (!confirm('Are you sure you want to delete this router? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/routers/${routerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete router')

      toast({
        title: "Success",
        description: "Router deleted successfully",
      })
      
      fetchRouters()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete router',
        variant: "destructive",
      })
    }
  }

  const filteredRouters = routers.filter(router =>
    router.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    router.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: Router['status']) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500">Online</Badge>
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const RouterForm = ({ router, onClose }: { router?: Router; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: router?.name || '',
      ipAddress: router?.ipAddress || '',
      username: router?.username || '',
      password: '',
      apiPort: router?.apiPort || 8728,
      isActive: router?.isActive ?? true
    })

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      await handleSaveRouter(formData, router?.id)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Router Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="ipAddress">IP Address</Label>
          <Input
            id="ipAddress"
            value={formData.ipAddress}
            onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="username">API Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">API Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={router ? "Leave blank to keep current password" : "Enter password"}
            required={!router}
          />
        </div>

        <div>
          <Label htmlFor="apiPort">API Port</Label>
          <Input
            id="apiPort"
            type="number"
            value={formData.apiPort}
            onChange={(e) => setFormData({ ...formData, apiPort: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {router ? 'Update Router' : 'Add Router'}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Router Management</h2>
          <p className="text-gray-600">Manage MikroTik routers and configurations</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchRouters} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Router
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Router</DialogTitle>
                <DialogDescription>Add a new MikroTik router to the system</DialogDescription>
              </DialogHeader>
              <RouterForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{routers.length}</div>
                )}
                <p className="text-sm text-gray-600">Total Routers</p>
              </div>
              <Wifi className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{routers.filter(r => r.status === 'online').length}</div>
                )}
                <p className="text-sm text-gray-600">Online</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{routers.filter(r => r.status === 'offline').length}</div>
                )}
                <p className="text-sm text-gray-600">Offline</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {routers.filter(r => r.status === 'online').length > 0 
                      ? Math.round(routers.filter(r => r.status === 'online').reduce((total, router) => total + router.cpuLoad, 0) / routers.filter(r => r.status === 'online').length)
                      : 0}%
                  </div>
                )}
                <p className="text-sm text-gray-600">Avg CPU Load</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="routers">Routers</TabsTrigger>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
        </TabsList>

        <TabsContent value="routers" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search routers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Routers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Routers</CardTitle>
              <CardDescription>List of all configured MikroTik routers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uptime</TableHead>
                      <TableHead>System Load</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRouters.map((router) => (
                      <TableRow key={router.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{router.name}</div>
                            <div className="text-sm text-gray-500">v{router.version}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{router.ipAddress}:{router.apiPort}</div>
                            <div className="text-sm text-gray-500">{router.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(router.status)}</TableCell>
                        <TableCell>{router.uptime}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">CPU:</span>
                              <Progress value={router.cpuLoad} className="w-16 h-2" />
                              <span className="text-sm">{router.cpuLoad}%</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">RAM:</span>
                              <Progress value={router.memoryUsage} className="w-16 h-2" />
                              <span className="text-sm">{router.memoryUsage}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{router.activeSessions} active</div>
                            <div className="text-gray-500">{router.totalSessions} total</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestConnection(router.id)}
                              disabled={testingConnection === router.id}
                            >
                              {testingConnection === router.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Wifi className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRouter(router)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRouter(router.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configurations" className="space-y-4">
          {/* Configurations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Hotspot Configurations</CardTitle>
              <CardDescription>Hotspot settings for each router</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Router</TableHead>
                    <TableHead>Hotspot Name</TableHead>
                    <TableHead>Interface</TableHead>
                    <TableHead>IP Range</TableHead>
                    <TableHead>DNS Servers</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routerConfigs.map((config) => {
                    const router = routers.find(r => r.id === config.routerId)
                    return (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{router?.name || 'Unknown'}</TableCell>
                        <TableCell>{config.hotspotName}</TableCell>
                        <TableCell>{config.interfaceName}</TableCell>
                        <TableCell>{config.ipAddressRange}</TableCell>
                        <TableCell>{config.dnsServers.join(', ')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Router Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Router</DialogTitle>
            <DialogDescription>Update router configuration</DialogDescription>
          </DialogHeader>
          {selectedRouter && (
            <RouterForm
              router={selectedRouter}
              onClose={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}