const Direction = {
  NORTH: 'north',
  EAST: 'east',
  SOUTH: 'south',
  WEST: 'west',
};

const ALL_DIRECTIONS = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];

const CornerDirection = {
  NORTHEAST: 'northeast',
  SOUTHEAST: 'southeast',
  SOUTHWEST: 'southwest',
  NORTHWEST: 'northwest',
};

const ALL_CORNER_DIRECTIONS = [CornerDirection.NORTHEAST, CornerDirection.SOUTHEAST, CornerDirection.SOUTHWEST, CornerDirection.NORTHWEST];

// When determining the position of the same type (e.g. island -> island, border -> border, corner -> corner), use `row` and `column`.
// When determining the position of a different type (e.g. island -> corner, island -> border, corner -> border), use `differentTypeRow` and `differentTypeColumn`.
const DIRECTION_VECTORS = {
  [Direction.NORTH]: { row: -1, differentTypeRow: 0, column: 0, differentTypeColumn: 0 },
  [Direction.EAST]: { row: 0, differentTypeRow: 0, column: 1, differentTypeColumn: 1 },
  [Direction.SOUTH]: { row: 1, differentTypeRow: 1, column: 0, differentTypeColumn: 0 },
  [Direction.WEST]: { row: 0, differentTypeRow: 0, column: -1, differentTypeColumn: 0 },
  [CornerDirection.NORTHEAST]: { differentTypeRow: 0, differentTypeColumn: 1 },
  [CornerDirection.SOUTHEAST]: { differentTypeRow: 1, differentTypeColumn: 1 },
  [CornerDirection.SOUTHWEST]: { differentTypeRow: 1, differentTypeColumn: 0 },
  [CornerDirection.NORTHWEST]: { differentTypeRow: 0, differentTypeColumn: 0 },
};

const BorderType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
};

const INITIAL_PLAYER_POSITION = { row: 2, column: 1 };
const INITIAL_SNAKE_POSITION = { row: 1, column: 2 };

let islands;
let corners;
let horizontalBorders;
let verticalBorders;
let playerPosition;
let snakePosition;
let pathLength;

const GRID_WIDTH = 5;
const GRID_HEIGHT = 5;

class Island {
  constructor(row, column) {
    this.row = row;
    this.column = column;
  }

  getCorner(cornerDirection) {
    const vector = DIRECTION_VECTORS[cornerDirection];
    return corners[this.row + vector.differentTypeRow]?.[this.column + vector.differentTypeColumn];
  }

  getBorder(direction) {
    const vector = DIRECTION_VECTORS[direction];

    if (vector.row === 0) {
      return verticalBorders[this.row]?.[this.column + vector.differentTypeColumn];
    }
    if (vector.column === 0) {
      return horizontalBorders[this.row + vector.differentTypeRow]?.[this.column];
    }
  }

  getIsland(direction) {
    const vector = DIRECTION_VECTORS[direction];
    return islands[this.row + vector.row]?.[this.column + vector.column];
  }

  static getIslandForPosition(position) {
    return islands[position.row]?.[position.column];
  }
}

class Corner {
  constructor(row, column) {
    this.row = row;
    this.column = column;
    this.visitedBySnake = false;
  }

  getBorder(direction) {
    const vector = DIRECTION_VECTORS[direction];

    if (vector.row === 0) {
      return horizontalBorders[this.row]?.[this.column + vector.differentTypeColumn - 1];
    }
    if (vector.column === 0) {
      return verticalBorders[this.row + vector.differentTypeRow - 1]?.[this.column];
    }
  }

  getCorner(direction) {
    const vector = DIRECTION_VECTORS[direction];
    return corners[this.row + vector.row]?.[this.column + vector.column];
  }

  getVisitedBySnake() {
    return this.visitedBySnake;
  }

  setVisitedBySnake() {
    this.visitedBySnake = true;
  }

  isInitialSnakePosition() {
    return this.row === INITIAL_SNAKE_POSITION.row && this.column === INITIAL_SNAKE_POSITION.column;
  }

  static getCornerForPosition(position) {
    return corners[position.row]?.[position.column];
  }
}

class Border {
  constructor(row, column, type) {
    this.row = row;
    this.column = column;
    this.type = type;
    this.visitedBySnake = false;
    this.noBridge = false;
    this.isIronBridge = false;
    this.isLava = false;
  }

  getVisitedBySnake() {
    return this.visitedBySnake;
  }

  setVisitedBySnake() {
    this.visitedBySnake = true;
  }

  getNoBridge() {
    return this.noBridge;
  }

  getIsIronBridge() {
    return this.isIronBridge;
  }

  getIsLava() {
    return this.isLava;
  }
}

function resetPuzzle() {
  islands = [];
  corners = [];
  horizontalBorders = [];
  verticalBorders = [];
  playerPosition = { row: INITIAL_PLAYER_POSITION.row, column: INITIAL_PLAYER_POSITION.column };
  snakePosition = { row: INITIAL_SNAKE_POSITION.row, column: INITIAL_SNAKE_POSITION.column };
  pathLength = 0;

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    islands.push([]);

    for (let column = 0; column < GRID_WIDTH; column += 1) {
      islands[row].push(new Island(row, column));
    }
  }

  for (let row = 0; row < GRID_HEIGHT + 1; row += 1) {
    corners.push([]);

    for (let column = 0; column < GRID_WIDTH + 1; column += 1) {
      corners[row].push(new Corner(row, column));
    }
  }

  for (let row = 0; row < GRID_HEIGHT + 1; row += 1) {
    horizontalBorders.push([]);

    for (let column = 0; column < GRID_WIDTH; column += 1) {
      horizontalBorders[row].push(new Border(row, column, BorderType.HORIZONTAL));
    }
  }

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    verticalBorders.push([]);

    for (let column = 0; column < GRID_WIDTH + 1; column += 1) {
      verticalBorders[row].push(new Border(row, column, BorderType.VERTICAL));
    }
  }

  verticalBorders[0][2].noBridge = true;
  verticalBorders[1][2].isLava = true;
  verticalBorders[2][4].isIronBridge = true;
  verticalBorders[3][1].isIronBridge = true;
  verticalBorders[4][1].isLava = true;
  verticalBorders[4][1].noBridge = true;
  verticalBorders[4][2].noBridge = true;

  Corner.getCornerForPosition(INITIAL_SNAKE_POSITION).visitedBySnake = true;
}

resetPuzzle();

const DIRECTION_COMMANDS = {
  [Direction.NORTH]: ['n', 'north'],
  [Direction.EAST]: ['e', 'east'],
  [Direction.SOUTH]: ['s', 'south'],
  [Direction.WEST]: ['w', 'west'],
};

const MAP_COMMANDS = ['m', 'map'];

const RESET_COMMAND = 'reset';

const ALL_DIRECTION_COMMANDS = Object.values(DIRECTION_COMMANDS).flat();

function sendCommand(event) {
  event.preventDefault();


  const commandInput = document.getElementById('command-input');
  const command = commandInput.value;
  commandInput.value = '';

  if (command) {
    const commandDisplay = commandDisplayElements(command);
    const responseLines = processCommand(command.trim().toLowerCase());
    addResponse(commandDisplay.concat(responseLines));
  }
}

function processCommand(command) {
  if (ALL_DIRECTION_COMMANDS.includes(command)) {
    return processMoveCommand(command);
  }
  if (MAP_COMMANDS.includes(command)) {
    return processMapCommand();
  }
  if (command === RESET_COMMAND) {
    resetPuzzle();
    return singleLineResponse('Puzzle reset!');
  }

  return singleLineResponse('Invalid command!');
}

function processMoveCommand(command) {
  const direction = Object.keys(DIRECTION_COMMANDS).find(
    direction => DIRECTION_COMMANDS[direction].includes(command)
  );
  const currentIsland = Island.getIslandForPosition(playerPosition);

  const newIsland = currentIsland.getIsland(direction);
  if (!newIsland) {
    return singleLineResponse('There is no island in that direction!');
  }

  const border = currentIsland.getBorder(direction);
  if (border.getNoBridge()) {
    return singleLineResponse('There is no bridge in that direction!');
  }
  if (border.getVisitedBySnake() && !border.getIsIronBridge()) {
    return singleLineResponse('The bridge in that direction has been destroyed!');
  }

  const vector = DIRECTION_VECTORS[direction];
  playerPosition.row += vector.row;
  playerPosition.column += vector.column;

  return singleLineResponse('Moved!');
}

function tryMoveSnake(direction) {
  const currentCorner = Corner.getCornerForPosition(snakePosition);

  const newCorner = currentCorner.getCorner(direction);
  if (!newCorner) {
    return false;
  }
  if (newCorner.getVisitedBySnake() && (pathLength <= 1 || !newCorner.isInitialSnakePosition())) {
    return false;
  }

  const border = currentCorner.getBorder(direction);
  if (border.getIsLava()) {
    return false;
  }

  const vector = DIRECTION_VECTORS[direction];
  snakePosition.row += vector.row;
  snakePosition.column += vector.column;

  newCorner.setVisitedBySnake();
  border.setVisitedBySnake();

  pathLength += 1;

  return true;
}

const MAP_TABLE_CELL_SIZE = 60;
const SNAKE_POSITION_CIRCLE_SIZE = 20;

function processMapCommand() {
  const mapTable = document.createElement('table');
  addClass(mapTable, 'map-table');

  const mapTableBody = document.createElement('tbody');
  mapTable.appendChild(mapTableBody);

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    const rowElement = document.createElement('tr');
    mapTableBody.appendChild(rowElement);

    for (let column = 0; column < GRID_WIDTH; column += 1) {
      const columnElement = document.createElement('td');
      addClass(columnElement, 'map-table-cell');
      rowElement.appendChild(columnElement);

      const island = Island.getIslandForPosition({ row, column });
      const topBorder = island.getBorder(Direction.NORTH);
      const leftBorder = island.getBorder(Direction.WEST);
      const bottomBorder = island.getBorder(Direction.SOUTH);
      const rightBorder = island.getBorder(Direction.EAST);

      if (topBorder.getVisitedBySnake()) {
        if (row === 0) {
          addClass(columnElement, 'top-border-snake');
        } else {
          addClass(columnElement, 'shrink-top-padding');
        }
      }
      if (leftBorder.getVisitedBySnake()) {
        if (column === 0) {
          addClass(columnElement, 'left-border-snake');
        } else {
          addClass(columnElement, 'shrink-left-padding');
        }
      }
      if (bottomBorder.getVisitedBySnake()) {
        addClass(columnElement, 'bottom-border-snake');
      }
      if (rightBorder.getVisitedBySnake()) {
        addClass(columnElement, 'right-border-snake');
      }
      

      const cellContent = document.createElement('div');
      addClass(cellContent, 'map-table-cell-inner');
      columnElement.appendChild(cellContent);

      if (row === playerPosition.row && column === playerPosition.column) {
        const positionMarker = document.createElement('div');
        positionMarker.innerText = '\u2605';
        addClass(positionMarker, 'position-marker');
        cellContent.appendChild(positionMarker);
      }
    }
  }

  const snakePositionCircle = document.createElement('div');
  addClass(snakePositionCircle, 'snake-position');
  snakePositionCircle.style.left = `${snakePosition.column * MAP_TABLE_CELL_SIZE - SNAKE_POSITION_CIRCLE_SIZE / 2}px`;
  snakePositionCircle.style.top = `${snakePosition.row * MAP_TABLE_CELL_SIZE - SNAKE_POSITION_CIRCLE_SIZE / 2}px`;
  mapTable.appendChild(snakePositionCircle);

  return [mapTable];
}

function commandDisplayElements(command) {
  const textElement = createResponseTextLine(`> ${command}`);
  addClass(textElement, 'command-display');
  return [textElement];
}

function singleLineResponse(line) {
  return [createResponseTextLine(line)];
}

function createResponseTextLine(text) {
  const textElement = document.createElement('div');
  textElement.innerText = text;
  return textElement;
}

function createResponseLineElement(childElements) {
  const responseLine = document.createElement('div');
  addClass(responseLine, 'response-line');

  for (let i = 0; i < childElements.length; i++) {
    responseLine.appendChild(childElements[i]);
  }

  return responseLine;
}

function addClass(element, className) {
  if (element.className) {
    element.className += ` ${className}`;
  } else {
    element.className = className;
  }
}

function addResponse(childElements) {
  const responseText = document.getElementById('response-text');

  const responseLine = createResponseLineElement(childElements);
  responseText.appendChild(responseLine);

  while (responseText.childElementCount > 20) {
    responseText.removeChild(responseText.firstChild);
  }

  responseText.scrollTop = responseText.scrollHeight;
}
