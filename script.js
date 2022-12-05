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

const islands = [];
const corners = [];
const horizontalBorders = [];
const verticalBorders = [];

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
}

class Corner {
    constructor(row, column) {
        this.row = row;
        this.column = column;
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
}

class Border {
    constructor(row, column, type) {
        this.row = row;
        this.column = column;
        this.type = type;
    }
}

function fillArrays() {
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
}

// Fill all arrays when page is loaded
fillArrays();

function sendCommand(event) {
    event.preventDefault();


    const commandInput = document.getElementById('command-input');
    const command = commandInput.value;
    commandInput.value = '';

    if (command) {
        processCommand(command);
    }
}

function processCommand(command) {
    addResponse([
        createResponseTextLine('This is the first line'),
        createResponseTextLine('This is the second line'),
        createResponseTextLine('This is the third line'),
        createResponseTextLine(command),
    ]);
}

function createResponseTextLine(text) {
    const textElement = document.createElement('div');
    textElement.innerText = text;
    return textElement;
}

function createResponseLineElement(childElements) {
    const responseLine = document.createElement('div');
    responseLine.className = 'response-line';

    for (let i = 0; i < childElements.length; i++) {
        responseLine.appendChild(childElements[i]);
    }

    return responseLine;
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
