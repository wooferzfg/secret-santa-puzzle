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
let gameWon;

const GRID_WIDTH = 5;
const GRID_HEIGHT = 5;

class Island {
  constructor(row, column) {
    this.row = row;
    this.column = column;
    this.buttonDirection = null;
    this.requiredSnakeVisits = null;
    this.hintText = null;
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

  hasButton() {
    return this.buttonDirection !== null;
  }

  getButtonDirection() {
    return this.buttonDirection;
  }

  hasEgg() {
    return this.requiredSnakeVisits !== null;
  }

  getEggLetter() {
    const eggMapping = {
      1: 'I',
      2: 'A',
      3: 'M',
    };
    return eggMapping[this.requiredSnakeVisits];
  }

  hasHintText() {
    return this.hintText !== null;
  }

  getHintText() {
    return this.hintText;
  }

  countSnakeVisits() {
    let totalVisits = 0;

    ALL_DIRECTIONS.forEach((direction) => {
      const border = this.getBorder(direction);
      if (border.getVisitedBySnake()) {
        totalVisits += 1;
      }
    });

    return totalVisits;
  }

  hasRequiredSnakeVisits() {
    return this.requiredSnakeVisits !== null;
  }

  getRequiredSnakeVisits() {
    return this.requiredSnakeVisits;
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

GAME_START_RESPONSE = 'You wake up and find yourself on a square shaped island. The island is surrounded by a large moat on all sides. You see many similar islands in the distance.';
RESTART_INFO = 'At any time, if you would like to restart the game, type \'restart\'.';
AFTER_MOVING_RESPONSE = 'You cross the bridge, and you are now on a different square shaped island.'

function resetPuzzle() {
  islands = [];
  corners = [];
  horizontalBorders = [];
  verticalBorders = [];
  playerPosition = { row: INITIAL_PLAYER_POSITION.row, column: INITIAL_PLAYER_POSITION.column };
  snakePosition = { row: INITIAL_SNAKE_POSITION.row, column: INITIAL_SNAKE_POSITION.column };
  pathLength = 0;
  gameWon = false;

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

  islands[0][0].requiredSnakeVisits = 2;
  islands[0][1].requiredSnakeVisits = 3;
  islands[1][1].requiredSnakeVisits = 1;
  islands[1][2].requiredSnakeVisits = 1;
  islands[2][4].requiredSnakeVisits = 2;
  islands[4][4].requiredSnakeVisits = 1;

  islands[0][0].buttonDirection = Direction.WEST;
  islands[0][2].buttonDirection = Direction.EAST;
  islands[4][0].buttonDirection = Direction.SOUTH;
  islands[4][3].buttonDirection = Direction.NORTH;

  islands[1][0].hintText = 'The snake\'s eggs count the sides of the island the snake must visit';
  islands[1][3].hintText = 'Perhaps a \'map\' could be useful';
  islands[2][2].hintText = 'All you need for a command is one letter. \'p\' is the same as \'push\'';
  islands[3][3].hintText = 'The snake must visit all its eggs and return home';

  Corner.getCornerForPosition(INITIAL_SNAKE_POSITION).visitedBySnake = true;
}

window.onload = () => startGame();

const DIRECTION_COMMANDS = {
  [Direction.NORTH]: ['n', 'north'],
  [Direction.EAST]: ['e', 'east'],
  [Direction.SOUTH]: ['s', 'south'],
  [Direction.WEST]: ['w', 'west'],
};
const MAP_COMMANDS = ['m', 'map'];
const PUSH_COMMANDS = ['p', 'push'];
const RESET_COMMANDS = ['reset', 'restart'];

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
  if (PUSH_COMMANDS.includes(command)) {
    return processPushCommand();
  }
  if (RESET_COMMANDS.includes(command)) {
    resetPuzzle();
    return multipleLineResponse(
      [
        'A dense white fog surrounds you, and you suddenly start feeling tired...',
        '',
        GAME_START_RESPONSE,
      ].concat(describeCurrentIsland())
    );
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
    return singleLineResponse('There is no island in that direction.');
  }

  const border = currentIsland.getBorder(direction);
  if (border.getNoBridge()) {
    return singleLineResponse('There is no bridge in that direction.');
  }
  if (border.getVisitedBySnake() && !border.getIsIronBridge()) {
    return singleLineResponse('The bridge in that direction has been destroyed.');
  }

  const vector = DIRECTION_VECTORS[direction];
  playerPosition.row += vector.row;
  playerPosition.column += vector.column;

  return multipleLineResponse([AFTER_MOVING_RESPONSE].concat(describeCurrentIsland()));
}

function processPushCommand() {
  const currentIsland = Island.getIslandForPosition(playerPosition);
  if (!currentIsland.hasButton()) {
    return singleLineResponse('This island does not have a button.');
  }

  const direction = currentIsland.getButtonDirection();
  const snakeMove = tryMoveSnake(direction);

  if (!snakeMove.result) {
    return singleLineResponse('The button buzzes loudly, as if it is rejecting you.');
  } else {
    const newCorner = snakeMove.newCorner;
    if (newCorner.isInitialSnakePosition()) {
      if (validateSnake()) {
        gameWon = true;

        document.getElementById('command-container').remove();

        return [
          createResponseTextLine('The snake slithers, as its head links with its tail.'),
          createResponseTextLine('Congratulations, you have completed the puzzle!'),
          drawMap(),
        ];
      }

      resetPuzzle();
      return multipleLineResponse(
        [
          'You hear a loud hiss. Something is wrong.',
          'A dense white fog surrounds you, and you suddenly start feeling tired...',
          '',
          GAME_START_RESPONSE,
        ].concat(describeCurrentIsland())
      );
    } else {
      return singleLineResponse('The snake moved!');
    }
  }
}

function tryMoveSnake(direction) {
  const currentCorner = Corner.getCornerForPosition(snakePosition);

  const newCorner = currentCorner.getCorner(direction);
  if (!newCorner) {
    return { result: false };
  }
  if (newCorner.getVisitedBySnake() && (pathLength <= 1 || !newCorner.isInitialSnakePosition())) {
    return { result: false };
  }

  const border = currentCorner.getBorder(direction);
  if (border.getIsLava()) {
    return { result: false };
  }

  const vector = DIRECTION_VECTORS[direction];
  snakePosition.row += vector.row;
  snakePosition.column += vector.column;

  newCorner.setVisitedBySnake();
  border.setVisitedBySnake();

  pathLength += 1;

  return { result: true, newCorner };
}

function startGame() {
  resetPuzzle();

  addResponse(
    multipleLineResponse(
      [GAME_START_RESPONSE].concat(describeCurrentIsland(), RESTART_INFO)
    )
  );
}

function validateSnake() {
  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    for (let column = 0; column < GRID_WIDTH; column += 1) {
      const island = Island.getIslandForPosition({ row, column });
      if (island.hasRequiredSnakeVisits() && island.countSnakeVisits() !== island.getRequiredSnakeVisits()) {
        return false;
      }
    }
  }
  return true;
}

const MAP_TABLE_CELL_SIZE = 60;
const SNAKE_POSITION_CIRCLE_SIZE = 20;

function processMapCommand() {
  const mapTable = drawMap();
  return [mapTable];
}

function drawMap() {
  const mapTable = document.createElement('table');
  addClass(mapTable, 'map-table');

  if (gameWon) {
    addClass(mapTable, 'margin-above-map');
  }

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

      if (!gameWon && row === playerPosition.row && column === playerPosition.column) {
        const positionMarker = document.createElement('div');
        positionMarker.innerText = '\u2605';
        addClass(positionMarker, 'position-marker');
        cellContent.appendChild(positionMarker);
      }

      if (gameWon && island.hasRequiredSnakeVisits()) {
        const requiredSnakeVisits = document.createElement('div');
        requiredSnakeVisits.innerText = island.getRequiredSnakeVisits();
        addClass(requiredSnakeVisits, 'required-snake-visits');
        cellContent.appendChild(requiredSnakeVisits);
      }
    }
  }

  if (!gameWon) {
    const snakePositionCircle = document.createElement('div');
    addClass(snakePositionCircle, 'snake-position');
    snakePositionCircle.style.left = `${snakePosition.column * MAP_TABLE_CELL_SIZE - SNAKE_POSITION_CIRCLE_SIZE / 2}px`;
    snakePositionCircle.style.top = `${snakePosition.row * MAP_TABLE_CELL_SIZE - SNAKE_POSITION_CIRCLE_SIZE / 2}px`;
    mapTable.appendChild(snakePositionCircle);
  }

  return mapTable;
}

function formatDirections(directions, conjunction = 'and', withQuotes = false) {
  if (withQuotes) {
    directions = directions.map((direction) => `'${direction}'`);
  }

  if (directions.length === 1) {
    return directions[0];
  }
  if (directions.length === 2) {
    return `${directions[0]} ${conjunction} ${directions[1]}`;
  }
  if (directions.length > 2) {
    return `${directions.slice(0, directions.length - 1).join(', ')}, ${conjunction} ${directions[directions.length - 1]}`;
  }
  throw 'No valid directions!';
}

function pluralize(singular, plural, directions) {
  if (!directions) {
    throw 'No valid directions!';
  }
  if (directions.length > 1) {
    return plural;
  }
  return singular;
}

function buttonLetter(direction) {
  return direction[0].toUpperCase();
}

function describeCurrentIsland() {
  const currentIsland = Island.getIslandForPosition(playerPosition);

  const moveDirs = [];
  const islandDirs = [];
  const ropeBridgeDirs = [];
  const ironBridgeDirs = [];
  const lavaDirsWithBridge = [];
  const lavaDirsNoBridge = [];
  const destroyedBridgeDirs = [];
  const noBridgeDirs = [];

  ALL_DIRECTIONS.forEach((direction) => {
    const border = currentIsland.getBorder(direction);
    const newIsland = currentIsland.getIsland(direction);

    if (newIsland) {
      islandDirs.push(direction);
      if (border.getIsIronBridge() || (!border.getVisitedBySnake() && !border.getNoBridge())) {
        moveDirs.push(direction);
      }
      if (!border.getIsIronBridge() && !border.getVisitedBySnake() && !border.getNoBridge()) {
        ropeBridgeDirs.push(direction);
      }
      if (border.getIsIronBridge()) {
        ironBridgeDirs.push(direction);
      }
      if (border.getIsLava()) {
        if (border.getIsIronBridge() || (!border.getVisitedBySnake() && !border.getNoBridge())) {
          lavaDirsWithBridge.push(direction);
        } else {
          lavaDirsNoBridge.push(direction);
        }
      }
      if (!border.getIsIronBridge() && border.getVisitedBySnake() && !border.getNoBridge()) {
        destroyedBridgeDirs.push(direction);
      }
      if (border.getNoBridge()) {
        noBridgeDirs.push(direction);
      }
    }
  });

  islandLines = [
    currentIsland.hasButton() ? `On a pedestal, there is a button with the letter ${buttonLetter(currentIsland.getButtonDirection())} on it. Type \'push\' to push the button.` : null,
    currentIsland.hasEgg() ? `On the ground, there is a large egg with the letter ${currentIsland.getEggLetter()} engraved on it.` : null,
    currentIsland.hasHintText() ? `In the middle of the island, there is a stone tablet that reads: "${currentIsland.getHintText()}."` : null,
  ].filter((line) => line !== null);

  borderLines = [
    islandDirs.length > 0 ? `There ${pluralize('is another island', 'are other islands', islandDirs)} to the ${formatDirections(islandDirs)}.` : null,
    ropeBridgeDirs.length > 0 ? `To the ${formatDirections(ropeBridgeDirs)}, there ${pluralize('is a', 'are', ropeBridgeDirs)} flimsy rope ${pluralize('bridge', 'bridges', ropeBridgeDirs)}.` : null,
    ironBridgeDirs.length > 0 ? (
      `To the ${formatDirections(ironBridgeDirs)}, there ${pluralize('is an', 'are', ironBridgeDirs)} arched iron ${pluralize('bridge', 'bridges', ironBridgeDirs)}. ` +
      'This type of bridge could survive heavy force from a large creature. The same cannot be said about a rope bridge.'
    ) : null,
    lavaDirsWithBridge.length > 0 ? `To the ${formatDirections(lavaDirsWithBridge)}, under the bridge, the moat is filled with lava. Not even the bravest of creatures would dare pass through it.` : null,
    lavaDirsNoBridge.length > 0 ? `To the ${formatDirections(lavaDirsNoBridge)}, the moat is filled with lava. Not even the bravest of creatures would dare pass through it.` : null,
    destroyedBridgeDirs.length > 0 ? `To the ${formatDirections(destroyedBridgeDirs)}, the wooden ${pluralize('bridge has been', 'bridges have been', destroyedBridgeDirs)} destroyed.` : null,
    noBridgeDirs.length > 0 ? `There ${pluralize('is no bridge', 'are no bridges', noBridgeDirs)} to the ${formatDirections(noBridgeDirs, 'or')}.`: null,
  ].filter((line) => line !== null);

  const response = [];

  if (islandLines.length > 0) {
    response.push('', ...islandLines);
  }
  if (borderLines.length > 0) {
    response.push('', ...borderLines);
  }

  response.push(
    '',
    moveDirs.length > 0 ? `Type ${formatDirections(moveDirs, 'or', true)} to move in that direction.` : 'You cannot move. Type \'restart\' to restart the game.',
  );

  return response;
}

function commandDisplayElements(command) {
  const textElement = createResponseTextLine(`> ${command}`);
  addClass(textElement, 'command-display');
  return [textElement];
}

function singleLineResponse(line) {
  return [createResponseTextLine(line)];
}

function multipleLineResponse(lines) {
  return lines.map((line) => createResponseTextLine(line));
}

function createResponseTextLine(text) {
  const textElement = document.createElement('div');
  textElement.innerText = text;

  if (!text) {
    addClass(textElement, 'empty-line');
  }

  return textElement;
}

function createResponseLineElement(childElements) {
  const responseLine = document.createElement('div');
  addClass(responseLine, 'response-line');

  for (let i = 0; i < childElements.length; i += 1) {
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

  while (responseText.childElementCount > 50) {
    responseText.removeChild(responseText.firstChild);
  }

  responseText.scrollTop = responseText.scrollHeight;
}

/*
To test path only having 1 segment left:

tryMoveSnake('east')
tryMoveSnake('east')
tryMoveSnake('south')
tryMoveSnake('south')
tryMoveSnake('east')
tryMoveSnake('south')
tryMoveSnake('west')
tryMoveSnake('west')
tryMoveSnake('north')
tryMoveSnake('west')
tryMoveSnake('north')
tryMoveSnake('west')
tryMoveSnake('south')
tryMoveSnake('south')
tryMoveSnake('east')
tryMoveSnake('south')
tryMoveSnake('west')
tryMoveSnake('west')
tryMoveSnake('north')
tryMoveSnake('north')
tryMoveSnake('north')
tryMoveSnake('north')
tryMoveSnake('east')
tryMoveSnake('north')
tryMoveSnake('east')
*/
