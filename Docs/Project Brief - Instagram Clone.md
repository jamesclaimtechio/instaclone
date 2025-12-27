## 1. The Vision

- **Core Concept:** A photo-sharing social platform with core Instagram mechanics (posts, feeds, follows, engagement)
- **The North Star:** A fully functional, deployed Instagram-style app that demonstrates mastery of building a complex social platform from concept to production using the AI Systems Architect methodology
- **Target User:** Primary: You (learning and portfolio demonstration). Secondary: General social media users who want a simple, clean photo-sharing experience
- **Day in the Life:** A user who wants to share moments through photos, discover what others are posting in a public feed, and engage with a community through likes and comments

## 2. Scope Definition

- **Phase 1 (The Complete Build):**
    - User authentication system (custom auth with email/password and secure password hashing)
    - User profiles (username, bio, profile picture, follower/following counts)
    - Photo post creation (upload single image, add caption)
    - Global chronological feed showing all posts from all users (most recent first)
    - Social interactions (like posts, comment on posts)
    - Follow/unfollow system (for profile tracking, not feed filtering)
    - Profile viewing (see any user's posts and profile info)
    - User search (discover users by username)
- **Phase 2 (Not Planned):**
    - This project ends at Phase 1. No additional phases planned.
    - *Context:* This is a focused learning project with a defined scope

## 3. The Conceptual System

- **Core "Nouns":** Users, Posts, Comments, Follows (relationships), Likes (relationships)
- **Primary User Flow:** New user signs up and creates profile → Uploads photo with caption → Browses global feed of all posts → Searches for and follows interesting users → Engages by liking and commenting on posts → Views followed users' profiles

## 4. Success Criteria

- **Success looks like:** A deployed, working web app where users can register, create profiles, post photos, follow others, and interact through likes and comments. The app demonstrates ability to execute the full AI Systems Architect methodology from concept to production.
- **Constraints:** Web app (responsive/mobile-friendly), Cloudflare infrastructure, Neon SQL database, custom authentication implementation

## 5. Business Model

- **How will this make money?** Not applicable - this is a learning and portfolio project
- **What's free vs paid?** Everything is free and accessible
- **What does a "successful" user look like?** A user who creates a profile, posts at least one photo, follows other users, and engages with content through likes or comments
