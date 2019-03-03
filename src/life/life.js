import _ from "lodash"
import { Machine, interpret, actions } from "xstate"
const { send, assign } = actions
//import { interpret2 } from "./interpreter"

//import initialBoard from "./smallBoard"
import initialBoard from "./mediumBoard"
import { getNextStateFromContext, getNeighbourCoordinates } from "./game"
import { makeBoard, updateBoard, updateCell, updateCounter } from "./dom"

const getCurrentStateCellValue = (x, y, isNext) => {
  const boardValue = life.state.value[isNext ? "nextBoard" : "board"]
  return boardValue[`cell_${x}_${y}`]
}

const getCellNextState = (x, y) => {
  const state = getCurrentStateCellValue(x, y)
  const neighboursStates = getNeighbourCoordinates(x, y).map(([x, y]) => getCurrentStateCellValue(x, y))
  return getNextStateFromContext(state, neighboursStates)
}

// Beacon for state-viz: BEGIN COPY

const getCell = (x, y, initial, isNext) => {
  const cellPrefix = isNext ? "nextCell" : "cell"
  const id = `${cellPrefix}_${x}_${y}`
  const cond = (ctx, e) => x === e.x && y === e.y && isNext === e.isNext

  return {
    id,
    initial,
    states: {
      dead: {
        on: {
          LIVE: {
            target: "alive",
            cond,
          },
          TRANSITION: {
            target: "alive",
            cond: () => isNext && getCellNextState(x, y) === "alive",
          },
          COPY: {
            target: "alive",
            cond: () => !isNext && getCellNextState(x, y, true) === "alive",
            actions: () => updateCell(x, y, "alive"),
          },
        },
      },
      alive: {
        on: {
          DIE: {
            target: "dead",
            cond,
          },
          TRANSITION: {
            target: "dead",
            cond: () => isNext && getCellNextState(x, y) === "dead",
          },
          COPY: {
            target: "dead",
            cond: () => !isNext && getCellNextState(x, y, true) === "dead",
            actions: () => updateCell(x, y, "dead"),
          },
        },
      },
    },
  }
}

const getAllCells = isNext => {
  const boardCells = initialBoard.map((line, y) => {
    return initialBoard[y].map((value, x) => {
      const initial = value === 1 ? "alive" : "dead"
      return getCell(x, y, initial, isNext)
    })
  })

  return _(boardCells)
    .flatten()
    .keyBy("id")
    .value()
}

const board = {
  type: "parallel",
  states: getAllCells(),
}

const nextBoard = {
  type: "parallel",
  states: getAllCells(true),
}

const pulse = {
  initial: "idle",
  //TODO: why not this context?
  // context: {
  //   count: 0,
  // },
  states: {
    idle: {
      on: {
        MANUAL: "manual",
        AUTO: "auto",
      },
    },
    step: {
      onEntry: [send("TRANSITION"), send("COPY")],
      on: {
        "": "manual",
      },
    },
    manual: {
      on: {
        STEP: "step",
      },
    },
    auto: {
      onEntry: [send("TRANSITION"), send("COPY"), assign({ count: ({ count }) => count + 1 }), ({ count }) => updateCounter(count)],
      after: {
        1500: "auto",
      },
    },
  },
}

const lifeMachine = Machine({
  id: "life",
  type: "parallel",
  context: {
    count: 0,
  },
  states: {
    board,
    nextBoard,
    pulse,
  },
})

// Beacon for state-viz: END COPY

console.time("computation")
const life = interpret(lifeMachine).onTransition((state, event) => {
  //console.log(state)
  //console.log(event.type, state.value)

  if (event.type !== "TRANSITION") {
    console.timeEnd("computation")
    console.time("computation")
  }

  //if (event.type === "COPY") updateBoard(state)
})

makeBoard(initialBoard)
life.start()
updateBoard(life.state)

life.send("AUTO")

//life.send("MANUAL")
//setTimeout(() => life.send("STEP"), 3000)
//setTimeout(() => life.send("STEP"), 6000)
