

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
        this.rows = rows;
        this.cols = cols;

        this.$generation = $generation;

        this.worker.postMessage({id: "initialize", payload: {rows: this.rows, cols: this.cols}});

        this.$container.addEventListener('click', (e) => {
                const [row, col] = this.getGridCoords(e);

                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    this.pattern[row][col] = 1;
                    this.update();
                }
        });

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
            this.pattern = data;

            if(id === "initialize") {
                this.init();
            }
        }


    }

    getGridCoords(e) {
        // 1. Get coordinates relative to the canvas
        const localX = e.offsetX;
        const localY = e.offsetY;
        
        // Canvas size divided by grid dimensions
        const cellWidth = this.$container.width / this.cols;
        const cellHeight = this.$container.height / this.rows;

        // 3. Map pixels to grid indices
        // X (horizontal) maps to Column (j index)
        const col = Math.floor(localX / cellWidth);
        // Y (vertical) maps to Row (i index)
        const row = Math.floor(localY / cellHeight); 

        return [row, col];
    }
    
    init() {
        // Canvas Cell  Height, and Width
       const height = this.$container.height / this.rows;
       const width = this.$container.width / this.cols;
       const ctx = this.$container.getContext('2d');

       let x = 0, y = 0;

       for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                ctx.beginPath();
                ctx.rect(x, y, width, height);
                ctx.strokeStyle = "red";
                ctx.stroke();
                if(this.pattern[i][j]) {
                    ctx.fillStyle = "red";
                    ctx.fill();
                } 
                
                else {
                    ctx.fillStyle = "white";
                    ctx.fill();
                }

                x += width;
            }

            y += height;
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
        this.update();
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
        
        this.pattern = new Array(this.rows).fill(null).map(_ => new Array(this.cols).fill(0));
        this.generation = 0;
        this.pause();
        this.update();
    }

    updateCell(posx, posy) {
       const height = this.$container.height / this.rows;
       const width = this.$container.width / this.cols;
       const ctx = this.$container.getContext('2d');

       const x = width * posx, y = height * posy;
       ctx.clearRect(x, y, width, height);
       ctx.beginPath();
       ctx.rect(x, y, width, height);
       ctx.strokeStyle = "red";
       ctx.stroke();

       if(this.pattern[posy][posx] === 1) {
            ctx.fillStyle = "red";
            ctx.fill();
        } else {
            ctx.fillStyle = "white";
            ctx.fill();
        }
    }


    update() {

       const height = this.$container.height / this.rows;
       const width = this.$container.width / this.cols;
       const ctx = this.$container.getContext('2d');

       let x = 0, y = 0;
        ctx.clearRect(0, 0, this.$container.width, this.$container.height);
        ctx.moveTo(x, y);
        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                
                ctx.beginPath();
                ctx.rect(x, y, width, height);
                ctx.strokeStyle = "red";
                ctx.stroke();

                if(this.pattern[i][j] === 1) {
                    ctx.fillStyle = "red";
                    ctx.fill();
                } else {
                    ctx.fillStyle = "white";
                    ctx.fill();
                }

                x += width;
            }

            y += height;
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