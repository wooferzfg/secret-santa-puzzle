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
