import _ from "lodash"
import $ from "jquery"

export const makeBoard = initialBoard => {
  const board$ = $("<div />")
    .appendTo("#app")
    .addClass("board")

  initialBoard.forEach((line, y) => {
    const line$ = $("<div />")
      .appendTo(board$)
      .addClass("line")
    line.forEach((value, x) => {
      $("<div />")
        .appendTo(line$)
        .addClass("cell")
        .attr("id", `cell_${x}_${y}`)
    })
  })

  $("<div />")
    .appendTo("#app")
    .attr("id", "counter")
}

export const updateBoard = state =>
  _.forEach(state.value.board, (cellState, id) => {
    const cell$ = $(`#${id}`)
    if (cellState === "alive") cell$.addClass("alive")
    else cell$.removeClass("alive")
  })

export const updateCell = (x, y, newState) => {
  const cell$ = $(`#cell_${x}_${y}`)
  if (newState === "alive") cell$.addClass("alive")
  else cell$.removeClass("alive")
}

export const updateCounter = value => $("#counter").text(value)
