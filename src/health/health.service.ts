import { Injectable } from '@nestjs/common';
import * as si from 'systeminformation';

@Injectable()
export class HealthService {
  async getHealth() {
    const [cpu, mem, disk, processes, network] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.processes(),
      si.networkStats(),
    ]);

    // Get top CPU processes
    const topCpuProcesses = processes.list
      .filter(p => p.cpu > 0)
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        cpu: p.cpu,
        memory: p.mem,
        pid: p.pid,
      }));

    // Get top memory processes
    const topMemoryProcesses = processes.list
      .filter(p => p.mem > 0)
      .sort((a, b) => b.mem - a.mem)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        cpu: p.cpu,
        memory: p.mem,
        pid: p.pid,
      }));

    // Calculate total storage
    const totalStorage = disk.reduce((acc, d) => ({
      size: acc.size + d.size,
      used: acc.used + d.used,
      available: acc.available + d.available,
    }), { size: 0, used: 0, available: 0 });

    // Calculate network usage (bytes per second)
    const networkUsage = network.reduce((acc, iface) => ({
      rx_bytes: acc.rx_bytes + iface.rx_bytes,
      tx_bytes: acc.tx_bytes + iface.tx_bytes,
      rx_sec: acc.rx_sec + iface.rx_sec,
      tx_sec: acc.tx_sec + iface.tx_sec,
    }), { rx_bytes: 0, tx_bytes: 0, rx_sec: 0, tx_sec: 0 });

    return {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        speed: cpu.speed,
        cores: cpu.cores,
        usage: await si.currentLoad().then(load => load.currentLoad),
        topProcesses: topCpuProcesses,
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usage: (mem.used / mem.total) * 100,
        topProcesses: topMemoryProcesses,
      },
      storage: {
        total: totalStorage.size,
        used: totalStorage.used,
        available: totalStorage.available,
        usage: (totalStorage.used / totalStorage.size) * 100,
      },
      network: {
        download: networkUsage.rx_sec, // bytes per second
        upload: networkUsage.tx_sec,   // bytes per second
        total_download: networkUsage.rx_bytes,
        total_upload: networkUsage.tx_bytes,
      },
    };
  }
}