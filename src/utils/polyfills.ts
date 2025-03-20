import { Buffer } from 'buffer';
import process from 'process';
import { EventEmitter } from 'events';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.process = process;
  window.EventEmitter = EventEmitter;
} 