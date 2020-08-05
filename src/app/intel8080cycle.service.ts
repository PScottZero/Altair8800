import { Injectable } from '@angular/core';

// 8-bit register
const A = 0b111;
const B = 0b000;
const C = 0b001;
const D = 0b010;
const E = 0b011;
const H = 0b100;
const L = 0b101;

// 16-bit register pairs
const BC = 0b00;
const DE = 0b01;
const HL = 0b10;
const SP = 0b11;

// conditions
const NOT_ZERO = 0b000;
const ZERO = 0b001;
const NOT_CARRY = 0b010;
const CARRY = 0b011;
const PARITY_ODD = 0b100;
const PARITY_EVEN = 0b101;
const POSITIVE = 0b110;
const NEGATIVE = 0b111;

@Injectable({
  providedIn: 'root'
})
export class Intel8080Service {
  PC: number;
  SP: number;
  regs: Uint8Array;
  mem: Uint8Array;

  // flags
  zero: boolean;
  sign: boolean;
  parity: boolean;
  carry: boolean;
  auxCarry: boolean;
  intEnable: boolean;

  runInterval;

  drawFunction: () => void;

  constructor() {
    this.PC = 0;
    this.SP = 0xFFFF;
    this.regs = new Uint8Array(8);
    this.mem = new Uint8Array(0x10000);
    this.runInterval = undefined;
    this.intEnable = true;
  }

  setDrawFunction(drawFunc: () => void) {
    this.drawFunction = drawFunc;
  }

  step() {
    this.decode();
  }

  run() {
    this.runInterval = setInterval(() => {
      this.step();
      this.drawFunction();
    }, 1);
  }

  isRunning(): boolean {
    return this.runInterval !== undefined;
  }

  stop() {
    clearInterval(this.runInterval);
    this.runInterval = undefined;
    this.drawFunction();
  }

  reset() {
    this.PC = 0;
    this.drawFunction();
  }

  clear() {
    this.PC = 0;
    this.SP = 0xFFFF;
    for (let i = 0; i < this.regs.length; i++) {
      this.regs[i] = 0;
    }
    for (let i = 0; i < this.mem.length; i++) {
      this.mem[i] = 0;
    }
    this.drawFunction();
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

  fetch() {
    const opcode = this.mem[this.PC];
  }

  decode() {
    const opcode = this.mem[this.PC];

    // ================================================================================
    // ========================== OPCODES IN NON-GENERAL FORM =========================
    // ================================================================================
    switch (opcode) {

      // ========================================
      // LDA a
      // Load memory at a into register A
      // ========================================
      case 0x3A:
        this.regs[A] = this.mem[this.getImm16()];
        break;

      // ========================================
      // STA a
      // Store register A at memory location a
      // ========================================
      case 0x32:
        this.mem[this.getImm16()] = this.regs[A];
        break;

      // ========================================
      // LHLD a
      // Load memory at a into register HL
      // ========================================
      case 0x2A:
        this.setRegPair(HL, this.getImm16());
        break;

      // ========================================
      // SHLD a
      // Store register HL at memory location a
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
        this.regs[A] = this.subtract(this.regs[A], this.getImm8());
        break;

      // ========================================
      // SBI #
      // Subtract immediate # from register A
      // with borrow
      // ========================================
      case 0xDE:
        this.regs[A] = this.subtract(this.regs[A], this.getImm8(), true);
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
        this.subtract(this.regs[A], this.getImm8());
        break;

      // ========================================
      // RLC
      // Rotate register A to the left
      // ========================================
      case 0x07:
        this.rotateALeft();
        break;

      // ========================================
      // RRC
      // Rotate register A to the right
      // ========================================
      case 0x0F:
        this.rotateARight();
        break;

      // ========================================
      // RAL
      // Rotate register A to the left
      // through carry
      // ========================================
      case 0x17:
        this.rotateALeft(true);
        break;

      // ========================================
      // RAR
      // Rotate register A to the right
      // through carry
      // ========================================
      case 0x1F:
        this.rotateARight(true);
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
        this.jump(this);
        break;

      // ========================================
      // CALL a
      // Call subroutine at address a
      // ========================================
      case 0xCD:
        this.call(this);
        break;

      // ========================================
      // RET
      // Return from subroutine
      // ========================================
      case 0xC9:
        this.PC = this.pop();
        break;

      // ========================================
      // PCHL
      // Jump to address in register pair HL
      // ========================================
      case 0xE9:
        this.PC = this.getRegPair(HL) - 1;
        break;

      // ========================================
      // XTHL
      // Swap register pair HL with
      // top word of stack
      // ========================================
      case 0xE3:
        const hlVal = this.getRegPair(HL);
        this.setRegPair(HL, this.pop());
        this.push(hlVal);
        break;

      // ========================================
      // SPHL
      // Set SP to register pair HL
      // ========================================
      case 0xF9:
        this.setRegPair(SP, HL);
        break;

      // ========================================
      // IN pa
      // Read input port pa into register A
      // NOT IMPLEMENTED
      // ========================================
      case 0xDB:
        this.PC += 2;
        break;

      // ========================================
      // OUT pa
      // Write register A to output port pa
      // NOT IMPLEMENTED
      // ========================================
      case 0xD3:
        this.PC += 2;
        break;

      // ========================================
      // EI
      // Enable interrupts
      // ========================================
      case 0xFB:
        this.intEnable = true;
        break;

      // ========================================
      // DI
      // Disable interrupts
      // ========================================
      case 0xF3:
        this.intEnable = false;
        break;

      // ========================================
      // HLT
      // Halt processor
      // ========================================
      case 0x76:
        this.stop();
        break;

      // ========================================
      // NOP
      // No operation
      // ========================================
      case 0x00:
        break;
    }

    // ================================================================================
    // ============= OPCODES IN THE FORM XXDDDSSS, XXDDDXXX, AND XXRPXXXX =============
    // ================================================================================
    const upperBits = (opcode & 0xC0) >> 6;
    const regDest = (opcode & 0x38) >> 3;
    const regSrc = opcode & 0x7;
    const lo = (opcode) & 0xF;
    const regPair = (opcode) >> 4 & 0x3;
    switch (upperBits) {

      // ========================================
      // MOV D, S
      // Move value of source register
      // into destination register
      // ========================================
      case 0b01:
        this.regs[regDest] = this.regs[regSrc];
        break;

      case 0b00:

        // ========================================
        // Opcodes with form 00RPXXXX
        // ========================================
        switch (lo) {

          // ========================================
          // LXI RP, #
          // Load 16-bit immediate into register
          // pair RP
          // ========================================
          case 0x1:
            this.setRegPair(regPair, this.getImm16());
            break;

          // ========================================
          // LDAX RP
          // Load indirect through register pair RP
          // ========================================
          case 0xA:
            this.regs[A] = this.mem[this.getRegPair(regPair)];
            break;

          // ========================================
          // STAX RP
          // Store indirect through register pair RP
          // ========================================
          case 0x2:
            this.mem[this.getRegPair(regPair)] = this.regs[A];
            break;

          // ========================================
          // INX RP
          // Increment register pair RP
          // ========================================
          case 0x3:
            this.setRegPair(regPair, this.getRegPair(regPair) + 1);
            break;

          // ========================================
          // DCX RP
          // Decrement register pair RP
          // ========================================
          case 0xB:
            this.setRegPair(regPair, this.getRegPair(regPair) - 1);
            break;

          // ========================================
          // DAD RP
          // Add register pair to HL
          // ========================================
          case 0x9:
            this.setRegPair(HL, this.doubleAdd(HL, regPair));
            break;
        }

        // ========================================
        // Opcodes with form 00DDDXXX
        // ========================================
        switch (regSrc) {

          // ========================================
          // MVI D, #
          // Move immediate into destination register
          // ========================================
          case 0b110:
            this.regs[regDest] = this.getImm8();
            break;

          // ========================================
          // INR D
          // Increment destination register d
          // ========================================
          case 0b100:
            this.increment(regDest);
            break;

          // ========================================
          // DCR
          // Decrement destination register d
          // ========================================
          case 0b101:
            this.decrement(regDest);
            break;
        }
        break;

      case 0b10:

        // ========================================
        // Opcodes with form 10XXXSSS
        // ========================================
        switch (regDest) {

          // ========================================
          // ADD S
          // Add source register S to register A
          // ========================================
          case 0b000:
            this.regs[A] = this.add(this.regs[A], this.regs[regSrc]);
            break;

          // ========================================
          // ADC S
          // Add source register S to register A
          // with carry
          // ========================================
          case 0b001:
            this.regs[A] = this.add(this.regs[A], this.regs[regSrc], true);
            break;

          // ========================================
          // SUB S
          // Subtract source register S from
          // register A
          // ========================================
          case 0b010:
            this.regs[A] = this.subtract(this.regs[A], this.regs[regSrc]);
            break;

          // ========================================
          // SBB S
          // Subtract source register S from
          // register A with borrow
          // ========================================
          case 0b011:
            this.regs[A] = this.subtract(this.regs[A], this.regs[regSrc], true);
            break;

          // ========================================
          // ANA S
          // AND source register S with A
          // ========================================
          case 0b100:
            this.regs[A] = this.and(this.regs[A], this.regs[regSrc]);
            break;

          // ========================================
          // ORA S
          // OR source register S with A
          // ========================================
          case 0b110:
            this.regs[A] = this.or(this.regs[A], this.regs[regSrc]);
            break;

          // ========================================
          // XRA S
          // XOR source register S with A
          // ========================================
          case 0b101:
            this.regs[A] = this.xor(this.regs[A], this.regs[regSrc]);
            break;

          // ========================================
          // CMP S
          // Compare source register with register A
          // ========================================
          case 0b111:
            this.subtract(this.regs[A], this.regs[regSrc]);
            break;
        }
        break;

      case 0b11:

        // ========================================
        // Opcodes of form 11CCCXXX
        // ========================================
        switch (regSrc) {

          // ========================================
          // Jccc a
          // Conditional jump to address a based
          // on condition ccc
          // ========================================
          case 0b010:
            this.condition(regDest, this.jump);
            break;

          // ========================================
          // Cccc a
          // Conditional subroutine call at address a
          // based on condition ccc
          // ========================================
          case 0b100:
            this.condition(regDest, this.call);
            break;

          // ========================================
          // Rccc
          // Conditional return from subroutine
          // based on condition ccc
          // ========================================
          case 0b000:
            this.condition(regDest, this.return);
            break;

          // ========================================
          // RST n
          // Restart (Call n*8)
          // ========================================
          case 0b111:
            this.PC = regDest * 8;
            break;
        }

        // ========================================
        // Opcodes of form 11RPXXXX
        // ========================================
        switch (lo) {

          // ========================================
          // PUSH RP
          // Push register pair RP onto stack
          // ========================================
          case 0x5:
            this.pushRegPair(regPair);
            break;

          // ========================================
          // POP RP
          // Pop stack and store result in register
          // pair RP
          // ========================================
          case 0x1:
            this.popRegPair(regPair);
            break;
        }
        break;
    }
    this.PC = (this.PC + 1) & 0xFFFF;
  }



  // ================================================================================
  // ============================= ARITHMETIC FUNCTIONS =============================
  // ================================================================================

  // ========================================
  // Adds two given numbers together.
  // Can optionally add with carry
  // ========================================
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

  // ========================================
  // Adds two register pairs together
  // ========================================
  doubleAdd(regPair1: number, regPair2: number): number {
    const result = this.getRegPair(regPair1) + this.getRegPair(regPair2);
    this.carry = result > 0xFFFF;
    return result & 0xFFFF;
  }

  // ========================================
  // Subtracts to given numbers.
  // Can optionally add with carry
  // ========================================
  subtract(a: number, b: number, withCarry?: boolean): number {
    b = (~b + 1) & 0xFF;
    this.carry = !this.carry;
    return this.add(a, b, withCarry);
  }

  // ========================================
  // Increment a given register by one
  // ========================================
  increment(reg: number) {
    const tempCarry = this.carry;
    this.regs[reg] = this.add(this.regs[reg], 1);
    this.carry = tempCarry;
  }

  // ========================================
  // Decrement a given register by one
  // ========================================
  decrement(reg: number) {
    const tempCarry = this.carry;
    this.regs[reg] = this.subtract(this.regs[reg], 1);
    this.carry = tempCarry;
  }



  // ================================================================================
  // ============================== LOGICAL FUNCTIONS ===============================
  // ================================================================================

  // ========================================
  // Ands two numbers together
  // ========================================
  and(a: number, b: number): number {
    const result = a & b;
    this.setFlags(result);
    return result;
  }

  // ========================================
  // Ors two numbers together
  // ========================================
  or(a: number, b: number): number {
    const result = a | b;
    this.setFlags(result);
    return result;
  }

  // ========================================
  // Xors two numbers together
  // ========================================
  xor(a: number, b: number): number {
    const result = a ^ b;
    this.setFlags(result);
    return result;
  }

  // ========================================
  // Rotate register A to the left.
  // Can optionally rotate through carry
  // ========================================
  rotateALeft(thruCarry?: boolean): number {
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

  // ========================================
  // Rotate register A to the right.
  // Can optionally rotate through carry
  // ========================================
  rotateARight(thruCarry?: boolean): number {
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

  // ================================================================================
  // ============================ CONTROL FLOW FUNCTIONS ============================
  // ================================================================================

  // ========================================
  // Jumps to address specified by
  // 16-bit immediate
  // ========================================
  jump(self) {
    self.PC = self.getImm16() - 1;
  }

  // ========================================
  // Calls subroutine at address specified by
  // 16-bit immediate
  // ========================================
  call(self) {
    self.push(self.PC);
    self.PC = self.getImm16() - 1;
  }

  // ========================================
  // Returns from a subroutine
  // ========================================
  return(self) {
    self.PC = self.pop();
  }

  // ========================================
  // Runs a given function if condition
  // specified is met
  // ========================================
  condition(condType: number, condFunc: (thisParameter) => void) {
    let cond: boolean;
    switch (condType) {
      case NOT_ZERO:
        cond = !this.zero;
        break;

      case ZERO:
        cond = this.zero;
        break;

      case NOT_CARRY:
        cond = !this.carry;
        break;

      case CARRY:
        cond = this.carry;
        break;

      case PARITY_ODD:
        cond = !this.parity;
        break;

      case PARITY_EVEN:
        cond = this.parity;
        break;

      case POSITIVE:
        cond = !this.sign;
        break;

      case NEGATIVE:
        cond = this.sign;
        break;
    }

    if (cond) {
      condFunc(this);
    } else {
      this.PC += 2;
    }
  }



  // ================================================================================
  // =============================== STACK FUNCTIONS ================================
  // ================================================================================

  // ========================================
  // Pushes a given 16-bit number onto
  // the stack
  // ========================================
  push(n16: number) {
    this.mem[this.SP--] = n16 & 0xFF;
    this.mem[this.SP--] = (n16 >> 8) & 0xFF;
  }

  // ========================================
  // Pushes a given register pair onto
  // the stack
  // ========================================
  pushRegPair(regPair: number) {
    const regPairValue = this.getRegPair(regPair);
    const regLo = regPairValue & 0xFF;
    const regHi = (regPairValue >> 8) & 0xFF;
    this.mem[this.SP--] = regLo;
    this.mem[this.SP--] = regHi;
  }

  // ========================================
  // Pops the stack and returns popped value
  // ========================================
  pop(): number {
    const msb = this.mem[++this.SP];
    const lsb = this.mem[++this.SP];
    return (msb << 8) | lsb;
  }

  // ========================================
  // Pops the stack and places popped value
  // into specified register pair
  // ========================================
  popRegPair(regPair: number) {
    const regHi = this.mem[++this.SP];
    const regLo = this.mem[++this.SP];
    const regPairValue = (regHi << 8) | regLo;
    this.setRegPair(regPair, regPairValue);
  }



  // ================================================================================
  // =================== REGISTER, IMMEDIATE, AND FLAG FUNCTIONS ====================
  // ================================================================================

  // ========================================
  // Returns 8-bit immediate value and
  // increments program counter by one
  // ========================================
  getImm8(): number {
    return this.mem[++this.PC];
  }

  // ========================================
  // Returns 16-bit immediate value and
  // increments program counter by two
  // ========================================
  getImm16() {
    return this.mem[++this.PC] | (this.mem[++this.PC] << 8);
  }

  // ========================================
  // Sets specified register pair to
  // given 16-bit value
  // ========================================
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

  // ========================================
  // Returns value of specified register pair
  // ========================================
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

  // ========================================
  // Returns parity of a given value. Returns
  // true if there are an even number of ones
  // in the binary number, false otherwise
  // ========================================
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

  // ========================================
  // Sets system flags based on a given value
  // ========================================
  setFlags(val: number) {
    this.zero = val === 0;
    this.sign = (val & 0x80) === 0x80;
    this.parity = this.getParity(val);
    this.carry = false;
    this.auxCarry = false;
  }

  // ========================================
  // Converts a given boolean value into a
  // number. 0 for false and 1 for true.
  // ========================================
  boolToNum(b: boolean): number {
    return (b) ? 1 : 0;
  }
}
