import { Component, OnInit } from '@angular/core';
import {Intel8080Service} from '../intel8080.service';

const REG_LIST = ['B', 'C', 'D', 'E', 'H', 'L', null, 'A'];

@Component({
  selector: 'app-sys-info',
  templateUrl: './sys-info.component.html',
  styleUrls: ['./sys-info.component.scss']
})
export class SysInfoComponent implements OnInit {

  saveFile: HTMLElement;
  openFile: HTMLElement;

  constructor(private intel8080Service: Intel8080Service) { }

  ngOnInit() {
    this.saveFile = document.getElementById('save-program');
    this.openFile = document.getElementById('load-program');
  }

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

  loadProgram(event) {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result = fileReader.result as ArrayBuffer;
      const bytes = new Uint8Array(result);
      for (let i = 0; i < bytes.length; i++) {
        this.intel8080Service.mem[i] = bytes[i];
      }
      this.intel8080Service.drawFunction();
    };
    fileReader.readAsArrayBuffer(file);
  }

  saveProgram() {
    let binFile: Uint8Array;
    for (let i = this.intel8080Service.mem.length - 1; i >= 0; i--) {
      if (this.intel8080Service.mem[i] !== 0) {
        binFile = this.intel8080Service.mem.slice(0, i + 1);
        break;
      }
    }

    if (binFile) {
      const file = document.createElement('a');
      document.body.appendChild(file);
      file.setAttribute('style', 'display: none;');

      const fileName = prompt('Save As', 'Enter File Name Here');
      if (fileName) {
        const data = new Blob([binFile], {type: 'octet/stream'});
        const url = window.URL.createObjectURL(data);
        file.setAttribute('href', url);
        file.setAttribute('download', fileName + '.i80');
        file.click();
        window.URL.revokeObjectURL(url);
      }
    }
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
