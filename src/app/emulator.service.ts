import { Injectable } from '@angular/core';

const A = 7;
const B = 0;
const C = 1;
const D = 2;
const E = 3;
const H = 4;
const L = 5;
const MEM = 6;
const BC = 0;
const DE = 1;
const HL = 2;
const SP = 3;

@Injectable({
  providedIn: 'root'
})
export class EmulatorService {
  PC: number;
  SP: number;
  regs: Uint8Array;
  mem: Uint8Array;
  carry: boolean;

  constructor() {
    this.PC = 0;
    this.SP = 0xFFFE;
    this.regs = new Uint8Array(8);
    this.mem = new Uint8Array(0xFFFF);
  }

  decode() {
    const opcode = this.mem[this.PC];
    const regDest = (opcode & 0x38) >> 3;
    const regSrc = opcode & 0x7;
    const upperBits = (opcode & 0xC0) >> 6;

    // non-general form opcodes
    let foundOpcode = true;
    switch (opcode) {

      // ========================================
      // LDA addr
      // Load memory at addr into register A
      // ========================================
      case 0x3A:
        this.regs[A] = this.mem[this.getImm16()];
        break;

      // ========================================
      // STA addr
      // Store register A at memory location addr
      // ========================================
      case 0x32:
        this.mem[this.getImm16()] = this.regs[A];
        break;

      // ========================================
      // LHLD addr
      // Load memory at addr into register HL
      // ========================================
      case 0x2A:
        this.setRegPair(HL, this.getImm16());
        break;

      // ========================================
      // SHLD addr
      // Store register HL at memory
      // location addr
      // ========================================
      case 0x22:
        const im16 = this.getImm16();
        this.mem[im16] = this.regs[L];
        this.mem[im16 + 1] = this.regs[H];
        break;

      // ========================================
      // XCHG
      // Exchange registers DE and HL
      // ========================================
      case 0xEB:
        const temp = this.getRegPair(DE);
        this.setRegPair(DE, this.getRegPair(HL));
        this.setRegPair(HL, temp);
        break;

      // ========================================
      // ADI #
      // Add immediate # to register A
      // ========================================
      case 0xC6:
        this.regs[A] += this.getImm8();
        break;

      default:
        foundOpcode = false;
        break;
    }
  }

  getImm8() {
    return this.mem[++this.PC];
  }

  getImm16() {
    return this.mem[++this.PC] | (this.mem[++this.PC] << 8);
  }

  setRegPair(pair: number, value: number) {
    const hi = (value >> 8) & 0xFF;
    const lo = value & 0xFF;

    switch (pair) {
      case BC:
        this.regs[B] = hi;
        this.regs[C] = lo;
        break;
      case DE:
        this.regs[D] = hi;
        this.regs[E] = lo;
        break;
      case HL:
        this.regs[H] = hi;
        this.regs[L] = lo;
        break;
      case SP:
        this.SP = value;
        break;
    }
  }

  getRegPair(pair: number): number {
    switch (pair) {
      case BC:
        return this.regs[B] << 8 | this.regs[C];
      case DE:
        return this.regs[D] << 8 | this.regs[E];
      case HL:
        return this.regs[H] << 8 | this.regs[L];
      case SP:
        return this.SP;
    }
  }
}
