import {Component, OnInit} from '@angular/core';
import * as panel from '../FrontPanelData';
import {EmulatorService} from '../emulator.service';

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
        this.switches.set(switchName, 2);
      } else {
        this.switches.set(switchName, 0);
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

  binarySwitchCheckClicked(switchName, switchX, switchY, clickX, clickY) {
    if (this.isBetween(clickX, switchX, switchX + 80)) {
      if (this.isBetween(clickY, switchY, switchY + 80)) {
        if (this.switches.get(switchName) === 1) {
          this.switches.set(switchName, 2);
        } else {
          this.switches.set(switchName, 1);
        }
      }
    }
  }

  ternarySwitchCheckClicked(switchName, switchX, switchY, clickX, clickY) {
    if (this.isBetween(clickX, switchX, switchX + 80)) {
      if (this.isBetween(clickY, switchY - 20, switchY + 40)) {
        this.switches.set(switchName, 1);
      } else if (this.isBetween(clickY, switchY + 40, switchY + 100)) {
        this.switches.set(switchName, 2);
      }
    }
  }

  mouseDown(event) {
    const canvasScreenRatio = this.canvas.width / this.canvas.getBoundingClientRect().width;
    const x = canvasScreenRatio * (event.pageX - this.canvas.getBoundingClientRect().left);
    const y = canvasScreenRatio * (event.pageY - this.canvas.getBoundingClientRect().top);

    this.switchLocations.forEach((value: [number, number], key: string) => {
      if (this.isBinarySwitch(key)) {
        this.binarySwitchCheckClicked(key, value[0], value[1], x, y);
      } else {
        this.ternarySwitchCheckClicked(key, value[0], value[1], x, y);
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
