// Necessary class types are declared at the top, game runtime processes are laid out towards the bottom.

// This class controls the player's stats for the display and (maybe) for a future back-end 
// Goal gets it's own class in case of later multiplayer version, where we'd have multiple goals onscreen.
class ScoreGoalRecord {
    constructor(goalElement,recordElement,scoreElement) {
        this.goalElement = goalElement;
        this.recordElement = recordElement;
        this.scoreElement = scoreElement;
        this.reset();
    }

    reset() {
        this.goal = 1;
        this.score = 0;
        // This method is called at the start of a new game and during a minute refresh. 
        if (newGame){
            this.record = 0;
        }
        this.updateRecordDisplay();
    }

    incrementGoal() {this.goal++;}

    incrementScore() {this.score++;}

    changeRecord() {this.record = this.score;}

    updateGoalDisplay() {this.goalElement.innerHTML = `${this.goal}`;}

    updateRecordDisplay() {this.recordElement.innerHTML = `${this.record}`;}

    updateScoreDisplay() {this.scoreElement.innerHTML = `${this.score}`;}
}

// Declaration newGame variable ensures stats get reset.
newGame = true;
const goalElement = document.querySelector('[data-goal]');
const recordElement = document.querySelector('[data-record]');
const scoreElement = document.querySelector('[data-score]');
const stats = new ScoreGoalRecord(goalElement,recordElement,scoreElement);
newGame = false

// Controls the calculator mechanism.
class Calculator {
    constructor(currentOperandTextElement){
        this.currentOperandTextElement = currentOperandTextElement;
        this.clear()
    }

    // "Full" means that currentOperand, previousOperand and operation all have data inside.
    // If the calculator is full, operation buttons act as implicit equals.
    checkFullness() {
        this.isFull = (this.currentOperand !== '' && this.previousOperand !== '' && this.operation !== undefined);
    }

    // Clear is not to be confused with delete.
    clear() {
        this.currentOperand = '';
        this.previousOperand = '';
        this.operation = undefined;
    }


    // NOTE: Delete can be used to fudge answers without doing any real math.
    // For example: 9 * 6 = 54 --[DEL]--> 5
    delete() {
        this.currentOperand = this.currentOperand.toString().slice(0,-1)
    }

    // There's an example of this as well TODO: Put an example here.
    appendNumber(number) {
        if (isAnswered) {
            this.currentOperand = number;
        }
        else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    // This used to do other things as well, and that turned out bad.
    chooseOperation(operation) {
        // console.log(`${operation} operation chosen.`);
            this.operation = operation;
    }

    // The part that does the actual math. Maybe change this in the future to make it easier to add new operations.
    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const curr = parseFloat(this.currentOperand);
        if (isNaN(curr) || curr ===- '') return
        else if (isNaN(prev) || prev === '') {
            return curr;
        }
        switch (this.operation) {
            case '+':
                computation = prev + curr;
                break;
            case '-':
                computation = prev - curr;
                break;
            case '*':
                computation = prev * curr;
                break;
            case '÷':
                computation = prev / curr;
                break;
            default:
                return;
        }
        this.operation = undefined;
        return computation;
    }

    // The actual "equals" button is "submit-equals" so you can't press equals just to see your answer without submitting.
    // The 'next' argument being like this is important for the operation buttons being implicit "equals".
    pushOperands(next='') {
        this.previousOperand = this.currentOperand;
        this.currentOperand = next;
    }

    // The 'message' argument is this way for the same reason.
    updateDisplay(message=this.currentOperand) {
        this.currentOperandTextElement.innerHTML = message;
    }
}

// When your minute is up...
function minuteRefresh() {
    // Checking if a new record has been set.
    if (stats.score > stats.record) {
        // console.log('new record!');
        stats.changeRecord();
        stats.updateRecordDisplay();
    }

    stats.updateGoalDisplay();
    // stats.updateScoreDisplay();
    stats.reset();

    calculator.clear();
    calculator.updateDisplay();
}
const updateTime = (isMilitary=true) => {

    // Get the time
    function getTime() {
        var time = new Date();
        let hours = time.getHours();
        let minutes = time.getMinutes();
        let seconds = time.getSeconds();
    
        return [hours,minutes,seconds]; // Time comes in an array which is deconstructed.
    }
    let time = getTime();
    let hours = time[0];
    let minutes = time[1];
    let seconds = time[2];

    // Convert to non-military time if user requests
    if (!isMilitary) {
        hours = hours % 12;
    }


    // Makes sure clock will not display 9:5 at 9:05, etc.
    function zeroify(number) {
        if (number < 10) {
            number = `0${number}`;
        }
        return number;
    }
    seconds = zeroify(seconds);
    minutes = zeroify(minutes);
    hours = zeroify(hours);
    

    // Format and write to document.
    let clockString = `${hours}${minutes}`;
    // console.log(clockString)
    for (let i = 0; i < 4; i++) {
        document.getElementsByClassName('clockNum')[i].innerHTML = clockString[i];
    }
    document.getElementById("seconds").innerHTML = seconds;
    // If seconds are at 0, tell the goal to reset.
    if (seconds == '00') {
        minuteRefresh();
    }
}

// This keeps track of the last 100 calculator keystrokes, it used to safeguard against pressing
// two operand buttons back-to-back, but it serves no immediate purpose right now. Still could be useful down the road.
class Keystrokes {
    constructor() {
        this.strokes = [];
    }

    append(char) {
        this.strokes.push(char);
        
        // This only keeps track of the last 100 keystrokes.
        if (this.strokes.length > 100) {
            this.strokes = this.strokes.slice(0,100);
        }

        // Easier to do here than in all the individual button-press functions.
        calculator.checkFullness()
    }

    // Goes to the last place a player began to attempt an answer
    // and returns the string of keystrokes.
    lastAttempt() {
        let i = this.strokes.lastIndexOf("SUB=");
        let j = this.strokes.lastIndexOf("AC");
        let k = this.strokes.lastIndexOf("DEL");

        return this.strokes.slice(Math.max(i,j,k) + 1,-1)
    }

    last() {
        return this.array[0];
    }
}
const keystrokes = new Keystrokes(); 

// This is the place where calculator class types get connected to the UI
// vvvvvvvvv

// Calculator buttons.
const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operation]');

// Changes the look of the operation buttons so the player knows which operation they're using.
function makeOperationsUnused() {
    operationButtons.forEach(button => {
        button.classList.remove('op-inuse');
        button.classList.add('calcButton:hover');
        button.classList.add('calcButton:active');
    })
}
// The same but for the numbers TODO: This doesn't show on-screen.
function makeNumbersUnused () {
    numberButtons.forEach(button => {
        button.classList.remove('num-inuse');
        button.classList.add('clockNum:active');
        button.classList.add('clockNum:hover');
    })
}

// Functional buttons.
const deleteButton = document.querySelector('[data-delete]');
const allClearButton = document.querySelector('[data-all-clear]');
const submitEqualsButton = document.querySelector('[data-submit-equals]');

const currentOperandTextElement = document.querySelector('[data-display]');
// const previousOperandTextElement = undefined; // Some calculators show the previous operand, to change the design this will be needed.

// ^^^^^^^^^
// End of class-types connecting to UI

const calculator = new Calculator(currentOperandTextElement);

// This is a quick-and-dirty solution to a problem further down in the code.
let isAnswered = false;
function invertIfTrue(bool) {
    // console.log(bool);
    if(bool) {bool = !bool;}
    return bool;
}

// Event listeners for all the calculator buttons
// vvvvvvvvvv

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        char = button.innerHTML;

        makeOperationsUnused();

        // Functionality
        calculator.appendNumber(char);
        isAnswered = invertIfTrue(isAnswered);
        calculator.updateDisplay();
        button.classList.add('num-inuse')
        button.classList.remove('clockNum:active');
        button.classList.remove('cloclNum:hover');
        // Record keystroke
        keystrokes.append(char);
    })
})

deleteButton.addEventListener('click', () => {
    
    // MBIP don't need to check this condition.
    if (!isAnswered) {
        calculator.delete();
        calculator.updateDisplay();
    }
    keystrokes.append('DEL');
})

allClearButton.addEventListener('click', () => {
    
    
    isAnswered = invertIfTrue(isAnswered);
    calculator.clear();
    calculator.updateDisplay();
    makeOperationsUnused();
    
    keystrokes.append('AC');
})

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        
        // TODO: See if there's a way to do this without checking the condition every time.
        if (!isAnswered) {

            // Only one operation appears selected at a time.
            makeOperationsUnused();
            
            // Operation buttons act as an implicit equals if calculator is full.
            if (calculator.isFull) {

                // Computing the answer to display.
                let answer = calculator.compute();
                message = `${answer}`;

                // Pushing the answer into the previousOperand slot
                calculator.pushOperands(next=answer)
            } else {
                message = calculator.currentOperand;
            }
            
            // Choosing operation.
            char = button.innerHTML;
            calculator.chooseOperation(char);

            calculator.pushOperands()

            calculator.updateDisplay(message=message);


            // Making everything pretty again.
            button.classList.add('op-inuse');
            button.classList.remove('calcbutton:hover');
            button.classList.remove('calcbutton:active');
            
            // Record keystroke.
            keystrokes.append(char);
        }
    })
})

submitEqualsButton.addEventListener('click', () => {
    makeOperationsUnused();

    
    let answer = calculator.compute();
    isAnswered = true;
    
    // console.log(calculator.currentOperand,stats.goalElement.innerHTML);
    // Compare calculation result with goal as numbers (not strings):
    if (answer == parseFloat(stats.goalElement.innerHTML)) {
        calculator.updateDisplay(`${answer} Accepted!`)
        calculator.clear()
        
        // Yes, it is annoying to do all this, but it should make it easier to debug in the long run :))))
        stats.incrementGoal();
        stats.incrementScore();
        stats.updateGoalDisplay();
        stats.updateScoreDisplay();
    }
    else {
        calculator.updateDisplay(`${answer} Rejected.`)
    }
    calculator.clear();
    keystrokes.append("SUB=");
})

// ^^^^^^^^^^^
// End of event listeners for Calculator buttons
