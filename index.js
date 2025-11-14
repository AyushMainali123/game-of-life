

class GameOfLife {
    generation = 0;
    $container = null;
    $generation = null;
    cellSize = 10;
    gameState = "pause";
    intervalId = null;
    pattern = [];
    elements = [];

    constructor(pattern, $container, $generation, cellSize = 10) {
        this.$container = $container;
        this.cellSize = cellSize;
        this.$generation = $generation;
        this.pattern = pattern;
        this.init();
    }
    
    init() {
        const row = this.pattern.length, col = this.pattern[0].length;
        this.elements = new Array(row).fill(null).map(_ => col).fill(null);

        this.$container.style.gridTemplateColumns = `repeat(${col}, ${this.cellSize}px)`;
        this.$container.style.gridTemplateRows = `repeat(${row}, ${this.cellSize}px)`;

        
        
        for(let i = 0; i < row; i++) {
            for(let j = 0; j < col; j++) {
                const element = document.createElement("button");
                element.dataset.row = i;
                element.dataset.col = j;

                element.classList.add("cell");
                if(this.pattern[i][j] === 1) element.classList.add("alive");
                else element.classList.add("dead");

                this.$container.appendChild(element);
            }

            this.$generation.textContent = this.generation;
        }


        this.$container.addEventListener("click", (ev) => {
            const target = ev.target;
            if(target.tagName === "BUTTON") {
                const row = Number(target.dataset.row);
                const col = Number(target.dataset.col);

                this.pattern[row][col] = 1;
            }

            this.update();
        })
    }

    nextGeneration() {

        // 8 DIRECTIONS ALONG THE CURRENT ELEMENT
        const DIRECTIONS = [
            // TOP
            [-1, 0],

            // BOTTOM
            [1, 0],

            // LEFT
            [0, -1],

            // RIGHT
            [0, 1],

            // TOP LEFT
            [-1, -1],

            // TOP RIGHT
            [-1, 1],

            // BOTTOM LEFT
            [1, -1],

            // BOTTOM RIGHT
            [1, 1]
        ];

        const newState = new Array(this.pattern.length).fill(null).map(_ => new Array(this.pattern[0].length).fill(-1));

        for(let posx = 0; posx < this.pattern.length; posx++) {
            for(let posy = 0; posy < this.pattern[0].length; posy++) {

                let currentcell = this.pattern[posx][posy];

                let aliveNeighbors = 0;
                for(let [dx, dy] of DIRECTIONS) {
                    const newx = posx + dx;
                    const newy = posy + dy;

                    if(newx >= this.pattern.length || newx < 0 || newy >= this.pattern[0].length || newy < 0) continue;
                    if(this.pattern[newx][newy] === 1) aliveNeighbors++;
                }

                if(currentcell === 1 && (aliveNeighbors < 2 || aliveNeighbors > 3)) newState[posx][posy] = 0;
                else if (currentcell === 1 || (currentcell === 0 && aliveNeighbors === 3)) newState[posx][posy] = 1;
                else newState[posx][posy] = 0;
            }
        }

        for(let posx = 0; posx < this.pattern.length; posx++) {
            for(let posy = 0; posy < this.pattern[0].length; posy++) {
                this.pattern[posx][posy] = newState[posx][posy];
            }
        }

        this.generation++;

        this.update();

    }


    update() {
        let ind = 0;
        const row = this.pattern.length, col = this.pattern[0].length;
        for(let i = 0; i < row; i++) {
            for(let j = 0; j < col; j++) {
                const child = this.$container.children[ind];
                if(this.pattern[i][j] === 0) {
                    child.classList.remove("alive");
                    child.classList.add("dead");
                } else {
                    child.classList.remove("dead");
                    child.classList.add("alive");
                }
                ind++;
            }
        }

        this.$generation.textContent = this.generation;
    }


    play() {
        this.gameState = "play";
        this.nextGeneration();
        this.intervalId = setInterval(() => this.nextGeneration(), 1000);
    }

    pause() {
        this.gameState = "pause";
        clearInterval(this.intervalId);
    }

}


async function  main() {    
    const container = document.querySelector("[data-game-of-life]");
    const generationContainer = document.querySelector("[data-generation]");
    const playButton = document.querySelector("[data-play]");
    const pauseButton = document.querySelector("[data-pause]");

    const patternsRaw = await fetch("./patterns.json");
    const patterns = await patternsRaw.json();

    const game = new GameOfLife(patterns[1].grid, container, generationContainer, 15);


    playButton.addEventListener("click", () => game.play());
    pauseButton.addEventListener("click", () => game.pause());
}



main();