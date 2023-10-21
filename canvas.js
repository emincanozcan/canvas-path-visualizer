const CANVAS_WIDTH = 3200;
const CANVAS_HEIGHT = CANVAS_WIDTH;
const DRAW_STEP = 50;
let DPI = CANVAS_WIDTH / (Math.min(window.innerHeight, window.innerWidth) * 0.8);
let POINT_RADIUS = 4 * DPI;

const white = "#fff";
const black = "#000";

function dpi(x) {
  return x * DPI;
}

class Point {
  constructor(x, y) {
    this.x = parseFloat(x.toFixed(1));
    this.y = parseFloat(y.toFixed(1));
  }

  canvasLocation() {
    return { x: CANVAS_WIDTH / 2 + this.x, y: CANVAS_HEIGHT / 2 - this.y };
  }
}

class Canvas {
  constructor(element) {
    this.points = [];
    this.canvas = element;
    this.ctx = this.canvas.getContext("2d");
  }

  draw() {
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.canvas.style.width = CANVAS_WIDTH / DPI + "px";
    this.canvas.style.height = CANVAS_HEIGHT / DPI + "px";
    this.ctx.font = `bold ${dpi(13)}px Arial`;
    this.ctx.lineCap = "round";
    this.drawAxis();
    this.drawPoints();
  }

  drawAxis() {
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(
      dpi(30),
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH - dpi(60),
      dpi(1)
    );
    this.ctx.fillRect(
      CANVAS_WIDTH / 2,
      dpi(30),
      dpi(1),
      CANVAS_HEIGHT - dpi(60)
    );
    this.ctx.fill();

    this.ctx.fillStyle = white;
    this.ctx.font = `bold ${dpi(16)}px Arial`;

    this.ctx.fillText("X", CANVAS_WIDTH - dpi(20), CANVAS_HEIGHT / 2 + dpi(6));
    this.ctx.fillText("- X", 15, CANVAS_HEIGHT / 2 + dpi(6));

    this.ctx.fillText("Y", CANVAS_WIDTH / 2 - dpi(5), dpi(20));
    this.ctx.fillText(
      "- Y",
      CANVAS_WIDTH / 2 - dpi(10),
      CANVAS_HEIGHT - dpi(10)
    );
  }

  plotPoint(point) {
    this.ctx.beginPath();
    const { x, y } = point.canvasLocation();
    this.ctx.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
    this.ctx.fill();

    this.ctx.fillStyle = ` ${white}`;
    this.ctx.font = `bold ${dpi(12)}px Arial`;
    const text = `(${point.x}, ${point.y})`;
    this.ctx.fillText(text, x - dpi(30), y + POINT_RADIUS + dpi(14));
  }

  drawPoints() {
    this.points.forEach(this.plotPoint, this);
  }

  addPoint(point) {
    this.points.push(point);
    this.plotPoint(point);
  }
}

class PathDrawer {
  lines = [];
  lastWaypointIdx = 0;
  lastLineIdx = 0;
  lastRequestId = null;

  constructor(canvas) {
    this.canvas = canvas;
  }

  generateWayPoints() {
    this.lines = [];

    /** @type {Point[]} */
    const points = this.canvas.points;

    for (var i = 1; i < points.length; i++) {
      const { x: x0, y: y0 } = points[i - 1].canvasLocation();
      const { x: x1, y: y1 } = points[i].canvasLocation();
      const dx = x1 - x0;
      const dy = y1 - y0;
      this.lines[i - 1] = {
        color: "hsl(" + Math.random() * 360 + ", 100%, 75%)",
        points: [],
      };
      for (let j = 0; j < DRAW_STEP; j++) {
        const x = x0 + (dx * j) / (DRAW_STEP - 1);
        const y = y0 + (dy * j) / (DRAW_STEP - 1);
        this.lines[i - 1].points.push([x, y]);
      }
    }
  }

  draw() {
    const line = this.lines[this.lastLineIdx];

    const wayPoints = line.points;

    if (
      this.lines[this.lastLineIdx + 1] ||
      wayPoints[this.lastWaypointIdx + 2]
    ) {
      this.lastRequestId = requestAnimationFrame(() => this.draw());
    }

    const [x0, y0] = wayPoints[this.lastWaypointIdx];
    const [x1, y1] = wayPoints[this.lastWaypointIdx + 1];
    this.canvas.ctx.beginPath();
    this.canvas.ctx.lineWidth = dpi(3);
    this.canvas.ctx.strokeStyle = line.color;
    this.canvas.ctx.moveTo(x0, y0);
    this.canvas.ctx.lineTo(x1, y1);
    this.canvas.ctx.stroke();

    if (this.lastWaypointIdx < wayPoints.length - 2) {
      this.lastWaypointIdx++;
      return;
    }

    if (this.lastLineIdx < this.lines.length - 1) {
      this.lastLineIdx++;
      this.lastWaypointIdx = 0;
    }
  }

  start() {
    if (this.lastRequestId) {
      cancelAnimationFrame(this.lastRequestId);
      this.lastRequestId = null;
    }
    this.canvas.ctx.shadowBlur = 4;
    this.lastWaypointIdx = 0;
    this.lastLineIdx = 0;
    this.generateWayPoints();
    this.draw();
  }
}

const random = document.getElementById("random");
random.addEventListener("click", randomStart);
function randomStart() {
  canvas.points = [];
  for (let i = 0; i < 10; i++) {
    const minus = -100;
    const x = Math.ceil(
      Math.random() * (CANVAS_WIDTH + minus) - (CANVAS_WIDTH + minus) / 2
    );
    const y = Math.ceil(
      Math.random() * (CANVAS_HEIGHT + minus) - (CANVAS_HEIGHT + minus) / 2
    );
    canvas.addPoint(new Point(x, y));
  }
  drawTable();
  canvas.draw();
  pathDrawer.start();
}

const addPoint = document.getElementById("add-point");
addPoint.addEventListener("click", () => {
  canvas.addPoint(new Point(0, 0));
  drawTable();
  canvas.draw();
  pathDrawer.start();
});
function drawTable() {
  const uiInput = `<td><input data-point-idx="{{idx}}" data-point-type="{{type}}" type="number" value="{{val}}" /></td>`;
  const uiPoints = document.getElementById("point-table-body");
  uiPoints.innerHTML = "";
  canvas.points.forEach((point, idx) => {
    const tr = document.createElement("tr");
    const x = uiInput
      .replace("{{val}}", point.x)
      .replace("{{idx}}", idx)
      .replace("{{type}}", "x");
    const y = uiInput
      .replace("{{val}}", point.y)
      .replace("{{idx}}", idx)
      .replace("{{type}}", "y");
    tr.innerHTML = x + y;
    uiPoints.appendChild(tr);
  });

  uiPoints.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const idx = input.getAttribute("data-point-idx");
      const type = input.getAttribute("data-point-type");
      canvas.points[idx][type] = parseFloat(input.value);
      canvas.draw();
      pathDrawer.start();
    });
  });
}

const canvas = new Canvas(document.getElementById("canvas"));
const pathDrawer = new PathDrawer(canvas);
const initScreen = () => {
  DPI = CANVAS_WIDTH / (Math.min(window.innerHeight, window.innerWidth) * 0.8);
  POINT_RADIUS = 4 * DPI;
  setTimeout(() => {
    document.getElementById("point-list").style.height = getComputedStyle(
      document.getElementById("canvas")
    ).height;
  }, 1);
};

initScreen();
randomStart();

window.addEventListener("resize", () => {
  initScreen();
  drawTable();
  canvas.draw();
  pathDrawer.start();
});
