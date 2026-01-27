export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MANAGER = "manager",
  VISITOR = "visitor",
}

export enum EventType {
  LIVE_MUSIC = "live_music",
  SPORTS_VIEWING = "sports_viewing",
  TRIVIA_NIGHT = "trivia_night",
  KARAOKE = "karaoke",
  PRIVATE_PARTY = "private_party",
  SPECIAL_EVENT = "special_event",
}

export enum SpecialType {
  DAILY = "daily",
  GAME_TIME = "game_time",
  DAY_TIME = "day_time",
  CHEF = "chef",
  SEASONAL = "seasonal",
}

export enum DayOfWeek {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

export enum SpecialCategory {
  REGULAR = "regular",
  LATE_NIGHT = "late_night",
}

export enum NewsletterCampaignStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
}

export enum DietaryInfo {
  VEGETARIAN = "vegetarian",
  VEGAN = "vegan",
  GLUTEN_FREE = "gluten_free",
  DAIRY_FREE = "dairy_free",
  NUT_FREE = "nut_free",
  HALAL = "halal",
  KOSHER = "kosher",
}

export enum Allergen {
  GLUTEN = "gluten",
  DAIRY = "dairy",
  NUTS = "nuts",
  EGGS = "eggs",
  SOY = "soy",
  SHELLFISH = "shellfish",
  FISH = "fish",
  SESAME = "sesame",
}
