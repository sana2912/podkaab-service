// Shared enums consumed by API, worker, and package code.
export enum Emotion {
  HAPPY = "HAPPY",
  SAD = "SAD",
  EXCITED = "EXCITED",
  SHOCKED = "SHOCKED",
  CURIOUS = "CURIOUS",
  INSPIRED = "INSPIRED",
}

export enum TargetType {
  COLLECTION = "COLLECTION",
  SHORT_CONTENT = "SHORT_CONTENT",
  FULL_CONTENT = "FULL_CONTENT",
}

export enum FeedEventType {
  IMPRESSION = "IMPRESSION",
  VIEW_START = "VIEW_START",
  WATCH_PROGRESS = "WATCH_PROGRESS",
  VIEW_COMPLETE = "VIEW_COMPLETE",
  CONTINUE_CLICK = "CONTINUE_CLICK",
  FULL_START = "FULL_START",
  FULL_COMPLETE = "FULL_COMPLETE",
  SKIP = "SKIP",
  REACTION = "REACTION",
}

export enum MediaStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  READY = "READY",
  FAILED = "FAILED",
}

export enum CollectionFullMode {
  SINGLE = "SINGLE",
  SERIES = "SERIES",
}

export enum ContentRole {
  SHORT = "SHORT",
  FULL = "FULL",
}

export enum PlaybackKind {
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
}
