import React, { Component } from "react";
import Node from "./Node/Node";
import ControlPanel from "./ControlPanel/ControlPanel";
import "./PathfindingVisualizer.css";
import { dijkstra, getNodesInShortestPathOrder } from "../algorithms/dijkstra";
import { dfs } from "../algorithms/dfs";
import { bfs } from "../algorithms/bfs";
import { aStar } from "../algorithms/aStar";
import { RecursiveDivision } from "../mazes/recursiveDiv";
// import { dijkstraOld } from "../algorithms/dijkstraOld";

let StartNodeRow = 5;
let StartNodeCol = 5;
let EndNodeRow = 15;
let EndNodeCol = 45;
let AlgorithmSelected = 0;
let weight = 0;
let speed_selected = 1;
let isAlgoRunning = 0;

export default class PathfindingVisualizer extends Component {
  constructor(props) {
    super(props); //Call Construct To Parent Class
    //props refer to the properties, special symbol. Used for passing data to one component to another
    this.state = {
      grid: [],
      GridRowSize: 21,
      GridColSize: 60,
      startNodeChange: false,
      endNodeChange: false,
      mouseIsPressed: false,
      wallNodeChange: false,
      addingStations: false,
      stationsPresent: true,
      addingWeights: 0,
    };
  }

  // componentDidMount() is invoked immediately after a component is mounted (inserted into the tree).
  // Initialization that requires DOM nodes should go here.
  componentDidMount() {
    const grid = initializeGrid(this.state.GridRowSize, this.state.GridColSize);
    this.setState({ grid: grid });
  }

  changeState = (
    row,
    col,
    isFinish,
    isStart,
    isWall,
    extraClassName,
    isStation = false,
    weight = 0
  ) => {
    const node = this.state.grid[row][col];
    node.isFinish = isFinish;
    node.isStart = isStart;
    node.isWall = isWall;
    node.isStation = isStation;
    node.isVisited = false;
    node.distance = Infinity;
    node.previousNode = null;
    if (weight) node.weight = weight;
    const element = document.getElementById(`node-${node.row}-${node.col}`);
    const prevClassName = element.className;
    if (weight > 1) {
      extraClassName = `${extraClassName}-${weight}`;
      //console.log(extraClassName);
    } else if (weight === 1) {
      extraClassName = "";
    } else if (weight === 0 && node.weight > 1) {
      extraClassName = `${prevClassName} ${extraClassName}`;
    }
    element.className = `node ${extraClassName}`;
    element.isFinish = isFinish;
    element.isStart = isStart;
    element.isWall = isWall;
    element.isStation = isStation;
    element.extraClassName = extraClassName;
    return;
  };

  handleMouseDown(row, col) {
    //console.log("Mouse Down", row, col);
    if (isAlgoRunning === 1) return;
    const node = this.state.grid[row][col];
    if (node.isStart && !this.addingWeights && !this.addingStations) {
      this.startNodeChange = true;
    } else if (node.isFinish && !this.addingWeights && !this.addingStations) {
      this.endNodeChange = true;
    } else if (
      !node.isFinish &&
      !node.isStart &&
      !node.isStation &&
      !node.isWall &&
      this.addingWeights === 1
    ) {
      this.addingWeights = 2;
      this.changeState(
        row,
        col,
        false,
        false,
        false,
        "node-weight",
        false,
        weight
      );
      console.log("Adding Weights");
    } else if (
      !node.isFinish &&
      !node.isStart &&
      !node.isStation &&
      !node.isWall &&
      this.addingStations === true
    ) {
      this.stationsPresent = true;
      this.changeState(row, col, false, false, false, "node-station", true);
    } else {
      console.log("Adding Walls");
      this.wallNodeChange = true;
      const node = this.state.grid[row][col];
      let className = "node-wall";
      if (node.isWall) className = "";
      this.changeState(row, col, false, false, !node.isWall, className);
    }
  }

  handleMouseEnter(row, col) {
    if (isAlgoRunning === 1) return;
    const node = this.state.grid[row][col];
    if (this.startNodeChange === true && node.isWall === false) {
      this.changeState(row, col, false, true, false, "node-start");
      StartNodeRow = row;
      StartNodeCol = col;
    } else if (this.endNodeChange === true && node.isWall === false) {
      this.changeState(row, col, true, false, false, "node-finish");
      EndNodeRow = row;
      EndNodeCol = col;
    } else if (
      !node.isFinish &&
      !node.isStart &&
      !node.isStation &&
      !node.isWall &&
      this.addingWeights === 2
    ) {
      this.changeState(
        row,
        col,
        false,
        false,
        false,
        "node-weight",
        false,
        weight
      );
    } else if (
      !node.isFinish &&
      !node.isStart &&
      this.wallNodeChange === true
    ) {
      let className = "node-wall";
      if (node.isWall) className = "";
      this.changeState(row, col, false, false, !node.isWall, className);
    }
  }
  handleMouseLeave(row, col) {
    if (isAlgoRunning === 1) return;
    console.log(StartNodeRow, StartNodeCol);
    const node = this.state.grid[row][col];
    if (this.startNodeChange === true && node.isWall === false) {
      if (row === EndNodeRow && col === EndNodeCol) {
        this.changeState(row, col, true, true, false, "node-finish");
        StartNodeRow = row;
        StartNodeCol = col;
      } else {
        this.changeState(row, col, false, false, false, "node ");
      }
    }

    if (this.endNodeChange === true && node.isWall === false) {
      if (row === StartNodeRow && col === StartNodeCol) {
        this.changeState(row, col, true, true, false, "node-start");
        EndNodeRow = row;
        EndNodeCol = col;
      } else {
        this.changeState(row, col, false, false, false, "node ");
      }
    }
  }

  handleMouseUp(row, col) {
    if (isAlgoRunning === 1) return;
    if (this.startNodeChange === true) {
      this.startNodeChange = false;
      // In case up node is a wall
      this.changeState(row, col, false, true, false, "node-start");
      StartNodeRow = row;
      StartNodeCol = col;
    } else if (this.endNodeChange === true) {
      this.endNodeChange = false;
      // In case up node is a wall
      this.changeState(row, col, true, false, false, "node-finish");
      EndNodeRow = row;
      EndNodeCol = col;
    } else if (this.wallNodeChange === true) {
      this.wallNodeChange = false;
    } else if (this.addingWeights === 2) {
      this.addingWeights = 0;
    } else if (
      StartNodeRow !== row &&
      StartNodeCol !== col &&
      StartNodeRow !== row &&
      StartNodeCol !== col &&
      this.addingStations
    ) {
      this.addingStations = false;
    }
  }

  clearBoard = () => {
    if (isAlgoRunning === 1) return;
    for (let r = 0; r < this.state.GridRowSize; ++r) {
      for (let c = 0; c < this.state.GridColSize; ++c) {
        if (r === EndNodeRow && c === EndNodeCol) {
          this.changeState(r, c, true, false, false, "node-finish");
        } else if (r === StartNodeRow && c === StartNodeCol) {
          this.changeState(r, c, false, true, false, "node-start");
        } else {
          this.changeState(r, c, false, false, false, "node ");
        }
      }
    }
  };

  addStation = () => {
    this.addingStations = true;
    this.addingWeights = 0;
  };
  // Clearing the board if user wants to run algorithm again to make visited node unvisited
  removePrevForNextAlgo = () => {
    isAlgoRunning = 0;
    for (let r = 0; r < this.state.GridRowSize; ++r) {
      for (let c = 0; c < this.state.GridColSize; ++c) {
        if (r === EndNodeRow && c === EndNodeCol) {
          this.changeState(r, c, true, false, false, "node-finish");
        } else if (r === StartNodeRow && c === StartNodeCol) {
          this.changeState(r, c, false, true, false, "node-start");
        } else {
          const element = document.getElementById(`node-${r}-${c}`);
          let class_name = "node ";
          if (element.isWall === true) {
            class_name = "node-wall";
          }
          this.changeState(r, c, false, false, element.isWall, class_name);
        }
      }
    }
  };

  // We have all the visited nodes in order and the path vector just have to animate it using appropriate timing
  animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder) {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          this.animateShortestPath(nodesInShortestPathOrder);
        }, 10 * i * speed_selected);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        const element = document.getElementById(`node-${node.row}-${node.col}`);
        if (
          element.className !== "node node-start" &&
          element.className !== "node node-finish"
        ) {
          // element.className = "node node-visited";
          this.changeState(
            node.row,
            node.col,
            false,
            false,
            false,
            "node-visited"
          );
        }
      }, 10 * i * speed_selected);
    }
  }

  animateShortestPath(nodesInShortestPathOrder) {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        const element = document.getElementById(`node-${node.row}-${node.col}`);
        if (
          element.className !== "node node-start" &&
          element.className !== "node node-finish"
        ) {
          // element.className = "node node-shortest-path";
          const next_col = nodesInShortestPathOrder[i + 1].col;
          const next_row = nodesInShortestPathOrder[i + 1].row;
          let class_name = "";
          if (node.weight > 1) {
            class_name = "node-shortest-path";
          } else if (next_col === node.col && next_row === node.row + 1) {
            class_name = "node-shortest-path node-down";
          } else if (next_col === node.col && next_row === node.row - 1) {
            class_name = "node-shortest-path node-up";
          } else if (next_col === node.col - 1 && next_row === node.row) {
            class_name = "node-shortest-path node-left";
          } else if (next_col === node.col + 1 && next_row === node.row) {
            class_name = "node-shortest-path node-right";
          } else if (next_col === node.col + 1 && next_row === node.row + 1) {
            class_name = "node-shortest-path node-downright";
          } else if (next_col === node.col - 1 && next_row === node.row + 1) {
            class_name = "node-shortest-path node-downleft";
          } else if (next_col === node.col + 1 && next_row === node.row - 1) {
            class_name = "node-shortest-path node-upright";
          } else if (next_col === node.col - 1 && next_row === node.row - 1) {
            class_name = "node-shortest-path node-upleft";
          }

          this.changeState(node.row, node.col, false, false, false, class_name);
        }
      }, 30 * i * speed_selected);
    }
    isAlgoRunning = 0;
  }

  // Visualizing Path Algorithm
  visulalizeAlgorithm = () => {
    this.removePrevForNextAlgo();
    const { grid } = this.state;
    const startNode = grid[StartNodeRow][StartNodeCol];
    const finishNode = grid[EndNodeRow][EndNodeCol];
    let visitedNodesInOrder = [];
    isAlgoRunning = 1;
    if (AlgorithmSelected === 1) {
      visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
    } else if (AlgorithmSelected === 2) {
      visitedNodesInOrder = aStar(grid, startNode, finishNode);
    } else if (AlgorithmSelected === 3) {
      visitedNodesInOrder = dfs(grid, startNode, finishNode);
    } else if (AlgorithmSelected === 4) {
      visitedNodesInOrder = bfs(grid, startNode, finishNode);
    } else {
      const buttonElement = document.getElementById("visualise-button");
      buttonElement.innerHTML = "!!! Select An Algorithm !!!";

      return;
    }
    const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
    this.animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
  };

  selectAnAlgorithm = (algo) => {
    AlgorithmSelected = algo;
    const buttonElement = document.getElementById("visualise-button");
    var algoName = "";
    if (algo === 1) {
      algoName = "Djikstra";
    } else if (algo === 2) {
      algoName = "A* Star";
    } else if (algo === 3) {
      algoName = "DFS";
    } else if (algo === 4) {
      algoName = "BFS";
    }

    buttonElement.innerHTML = `Visualise ${algoName}`;
  };

  addWeight = (wht) => {
    console.log("Adding Weight", wht);
    this.addingWeights = 1;
    this.addingStations = false;
    weight = wht;
  };

  selectSpeedOfVisualization = (speed) => {
    speed_selected = speed;
  };

  clearPath = () => {
    if (isAlgoRunning === 1) return;
    this.removePrevForNextAlgo();
  };

  mazeGenerate = (mazeAlgo) => {
    this.clearBoard();
    const { grid } = this.state;
    var forWalls;
    if (mazeAlgo === 1) {
      forWalls = RecursiveDivision(grid);
    } else {
      alert("Only Recursive division is Working till now");
      return;
    }
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        if (
          i !== 0 &&
          i !== grid.length - 1 &&
          j !== 0 &&
          j !== grid[0].length - 1
        )
          continue;
        setTimeout(() => {
          const node = grid[i][j];
          const element = document.getElementById(
            `node-${node.row}-${node.col}`
          );
          if (
            element.className !== "node node-start" &&
            element.className !== "node node-finish"
          ) {
            // element.className = "node node-visited";
            this.changeState(
              node.row,
              node.col,
              false,
              false,
              true,
              "node-wall wall-animate"
            );
          }
        }, 20 * i);
      }
    }
    for (let i = 0; i < forWalls.length; i++) {
      setTimeout(() => {
        const node = forWalls[i];
        const element = document.getElementById(`node-${node.row}-${node.col}`);
        if (
          element.className !== "node node-start" &&
          element.className !== "node node-finish"
        ) {
          // element.className = "node node-visited";
          this.changeState(
            node.row,
            node.col,
            false,
            false,
            true,
            "node-wall wall-animate"
          );
        }
      }, 20 * i);
    }
  };

  render() {
    return (
      <div>
        <ControlPanel
          onClickClear_={() => this.clearBoard()}
          onClickVisualize_={() => this.visulalizeAlgorithm()}
          onClickSelect_={(algo) => this.selectAnAlgorithm(algo)}
          onClickAddStation_={() => this.addStation()}
          onClickAddWeight_={(weight) => this.addWeight(weight)}
          onClickChangeSpeed_={(speed) =>
            this.selectSpeedOfVisualization(speed)
          }
          onClickClearPath_={() => this.clearPath()}
          onClickGenerateMaze_={(mazeAlgo) => this.mazeGenerate(mazeAlgo)}
        ></ControlPanel>
        <div className="grid">
          {this.state.grid.map((row, rowId) => {
            return (
              <div key={rowId} className="mar">
                {row.map((node, nodeId) => {
                  const {
                    col,
                    row,
                    isFinish,
                    isStart,
                    isWall,
                    isStation,
                    refElement,
                  } = node;
                  return (
                    <Node
                      ref={refElement}
                      key={nodeId}
                      col={col}
                      row={row}
                      isFinish={isFinish}
                      isStart={isStart}
                      isWall={isWall}
                      isStation={isStation}
                      onMouseDown_={(row, col) =>
                        this.handleMouseDown(row, col)
                      }
                      onMouseUp_={(row, col) => this.handleMouseUp(row, col)}
                      onMouseEnter_={(row, col) =>
                        this.handleMouseEnter(row, col)
                      }
                      onMouseLeave_={(row, col) =>
                        this.handleMouseLeave(row, col)
                      }
                    ></Node>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

function initializeGrid(GridRowSize, GridColSize) {
  const grid = [];
  for (let r = 0; r < GridRowSize; ++r) {
    const row = [];
    for (let c = 0; c < GridColSize; ++c) {
      row.push(createNode(r, c));
    }
    grid.push(row);
  }
  return grid;
}

const createNode = (row, col) => {
  return {
    col,
    row,
    isFinish: row === EndNodeRow && col === EndNodeCol,
    isStart: row === StartNodeRow && col === StartNodeCol,
    isWall: false,
    isStation: false,
    distance: Infinity,
    isVisited: false,
    previousNode: null,
    weight: 1,
    refElement: React.createRef(),
  };
};
