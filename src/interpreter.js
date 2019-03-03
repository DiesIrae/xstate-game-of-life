
// Unused interpreter, adding action.context & current state to sent actions

export const interpret2 = machine => {
  let currentState = machine.initial

  // Keep track of the listeners
  const listeners = new Set()

  const interpreter = {
    send,
    onTransition,
    start: () => {},
  }

  // Have a way of sending/dispatching events
  function send(event) {
    // Remember: machine.transition() is a pure function
    currentState = machine.transition(currentState, event)

    // Get the side-effect actions to execute
    const { actions } = currentState

    actions.forEach(action => {
      // If the action is executable, execute it
      console.log(action)
      action.exec && action.exec()
      if (action.event)
        send({
          ...action.event,
          ...action.context,
          currentState,
        })
    })

    // Notify the listeners
    listeners.forEach(listener => listener(currentState))
    return interpreter
  }

  function onTransition(listener) {
    listeners.add(listener)
    return interpreter
  }

  function unlisten(listener) {
    listeners.delete(listener)
  }
  return interpreter
}
