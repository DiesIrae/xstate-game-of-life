//Unused
// Available variables:
// Machine (machine factory function)
// XState (all XState exports)
const {
  actions: { send }
} = XState;

const api = {
  id: "api",
  initial: "polling",
  states: {
    idle: {
      on: { POLL: "polling" },
      on: { POST: "posting" }
    },
    polling: {
      on: { POLL_SUCCESS: "idle" },
      on: { POLL_ERROR: "idle" },
      on: { POST: "posting" }
    },
    posting: {
      on: { POST_SUCCESS: "idle" },
      on: { POST_ERROR: "idle" }
    }
  }
};

const conversation = {
  on: { CLOSE: "botMinimized" },
  id: "conversation",
  type: "parallel",
  states: {
    userMessage: {
      id: "userMessage",
      initial: "typing",
      states: {
        typing: {
          on: { TYPE: "typing" },
          on: {
            SUBMIT: {
              target: "typing",
              actions: send("POST")
            }
          }
        }
      }
    },
    botResponse: {
      id: "botResponse",
      initial: "idle",
      states: {
        idle: {
          on: { BOT_RESPONSE_WAIT: "waiting" }
        },
        waiting: {
          on: { BOT_RESPONSE_FINISH: "idle" }
        }
      }
    },
    wineResult: {
      id: "wineResult",
      initial: "closed",
      states: {
        closed: {
          on: { OPEN: "opened" }
        },
        opened: {
          on: { CLOSE: "closed" }
        }
      }
    },
    api
  }
};

const matchaWebchatMachine = Machine({
  id: "matchaWebchat",
  initial: "inactive",
  states: {
    inactive: {
      on: { ACTIVATE: "active" }
    },
    active: {
      id: "window",
      on: { DEACTIVATE: "inactive" },
      initial: "onboarding",
      states: {
        onboarding: {
          on: { CLICK: "conversation" }
        },
        botMinimized: {
          on: { CLICK: "conversation" }
        },
        conversation
      }
    }
  }
});
