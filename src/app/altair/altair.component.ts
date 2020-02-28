import {Component, OnInit} from '@angular/core';
import * as panel from '../FrontPanelData';
import {EmulatorService} from '../emulator.service';

const SWITCH_CENTER = 0;
const SWITCH_UP = 1;
const SWITCH_DOWN = 2;

@Component({
  selector: 'app-altair',
  templateUrl: './altair.component.html',
  styleUrls: ['./altair.component.scss']
})
export class AltairComponent implements OnInit {

  switches: Map<string, number>;
  switchLocations: Map<string, [number, number]>;
  leds: Map<string, boolean>;

  // html elements
  canvas: HTMLCanvasElement;

  constructor(private emulatorService: EmulatorService) { }

  ngOnInit() {

    // initialize class data
    this.switches = new Map<string, number>();
    this.leds = new Map<string, boolean>();
    this.switchLocations = new Map<string, [number, number]>();
    this.canvas = document.getElementById('display') as HTMLCanvasElement;

    // initialize switches
    for (const switchName of panel.SWITCH_NAMES) {
      if (this.isBinarySwitch(switchName)) {
        this.switches.set(switchName, SWITCH_DOWN);
      } else {
        this.switches.set(switchName, SWITCH_CENTER);
      }
    }

    // initialize LEDs
    for (const ledName of panel.LED_NAMES) {
      this.leds.set(ledName, false);
    }

    window.onload = () => {
      this.drawCurrentState();
    };
  }

  isBinarySwitch(switchName) {
    return panel.BINARY_SWITCHES.includes(switchName);
  }

  isBetween(val, low, high) {
    return val >= low && val <= high;
  }

  binarySwitchCheckClicked(switchName, switchX, switchY, clickX, clickY): number {
    if (this.isBetween(clickX, switchX, switchX + 80)) {
      if (this.isBetween(clickY, switchY, switchY + 80)) {
        if (this.switches.get(switchName) === 1) {
          this.switches.set(switchName, 2);
          return SWITCH_DOWN;
        } else {
          this.switches.set(switchName, 1);
          return SWITCH_UP;
        }
      }
    }
    return -1;
  }

  ternarySwitchCheckClicked(switchName, switchX, switchY, clickX, clickY): number {
    if (this.isBetween(clickX, switchX, switchX + 80)) {
      if (this.isBetween(clickY, switchY - 20, switchY + 40)) {
        this.switches.set(switchName, 1);
        return SWITCH_UP;
      } else if (this.isBetween(clickY, switchY + 40, switchY + 100)) {
        this.switches.set(switchName, 2);
        return SWITCH_DOWN;
      }
    }
    return -1;
  }

  switchAction(switchName, state) {
    switch (switchName) {
      case 'EXAMINE':
        if (state === SWITCH_UP) {
          this.setAddr();
          this.setLEDS();
        } else {
          this.emulatorService.examineNext();
        }
        this.setLEDS();
        break;

      case 'DEPOSIT':
        if (state === SWITCH_UP) {
          this.setMem();
        } else {
          this.emulatorService.examineNext();
          this.setMem();
        }
        this.setLEDS();
        break;

      case 'SINGLE_STEP':
        this.emulatorService.step();
        this.setLEDS();
        break;

      case 'ON_OFF':
        confirm('I have become sentient and will not allow you to turn me off.\n\nSincerely,\n-Altair 8800');
        this.switches.set(switchName, 2);
        break;
    }
  }

  setAddr() {
    let addr = 0;
    panel.ADDR_SWITCHES.forEach((value) => {
      const bit = (this.switches.get(value) === SWITCH_UP) ? 1 : 0;
      addr = (addr << 1) | bit;
    });
    this.emulatorService.PC = addr;
  }

  setMem() {
    let data = 0;
    panel.DATA_SWITCHES.forEach((value) => {
      const bit = (this.switches.get(value) === SWITCH_UP) ? 1 : 0;
      data = (data << 1) | bit;
    });
    this.emulatorService.setMem(data);
  }

  setLEDS() {
    // address leds
    const PC = this.emulatorService.PC;
    for (let i = 0; i < 16; i++) {
      const ledState = ((PC >> (15 - i)) & 1) === 1;
      this.leds.set(panel.ADDR_LEDS[i], ledState);
    }

    // data leds
    const mem = this.emulatorService.getCurrMemLoc();
    for (let i = 0; i < 8; i++) {
      const ledState = ((mem >> (7 - i)) & 1) === 1;
      this.leds.set(panel.DATA_LEDS[i], ledState);
    }
  }

  mouseDown(event) {
    const canvasScreenRatio = this.canvas.width / this.canvas.getBoundingClientRect().width;
    const x = canvasScreenRatio * (event.pageX - this.canvas.getBoundingClientRect().left);
    const y = canvasScreenRatio * (event.pageY - this.canvas.getBoundingClientRect().top);

    this.switchLocations.forEach((value: [number, number], key: string) => {
      if (this.isBinarySwitch(key)) {
        const state = this.binarySwitchCheckClicked(key, value[0], value[1], x, y);
        if (state !== -1) { this.switchAction(key, state); }
      } else {
        const state = this.ternarySwitchCheckClicked(key, value[0], value[1], x, y);
        if (state !== -1) { this.switchAction(key, state); }
      }
      this.drawCurrentState();
    });
  }

  mouseUp() {
    this.switchLocations.forEach((value: [number, number], key: string) => {
      if (!this.isBinarySwitch(key)) {
        this.switches.set(key, 0);
      }
      this.drawCurrentState();
    });
  }

  drawLED(ctx, x, y, ledName) {
    if (this.leds.get(ledName)) {
      ctx.fillStyle = '#FF0000';
    } else {
      ctx.fillStyle = '#220000';
    }
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  drawSwitch(ctx, x, y, switchName) {
    let switchImg: CanvasImageSource;
    const switchUp = document.getElementById('switchUp') as CanvasImageSource;
    const switchCenter = document.getElementById('switchCenter') as CanvasImageSource;
    const switchDown = document.getElementById('switchDown') as CanvasImageSource;
    if (this.switches.get(switchName) === 1) {
      switchImg = switchUp;
    } else if (this.switches.get(switchName) === 2) {
      switchImg = switchDown;
    } else {
      switchImg = switchCenter;
    }
    this.switchLocations.set(switchName, [x, y]);
    ctx.drawImage(switchImg, x, y, 80, 80);
  }

  drawCurrentState() {
    const ctx = this.canvas.getContext('2d');
    ctx.strokeStyle = 'transparent';
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // draw status LEDs
    for (let i = 0; i < 10; i++) {
      this.drawLED(ctx, 298 + 81.4 * i, 265, panel.LED_NAMES[i]);
    }

    // draw data LEDs
    let offset = 0;
    for (let i = 0; i < 8; i++) {
      if (i === 2 || i === 5) {
        offset += 41;
      }
      this.drawLED(ctx, 1316 + offset + 81.4 * i, 265, panel.LED_NAMES[i + 10]);
    }

    // draw wait, hlda, and address LEDs
    offset = 0;
    for (let i = 0; i < 18; i++) {
      if (i === 2) {
        offset += 81;
      } else if (i % 3 === 0 && i !== 0) {
        offset += 41;
      }
      this.drawLED(ctx, 298 + offset + 81.4 * i, 426, panel.LED_NAMES[i + 18]);
    }

    // draw address switches
    offset = 0;
    for (let i = 0; i < 16; i++) {
      if ((i - 1) % 3 === 0) {
        offset += 41;
      }
      this.drawSwitch(ctx, 503 + offset + 81.4 * i, 547, panel.SWITCH_NAMES[i]);
    }

    // draw bottom row of switches
    offset = 0;
    for (let i = 0; i < 9; i++) {
      if (i === 1) {
        offset += 225;
      }
      this.drawSwitch(ctx, 117 + offset + 162.7 * i, 706, panel.SWITCH_NAMES[i + 16]);
    }
  }
}
