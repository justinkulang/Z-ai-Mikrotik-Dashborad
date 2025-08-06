import { MikrotikAPI } from '../mikrotik-api';
import { RouterOSAPIv2 } from 'node-routeros-v2';

jest.mock('node-routeros-v2');

const RouterOSAPIv2Mock = RouterOSAPIv2 as jest.MockedClass<typeof RouterOSAPIv2>;

describe('MikrotikAPI', () => {
  let mikrotikAPI: MikrotikAPI;
  let mockClient: jest.Mocked<RouterOSAPIv2>;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    RouterOSAPIv2Mock.mockClear();

    mikrotikAPI = new MikrotikAPI({
      host: '192.168.88.1',
      port: 8728,
      username: 'admin',
      password: 'password',
    });

    mockClient = RouterOSAPIv2Mock.mock.instances[0] as jest.Mocked<RouterOSAPIv2>;
  });

  it('should test the connection', async () => {
    mockClient.connect.mockResolvedValue();
    const result = await mikrotikAPI.testConnection();
    expect(result.success).toBe(true);
    expect(mockClient.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.close).toHaveBeenCalledTimes(1);
  });

  it('should get system resources', async () => {
    const mockResources = [{
      'free-memory': '123456',
      'total-memory': '234567',
      'cpu-load': '50',
      'free-hdd-space': '345678',
      'total-hdd-space': '456789',
      'cpu-count': '4',
    }];
    mockClient.write.mockResolvedValue(mockResources);
    const resources = await mikrotikAPI.getSystemResources();
    expect(resources.freeMemory).toBe(123456);
    expect(mockClient.write).toHaveBeenCalledWith('/system/resource/print');
  });

  it('should get hotspot users', async () => {
    const mockUsers = [{ name: 'testuser' }];
    mockClient.write.mockResolvedValue(mockUsers);
    const users = await mikrotikAPI.getHotspotUsers();
    expect(users).toEqual(mockUsers);
    expect(mockClient.write).toHaveBeenCalledWith('/ip/hotspot/user/print');
  });
});
