

class GameOfLife {
    generation = 0;
    rows = 20;
    cols = 20;
    $container = null;
    $generation = null;
    intervalId = null;
    pattern = [];
    isSelecting = false;
    state = "pause";
    worker = new Worker("worker.js");
    ctx = null;
    cellwidth = 0;
    cellheight = 0;

    // 8 DIRECTIONS ALONG THE CURRENT ELEMENT
    static DIRECTIONS = [
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


    constructor($container, $generation, rows=30, cols=30) {

        this.$container = $container;
        this.ctx = this.$container.getContext('2d');
        this.rows = rows;
        this.cols = cols;
        this.cellwidth = this.$container.width / this.cols;
        this.cellheight = this.$container.height / this.rows;

        this.$generation = $generation;

        this.worker.postMessage({id: "initialize", payload: {rows: this.rows, cols: this.cols}});

        this.$container.addEventListener("mousedown", (e) => {
            this.isSelecting = true;
        });

        this.$container.addEventListener("mousemove", e => {
            if(this.isSelecting) {
                const [row, col] = this.getGridCoords(e);
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    this.pattern[row][col] = this.pattern[row][col] = 1;
                    this.updateCell(col, row);
                }

            }
        });

        this.$container.addEventListener("mouseup", (e) => {
            this.isSelecting = false;
        });
        
        this.worker.onmessage = (ev) =>  {
            const {id, data} = ev.data;
            
            if(id === "initialize") {
                this.pattern = data;
                this.init();
            }

            if(id === "calculateNextStep") {
                for(const [posx, posy, state] of data) {
                    this.pattern[posx][posy] = state;
                    this.updateCell(posy, posx);
                }
                this.$generation.textContent = this.generation;
            }
        }
    }

    getGridCoords(e) {
        const localX = e.offsetX;
        const localY = e.offsetY;
        const col = Math.floor(localX / this.cellwidth);
        const row = Math.floor(localY / this.cellheight); 

        return [row, col];
    }
    
    init() {
        let x = 0, y = 0;

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                // Fill the cell, leaving space for grid lines
                this.ctx.fillStyle = this.pattern[i][j] ? "green" : "white";
                this.ctx.fillRect(
                    x + 0.5, y + 0.5,
                    this.cellwidth - 1, this.cellheight - 1
                );

                // Draw red grid lines
                this.ctx.strokeStyle = "red";
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.cellwidth, this.cellheight);

                x += this.cellwidth;
            }
            y += this.cellheight;
            x = 0;
        }

        this.$generation.textContent = 0;
    }


    #calculateNextState() {
        this.worker.postMessage({
            id: "calculateNextStep",
            payload: {
                rows: this.rows, 
                cols: this.cols, 
                directions: GameOfLife.DIRECTIONS,
                pattern: this.pattern
            }
        });

        this.generation++;
    }

    nextGeneration() {
        this.#calculateNextState();
    }


    reset() {
        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                this.pattern[i][j] = 0;
            }
        }

        this.update();
    }

    updateRowsAndColumns(rows, cols) {
        if(rows === this.rows && cols === this.cols) return;
        this.rows = rows;
        this.cols = cols;
        this.cellwidth = this.$container.width / this.cols;
        this.cellheight = this.$container.height / this.rows;
        
        this.pattern = new Array(this.rows).fill(null).map(_ => new Array(this.cols).fill(0));
        this.generation = 0;
        this.pause();
        this.update();
    }

    updateCell(posx, posy) {
        const x = this.cellwidth * posx;
        const y = this.cellheight * posy;

        // Clear the entire cell
        this.ctx.clearRect(x, y, this.cellwidth, this.cellheight);

        // Set fill color based on pattern
        this.ctx.fillStyle = this.pattern[posy][posx] === 1 ? "green" : "white";

        // Fill the cell, leaving space for grid lines
        this.ctx.fillRect(
            x + 0.5, y + 0.5,
            this.cellwidth - 1, this.cellheight - 1
        );

        // Redraw grid lines for this cell
        this.ctx.strokeStyle = "red"; // Red grid lines
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.cellwidth, this.cellheight);
    }


    update() {
        let x = 0, y = 0;
        this.ctx.clearRect(0, 0, this.$container.width, this.$container.height);

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                // Fill the cell, leaving space for grid lines
                this.ctx.fillStyle = this.pattern[i][j] === 1 ? "green" : "white";
                this.ctx.fillRect(
                    x + 0.5, y + 0.5,
                    this.cellwidth - 1, this.cellheight - 1
                );

                // Draw red grid lines
                this.ctx.strokeStyle = "red";
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.cellwidth, this.cellheight);

                x += this.cellwidth;
            }
            y += this.cellheight;
            x = 0;
        }

        this.$generation.textContent = this.generation;
    }


    play() {
        if(this.state === "play") return;
        this.state = "play";

        let lastTime = 0;
        const interval = 500; // ms
        const loop = (currentTime) => {
            if (currentTime - lastTime >= interval) {
                lastTime = currentTime;
                this.nextGeneration()
            }
            this.intervalId = requestAnimationFrame(loop);
        }
        this.intervalId = requestAnimationFrame(loop);

    }

    pause() {
        this.state = "pause";
        cancelAnimationFrame(this.intervalId);
    }

}


async function  main() {    
    const container = document.querySelector("canvas");
    const generationContainer = document.querySelector("[data-generation]");
    const playButton = document.querySelector("[data-play]");
    const pauseButton = document.querySelector("[data-pause]");

    const rowsInput = document.querySelector("#rows-input");
    const colsInput = document.querySelector("#cols-input");
    const restartGameButton = document.querySelector("[data-restart-game]");

    const resizeCanvas = () => {
        const wrapper = document.getElementById('canvas-wrapper');
        container.width = wrapper.clientWidth;
        container.height = wrapper.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);


    const game = new GameOfLife(container, generationContainer, Number(rowsInput.value), Number(colsInput.value));
    window.addEventListener('resize', () => game.update());
    playButton.addEventListener('click', () => game.play());
    pauseButton.addEventListener('click', () => game.pause());

    restartGameButton.addEventListener("click", e => {
        const rowValue = Number(rowsInput.value);
        const colValue = Number(colsInput.value);

        if(rowValue < Number(rowsInput.ariaValueMin) || rowValue > Number(rowsInput.ariaValueMax)) {
            alert(`Rows must be between ${rowsInput.ariaValueMin} and ${rowsInput.ariaValueMax}`);
            return;
        }

        if(colValue < Number(colsInput.ariaValueMin) || colValue > Number(colsInput.ariaValueMax)) {
            alert(`Columns must be between ${colsInput.ariaValueMin} and ${colsInput.ariaValueMax}`);
            return;
        }

        game.updateRowsAndColumns(rowValue, colValue);
    }) 
}



main();