// Minimal typings for ical-expander (no official @types package).
declare module 'ical-expander' {
  interface IcalTime {
    toJSDate(): Date
    isDate: boolean
  }
  interface CalEvent {
    uid: string
    summary: string
    location?: string
    startDate: IcalTime
    endDate: IcalTime
  }
  interface Occurrence {
    startDate: IcalTime
    endDate: IcalTime
    recurrenceId?: IcalTime
    item: CalEvent
  }
  interface BetweenResult {
    events: CalEvent[]
    occurrences: Occurrence[]
  }
  interface IcalExpanderOptions {
    ics: string
    maxIterations?: number
    skipInvalidDates?: boolean
  }
  export default class IcalExpander {
    constructor(options: IcalExpanderOptions)
    between(after?: Date, before?: Date): BetweenResult
    before(before: Date): BetweenResult
    after(after: Date): BetweenResult
    all(): BetweenResult
  }
}
