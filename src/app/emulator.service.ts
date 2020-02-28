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
  zero: boolean;
  sign: boolean;
  parity: boolean;
  carry: boolean;
  auxCarry: boolean;

  constructor() {
    this.PC = 0;
    this.SP = 0xFFFE;
    this.regs = new Uint8Array(8);
    this.mem = new Uint8Array(0x10000);
  }

  step() {
    this.decode();
  }

  examineNext() {
    this.PC = (this.PC + 1) & 0xFFFF;
  }


  getCurrMemLoc(): number {
    return this.mem[this.PC];
  }

  setMem(value: number) {
    this.mem[this.PC] = value;
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
        this.regs[A] = this.add(this.regs[A], this.getImm8());
        break;

      // ========================================
      // ACI #
      // Add immediate # to register A with carry
      // ========================================
      case 0xCE:
        this.regs[A] = this.add(this.regs[A], this.getImm8(), true);
        break;

      // ========================================
      // SUI #
      // Subtract immediate # from register A
      // ========================================
      case 0xD6:
        this.regs[A] = this.sub(this.regs[A], this.getImm8());
        break;

      // ========================================
      // SBI #
      // Subtract immediate # from register A
      // with borrow
      // ========================================
      case 0xDE:
        this.regs[A] = this.sub(this.regs[A], this.getImm8(), true);
        break;

      // ========================================
      // DAA
      // Decimal adjust register A
      // ========================================
      case 0x27:
        // TODO: implement DAA
        break;

      // ========================================
      // ANI #
      // AND immediate # with register A
      // ========================================
      case 0xE6:
        this.regs[A] = this.and(this.regs[A], this.getImm8());
        break;

      // ========================================
      // ORI #
      // OR immediate # with register A
      // ========================================
      case 0xF6:
        this.regs[A] = this.or(this.regs[A], this.getImm8());
        break;

      // ========================================
      // XRI #
      // XOR immediate # with register A
      // ========================================
      case 0xEE:
        this.regs[A] = this.xor(this.regs[A], this.getImm8());
        break;

      // ========================================
      // CPI #
      // Compare immediate # with register A
      // ========================================
      case 0xFE:
        this.sub(this.regs[A], this.getImm8());
        break;

      // ========================================
      // RLC
      // Rotate register A to the left
      // ========================================
      case 0x07:
        this.rotALeft();
        break;

      // ========================================
      // RRC
      // Rotate register A to the right
      // ========================================
      case 0x0F:
        this.rotARight();
        break;

      // ========================================
      // RAL
      // Rotate register A to the left
      // through carry
      // ========================================
      case 0x17:
        this.rotALeft(true);
        break;

      // ========================================
      // RAR
      // Rotate register A to the right
      // through carry
      // ========================================
      case 0x1F:
        this.rotARight(true);
        break;

      // ========================================
      // CMA
      // Complement register A
      // ========================================
      case 0x2F:
        this.regs[A] = ~this.regs[A] & 0xFF;
        break;

      // ========================================
      // CMC
      // Complement carry flag
      // ========================================
      case 0x3F:
        this.carry = !this.carry;
        break;

      // ========================================
      // STC
      // Set carry flag
      // ========================================
      case 0x37:
        this.carry = true;
        break;

      // ========================================
      // JMP a
      // Unconditional jump to address a
      // ========================================
      case 0xC3:
        this.PC = this.getImm16() - 1;
        break;

      // ========================================
      // CALL a
      // Call subroutine at address a
      // ========================================
      case 0xCD:
        this.PC = this.getImm16() - 1;
        break;

      default:
        foundOpcode = false;
        break;
    }

    this.PC = (this.PC + 1) & 0xFFFF;
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

  getParity(val: number): boolean {
    let oneCount = 0;
    for (let i = 0; i < 8; i++) {
      const bit = (val >> i) & 1;
      if (bit === 1) {
        oneCount++;
      }
    }
    return !(oneCount % 2);
  }

  boolToNum(b: boolean): number {
    return (b) ? 1 : 0;
  }

  setFlags(val: number) {
    this.zero = val === 0;
    this.sign = (val & 0x80) === 0x80;
    this.parity = this.getParity(val);
    this.carry = false;
    this.auxCarry = false;
  }

  add(a: number, b: number, withCarry?: boolean): number {
    let carry = this.boolToNum(this.carry);
    if (!withCarry) { carry = 0; }
    const result = a + b + carry;
    const auxResult = (a & 0xF) + (b & 0xF) + carry;
    const result8 = result & 0xFF;
    this.setFlags(result8);
    this.carry = result > 0xFF;
    this.auxCarry = auxResult > 0xF;
    return result8;
  }

  sub(a: number, b: number, withCarry?: boolean): number {
    b = ~b & 0xFF;
    this.carry = !this.carry;
    return this.add(a, b, withCarry);
  }

  and(a: number, b: number): number {
    const result = a & b;
    this.setFlags(result);
    return result;
  }

  or(a: number, b: number): number {
    const result = a | b;
    this.setFlags(result);
    return result;
  }

  xor(a: number, b: number): number {
    const result = a ^ b;
    this.setFlags(result);
    return result;
  }

  rotALeft(thruCarry?: boolean): number {
    const val = this.regs[A];
    const bit7 = (val >> 7) & 1;
    let result;
    if (thruCarry) {
      result = ((val << 1) & 0xFF) | this.boolToNum(this.carry);
    } else {
      result = ((val << 1) & 0xFF) | bit7;
    }
    this.carry = bit7 !== 0;
    return result;
  }

  rotARight(thruCarry?: boolean): number {
    const val = this.regs[A];
    const bit0 = val & 1;
    let result;
    if (thruCarry) {
      result = ((val >> 1) & 0xFF) | (this.boolToNum(this.carry) << 7);
    } else {
      result = ((val >> 1) & 0xFF) | (bit0 << 7);
    }
    this.carry = bit0 !== 0;
    return result;
  }
}
