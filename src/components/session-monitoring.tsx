"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, Download, Power, Wifi, User, Clock, Zap, RefreshCw, AlertCircle, Activity } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Session {
  id: string
  sessionId: string
  hotspotUser: {
    id: string
    username: string
    name: string
    email: string
  }
  router: {
    id: string
    name: string
    ipAddress: string
  }
  ipAddress: string
  macAddress: string
  startTime: string
  endTime?: string
  uploadBytes: number
  downloadBytes: number
  isActive: boolean
  duration: number
  createdAt: string
  updatedAt: string
}

export function SessionMonitoring() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [routerFilter, setRouterFilter] = useState('all')
  const [sessions, setSessions] = useState<Session[]>([])
  const [routers, setRouters] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSessions()
    fetchRouters()
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('isActive', statusFilter)
      if (routerFilter !== 'all') params.append('routerId', routerFilter)

      const response = await fetch(`/api/sessions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch sessions')
      
      const data = await response.json()
      setSessions(data.sessions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRouters = async () => {
    try {
      const response = await fetch('/api/routers?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch routers')
      
      const data = await response.json()
      setRouters(data.routers)
    } catch (err) {
      console.error('Failed to fetch routers:', err)
    }
  }

  const handleDisconnectSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to disconnect this session?')) return

    try {
      setDisconnecting(sessionId)
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to disconnect session')

      toast({
        title: "Success",
        description: "Session disconnected successfully",
      })
      
      fetchSessions()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to disconnect session',
        variant: "destructive",
      })
    } finally {
      setDisconnecting(null)
    }
  }

  const handleDisconnectAllSessions = async () => {
    if (!confirm('Are you sure you want to disconnect all active sessions?')) return

    try {
      const activeSessions = sessions.filter(s => s.isActive)
      const disconnectPromises = activeSessions.map(session => 
        fetch(`/api/sessions/${session.id}`, { method: 'POST' })
      )

      await Promise.all(disconnectPromises)

      toast({
        title: "Success",
        description: `Disconnected ${activeSessions.length} sessions`,
      })
      
      fetchSessions()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to disconnect all sessions",
        variant: "destructive",
      })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.hotspotUser.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.macAddress.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'true' && session.isActive) ||
                         (statusFilter === 'false' && !session.isActive)
    
    const matchesRouter = routerFilter === 'all' || session.router.id === routerFilter
    
    return matchesSearch && matchesStatus && matchesRouter
  })

  const activeSessions = sessions.filter(s => s.isActive)
  const totalDownload = sessions.reduce((total, session) => total + session.downloadBytes, 0)
  const totalUpload = sessions.reduce((total, session) => total + session.uploadBytes, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Session Monitoring</h2>
          <p className="text-gray-600">Monitor active user sessions and connections</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchSessions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDisconnectAllSessions}
            disabled={activeSessions.length === 0}
          >
            <Power className="w-4 h-4 mr-2" />
            Disconnect All ({activeSessions.length})
          </Button>
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
                  <div className="text-2xl font-bold">{activeSessions.length}</div>
                )}
                <p className="text-sm text-gray-600">Active Sessions</p>
              </div>
              <Wifi className="h-8 w-8 text-green-600" />
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
                  <div className="text-2xl font-bold">{sessions.length}</div>
                )}
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
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
                  <div className="text-2xl font-bold">{formatBytes(totalDownload)}</div>
                )}
                <p className="text-sm text-gray-600">Total Download</p>
              </div>
              <Download className="h-8 w-8 text-purple-600" />
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
                  <div className="text-2xl font-bold">{formatBytes(totalUpload)}</div>
                )}
                <p className="text-sm text-gray-600">Total Upload</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={routerFilter} onValueChange={setRouterFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Routers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routers</SelectItem>
                {routers.map((router) => (
                  <SelectItem key={router.id} value={router.id}>
                    {router.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Real-time session monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Router</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{session.hotspotUser.username}</div>
                        <div className="text-sm text-gray-500">{session.hotspotUser.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{session.ipAddress}</TableCell>
                    <TableCell className="font-mono">{session.macAddress}</TableCell>
                    <TableCell>
                      <div>
                        <div>{session.router.name}</div>
                        <div className="text-sm text-gray-500">{session.router.ipAddress}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(session.duration)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-green-600">↓ {formatBytes(session.downloadBytes)}</div>
                        <div className="text-red-600">↑ {formatBytes(session.uploadBytes)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.isActive ? "default" : "secondary"}>
                        {session.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                        >
                          View
                        </Button>
                        {session.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnectSession(session.id)}
                            disabled={disconnecting === session.id}
                          >
                            {disconnecting === session.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>Detailed information about the selected session</DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Username</Label>
                  <p className="text-sm text-gray-600">{selectedSession.hotspotUser.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-gray-600">{selectedSession.hotspotUser.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600">{selectedSession.hotspotUser.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedSession.isActive ? "default" : "secondary"}>
                    {selectedSession.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm text-gray-600">{selectedSession.ipAddress}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">MAC Address</Label>
                  <p className="text-sm text-gray-600">{selectedSession.macAddress}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Router</Label>
                  <p className="text-sm text-gray-600">{selectedSession.router.name} ({selectedSession.router.ipAddress})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Session ID</Label>
                  <p className="text-sm text-gray-600 font-mono">{selectedSession.sessionId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <p className="text-sm text-gray-600">{new Date(selectedSession.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-sm text-gray-600">{formatDuration(selectedSession.duration)}</p>
                </div>
                {selectedSession.endTime && (
                  <div>
                    <Label className="text-sm font-medium">End Time</Label>
                    <p className="text-sm text-gray-600">{new Date(selectedSession.endTime).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Data Usage</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Download</Label>
                    <p className="text-sm text-gray-600">{formatBytes(selectedSession.downloadBytes)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Upload</Label>
                    <p className="text-sm text-gray-600">{formatBytes(selectedSession.uploadBytes)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-sm font-medium">Total Data</Label>
                  <p className="text-sm text-gray-600">{formatBytes(selectedSession.downloadBytes + selectedSession.uploadBytes)}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedSession(null)}>
                  Close
                </Button>
                {selectedSession.isActive && (
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      handleDisconnectSession(selectedSession.id)
                      setSelectedSession(null)
                    }}
                    disabled={disconnecting === selectedSession.id}
                  >
                    {disconnecting === selectedSession.id ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Power className="w-4 h-4 mr-2" />
                    )}
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Live Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Live Statistics</CardTitle>
          <CardDescription>Real-time network usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatBytes(activeSessions.reduce((total, session) => total + session.downloadBytes, 0))}
              </div>
              <p className="text-sm text-gray-600">Current Download</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatBytes(activeSessions.reduce((total, session) => total + session.uploadBytes, 0))}
              </div>
              <p className="text-sm text-gray-600">Current Upload</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {activeSessions.length}
              </div>
              <p className="text-sm text-gray-600">Connected Users</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}