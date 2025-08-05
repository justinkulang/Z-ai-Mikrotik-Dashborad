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
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Copy, Trash2, Search, Download, QrCode, RefreshCw, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Voucher {
  id: string
  code: string
  plan: {
    id: string
    name: string
    price: number
    duration: number
  }
  isUsed: boolean
  usedBy?: string
  usedAt?: string
  expiresAt?: string
  createdAt: string
}

interface Plan {
  id: string
  name: string
  price: number
  duration: number
  routerId: string
}

export function VoucherManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isUsedFilter, setIsUsedFilter] = useState<string>('all')
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchVouchers()
    fetchPlans()
  }, [])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (isUsedFilter !== 'all') params.append('isUsed', isUsedFilter)

      const response = await fetch(`/api/vouchers?${params}`)
      if (!response.ok) throw new Error('Failed to fetch vouchers')
      
      const data = await response.json()
      setVouchers(data.vouchers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vouchers')
      toast({
        title: "Error",
        description: "Failed to fetch vouchers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch plans')
      
      const data = await response.json()
      setPlans(data.plans)
    } catch (err) {
      console.error('Failed to fetch plans:', err)
    }
  }

  const handleGenerateVouchers = async (formData: any) => {
    try {
      setGenerating(true)
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate vouchers')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: `Successfully generated ${data.totalGenerated} vouchers`,
      })
      
      setIsGenerateDialogOpen(false)
      fetchVouchers()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to generate vouchers',
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return

    try {
      const response = await fetch(`/api/vouchers/${voucherId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete voucher')

      toast({
        title: "Success",
        description: "Voucher deleted successfully",
      })
      
      fetchVouchers()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete voucher',
        variant: "destructive",
      })
    }
  }

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Copied",
      description: "Voucher code copied to clipboard",
    })
  }

  const filteredVouchers = vouchers.filter(voucher =>
    voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const VoucherGeneratorForm = ({ onClose }: { onClose: () => void }) => {
    const [formData, setFormData] = useState({
      planId: '',
      quantity: 1,
      prefix: 'HS',
      expiresAt: '',
      generateQr: false
    })

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      await handleGenerateVouchers(formData)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="plan">Plan</Label>
          <Select value={formData.planId} onValueChange={(value) => setFormData({ ...formData, planId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price} ({plan.duration}min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity">Quantity (1-100)</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="100"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            required
          />
        </div>

        <div>
          <Label htmlFor="prefix">Code Prefix</Label>
          <Input
            id="prefix"
            value={formData.prefix}
            onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
            placeholder="e.g., HS, VOUCHER, etc."
            required
          />
        </div>

        <div>
          <Label htmlFor="expiresAt">Expires At (Optional)</Label>
          <Input
            id="expiresAt"
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="generateQr"
            checked={formData.generateQr}
            onCheckedChange={(checked) => setFormData({ ...formData, generateQr: checked })}
          />
          <Label htmlFor="generateQr">Generate QR Codes</Label>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Preview</h4>
          <p className="text-sm text-gray-600">
            {formData.quantity} voucher(s) will be generated for {
              plans.find(p => p.id === formData.planId)?.name || 'selected plan'
            }
          </p>
          <p className="text-sm text-gray-600">
            Code format: {formData.prefix}-XXXX-XXXX
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={generating || !formData.planId}>
            {generating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Generate Vouchers
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
          <h2 className="text-2xl font-bold">Voucher Management</h2>
          <p className="text-gray-600">Generate and manage hotspot vouchers</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchVouchers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Generate Vouchers
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Vouchers</DialogTitle>
                <DialogDescription>Create new hotspot vouchers</DialogDescription>
              </DialogHeader>
              <VoucherGeneratorForm onClose={() => setIsGenerateDialogOpen(false)} />
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
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{vouchers.length}</div>
            )}
            <p className="text-sm text-gray-600">Total Vouchers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{vouchers.filter(v => !v.isUsed).length}</div>
            )}
            <p className="text-sm text-gray-600">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{vouchers.filter(v => v.isUsed).length}</div>
            )}
            <p className="text-sm text-gray-600">Used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {vouchers.filter(v => !v.expiresAt || new Date(v.expiresAt) > new Date()).length}
              </div>
            )}
            <p className="text-sm text-gray-600">Valid</p>
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
                  placeholder="Search vouchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={isUsedFilter} onValueChange={setIsUsedFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="false">Available</SelectItem>
                <SelectItem value="true">Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vouchers</CardTitle>
          <CardDescription>List of all generated vouchers</CardDescription>
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
                  <TableHead>Code</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Used At</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{voucher.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyVoucher(voucher.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{voucher.plan.name}</div>
                        <div className="text-sm text-gray-500">
                          ${voucher.plan.price} ({voucher.plan.duration}min)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={voucher.isUsed ? "secondary" : "default"}>
                        {voucher.isUsed ? "Used" : "Available"}
                      </Badge>
                    </TableCell>
                    <TableCell>{voucher.usedBy || '-'}</TableCell>
                    <TableCell>
                      {voucher.usedAt ? new Date(voucher.usedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" title="Generate QR Code">
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVoucher(voucher.id)}
                          title="Delete Voucher"
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common voucher operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsGenerateDialogOpen(true)}
            >
              <Plus className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-sm font-medium">Generate Single</p>
              <p className="text-xs text-gray-500">Create one voucher</p>
            </div>
            
            <div 
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsGenerateDialogOpen(true)}
            >
              <Plus className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-sm font-medium">Bulk Generate</p>
              <p className="text-xs text-gray-500">Create multiple</p>
            </div>
            
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <QrCode className="h-8 w-8 text-purple-600 mb-2" />
              <p className="text-sm font-medium">Export QR Codes</p>
              <p className="text-xs text-gray-500">Download QR codes</p>
            </div>
            
            <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Download className="h-8 w-8 text-orange-600 mb-2" />
              <p className="text-sm font-medium">Export List</p>
              <p className="text-xs text-gray-500">Download CSV/Excel</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}