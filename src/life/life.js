import _ from "lodash"
import { Machine, interpret, actions } from "xstate"
const { send, assign, raise, log } = actions
//import { interpret2 } from "./interpreter"

import initialBoard from "./smallBoard"
// import initialBoard from "./mediumBoard"
import { getNextStateFromContext, getNeighbourCoordinates } from "./game"
import { makeBoard, updateCell, updateCounter } from "./dom"

const getCurrentStateCellValue = (x, y) => {
  const boardValue = life.state.value.board
  const cell = boardValue[`cell_${x}_${y}`]
  return cell && cell.currentState
}

const getCellNextState = (x, y) => {
  const state = getCurrentStateCellValue(x, y)
  const neighboursStates = getNeighbourCoordinates(x, y).map(([x, y]) => getCurrentStateCellValue(x, y))
  // console.log(getNextStateFromContext(state, neighboursStates))
  return getNextStateFromContext(state, neighboursStates)
}

// Beacon for state-viz: BEGIN COPY

const getCell = (x, y, initial) => {
  const cellPrefix = "cell"
  const coordinates = `_${x}_${y}`
  const id = `${cellPrefix}_${x}_${y}`

  const LIVE = `LIVE${coordinates}`
  const DIE = `DIE${coordinates}`
  const LIVE_NEXT = `LIVE_NEXT${coordinates}`
  const DIE_NEXT = `DIE_NEXT${coordinates}`

  return {
    id,
    type: "parallel",
    states: {
      currentState: {
        initial,
        states: {
          dead: {
            onEntry: () => updateCell(x, y, "dead"),
            on: {
              [LIVE]: "alive",
              TRANSITION: {
                cond: () => getCellNextState(x, y) === "alive",
                actions: raise(LIVE_NEXT),
              }
            }
          },
          alive: {
            onEntry: () => updateCell(x, y, "alive"),
            on: {
              [DIE]: "dead",
              TRANSITION: {
                cond: () => getCellNextState(x, y) === "dead",
                actions: raise(DIE_NEXT),
              }
            }
          }
        }
      },
      nextState: {
        initial,
        states: {
          dead: {
            on: {
              [LIVE_NEXT]: "living"
            }
          },
          alive: {
            on: {
              [DIE_NEXT]: "dying"
            }
          },
          dying: {
            on: {
              COPY: {
                target: "dead",
                actions: raise(DIE)
              }
            }
          },
          living: {
            on: {
              COPY: {
                target: "alive",
                actions: raise(LIVE)
              }
            }
          }
        }
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

const pulse = {
  initial: "idle",
  //TODO: why not this context?
  // context: {
  //   count: 0,
  // },
  states: {
    idle: {
      onEntry: [({ count }) => updateCounter(count)],
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
        5000: "auto",
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
    pulse,
  },
})

// Beacon for state-viz: END COPY

console.time("computation")
const life = interpret(lifeMachine).onTransition((state, event) => {
  //console.log(state)
  console.log(event.type, state.value)

  if (event.type !== "TRANSITION") {
    console.timeEnd("computation")
    console.time("computation")
  }

  //if (event.type === "COPY") updateBoard(state)
})

makeBoard(initialBoard)
life.start()
// updateBoard(life.state)

// life.send("AUTO")

life.send("MANUAL")
setTimeout(() => life.send("STEP"), 5000)
setTimeout(() => life.send("STEP"), 10000)

global.life = life
