/**
 * Data Layer Barrel Export
 * Central export for all data functions
 */

// User functions
export {
  getUserByWhopId,
  getUserById,
  getOrCreateUser,
  updateUser,
  deleteUser,
  getUsersByIds,
} from './users';

// Company functions
export {
  getCompanyByWhopId,
  getCompanyById,
  getOrCreateCompany,
  updateCompany,
  upsertCompanyMember,
  getCompanyMember,
  checkCompanyRole,
  getCompanyMembers,
  getUserCompanies,
  removeCompanyMember,
  syncCompanyMembership,
} from './companies';

// Webinar functions
export {
  createWebinar,
  getWebinarById,
  getWebinarBySlug,
  getWebinarWithHosts,
  getWebinarWithDetails,
  getWebinarPublicView,
  updateWebinar,
  updateWebinarStatus,
  deleteWebinar,
  getCompanyWebinars,
  getUpcomingWebinars,
  getWebinarsToEnd,
  addWebinarHost,
  updateWebinarHost,
  removeWebinarHost,
  getWebinarHosts,
  reorderWebinarHosts,
} from './webinars';

// Registration functions
export {
  createRegistration,
  getRegistrationById,
  getRegistrationByEmail,
  getRegistrationWithWebinar,
  updateRegistration,
  deleteRegistration,
  getWebinarRegistrations,
  getRegistrationCount,
  getAttendeeCount,
  markAttended,
  markWatchedReplay,
  markConfirmationSent,
  markReminder24hSent,
  markReminder1hSent,
  markReplaySent,
  searchRegistrations,
  getRegistrationsPendingEmail,
  getRegistrationsByEmail,
  exportWebinarRegistrations,
} from './registrations';

// Poll functions
export {
  createPoll,
  getPollById,
  getWebinarPolls,
  getWebinarPollsWithResults,
  updatePoll,
  updatePollStatus,
  deletePoll,
  submitPollResponse,
  getUserPollResponse,
  getPollResults,
} from './polls';

// Discount code functions
export {
  createDiscountCode,
  getDiscountCodeById,
  getDiscountCodeByCode,
  getWebinarDiscountCodes,
  updateDiscountCode,
  toggleDiscountCodeActive,
  deleteDiscountCode,
  incrementDiscountCodeUse,
  validateDiscountCode,
  getActiveDiscountCodes,
} from './discounts';

// Chat functions
export {
  sendChatMessage,
  getChatMessages,
  getRecentChatMessages,
  getPinnedMessages,
  toggleMessagePin,
  toggleMessageHidden,
  deleteChatMessage,
  getChatMessageCount,
} from './chat';

// Q&A functions
export {
  submitQuestion,
  getQuestions,
  getQuestionsWithUpvoteStatus,
  getHighlightedQuestions,
  updateQuestionStatus,
  answerQuestion,
  dismissQuestion,
  toggleQuestionHighlight,
  toggleQuestionHidden,
  deleteQuestion,
  toggleUpvote,
  getQuestionCount,
} from './qa';
export type { QuestionWithMeta } from './qa';

// Reaction functions
export {
  sendReaction,
  getRecentReactions,
  getReactionCounts,
  getTotalReactionCount,
  getReactionsInWindow,
  deleteOldReactions,
  REACTION_EMOJIS,
} from './reactions';
export type { ReactionEmoji } from './reactions';
