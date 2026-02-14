const state = {
  status: 'idle', // idle | processing | success | error
  message: '',
  error: '',
  updatedAt: Date.now(),
}

const listeners = new Set()

const notify = () => {
  listeners.forEach((fn) => {
    try {
      fn({ ...state })
    } catch (_) {}
  })
}

export const setUploadJobState = (patch) => {
  Object.assign(state, patch, { updatedAt: Date.now() })
  notify()
}

export const getUploadJobState = () => ({ ...state })

export const subscribeUploadJobState = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

