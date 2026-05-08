/** Armed immediately before store openInEditor from Ctrl+Arrow; Timeline consumes once per layout flush. */
let armed = false

export const armTimelineKeyboardStepScroll = (): void => {
  armed = true
}

export const takeTimelineKeyboardStepScroll = (): boolean => {
  const v = armed
  armed = false
  return v
}
