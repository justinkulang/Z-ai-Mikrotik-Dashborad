import { RouterOSAPIv2 } from 'node-routeros-v2';

// MikroTik RouterOS API Client
// This service handles communication with MikroTik routers

export interface MikrotikConnection {
  host: string
  port: number
  username: string
  password: string
}

export interface MikrotikHotspotUser {
  name: string
  password?: string
  profile?: string
  uptime?: string
  bytesIn?: number
  bytesOut?: number
  packetsIn?: number
  packetsOut?: number
  macAddress?: string
  loginBy?: string
  address?: string
  '.id'?: string;
}

export interface MikrotikHotspotProfile {
  name: string
  sharedUsers?: string
  rateLimit?: string
  idleTimeout?: string
  keepaliveTimeout?: string
  statusAutorefresh?: string
  addMacCookie?: string
  '.id'?: string;
}

export interface MikrotikHotspotServer {
  name: string
  interfaceName: string
  addressPool: string
  profile: string
  idleTimeout: string
  keepaliveTimeout: string
  addressesPerMac: string
  macCookieTimeout: string
}

export interface MikrotikInterface {
  name: string
  type: string
  mtu: string
  l2mtu?: string
  running: boolean
  disabled: boolean
  rxByte?: number
  txByte?: number
  rxPacket?: number
  txPacket?: number
  rxError?: number
  txError?: number
  rxDrop?: number
  txDrop?: number
}

export interface MikrotikSystemResource {
  uptime: string
  version: string
  buildTime: string
  freeMemory: number
  totalMemory: number
  cpuFrequency: string
  cpuCount: number
  cpuLoad: number
  freeHddSpace: number
  totalHddSpace: number
  architectureName: string
  boardName: string
  platform: string
}

export class MikrotikAPI {
  private client: RouterOSAPIv2;

  constructor(connection: MikrotikConnection) {
    this.client = new RouterOSAPIv2({
        host: connection.host,
        user: connection.username,
        password: connection.password,
        port: connection.port,
        tls: false, // You might want to make this configurable
    });
  }

  private async connect(): Promise<void> {
    if (!this.client.connected) {
        await this.client.connect();
    }
  }

  private async disconnect(): Promise<void> {
      if (this.client.connected) {
          await this.client.close();
      }
  }

  private formatParams(params: Record<string, any>): string[] {
    return Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `=${key}=${value}`);
  }

  /**
   * Test connection to MikroTik router
   */
  async testConnection(): Promise<{ success: boolean; responseTime?: number; error?: string }> {
    const startTime = Date.now();
    try {
      await this.connect();
      const responseTime = Date.now() - startTime;
      return { success: true, responseTime };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Get system resources information
   */
  async getSystemResources(): Promise<MikrotikSystemResource> {
    await this.connect();
    const response = await this.client.write('/system/resource/print');
    await this.disconnect();
    const resources = response[0];
    return {
        ...resources,
        freeMemory: parseInt(resources.freeMemory, 10),
        totalMemory: parseInt(resources.totalMemory, 10),
        cpuLoad: parseInt(resources.cpuLoad, 10),
        freeHddSpace: parseInt(resources.freeHddSpace, 10),
        totalHddSpace: parseInt(resources.totalHddSpace, 10),
        cpuCount: parseInt(resources.cpuCount, 10),
    };
  }

  /**
   * Get hotspot users
   */
  async getHotspotUsers(): Promise<MikrotikHotspotUser[]> {
    await this.connect();
    const response = await this.client.write('/ip/hotspot/user/print');
    await this.disconnect();
    return response;
  }

  /**
   * Add hotspot user
   */
  async addHotspotUser(user: Omit<MikrotikHotspotUser, 'uptime' | 'bytesIn' | 'bytesOut' | 'packetsIn' | 'packetsOut'>): Promise<any> {
    await this.connect();
    const params = this.formatParams(user);
    const response = await this.client.write('/ip/hotspot/user/add', params);
    await this.disconnect();
    return response;
  }

  /**
   * Remove hotspot user
   */
  async removeHotspotUser(id: string): Promise<any> {
    await this.connect();
    const response = await this.client.write('/ip/hotspot/user/remove', [`=.id=${id}`]);
    await this.disconnect();
    return response;
  }

  /**
   * Disconnect hotspot user session
   */
  async disconnectHotspotUser(username: string): Promise<boolean> {
    await this.connect();
    const sessions = await this.client.write('/ip/hotspot/active/print', [`?user=${username}`]);
    if (sessions.length > 0) {
        const sessionId = sessions[0]['.id'];
        await this.client.write('/ip/hotspot/active/remove', [`=.id=${sessionId}`]);
    }
    await this.disconnect();
    return true;
  }

  /**
   * Get hotspot profiles
   */
  async getHotspotProfiles(): Promise<MikrotikHotspotProfile[]> {
    await this.connect();
    const response = await this.client.write('/ip/hotspot/profile/print');
    await this.disconnect();
    return response;
  }

  /**
   * Get hotspot server configuration
   */
  async getHotspotServer(): Promise<MikrotikHotspotServer[]> {
    await this.connect();
    const response = await this.client.write('/ip/hotspot/print');
    await this.disconnect();
    return response;
  }

  /**
   * Get network interfaces
   */
  async getInterfaces(): Promise<MikrotikInterface[]> {
    await this.connect();
    const response = await this.client.write('/interface/print');
    await this.disconnect();
    return response.map((iface: any) => ({
        ...iface,
        running: iface.running === 'true',
        disabled: iface.disabled === 'true',
    }));
  }

  /**
   * Create or update hotspot profile
   */
  async setHotspotProfile(profile: Partial<MikrotikHotspotProfile>): Promise<any> {
    await this.connect();
    const params = this.formatParams(profile);
    const command = profile['.id'] ? '/ip/hotspot/profile/set' : '/ip/hotspot/profile/add';
    if(profile['.id']) params.push(`=.id=${profile['.id']}`);
    const response = await this.client.write(command, params);
    await this.disconnect();
    return response;
  }

  /**
   * Execute arbitrary command (for advanced usage)
   */
  async executeCommand(command: string, params?: string[]): Promise<any> {
    await this.connect();
    const response = await this.client.write(command, params);
    await this.disconnect();
    return response;
  }
}

// Factory function to create MikrotikAPI instance
export function createMikrotikAPI(connection: MikrotikConnection): MikrotikAPI {
  return new MikrotikAPI(connection)
}

// Helper function to format bytes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to format duration
export function formatDuration(seconds: number): string {
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