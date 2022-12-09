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
const BUTTON_LOCATIONS = {
  [Direction.NORTH]: { row: 4, column: 3 },
  [Direction.EAST]: { row: 0, column: 2 },
  [Direction.SOUTH]: { row: 4, column: 0 },
  [Direction.WEST]: { row: 0, column: 0 },
}

let islands;
let corners;
let horizontalBorders;
let verticalBorders;
let playerPosition;
let snakePosition;
let gameWon;
let snakePath;
let mapData = null;

const GRID_WIDTH = 5;
const GRID_HEIGHT = 5;

class Island {
  constructor(row, column) {
    this.row = row;
    this.column = column;
    this.buttonDirection = null;
    this.requiredSnakeVisits = null;
    this.hintText = null;
    this.hasHamster = false;

    ALL_DIRECTIONS.forEach((direction) => {
      const buttonLocation = BUTTON_LOCATIONS[direction];
      if (buttonLocation.row === row && buttonLocation.column === column) {
        this.buttonDirection = direction;
      }
    });
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

  getHasHamster() {
    return this.hasHamster;
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

  undoVisitedBySnake() {
    this.visitedBySnake = false;
  }

  isInitialSnakePosition() {
    return this.row === INITIAL_SNAKE_POSITION.row && this.column === INITIAL_SNAKE_POSITION.column;
  }

  hasSnakeHead() {
    return this.row === snakePosition.row && this.column === snakePosition.column;
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

  undoVisitedBySnake() {
    this.visitedBySnake = false;
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

GAME_START_RESPONSE = 'You wake up and find yourself on a small square island. The island is surrounded by a large moat on all sides. You see many similar islands in the distance.';
RESTART_INFO = `At any time, if you would like to restart the game, type '${withBold('restart')}'.`;
AFTER_MOVING_RESPONSE = 'You cross the bridge, and you are now on a different small square island.'
HAMSTER_INFO = `In the middle of the island, there is a broken ${withColor('stone tablet', 'indigo')}. There is a hamster sitting on top of the tablet, muttering to themselves. Type '${withBold('talk')}' to talk to the hamster.`

function resetPuzzle() {
  islands = [];
  corners = [];
  horizontalBorders = [];
  verticalBorders = [];
  playerPosition = { row: INITIAL_PLAYER_POSITION.row, column: INITIAL_PLAYER_POSITION.column };
  snakePosition = { row: INITIAL_SNAKE_POSITION.row, column: INITIAL_SNAKE_POSITION.column };
  gameWon = false;
  snakePath = [];

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

  islands[1][0].hintText = "The engraving on a snake's egg counts how many sides of the island the snake must visit";
  islands[1][3].hintText = "The snake's journey begins and ends at its burrow";
  islands[2][2].hintText = `Most commands can be be typed as a single letter (e.g. '${withBold('s')}' is the same as '${withBold('south')}')`;
  islands[3][2].hintText = `Type '${withBold('undo')}' to retract the snake's last move`;
  islands[3][3].hintText = `Typing '${withBold('map')}' might help you navigate`;
  islands[3][4].hintText = 'The path of the snake has a unique solution'

  islands[0][4].hasHamster = true;

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
const TALK_COMMANDS = ['t', 'talk'];
const UNDO_COMMANDS = ['u', 'undo'];
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
  if (TALK_COMMANDS.includes(command)) {
    return processTalkCommand();
  }
  if (UNDO_COMMANDS.includes(command)) {
    return processUndoCommand();
  }
  if (RESET_COMMANDS.includes(command)) {
    resetPuzzle();
    updateMap();
    return multipleLineResponse(
      [
        'A dense white fog surrounds you, and you suddenly start feeling tired...',
        '',
        GAME_START_RESPONSE,
      ].concat(describeCurrentIsland())
    );
  }

  return singleLineResponse('The command you entered is not valid.');
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
  updateMap();

  return multipleLineResponse([AFTER_MOVING_RESPONSE].concat(describeCurrentIsland()));
}

function processPushCommand() {
  const currentIsland = Island.getIslandForPosition(playerPosition);
  if (!currentIsland.hasButton()) {
    return singleLineResponse('There is nothing to push on this island.');
  }

  const direction = currentIsland.getButtonDirection();
  const snakeMove = tryMoveSnake(direction);

  if (!snakeMove.result) {
    return singleLineResponse('The button buzzes loudly, as if it is rejecting you.');
  } else {
    const { previousCorner, newCorner, lastBorder } = snakeMove;

    if (newCorner.isInitialSnakePosition()) {
      if (validateSnake()) {
        gameWon = true;
        updateMap();

        document.getElementById('command-container').remove();
        window.getSelection?.().empty?.(); // Deselect page text

        return [
          createResponseTextLine('The snake slithers, as its head links with its tail.'),
          createResponseTextLine('Congratulations, you have completed the puzzle!'),
          gameWinMapElement(),
        ];
      }

      resetPuzzle();
      updateMap();
      return multipleLineResponse(
        [
          'You hear a loud hiss. Something is wrong.',
          'A dense white fog surrounds you, and you suddenly start feeling tired...',
          '',
          GAME_START_RESPONSE,
        ].concat(describeCurrentIsland())
      );
    } else {
      updateMap();
      return snakeMovementResponse(previousCorner, newCorner, lastBorder, direction);
    }
  }
}

function tryMoveSnake(direction) {
  const currentCorner = Corner.getCornerForPosition(snakePosition);

  const newCorner = currentCorner.getCorner(direction);
  if (!newCorner) {
    return { result: false };
  }
  if (newCorner.getVisitedBySnake() && (snakePath.length <= 1 || !newCorner.isInitialSnakePosition())) {
    return { result: false };
  }

  const border = currentCorner.getBorder(direction);
  if (border.getIsLava()) {
    return { result: false };
  }

  newCorner.setVisitedBySnake();
  border.setVisitedBySnake();

  snakePath.push({
    border,
    corner: newCorner,
    direction,
    previousSnakePosition: {
      row: snakePosition.row,
      column: snakePosition.column,
    },
  });

  const vector = DIRECTION_VECTORS[direction];
  snakePosition.row += vector.row;
  snakePosition.column += vector.column;

  return {
    result: true,
    previousCorner: currentCorner,
    newCorner,
    lastBorder: border,
  };
}

function snakeMovementResponse(previousCorner, newCorner, lastBorder, snakeDirection) {
  const currentIsland = Island.getIslandForPosition(playerPosition);

  let previousCornerDirection = null;
  let newCornerDirection = null;
  let lastBorderDirection = null;
  let exitingBurrow = false;
  let anySnakeBodyBorders = false;
  let lastBorderBridgeDestroyed = false;

  ALL_DIRECTIONS.forEach((direction) => {
    const border = currentIsland.getBorder(direction);
    const newIsland = currentIsland.getIsland(direction);

    if (border === lastBorder) {
      lastBorderDirection = direction;
      if (newIsland && !border.getIsIronBridge() && !border.getNoBridge()) {
        lastBorderBridgeDestroyed = true;
      }
    }
    if (border.getVisitedBySnake()) {
      anySnakeBodyBorders = true;
    }
  });

  ALL_CORNER_DIRECTIONS.forEach((cornerDirection) => {
    const corner = currentIsland.getCorner(cornerDirection);
    if (corner === previousCorner) {
      previousCornerDirection = cornerDirection;
      if (corner.isInitialSnakePosition()) {
        exitingBurrow = true;
      }
    }
    if (corner === newCorner) {
      newCornerDirection = cornerDirection;
    }
  });

  if (previousCornerDirection === null && newCornerDirection === null) {
    if (anySnakeBodyBorders) {
      return singleLineResponse(`The ${withColor('giant snake', 'green')} moves forward, as its body still fills the moat. The snake's head is too far away for you to see.`)
    }

    return singleLineResponse('You hear something move in the distance.');
  }
  if (previousCornerDirection === null && newCornerDirection !== null) {
    if (anySnakeBodyBorders) {
      return singleLineResponse(
        `The ${withColor('giant snake', 'green')} moves forward, as its body still fills the moat. The snake's head moves through a moat in the distance, ` +
        `heading ${snakeDirection} until it stops at the ${newCornerDirection} corner of the island you are on.`
      );
    }

    return singleLineResponse(
      `A ${withColor('giant snake', 'green')} moves through a moat in the distance, heading ${snakeDirection} until it stops at ` +
      `the ${newCornerDirection} corner of the island you are on.`
    );
  }
  if (previousCornerDirection !== null && newCornerDirection === null) {
    if (anySnakeBodyBorders) {
      return singleLineResponse(
        `The ${withColor('giant snake', 'green')} moves away from the ${previousCornerDirection} corner of the island and heads ${snakeDirection}, as its body still fills the moat.`
      );
    }

    return singleLineResponse(
      `The ${withColor('giant snake', 'green')} moves away from the ${previousCornerDirection} corner of the island and heads ${snakeDirection}.`
    );
  }
  if (previousCornerDirection !== null && newCornerDirection !== null) {
    const snakeBodyMoatLine = `The snake's body fills the moat to the ${lastBorderDirection} of the island${lastBorderBridgeDestroyed ? `, destroying the ${withColor('rope bridge', 'brown')} that was there before.` : '.'}`;

    if (exitingBurrow) {
      return singleLineResponse(
        `The ${withColor('giant snake', 'green')} emerges from the burrow, moving through the moat from the ${previousCornerDirection} corner to the ${newCornerDirection} corner of the island. ` +
        snakeBodyMoatLine
      )
    }

    return singleLineResponse(
      `The ${withColor('giant snake', 'green')} moves through the moat from the ${previousCornerDirection} corner to the ${newCornerDirection} corner of the island. ` +
      snakeBodyMoatLine
    );
  }
  throw `Invalid snake movement: ${previousCornerDirection}, ${newCornerDirection}, ${lastBorderDirection}, ${snakeDirection}`;
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

function sudokuPuzzleLinkElement(linkText) {
  const element = document.createElement('a');
  element.className = 'bold-text';
  element.href = 'https://tinyurl.com/2t2w6ee5';
  element.target = '_blank';
  element.innerText = linkText;
  return element;
}

function processTalkCommand() {
  const currentIsland = Island.getIslandForPosition(playerPosition);
  if (!currentIsland.getHasHamster()) {
    return singleLineResponse('There is no one to talk to on this island.');
  }

  return [
    createResponseTextLine(
      '"The stone tablet had a puzzle on it, before it was destroyed. ' +
      'I remember the puzzle perfectly, but I was never able to figure out the solution. ' +
      'The tablet said that the digits 1-6 need to be placed once each in every row, column, and box. ' +
      'Also, neighboring digits on a gray line must be at least 3 apart.'
    ),
    createResponseTextLine(''),
    createResponseTextLine(
      'I tried solving the puzzle with those rules, but I ended up with two solutions. ' +
      `The puzzle has some letters in it, and I've seen the same letters ${withColor('somewhere else', 'orange')}, but I can't remember where. ` +
      `Perhaps if you ${withBold('assign a value to each letter')} based on the numbers you get from each of the solutions, ` +
      'you can determine which of the solutions is correct?'
    ),
    createResponseTextLine(''),
    createResponseTextLine(
      (
        'Please '
      ),
      'span',
    ),
    sudokuPuzzleLinkElement('try the puzzle yourself'),
    createResponseTextLine(' and help me solve this mystery!"', 'span'),
  ]
}

function processUndoCommand() {
  if (snakePath.length === 0) {
    return singleLineResponse('The snake has not moved yet.');
  }

  const {
    corner,
    border,
    direction,
    previousSnakePosition,
  } = snakePath.pop();

  corner.undoVisitedBySnake();
  border.undoVisitedBySnake();

  const buttonLocation = BUTTON_LOCATIONS[direction];
  const isTeleported = playerPosition.row !== buttonLocation.row || playerPosition.column !== buttonLocation.column;
  if (isTeleported) {
    playerPosition.row = buttonLocation.row;
    playerPosition.column = buttonLocation.column;
  }

  snakePosition.row = previousSnakePosition.row;
  snakePosition.column = previousSnakePosition.column;

  updateMap();

  return multipleLineResponse(
    [
      `There is a sudden white flash. ${isTeleported ? 'You notice that you are now standing on a different island.' : ''} ` +
      'You feel as though you have traveled back in time.',
    ].concat(describeCurrentIsland())
  );
}

function processMapCommand() {
  if (mapData !== null) {
    document.getElementById('main-map').remove();
    mapData = null;
    return singleLineResponse('Map disabled.');
  } else {
    mapData = createMapElement();

    mapData.mapTable.id = 'main-map';
    document.getElementById('response-text-container').appendChild(mapData.mapTable);
    updateMap();

    return singleLineResponse('Map enabled.');
  }
}

function updateMap() {
  if (mapData !== null) {
    updateMapElement(mapData.mapTable, mapData.tableArray, mapData.snakePositionCircle, false);
  }
}

const MAP_TABLE_CELL_SIZE = 60;
const SNAKE_POSITION_CIRCLE_SIZE = 20;

function gameWinMapElement() {
  const { mapTable, tableArray, snakePositionCircle } = createMapElement();
  updateMapElement(mapTable, tableArray, snakePositionCircle, true);
  return mapTable;
}

function createMapElement() {
  const mapTable = document.createElement('table');
  addClass(mapTable, 'map-table');

  const tableArray = [];

  const mapTableBody = document.createElement('tbody');
  mapTable.appendChild(mapTableBody);
  
  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    const rowElement = document.createElement('tr');
    mapTableBody.appendChild(rowElement);
    tableArray.push([]);

    for (let column = 0; column < GRID_WIDTH; column += 1) {
      const columnElement = document.createElement('td');
      rowElement.appendChild(columnElement);

      const cellContent = document.createElement('div');
      addClass(cellContent, 'map-table-cell-inner');
      columnElement.appendChild(cellContent);

      tableArray[row].push({ columnElement, cellContent });
    }
  }

  const snakePositionCircle = document.createElement('div');
  addClass(snakePositionCircle, 'snake-position');
  mapTable.appendChild(snakePositionCircle);

  return { mapTable, tableArray, snakePositionCircle };
}

function updateMapElement(mapTable, tableArray, snakePositionCircle, isGameWinMap) {
  if (isGameWinMap) {
    addClass(mapTable, 'game-win-map');
  }

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    for (let column = 0; column < GRID_WIDTH; column += 1) {
      const { columnElement, cellContent } = tableArray[row][column];

      // Reset table elements
      columnElement.className = 'map-table-cell';
      while (cellContent.firstChild) {
        cellContent.removeChild(cellContent.firstChild);
      }

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

      if (!isGameWinMap && row === playerPosition.row && column === playerPosition.column) {
        const positionMarker = document.createElement('div');
        positionMarker.innerText = '\u2605';
        addClass(positionMarker, 'position-marker');
        cellContent.appendChild(positionMarker);
      }

      if (isGameWinMap && island.hasRequiredSnakeVisits()) {
        const requiredSnakeVisits = document.createElement('div');
        requiredSnakeVisits.innerText = island.getRequiredSnakeVisits();
        addClass(requiredSnakeVisits, 'required-snake-visits');
        cellContent.appendChild(requiredSnakeVisits);
      }
    }
  }

  if (isGameWinMap) {
    snakePositionCircle.style.display = 'none';
  } else {
    snakePositionCircle.style.left = `${snakePosition.column * MAP_TABLE_CELL_SIZE - SNAKE_POSITION_CIRCLE_SIZE / 2}px`;
    snakePositionCircle.style.top = `${snakePosition.row * MAP_TABLE_CELL_SIZE - SNAKE_POSITION_CIRCLE_SIZE / 2}px`;
  }
}

function formatDirections(directions, conjunction = 'and', withQuotes = false) {
  if (withQuotes) {
    directions = directions.map((direction) => `'${withBold(direction)}'`);
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
  let ironBridgeAndSnakeDirs = [];
  const lavaDirsWithBridge = [];
  const lavaDirsNoBridge = [];
  let snakeBodyDirs = [];
  let destroyedBridgeDirs = [];
  const noBridgeDirs = [];

  ALL_DIRECTIONS.forEach((direction) => {
    const border = currentIsland.getBorder(direction);
    const newIsland = currentIsland.getIsland(direction);

    if (border.getVisitedBySnake()) {
      snakeBodyDirs.push(direction);
    }

    if (newIsland) {
      islandDirs.push(direction);
      if (border.getIsIronBridge() || (!border.getVisitedBySnake() && !border.getNoBridge())) {
        moveDirs.push(direction);
      }
      if (!border.getIsIronBridge() && !border.getVisitedBySnake() && !border.getNoBridge()) {
        ropeBridgeDirs.push(direction);
      }
      if (border.getIsIronBridge()) {
        if (border.getVisitedBySnake()) {
          ironBridgeAndSnakeDirs.push(direction);
        } else {
          ironBridgeDirs.push(direction);
        }
      }
      if (border.getIsLava()) {
        if (border.getIsIronBridge() || (!border.getVisitedBySnake() && !border.getNoBridge())) {
          lavaDirsWithBridge.push(direction);
        } else {
          lavaDirsNoBridge.push(direction);
        }
      }
      if (border.getVisitedBySnake() && !border.getIsIronBridge() && !border.getNoBridge()) {
        destroyedBridgeDirs.push(direction);
      }
      if (border.getNoBridge()) {
        noBridgeDirs.push(direction);
      }
    }
  });

  const isSnakeBodyVisible = snakeBodyDirs.length > 0;

  // If all bridges are destroyed by the snake, we combine the responses.
  let destroyedBridgeAndSnakeDirs;
  if (snakeBodyDirs.length === destroyedBridgeDirs.length) {
    destroyedBridgeAndSnakeDirs = snakeBodyDirs;
    snakeBodyDirs = [];
    destroyedBridgeDirs = [];
  } else {
    destroyedBridgeAndSnakeDirs = [];
  }

  // If the only bridges under the snake are iron bridges, we combine the responses.
  let snakeWithIronBridgeOnlyDirs;
  if (ironBridgeAndSnakeDirs.length === snakeBodyDirs.length) {
    snakeWithIronBridgeOnlyDirs = ironBridgeAndSnakeDirs;
    ironBridgeAndSnakeDirs = [];
    snakeBodyDirs = [];
  } else {
    snakeWithIronBridgeOnlyDirs = [];
  }

  let snakeHeadDirection = null;
  let snakeHeadAtBurrowDirection = null;
  let snakeBodyAtBurrowDirection = null;
  let isSnakeHeadVisible = false;
  ALL_CORNER_DIRECTIONS.forEach((cornerDirection) => {
    const corner = currentIsland.getCorner(cornerDirection);

    if (corner.hasSnakeHead()) {
      isSnakeHeadVisible = true;

      if (corner.isInitialSnakePosition()) {
        snakeHeadAtBurrowDirection = cornerDirection;
      } else {
        snakeHeadDirection = cornerDirection;
      }
    } else if (corner.isInitialSnakePosition()) {
      snakeBodyAtBurrowDirection = cornerDirection;
    }
  });

  const snakeBodyDescr = isSnakeHeadVisible ? `the ${withColor("snake's body", 'green')}` : `a ${withColor("giant snake's body", 'green')}`;
  const snakeBodyAtBurrowDescr = isSnakeBodyVisible ? `the ${withColor("snake's body", 'green')}` : `a ${withColor("giant snake's body", 'green')}`;
  const eggDescr = currentIsland.hasButton() ? `At the foot of the pedestal, there is a large ${withColor('snake egg', 'orange')}` : `In the middle of the island, there is a large ${withColor('snake egg', 'orange')} on the ground`

  islandLines = [
    currentIsland.hasButton() ? `On a pedestal in the middle of the island, there is a ${withColor('button', 'purple')} with the letter ${withColor(buttonLetter(currentIsland.getButtonDirection()), 'purple')} on it. Type '${withBold('push')}' to push the button.` : null,
    currentIsland.hasEgg() ? `${eggDescr} with the letter ${withColor(currentIsland.getEggLetter(), 'orange')} engraved on it.` : null,
    currentIsland.hasHintText() ? `In the middle of the island, there is a ${withColor('stone tablet', 'indigo')} that reads: "${currentIsland.getHintText()}."` : null,
    currentIsland.getHasHamster() ? HAMSTER_INFO : null,
  ].filter((line) => line !== null);

  borderLines = [
    islandDirs.length > 0 ? `There ${pluralize('is another island', 'are other islands', islandDirs)} to the ${formatDirections(islandDirs)}.` : null,
    ropeBridgeDirs.length > 0 ? `To the ${formatDirections(ropeBridgeDirs)}, there ${pluralize('is a', 'are', ropeBridgeDirs)} ${withColor(`flimsy rope ${pluralize('bridge', 'bridges', ropeBridgeDirs)}`, 'brown')}.` : null,
    ironBridgeDirs.length > 0 ? (
      `To the ${formatDirections(ironBridgeDirs)}, there ${pluralize('is an', 'are', ironBridgeDirs)} ${withColor(`arched iron ${pluralize('bridge', 'bridges', ironBridgeDirs)}`, 'blue')}. ` +
      `A giant creature could pass under ${pluralize('this bridge', 'these bridges', ironBridgeDirs)} without destroying ${pluralize('it', 'them', ironBridgeDirs)}.`
    ) : null,
    lavaDirsWithBridge.length > 0 ? `To the ${formatDirections(lavaDirsWithBridge)}, under the bridge, the moat is filled with ${withColor('lava', 'red')}. Not even the bravest of creatures would dare pass through it.` : null,
    lavaDirsNoBridge.length > 0 ? `To the ${formatDirections(lavaDirsNoBridge)}, the moat is filled with ${withColor('lava', 'red')}. Not even the bravest of creatures would dare pass through it.` : null,
    snakeHeadAtBurrowDirection ? `To the ${snakeHeadAtBurrowDirection}, a ${withColor("giant snake's head", 'green')} is peeking out of a large ${withColor('burrow', 'green')} in the moat.` : null,
    snakeHeadDirection ? `To the ${snakeHeadDirection}, a ${withColor("giant snake's head", 'green')} is in the moat.` : null,
    destroyedBridgeAndSnakeDirs.length > 0 ? `To the ${formatDirections(destroyedBridgeAndSnakeDirs)}, ${snakeBodyDescr} fills the moat, and the ${pluralize(`${withColor('rope bridge', 'brown')} has been`, `${withColor('rope bridges', 'brown')} have been`, destroyedBridgeAndSnakeDirs)} destroyed.` : null,
    snakeBodyDirs.length > 0 ? `To the ${formatDirections(snakeBodyDirs)}, ${snakeBodyDescr} fills the moat.` : null,
    snakeWithIronBridgeOnlyDirs.length > 0 ? (
      `To the ${formatDirections(snakeWithIronBridgeOnlyDirs)}, ${snakeBodyDescr} fills the moat. Above the snake's body, there ${pluralize('is an', 'are', snakeWithIronBridgeOnlyDirs)} ${withColor(`arched iron ${pluralize('bridge', 'bridges', snakeWithIronBridgeOnlyDirs)}`, 'blue')}.`
    ) : null,
    ironBridgeAndSnakeDirs.length > 0 ? (
      `To the ${formatDirections(ironBridgeAndSnakeDirs)}, above the snake's body, there ${pluralize('is an', 'are', ironBridgeAndSnakeDirs)} ${withColor(`arched iron ${pluralize('bridge', 'bridges', ironBridgeAndSnakeDirs)}`, 'blue')}.`
    ) : null,
    snakeBodyAtBurrowDirection ? `To the ${snakeBodyAtBurrowDirection}, ${snakeBodyAtBurrowDescr} emerges from a large ${withColor('burrow', 'green')} in the moat.` : null,
    destroyedBridgeDirs.length > 0 ? `To the ${formatDirections(destroyedBridgeDirs)}, the ${pluralize(`${withColor('rope bridge', 'brown')} has been`, `${withColor('rope bridges', 'brown')} have been`, destroyedBridgeDirs)} destroyed.` : null,
    noBridgeDirs.length > 0 ? `There ${pluralize(`is ${withColor('no bridge', 'pink')}`, `are ${withColor('no bridges', 'pink')}`, noBridgeDirs)} to the ${formatDirections(noBridgeDirs, 'or')}.` : null,
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
    moveDirs.length > 0 ? `Type ${formatDirections(moveDirs, 'or', true)} to move in that direction.` : "You cannot move. Type 'restart' to restart the game.",
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

function createResponseTextLine(text, elementType = 'div') {
  const textElement = document.createElement(elementType);
  textElement.innerHTML = text;

  if (!text) {
    addClass(textElement, 'empty-line');
  }

  return textElement;
}

function withColor(text, color) {
  return `<span class="${color}-text bold-text">${text}</span>`;
}

function withBold(text) {
  return `<span class="bold-text">${text}</span>`;
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
