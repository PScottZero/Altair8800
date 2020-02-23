import {Component, OnInit} from '@angular/core';

const SWITCH_NAMES = [
  'A15', 'A14', 'A13', 'A12',
  'A11', 'A10', 'A9', 'A8',
  'A7', 'A6', 'A5', 'A4',
  'A3', 'A2', 'A1', 'A0',
  'ON_OFF',
  'STOP_RUN', 'SINGLE_STEP',
  'EXAMINE', 'DEPOSIT', 'RESET_CLR',
  'PROTECT', 'AUX1', 'AUX2',
];

const LED_NAMES = [
  'INTE', 'PROT', 'MEMR', 'INP',
  'MI', 'OUT', 'HLTA', 'STACK',
  'WO', 'INT',
  'D7', 'D6', 'D5', 'D4',
  'D3', 'D2', 'D1', 'D0',
  'WAIT', 'HLDA',
  'A15', 'A14', 'A13', 'A12',
  'A11', 'A10', 'A9', 'A8',
  'A7', 'A6', 'A5', 'A4',
  'A3', 'A2', 'A1', 'A0',
];

@Component({
  selector: 'app-altair',
  templateUrl: './altair.component.html',
  styleUrls: ['./altair.component.scss']
})
export class AltairComponent implements OnInit {

  switches: Map<string, number>;
  switchLocations: Map<string, [number, number]>;
  leds: Map<string, boolean>;

  canvas: HTMLCanvasElement;

  constructor() { }

  ngOnInit() {
    this.switches = new Map<string, number>();
    this.leds = new Map<string, boolean>();
    this.switchLocations = new Map<string, [number, number]>();

    this.canvas = document.getElementById('display') as HTMLCanvasElement;

    for (const switchName of SWITCH_NAMES) {
      if ((switchName.substr(0, 1) !== 'A' && switchName !== 'ON_OFF') || switchName.substr(0, 3) === 'AUX') {
        this.switches.set(switchName, 0);
      } else {
        this.switches.set(switchName, 2);
      }
    }

    for (const ledName of LED_NAMES) {
      this.leds.set(ledName, false);
    }

    window.onload = () => {
      this.drawCurrentState();
    };
  }

  mouseDown(event) {
    const canvasScreenRatio = this.canvas.width / this.canvas.getBoundingClientRect().width;
    const x = canvasScreenRatio * (event.pageX - this.canvas.getBoundingClientRect().left);
    const y = canvasScreenRatio * (event.pageY - this.canvas.getBoundingClientRect().top);

    this.switchLocations.forEach((value: [number, number], key: string) => {
      if (x >= value[0] && x <= value[0] + 80) {
        if ((key.substr(0, 1) !== 'A' && key !== 'ON_OFF') || key.substr(0, 3) === 'AUX') {
          if (y >= value[1] && y <= value[1] + 40) {
            this.switches.set(key, 1);
          } else if (y >= value[1] + 40 && y <= value[1] + 80) {
            this.switches.set(key, 2);
          }
        } else if (y >= value[1] && y <= value[1] + 80) {
          if (this.switches.get(key) === 1) {
            this.switches.set(key, 2);
          } else {
            this.switches.set(key, 1);
          }
        }
      }
      this.drawCurrentState();
    });
  }

  mouseUp(event) {
    this.switchLocations.forEach((value: [number, number], key: string) => {
      if ((key.substr(0, 1) !== 'A' && key !== 'ON_OFF') || key.substr(0, 3) === 'AUX') {
        this.switches.set(key, 0);
      }
      this.drawCurrentState();
    });
  }

  drawCurrentState() {
    const ctx = this.canvas.getContext('2d');
    ctx.strokeStyle = 'transparent';

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // draw status LEDs
    for (let i = 0; i < 10; i++) {

      // choose led color
      if (this.leds.get(LED_NAMES[i])) {
        ctx.fillStyle = '#FF0000';
      } else {
        ctx.fillStyle = '#220000';
      }
      ctx.beginPath();
      ctx.arc(298 + 81.4 * i, 265, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // draw data LEDs
    let offset = 0;
    for (let i = 0; i < 8; i++) {

      // choose led color
      if (this.leds.get(LED_NAMES[i + 10])) {
        ctx.fillStyle = '#FF0000';
      } else {
        ctx.fillStyle = '#220000';
      }

      if (i === 2 || i === 5) {
        offset += 41;
      }
      ctx.beginPath();
      ctx.arc(1316 + offset + 81.4 * i, 265, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // draw wait, hlda, and address LEDs
    offset = 0;
    for (let i = 0; i < 18; i++) {

      // choose led color
      if (this.leds.get(LED_NAMES[i + 18])) {
        ctx.fillStyle = '#FF0000';
      } else {
        ctx.fillStyle = '#220000';
      }

      if (i === 2) {
        offset += 81;
      } else if (i % 3 === 0 && i !== 0) {
        offset += 41;
      }
      ctx.beginPath();
      ctx.arc(298 + offset + 81.4 * i, 426, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // draw address switches
    offset = 0;
    let switchImg: CanvasImageSource;
    const switchUp = document.getElementById('switchUp') as CanvasImageSource;
    const switchCenter = document.getElementById('switchCenter') as CanvasImageSource;
    const switchDown = document.getElementById('switchDown') as CanvasImageSource;
    for (let i = 0; i < 16; i++) {
      if ((i - 1) % 3 === 0) {
        offset += 41;
      }

      // get switch position
      if (this.switches.get(SWITCH_NAMES[i]) === 1) {
        switchImg = switchUp;
      } else if (this.switches.get(SWITCH_NAMES[i]) === 2) {
        switchImg = switchDown;
      } else {
        switchImg = switchCenter;
      }

      this.switchLocations.set(SWITCH_NAMES[i], [503 + offset + 81.4 * i, 547]);
      ctx.drawImage(switchImg, 503 + offset + 81.4 * i, 547, 80, 80);
    }

    // draw bottom row of switches
    offset = 0;
    for (let i = 0; i < 9; i++) {
      if (i === 1) {
        offset += 225;
      }

      // get switch position
      if (this.switches.get(SWITCH_NAMES[i + 16]) === 1) {
        switchImg = switchUp;
      } else if (this.switches.get(SWITCH_NAMES[i + 16]) === 2) {
        switchImg = switchDown;
      } else {
        switchImg = switchCenter;
      }

      this.switchLocations.set(SWITCH_NAMES[i + 16], [117 + offset + 162.7 * i, 706]);
      ctx.drawImage(switchImg, 117 + offset + 162.7 * i, 706, 80, 80);
    }
  }
}
