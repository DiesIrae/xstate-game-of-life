import _ from "lodash"

export const getNextStateFromContext = (state, neighboursStates) => {
  const aliveNeighbors = _.filter(neighboursStates, state => state === "alive").length
  //console.log(aliveNeighbors)
  if (state === "dead" && aliveNeighbors === 3) return "alive"
  if (state === "alive" && (aliveNeighbors > 3 || aliveNeighbors < 2)) return "dead"
}

export const getNeighbourCoordinates = (x, y) => {
  const allCoordinates = _.flatten(
    [0, 1, -1].map(xc => {
      return [0, 1, -1].map(yc => {
        return [x + xc, y + yc]
      })
    })
  )
  return _.drop(allCoordinates)
}
