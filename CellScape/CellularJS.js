const width = 400; // width and height of canvas
var squares = 100; // how many squares will be drawn across the canvas
let frame = 0; // the current frame, used for redarawing purposes

var screen = []; // the screen as seen
var tscreen = []; // the backup screen for keeping updates equal across the grid
var cscreen = []; // keeps track of which tiles have been updated and need to be re-drawn
var animals = []; // keeps track of stats for the eco sim
var terrain = []; // the terrain data for the eco sim
var max; // the maximum height reached of terrain, for normalization
var min; // the minimum height seen of terrain, for normalization
let type = 1; // toggle for circle/noise generation
let rain = 1; // toggle for the rain in the rain sim

// a set of colors for the mosaic sim
const colors = [
  "MidnightBlue",
  "RoyalBlue",
  "DeepSkyBlue",
  "DodgerBlue",
  "LightSeaGreen",
  "MediumTurquoise",
];

// setting up canvas and sliders
var slider = document.getElementById("squares");
var sim = document.getElementById("sim");
var fps = document.getElementById("fps");
const plot = document.getElementById("plot");
const ctx = plot.getContext("2d");

var timer; // setting  the max frame rate
var rToggle = 0; // toggle for the rule used in the fractal sim
var visual = 0; // three way toggle for what is seen in the eco sim
var backcolor = 1; // the background color
let backcolors = ["#1e1f24", "#d4d7d9", "#86bf7c", "MidnightBlue", "Green"]; // possible background colors
// colors for terrain[]
let sColors = [
  "rgba(122, 113, 98, 1)",
  "rgba(109, 73, 19, 1)",
  "rgba(207, 158, 83, 1)",
  "rgba(83, 162, 207, 1)",
  "rgba(45, 113, 153, 1)",
];

// vars for finding the fps
const now = new Date();
var cSec = Date.now();
var ticks = 0;

// setting up the screen
step();

// in case of a change in background color
function cChange() {
  backcolor++;
  document.body.style.backgroundColor = backcolors[backcolor % 5];
}

// set up for the forest fire sim
function Fire() {
  let river = squares / 2;
  let smooth = squares / 2;
  let goalx = river + Math.floor(Math.random() * 12) - 5.5;
  let goaly = Math.floor(Math.random() * 3) + 6;
  let svel = goaly / goalx;
  let thick = 0;

  for (var y = 0; y < squares + 1; y++) {
    for (var x = 0; x < squares; x++) {
      if (
        (x < river + squares / (40 - thick) &&
          x > river - squares / (40 - thick)) ||
        (x < smooth + squares / (50 - thick) &&
          x > smooth - squares / (50 - thick))
      ) {
        screen[y * squares + x] = 5;
      } else {
        screen[y * squares + x] = !!Math.floor(Math.random() * 3) + 1;
      }
      tscreen[y * squares + x] = screen[y * squares + x];
    }

    smooth += svel;

    thick += 10 / squares;

    if (goaly == y) {
      goaly += Math.round(
        ((Math.floor(Math.random() * 3) + 5) * squares) / 100
      );
      goalx += ((Math.floor(Math.random() * 3) - 1) * squares) / 50;
    } else if (goalx != river) {
      if (smooth < river - squares / 50 || smooth > river + squares / 50) {
        if (smooth > river) {
          svel -= (goaly - y) / squares;
        } else {
          svel += (goaly - y) / squares;
        }
      } else {
        svel = (goalx - river) / (goaly - y);
      }

      if (river > goalx) {
        river -= (river - goalx) / (goaly - y);
      } else {
        river += (goalx - river) / (goaly - y);
      }
    }
  }

  timer = setInterval(step, 1000 / fps.value);
}

// set up for the 'mosaic' sim
function Cycle() {
  for (var y = 0; y < squares + 1; y++) {
    for (var x = 0; x < squares; x++) {
      screen[y * squares + x] = Math.floor(Math.random() * 6);

      if (y == squares) {
        screen[y * squares + x] = 0;
      }

      tscreen[y * squares + x] = screen[y * squares + x];
    }
  }

  timer = setInterval(step, 1000 / fps.value);
}

// set up for the fractal sim
function Fractal() {
  for (var y = 0; y < squares; y++) {
    for (var x = 0; x < squares; x++) {
      screen[y * squares + x] = 0;

      if (y == Math.floor(squares / 2) && x == Math.floor(squares / 2)) {
        screen[y * squares + x] = 1;
      }

      tscreen[y * squares + x] = screen[y * squares + x];
    }
  }

  timer = setInterval(step, 1000 / fps.value);
}

// set up for the diffusion sim
function Water() {
  for (var y = 0; y < squares; y++) {
    for (var x = 0; x < squares; x++) {
      screen[y * squares + x] = Math.floor(Math.random() * 3) * 3.5;
      tscreen[y * squares + x] = screen[y * squares + x];
    }
  }

  timer = setInterval(step, 1000 / fps.value);
}

// set up for the eco sim
function Erosion() {
  let SPeakX = Math.floor(Math.random() * squares);
  let SPeakY = Math.floor(Math.random() * squares);
  let WPeakX = Math.floor(Math.random() * squares);
  let WPeakY = Math.floor(Math.random() * squares);
  let EPeakX = (SPeakX + WPeakX + Math.floor(Math.random() * squares)) / 3;
  let EPeakY = (SPeakY + WPeakY + Math.floor(Math.random() * squares)) / 3;

  for (var y = 0; y < squares + 1; y++) {
    for (var x = 0; x < squares; x++) {
      let SDist = Math.sqrt(
        (SPeakY - y) * (SPeakY - y) + (SPeakX - x) * (SPeakX - x)
      );
      let WDist = Math.sqrt(
        (WPeakY - y) * (WPeakY - y) + (WPeakX - x) * (WPeakX - x)
      );
      let MDist = Math.sqrt(
        (EPeakY - y) * (EPeakY - y) + (EPeakX - x) * (EPeakX - x)
      );
      terrain[y * squares + x] = Math.floor(
        (100 * (SDist + WDist - MDist)) / (1 * Math.sqrt(2) * squares)
      );
      if (y == 0 && x == 0) {
        max = terrain[0];
        min = terrain[0];
      } else if (max < terrain[y * squares + x]) {
        max = terrain[y * squares + x];
      } else if (min > terrain[y * squares + x]) {
        min = terrain[y * squares + x];
      }
    }
  }
  for (var y = 0; y < squares + 1; y++) {
    for (var x = 0; x < squares; x++) {
      terrain[y * squares + x] = Math.floor(
        (100 * (terrain[y * squares + x] - min)) / (max - min)
      );
      screen[y * squares + x] =
        !Math.floor(Math.random() * 3) * (Math.floor(Math.random() * 11) + 1);
      tscreen[y * squares + x] = -1;
    }
  }
  timer = setInterval(step, 1000 / fps.value);
}

// the entirety of the noise/circle generator
function circle() {
  let rx = [];
  let ry = [];
  for (let i = 0; i < (squares * squares) / 2500; i++) {
    rx.push(Math.floor(Math.random() * squares));
    ry.push(Math.floor(Math.random() * squares));
  }
  for (var y = 0; y < squares; y++) {
    for (var x = 0; x < squares; x++) {
      if (type) {
        let dy = Math.abs(y - squares / 2);
        let dx = Math.abs(x - squares / 2);
        if (Math.sqrt(dy * dy + dx * dx) < squares / 2) {
          screen[y * squares + x] = 1;
        } else {
          screen[y * squares + x] = 0;
        }
      } else {
        screen[y * squares + x] = Math.round(
          (Math.floor(Math.random() * 3) + Math.sin(x) - Math.sin(y) + 2) / 6
        );
        for (let i = 0; i < rx.length; i++) {
          let randx = Math.floor(Math.random() * 10 + 10);
          let randy = Math.floor(Math.random() * 10 + 10);
          if (
            Math.round(x / randx) == Math.round(rx[i] / randx) &&
            Math.round(y / randy) == Math.round(ry[i] / randy)
          ) {
            screen[y * squares + x] = 0;
          }
        }
      }
      tscreen[y * squares + x] = screen[y * squares + x];
    }
  }
  for (let i = 0; i < 8; i++) {
    for (var y = 0; y < squares; y++) {
      for (var x = 0; x < squares; x++) {
        if (i < 7) {
          tscreen[y * squares + x] = Math.round(
            (screen[((y - 1 + squares) % squares) * squares + x] +
              screen[((y + 1) % squares) * squares + x] +
              screen[y * squares + ((x - 1 + squares) % squares)] +
              screen[y * squares + ((x + 1) % squares)] +
              screen[y * squares + x]) /
              5
          );
        } else if (
          Math.round(
            (screen[((y - 1 + squares) % squares) * squares + x] +
              screen[((y + 1) % squares) * squares + x] +
              screen[y * squares + ((x - 1 + squares) % squares)] +
              screen[y * squares + ((x + 1) % squares)] +
              screen[y * squares + x]) /
              5
          ) != screen[y * squares + x]
        ) {
          tscreen[y * squares + x] = 0;
        }
      }
    }
    for (var y = 0; y < squares; y++) {
      for (var x = 0; x < squares; x++) {
        screen[y * squares + x] = tscreen[y * squares + x];
      }
    }
  }
  timer = setInterval(step, 1000 / fps.value);
}

// set up for the rain sim
function Rain() {
  for (var y = 0; y < squares; y++) {
    for (var x = 0; x < squares; x++) {
      screen[y * squares + x] = 0;
      tscreen[y * squares + x] = screen[y * squares + x];
    }
  }
  timer = setInterval(step, 1000 / fps.value);
}

// main tick function
function step() {
  ticks++;
  frame++;

  // fps
  if (Date.now() > cSec + 1000) {
    cSec = Date.now();
    document.getElementById("fpv").innerText = "Fps: " + (ticks - 1);
    ticks = 0;
  }

  // the rules of each sim
  if (sim.value == 1) {
    for (var y = 0; y < squares; y++) {
      for (var x = 0; x < squares; x++) {
        if (screen[y * squares + x] == 3) {
          tscreen[y * squares + x] = 0;
        } else if (screen[y * squares + x] == 0) {
          tscreen[y * squares + x] = Math.floor(Math.random() * 2) * 4;
        } else if (screen[y * squares + x] == 2) {
          if (
            (x != 0 && screen[y * squares + x - 1] == 3) ||
            (x != squares - 1 && screen[y * squares + x + 1] == 3) ||
            screen[(y - 1) * squares + x] == 3 ||
            screen[(y + 1) * squares + x] == 3
          ) {
            tscreen[y * squares + x] = 3;
          }
        }
      }
    }
  } else if (sim.value == 2) {
    for (var y = 0; y < squares; y++) {
      for (var x = 0; x < squares; x++) {
        let around = 0;

        if (
          screen[(y + 1) * squares + x + 1] ==
          (screen[y * squares + x] + 1) % 6
        ) {
          around++;
        }
        if (screen[y * squares + x + 1] == (screen[y * squares + x] + 1) % 6) {
          around++;
        }
        if (
          screen[(y - 1) * squares + x + 1] ==
          (screen[y * squares + x] + 1) % 6
        ) {
          around++;
        }
        if (
          screen[(y + 1) * squares + x] ==
          (screen[y * squares + x] + 1) % 6
        ) {
          around++;
        }
        if (
          screen[(y - 1) * squares + x] ==
          (screen[y * squares + x] + 1) % 6
        ) {
          around++;
        }
        if (
          screen[(y + 1) * squares + x - 1] ==
          (screen[y * squares + x] + 1) % 6
        ) {
          around++;
        }
        if (screen[y * squares + x - 1] == (screen[y * squares + x] + 1) % 6) {
          around++;
        }
        if (
          screen[(y - 1) * squares + x - 1] ==
          (screen[y * squares + x] + 1) % 6
        ) {
          around++;
        }
        if (around > 1) {
          tscreen[y * squares + x] = (tscreen[y * squares + x] + 1) % 6;
        }
      }
    }
  } else if (sim.value == 3) {
    for (var y = 1; y < squares - 1; y++) {
      for (var x = 1; x < squares - 1; x++) {
        if (
          (screen[(y - 1) * squares + x] +
            screen[(y + 1) * squares + x] +
            screen[y * squares + x - 1] +
            screen[y * squares + x + 1] ==
            3 &&
            !rToggle) ||
          screen[(y - 1) * squares + x] +
            screen[(y + 1) * squares + x] +
            screen[y * squares + x - 1] +
            screen[y * squares + x + 1] ==
            1
        ) {
          tscreen[y * squares + x] = 1;
        } else {
          tscreen[y * squares + x] = screen[y * squares + x];
        }
      }
    }
  } else if (sim.value == 4) {
    for (var y = 0; y < squares; y++) {
      for (var x = 0; x < squares; x++) {
        tscreen[y * squares + x] =
          (screen[((y - 1 + squares) % squares) * squares + x] +
            screen[((y + 1) % squares) * squares + x] +
            screen[y * squares + ((x - 1 + squares) % squares)] +
            screen[y * squares + ((x + 1) % squares)]) /
          4;
      }
    }
  } else if (sim.value == 5) {
    animals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var y = 0; y < squares; y++) {
      for (var x = 0; x < squares; x++) {
        animals[screen[y * squares + x]] += 1;
        if (screen[y * squares + x] == 1) {
          if (
            terrain[y * squares + x] > 50 ||
            Math.random() < 0.01 ||
            (terrain[y * squares + x] > 45 && Math.random() < 0.02)
          ) {
            tscreen[y * squares + x] = 0;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 6 ||
              screen[((y + 1) % squares) * squares + x] == 6 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 6 ||
              screen[y * squares + ((x + 1) % squares)] == 6) &&
            Math.random() < 0.3
          ) {
            tscreen[y * squares + x] = 6;
          }
        } else if (screen[y * squares + x] == 2) {
          if (
            terrain[y * squares + x] > 70 ||
            (terrain[y * squares + x] > 62 && Math.random() < 0.2) ||
            (terrain[y * squares + x] < 15 && Math.random() < 0.2) ||
            (terrain[y * squares + x] > 20 && Math.random() < 0.01)
          ) {
            tscreen[y * squares + x] = 0;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 6 ||
              screen[((y + 1) % squares) * squares + x] == 6 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 6 ||
              screen[y * squares + ((x + 1) % squares)] == 6) &&
            Math.random() < 0.2 &&
            terrain[y * squares + x] < 57
          ) {
            tscreen[y * squares + x] = 6;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 7 ||
              screen[((y + 1) % squares) * squares + x] == 7 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 7 ||
              screen[y * squares + ((x + 1) % squares)] == 7) &&
            Math.random() < 0.2
          ) {
            tscreen[y * squares + x] = 7;
          }
        } else if (screen[y * squares + x] == 3) {
          if (terrain[y * squares + x] < 60) {
            tscreen[y * squares + x] = 0;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 5 ||
              screen[((y + 1) % squares) * squares + x] == 5 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 5 ||
              screen[y * squares + ((x + 1) % squares)] == 5) &&
            Math.random() < 0.5
          ) {
            tscreen[y * squares + x] = 5;
          }
        } else if (screen[y * squares + x] == 4) {
          if (
            terrain[y * squares + x] > 60 ||
            (terrain[y * squares + x] < 20 && Math.random() < 0.1) ||
            Math.random() < 0.05
          ) {
            if (Math.random() < 0.2) {
              tscreen[y * squares + x] = Math.floor(Math.random() * 2) + 1;
            } else {
              tscreen[y * squares + x] = 0;
            }
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 8 ||
              screen[((y + 1) % squares) * squares + x] == 8 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 8 ||
              screen[y * squares + ((x + 1) % squares)] == 8) &&
            Math.random() < 0.6
          ) {
            tscreen[y * squares + x] = 8;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 7 ||
              screen[((y + 1) % squares) * squares + x] == 7 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 7 ||
              screen[y * squares + ((x + 1) % squares)] == 7) &&
            Math.random() < 0.3
          ) {
            tscreen[y * squares + x] = 7;
          }
        } else if (screen[y * squares + x] == 5) {
          if (terrain[y * squares + x] < 60) {
            if (Math.random() < 0.1) {
              tscreen[y * squares + x] = 7;
            } else {
              tscreen[y * squares + x] = 0;
            }
          } else if (Math.random() < 0.15) {
            tscreen[y * squares + x] = 0;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 8 ||
              screen[((y + 1) % squares) * squares + x] == 8 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 8 ||
              screen[y * squares + ((x + 1) % squares)] == 8) &&
            Math.random() < 0.5
          ) {
            tscreen[y * squares + x] = 8;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 7 ||
              screen[((y + 1) % squares) * squares + x] == 7 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 7 ||
              screen[y * squares + ((x + 1) % squares)] == 7) &&
            Math.random() < 0.5
          ) {
            tscreen[y * squares + x] = 7;
          } else if (
            screen[((y - 1 + squares) % squares) * squares + x] == 5 &&
            screen[((y + 1) % squares) * squares + x] == 5 &&
            screen[y * squares + ((x - 1 + squares) % squares)] == 5 &&
            screen[y * squares + ((x + 1) % squares)] == 5 &&
            Math.random() < 0.02
          ) {
            tscreen[y * squares + x] = 9;
          }
        } else if (screen[y * squares + x] == 6) {
          if (
            Math.random() < 0.15 ||
            (Math.random() < 0.3 && terrain[y * squares + x] < 20)
          ) {
            tscreen[y * squares + x] = 12;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 10 ||
              screen[((y + 1) % squares) * squares + x] == 10 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 10 ||
              screen[y * squares + ((x + 1) % squares)] == 10) &&
            Math.random() < 0.5
          ) {
            tscreen[y * squares + x] = 10;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 11 ||
              screen[((y + 1) % squares) * squares + x] == 11 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 11 ||
              screen[y * squares + ((x + 1) % squares)] == 11) &&
            Math.random() < 0.5
          ) {
            tscreen[y * squares + x] = 11;
          } else if (
            screen[((y - 1 + squares) % squares) * squares + x] == 6 &&
            screen[((y + 1) % squares) * squares + x] == 6 &&
            screen[y * squares + ((x - 1 + squares) % squares)] == 6 &&
            screen[y * squares + ((x + 1) % squares)] == 6 &&
            Math.random() < 0.02
          ) {
            tscreen[y * squares + x] = 11;
          }
        } else if (screen[y * squares + x] == 7) {
          if (
            Math.random() < 0.2 ||
            (terrain[y * squares + x] > 57 && Math.random() < 0.5)
          ) {
            tscreen[y * squares + x] = 12;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 10 ||
              screen[((y + 1) % squares) * squares + x] == 10 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 10 ||
              screen[y * squares + ((x + 1) % squares)] == 10) &&
            Math.random() < 0.1
          ) {
            tscreen[y * squares + x] = 10;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 11 ||
              screen[((y + 1) % squares) * squares + x] == 11 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 11 ||
              screen[y * squares + ((x + 1) % squares)] == 11) &&
            Math.random() < 0.1
          ) {
            tscreen[y * squares + x] = 11;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 9 ||
              screen[((y + 1) % squares) * squares + x] == 9 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 9 ||
              screen[y * squares + ((x + 1) % squares)] == 9) &&
            Math.random() < 0.1
          ) {
            tscreen[y * squares + x] = 9;
          }
        } else if (screen[y * squares + x] == 8) {
          if (Math.random() < 0.2 || terrain[y * squares + x] > 60) {
            tscreen[y * squares + x] = 12;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 10 ||
              screen[((y + 1) % squares) * squares + x] == 10 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 10 ||
              screen[y * squares + ((x + 1) % squares)] == 10) &&
            Math.random() < 0.7
          ) {
            tscreen[y * squares + x] = 10;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 11 ||
              screen[((y + 1) % squares) * squares + x] == 11 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 11 ||
              screen[y * squares + ((x + 1) % squares)] == 11) &&
            Math.random() < 0.7
          ) {
            tscreen[y * squares + x] = 11;
          } else if (
            screen[((y - 1 + squares) % squares) * squares + x] == 8 &&
            screen[((y + 1) % squares) * squares + x] == 8 &&
            screen[y * squares + ((x - 1 + squares) % squares)] == 8 &&
            screen[y * squares + ((x + 1) % squares)] == 8 &&
            Math.random() < 0.02
          ) {
            tscreen[y * squares + x] = 10;
          }
        } else if (screen[y * squares + x] == 9) {
          if (Math.random() < 0.1 || terrain[y * squares + x] < 60) {
            tscreen[y * squares + x] = 0;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 11 ||
              screen[((y + 1) % squares) * squares + x] == 11 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 11 ||
              screen[y * squares + ((x + 1) % squares)] == 11) &&
            Math.random() < 0.25
          ) {
            tscreen[y * squares + x] = 11;
          }
        } else if (screen[y * squares + x] == 10) {
          if (Math.random() < 0.1 || terrain[y * squares + x] > 60) {
            tscreen[y * squares + x] = 12;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 11 ||
              screen[((y + 1) % squares) * squares + x] == 11 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 11 ||
              screen[y * squares + ((x + 1) % squares)] == 11) &&
            Math.random() < 0.25
          ) {
            tscreen[y * squares + x] = 11;
          }
        } else if (screen[y * squares + x] == 11) {
          if (Math.random() < 0.1) {
            tscreen[y * squares + x] = 12;
          }
        } else if (screen[y * squares + x] == 12) {
          if (Math.random() >= 0.5) {
            tscreen[y * squares + x] = 0;
          } else {
            tscreen[y * squares + x] = 4;
          }
        } else {
          if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 1 ||
              screen[((y + 1) % squares) * squares + x] == 1 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 1 ||
              screen[y * squares + ((x + 1) % squares)] == 1) &&
            Math.random() < 0.3 &&
            terrain[y * squares + x] < 50
          ) {
            tscreen[y * squares + x] = 1;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 2 ||
              screen[((y + 1) % squares) * squares + x] == 2 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 2 ||
              screen[y * squares + ((x + 1) % squares)] == 2) &&
            Math.random() < 0.1 &&
            terrain[y * squares + x] < 70
          ) {
            tscreen[y * squares + x] = 2;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 3 ||
              screen[((y + 1) % squares) * squares + x] == 3 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 3 ||
              screen[y * squares + ((x + 1) % squares)] == 3) &&
            Math.random() < 0.2 &&
            terrain[y * squares + x] > 60
          ) {
            tscreen[y * squares + x] = 3;
          } else if (
            (screen[((y - 1 + squares) % squares) * squares + x] == 4 ||
              screen[((y + 1) % squares) * squares + x] == 4 ||
              screen[y * squares + ((x - 1 + squares) % squares)] == 4 ||
              screen[y * squares + ((x + 1) % squares)] == 4) &&
            Math.random() < 0.25 &&
            terrain[y * squares + x] < 55 &&
            terrain[y * squares + x] > 15
          ) {
            tscreen[y * squares + x] = 4;
          }
        }
      }
    }
    ecoData();
  } else if (sim.value == 7) {
    for (var y = 0; y < squares; y++) {
      for (var x = 0; x < squares; x++) {
        tscreen[y * squares + x] =
          Math.floor(screen[((y - 1 + squares) % squares) * squares + x] / 12) +
          Math.floor(screen[((y + 1) % squares) * squares + x] / 12) +
          Math.floor(screen[y * squares + ((x - 1 + squares) % squares)] / 12) +
          Math.floor(screen[y * squares + ((x + 1) % squares)] / 12) +
          Math.floor(screen[((y - 2 + squares) % squares) * squares + x] / 12) +
          Math.floor(screen[((y + 2) % squares) * squares + x] / 12) +
          Math.floor(screen[y * squares + ((x - 2 + squares) % squares)] / 12) +
          Math.floor(screen[y * squares + ((x + 2) % squares)] / 12) +
          Math.floor(
            screen[
              ((y - 1 + squares) % squares) * squares +
                ((x - 1 + squares) % squares)
            ] / 12
          ) +
          Math.floor(
            screen[
              ((y + 1) % squares) * squares + ((x - 1 + squares) % squares)
            ] / 12
          ) +
          Math.floor(
            screen[
              ((y - 1 + squares) % squares) * squares + ((x + 1) % squares)
            ] / 12
          ) +
          Math.floor(
            screen[((y + 1) % squares) * squares + ((x + 1) % squares)] / 12
          );
        if (
          tscreen[y * squares + x] == 0 &&
          screen[((y - 1 + squares) % squares) * squares + x] +
            screen[((y + 1) % squares) * squares + x] +
            screen[y * squares + ((x - 1 + squares) % squares)] +
            screen[y * squares + ((x + 1) % squares)] ==
            3
        ) {
          tscreen[y * squares + x] = 1;
        }
      }
    }
    if (rain) {
      for (let i = 0; i < (squares * squares) / 2500; i++) {
        if (Math.random() < 0.5) {
          tscreen[Math.floor(Math.random() * squares * squares)] = 1728;
        } else if (Math.random() < 0.5) {
          tscreen[Math.floor(Math.random() * squares * squares)] = 144;
        } else if (Math.random() < 0.5) {
          tscreen[Math.floor(Math.random() * squares * squares)] = 12;
        }
      }
    }
  }

  // updating screen and cscreen after rules are done with
  for (var y = 0; y < squares; y++) {
    for (var x = 0; x < squares; x++) {
      if (
        Math.round(screen[y * squares + x]) !=
          Math.round(tscreen[y * squares + x]) ||
        frame == 1
      ) {
        cscreen[y * squares + x] = 1;
      } else {
        cscreen[y * squares + x] = 0;
      }
      screen[y * squares + x] = tscreen[y * squares + x];
    }
  }
  // drawing screen
  let color;
  ctx.beginPath();
  ctx.imageSmoothingEnabled = false;
  if (sim.value == 0) {
    ctx.drawImage(document.getElementById("cells"), 0, 0, 400, 450);
  } else {
    for (var y = 0; y < width; y += width / squares) {
      for (var x = 0; x < width; x += width / squares) {
        z = Math.round((x * squares) / width);
        v = Math.round((y * squares) / width);
        if (cscreen[v * squares + z]) {
          if (sim.value == 1) {
            if (screen[v * squares + z] == 0 || screen[v * squares + z] == 1) {
              color = "#703206";
            } else if (screen[v * squares + z] == 3) {
              color = "red";
            } else if (screen[v * squares + z] == 2) {
              color = "green";
            } else if (screen[v * squares + z] == 5) {
              color = "MidnightBlue";
            } else {
              color = "#361104";
            }
          } else if (sim.value == 0) {
            color = "white";
          } else if (sim.value == 2) {
            color = colors[screen[v * squares + z]];
          } else if (sim.value == 3 || sim.value == 6) {
            if (screen[v * squares + z] == 0) {
              color = "black";
            } else {
              color = "white";
            }
          } else if (sim.value == 4) {
            color = colors[Math.round(screen[v * squares + z])];
          } else if (sim.value == 5) {
            if (visual == 0) {
              if (screen[v * squares + z] == 1) {
                color = "#0b4209ff";
              } else if (screen[v * squares + z] == 2) {
                color = "#146e11ff";
              } else if (screen[v * squares + z] == 3) {
                color = "#1db46eff";
              } else if (screen[v * squares + z] == 4) {
                color = "#6c9225ff";
              } else if (screen[v * squares + z] == 5) {
                color = "#0c0e9cff";
              } else if (screen[v * squares + z] == 6) {
                color = "#7a540cff";
              } else if (screen[v * squares + z] == 7) {
                color = "#24d41eff";
              } else if (screen[v * squares + z] == 8) {
                color = "#ffffffff";
              } else if (screen[v * squares + z] == 9) {
                color = "#091652ff";
              } else if (screen[v * squares + z] == 10) {
                color = "#505050ff";
              } else if (screen[v * squares + z] == 11) {
                color = "#311a00ff";
              } else {
                color = sColors[Math.floor(terrain[v * squares + z] / 20)];
              }
            } else if (visual == 1) {
              color = sColors[Math.floor(terrain[v * squares + z] / 20)];
            } else {
              if (screen[v * squares + z] == 1) {
                color = "#0b4209ff";
              } else if (screen[v * squares + z] == 2) {
                color = "#146e11ff";
              } else if (screen[v * squares + z] == 3) {
                color = "#1db46eff";
              } else if (screen[v * squares + z] == 4) {
                color = "#6c9225ff";
              } else {
                color = sColors[Math.floor(terrain[v * squares + z] / 20)];
              }
            }
          } else if (sim.value == 7) {
            if (screen[v * squares + z] < 1) {
              color = "#b6e4ebff";
            } else if (screen[v * squares + z] < 12) {
              color = "#65a8b3ff";
            } else if (screen[v * squares + z] < 144) {
              color = "#357e8aff";
            } else if (screen[v * squares + z] < 1728) {
              color = "#1a5d68ff";
            } else {
              color = "#073941ff";
            }
          }

          ctx.fillStyle = color;
          ctx.fillRect(x, y, width / squares, width / squares);
        }
      }
    }
  }
  ctx.closePath();
}

// clearing and resetting screen
function set() {
  ctx.beginPath();
  ctx.clearRect(0, 0, 400, 400);
  ctx.closePath();
  frame = 0;
}

// draws info about eco sim
function ecoData() {
  document.getElementById("data").innerHTML =
    "type current(%)<br>" +
    "empty.: " +
    Math.round((100 * animals[0]) / (squares * squares)) +
    "<br>" +
    "ctrees: " +
    Math.round((100 * animals[1]) / (squares * squares)) +
    "<br>" +
    "dtrees: " +
    Math.round((100 * animals[2]) / (squares * squares)) +
    "<br>" +
    "coral.: " +
    Math.round((100 * animals[3]) / (squares * squares)) +
    "<br>" +
    "grass.: " +
    Math.round((100 * animals[4]) / (squares * squares)) +
    "<br>" +
    "fish..: " +
    Math.round((100 * animals[5]) / (squares * squares)) +
    "<br>" +
    "moose.: " +
    Math.round((100 * animals[6]) / (squares * squares)) +
    "<br>" +
    "frogs.: " +
    Math.round((100 * animals[7]) / (squares * squares)) +
    "<br>" +
    "hares.: " +
    Math.round((100 * animals[8]) / (squares * squares)) +
    "<br>" +
    "sharks: " +
    Math.round((100 * animals[9]) / (squares * squares)) +
    "<br>" +
    "wolves: " +
    Math.round((100 * animals[10]) / (squares * squares)) +
    "<br>" +
    "bears.: " +
    Math.round((100 * animals[11]) / (squares * squares)) +
    "<br>" +
    "dead..: " +
    Math.round((100 * animals[12]) / (squares * squares));
  document.getElementById("eData").innerHTML =
    "type current#<br>" +
    "empty.: " +
    animals[0] +
    "<br>" +
    "ctrees: " +
    animals[1] +
    "<br>" +
    "dtrees: " +
    animals[2] +
    "<br>" +
    "coral.: " +
    animals[3] +
    "<br>" +
    "grass.: " +
    animals[4] +
    "<br>" +
    "fish..: " +
    animals[5] +
    "<br>" +
    "moose.: " +
    animals[6] +
    "<br>" +
    "frogs.: " +
    animals[7] +
    "<br>" +
    "hares.: " +
    animals[8] +
    "<br>" +
    "sharks: " +
    animals[9] +
    "<br>" +
    "wolves: " +
    animals[10] +
    "<br>" +
    "bears.: " +
    animals[11] +
    "<br>" +
    "dead..: " +
    animals[12] +
    "<br>" +
    "total.: " +
    squares * squares;
}

// what the button does in each case
function Button() {
  let rpos = Math.floor(Math.random() * squares * squares);
  if (sim.value == 1) {
    if (screen[rpos] != 5) {
      screen[rpos] = 3;
    } else {
      alert("The fire landed in the river...");
    }
  } else if (sim.value == 2) {
    clearInterval(timer);
    Cycle();
  } else if (sim.value == 3) {
    clearInterval(timer);
    rToggle = !rToggle;
    set();
    Fractal();
  } else if (sim.value == 4) {
    screen[rpos] = 8;
  } else if (sim.value == 5) {
    visual++;
    if (visual == 3) {
      visual = 0;
    }
    set();
  } else if (sim.value == 6) {
    type = !type;
    clearInterval(timer);
    set();
    circle();
  } else if (sim.value == 7) {
    rain = !rain;
  }
}

// the grid size slider
slider.oninput = function slide() {
  clearInterval(timer);

  squares = +slider.value;
  document.getElementById("value").innerHTML = squares;
  set();

  if (sim.value == 1) {
    Fire();
  } else if (sim.value == 2) {
    Cycle();
  } else if (sim.value == 3) {
    Fractal();
  } else if (sim.value == 4) {
    Water();
  } else if (sim.value == 5) {
    Erosion();
  } else if (sim.value == 6) {
    circle();
  } else if (sim.value == 7) {
    Rain();
  } else {
    step();
  }
};

// the sim slider
sim.oninput = function simC() {
  clearInterval(timer);
  document.getElementById("data").innerHTML = "";
  document.getElementById("eData").innerHTML = "";
  set();

  if (sim.value == 0) {
    document.getElementById("b").innerText = "Pls Select Automata";
    document.getElementById("simType").innerText = "None";
    step();
  } else if (sim.value == 1) {
    document.getElementById("b").innerText = "Add fire";
    document.getElementById("simType").innerText = "Forest Fire";
    Fire();
  } else if (sim.value == 2) {
    document.getElementById("b").innerText = "Randomize";
    document.getElementById("simType").innerText = "Mosaic";
    Cycle();
  } else if (sim.value == 3) {
    document.getElementById("b").innerText = "Toggle Rule";
    document.getElementById("simType").innerText = "Fractal";
    Fractal();
  } else if (sim.value == 4) {
    document.getElementById("b").innerText = "Add Particles";
    document.getElementById("simType").innerText = "Diffusion";
    Water();
  } else if (sim.value == 5) {
    document.getElementById("b").innerText = "Toggle View";
    document.getElementById("simType").innerText = "Eco Sim";
    Erosion();
  } else if (sim.value == 6) {
    document.getElementById("b").innerText = "Toggle Type";
    document.getElementById("simType").innerText = "Circle";
    circle();
  } else if (sim.value == 7) {
    document.getElementById("b").innerText = "Toggle Rain";
    document.getElementById("simType").innerText = "Rain";
    Rain();
  }
};

// the fps slider
fps.oninput = function fpsC() {
  clearInterval(timer);
  document.getElementById("fpsL").innerHTML = fps.value;
  timer = setInterval(step, 1000 / fps.value);
};
