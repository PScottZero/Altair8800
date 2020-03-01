import { Component, OnInit } from '@angular/core';
import {Intel8080Service} from '../intel8080.service';

const REG_LIST = ['B', 'C', 'D', 'E', 'H', 'L', null, 'A'];

@Component({
  selector: 'app-sys-info',
  templateUrl: './sys-info.component.html',
  styleUrls: ['./sys-info.component.scss']
})
export class SysInfoComponent implements OnInit {

  constructor(private intel8080Service: Intel8080Service) { }

  ngOnInit() {}

  getMemoryMap(): string[] {
    const memMap = [];
    for (let i = 0; i < 0x10000; i += 8) {
      let memLine = this.getHex(i, 4) + ': ';
      for (let j = 0; j < 8; j++) {
        memLine += this.getHex(this.intel8080Service.mem[i + j], 2) + ' ';
      }
      memMap.push(memLine);
    }
    return memMap;
  }

  getRegs() {
    const regLines = [];
    let reg16 = 'PC:' + this.getHex(this.intel8080Service.PC, 4) + ' ';
    reg16 += 'SP:' + this.getHex(this.intel8080Service.SP, 4) + ' ';
    regLines.push(reg16);

    let reg8 = '';
    for (let i = 0; i < 8; i++) {
      if (i !== 6) {
        reg8 += REG_LIST[i] + ':' + this.getHex(this.intel8080Service.regs[i], 2);
      }

      if (i === 3) {
        regLines.push(reg8);
        reg8 = '';
      } else {
        reg8 += ' ';
      }
    }
    regLines.push(reg8);
    return regLines;
  }

  getFlags() {
    let flags = 'Z:' + this.boolToNum(this.intel8080Service.zero) + ' ';
    flags += 'S:' + this.boolToNum(this.intel8080Service.sign) + ' ';
    flags += 'P:' + this.boolToNum(this.intel8080Service.parity) + ' ';
    flags += 'C:' + this.boolToNum(this.intel8080Service.carry) + ' ';
    flags += 'AC:' + this.boolToNum(this.intel8080Service.auxCarry);
    return flags;
  }

  boolToNum(b: boolean): number {
    return (b) ? 1 : 0;
  }

  getHex(value: number, length: number) {
    let hex = value.toString(16);
    const hexLength = hex.length;
    if (hexLength !== length) {
      for (let i = 0; i < length - hexLength; i++) {
        hex = '0' + hex;
      }
    }
    return hex.toUpperCase();
  }

  // opens given link in new tab
  open(link: string) {
    if (link) {
      window.open(link, '_blank');
    }
  }
}
