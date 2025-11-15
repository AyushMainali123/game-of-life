onmessage = function(message) {
 const {id, payload} = message.data;  

 if(id === "calculateNextStep") {
     const { rows, cols, directions, pattern } = payload;
     let newState = new Array(rows).fill(null).map(_ => new Array(cols).fill(0));
        for(let posx = 0; posx < rows; posx++) {
            for(let posy = 0; posy < cols; posy++) {
                let currentcell = pattern[posx][posy];
    
                let aliveNeighbors = 0;
                for(let [dx, dy] of directions) {
                    const newx = posx + dx;
                    const newy = posy + dy;
    
                    if(newx >= rows || newx < 0 || newy >= cols || newy < 0) continue;
                    if(pattern[newx][newy] === 1) aliveNeighbors++;
                }
    
    
                if(currentcell === 1 && (aliveNeighbors < 2 || aliveNeighbors > 3)) newState[posx][posy] = 0;
                else if (currentcell === 1 || (currentcell === 0 && aliveNeighbors === 3)) newState[posx][posy] = 1;
                else newState[posx][posy] = 0;
            }
        }
        this.postMessage({id: "calculateNextStep", data: newState});
 }

if(id === "initialize") {
    const { rows, cols } = payload;
    const state = new Array(rows).fill(null).map(_ => new Array(cols).fill(0));
    this.postMessage({id: "initialize", data: state});
}

}