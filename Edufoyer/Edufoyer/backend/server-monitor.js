import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class ServerMonitor {
  constructor() {
    this.serverProcess = null;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.restartDelay = 5000; // 5 seconds
    this.isShuttingDown = false;
  }

  start() {
    console.log('🚀 Starting server monitor...');
    this.startServer();
    this.setupSignalHandlers();
  }

  startServer() {
    if (this.isShuttingDown) return;

    console.log(`📡 Starting server process (attempt ${this.restartCount + 1})...`);
    
    this.serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    this.serverProcess.on('error', (error) => {
      console.error('❌ Server process error:', error);
      this.handleServerExit(1);
    });

    this.serverProcess.on('exit', (code, signal) => {
      console.log(`📊 Server process exited with code ${code} and signal ${signal}`);
      this.handleServerExit(code);
    });
  }

  handleServerExit(code) {
    if (this.isShuttingDown) return;

    if (code === 0) {
      console.log('✅ Server shut down gracefully');
      return;
    }

    this.restartCount++;
    
    if (this.restartCount >= this.maxRestarts) {
      console.error(`❌ Maximum restart attempts (${this.maxRestarts}) reached. Stopping monitor.`);
      process.exit(1);
    }

    console.log(`🔄 Restarting server in ${this.restartDelay / 1000} seconds... (attempt ${this.restartCount}/${this.maxRestarts})`);
    
    setTimeout(() => {
      this.startServer();
    }, this.restartDelay);
  }

  setupSignalHandlers() {
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
      this.shutdown();
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception in monitor:', error);
      this.shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection in monitor:', reason);
      this.shutdown();
    });
  }

  shutdown() {
    this.isShuttingDown = true;
    
    if (this.serverProcess) {
      console.log('🔄 Terminating server process...');
      this.serverProcess.kill('SIGTERM');
      
      // Force kill after 10 seconds
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('🔨 Force killing server process...');
          this.serverProcess.kill('SIGKILL');
        }
        process.exit(0);
      }, 10000);
    } else {
      process.exit(0);
    }
  }
}

// Start the monitor
const monitor = new ServerMonitor();
monitor.start();
