export interface ClientStory {
  id: string;
  name: string;
  initials?: string;
  role: string;
  company?: string;
  text: string;
  rating?: number;
}

/**
 * Real client stories and verified testimonials.
 * Left empty by default so that no simulated or placeholder reviews are shown.
 * When you receive genuine client feedback, simply add them to this list and
 * they will automatically appear in the "Trusted Across Saint Lucia" section on the home page.
 *
 * Example format to add when ready:
 * {
 *   id: "story-1",
 *   name: "Jane Doe",
 *   initials: "JD",
 *   role: "Managing Director",
 *   company: "St. Lucia Logistics",
 *   text: "Vision79 upgraded our entire network infrastructure and server reliability seamlessly.",
 *   rating: 5
 * }
 */
export const CLIENT_STORIES: ClientStory[] = [];
