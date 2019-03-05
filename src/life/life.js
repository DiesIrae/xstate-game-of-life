import _ from "lodash"
import { Machine, interpret, actions } from "xstate"
const { send, assign, raise, log, sendParent } = actions
//import { interpret2 } from "./interpreter"

// import initialBoard from "./smallBoard"
import initialBoard from "./mediumBoard"
import { getNextStateFromContext, getNeighbourCoordinates } from "./game"
import { makeBoard, updateCell, updateCounter } from "./dom"

const getCurrentStateCellValue = (x, y) => {
  const boardValue = life.state.value.board
  return boardValue[`cell_${x}_${y}`]
}

const getCellNextState = (x, y) => {
  const state = getCurrentStateCellValue(x, y)
  const neighboursStates = getNeighbourCoordinates(x, y).map(([x, y]) => getCurrentStateCellValue(x, y))
  // console.log(getNextStateFromContext(state, neighboursStates))
  return getNextStateFromContext(state, neighboursStates)
}

// Beacon for state-viz: BEGIN COPY


const nextStateCell = Machine({
  id: "nextStateCell",
  initial: "waiting",
  states: {
    waiting: {
      on: {
        DIE: "dead",
        LIVE: "alive",
      }
    },
    dead: {
      on: {
        COPY: {
          actions: sendParent("DIE"),
          target: "done"
        }
      }
    },
    alive: {
      on: {
        COPY: {
          actions: sendParent("LIVE"),
          target: "done"
        }
      }
    },
    done: {
      type: "final"
    }
  }
})

const getCell = (x, y, initial) => {
  const cellPrefix = "cell"
  const id = `${cellPrefix}_${x}_${y}`
  const nextCellId = `next_${id}`

  return {
    id,
    initial,
    states: {
      dead: {
        onEntry: () => updateCell(x, y, "dead"),
        on: {
          TRANSITION: {
            cond: () => getCellNextState(x, y) === "alive",
            target: "living"
          }
        }
      },
      alive: {
        onEntry: () => updateCell(x, y, "alive"),
        on: {
          TRANSITION: {
            cond: () => getCellNextState(x, y) === "dead",
            target: "dying"
          }
        }
      },
      dying: {
        invoke: {
          id: nextCellId,
          src: "nextStateCell",
        },
        onEntry: send("DIE", {to: nextCellId}),
        on: {
          DIE: "dead",
          COPY: {
            actions: send("COPY", {to: nextCellId}),
          }
        }
      },
      living: {
        invoke: {
          id: nextCellId,
          src: "nextStateCell",
        },
        onEntry: send("LIVE", {to: nextCellId}),
        on: {
          LIVE: "alive",
          COPY: {
            actions: send("COPY", {to: nextCellId}),
          }
        }
      }
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
    pulse,
  },
}, {services: {nextStateCell}})

// Beacon for state-viz: END COPY

console.time("computation")
const life = interpret(lifeMachine).onTransition((state, event) => {
  // console.log(state)
  // console.log(event.type, state.value)

  if (_.includes(["COPY", "TRANSITION"], event.type)) {
    console.timeEnd("computation")
    console.time("computation")
  }

  //if (event.type === "COPY") updateBoard(state)
})

makeBoard(initialBoard)
life.start()
// updateBoard(life.state)

life.send("AUTO")

life.send("MANUAL")
setTimeout(() => life.send("STEP"), 5000)
setTimeout(() => life.send("STEP"), 10000)

global.life = life
