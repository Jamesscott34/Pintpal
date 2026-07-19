# PintPal

Multi-user drinks discovery, rating and recommendation platform.

Version 1.1, July 2026

## Overview

PintPal lets users create one account, build a personal taste profile, photograph and rate drinks, write reviews, follow other users, compare products, join category communities and discover highly rated drinks from a phone, tablet, laptop or desktop computer.

The platform launches with beer, cider, wine and spirits, while allowing administrators to create additional categories and subcategories without requiring an app release. The Android app, responsive website, Progressive Web App and administration dashboard share the same Firebase backend, user accounts and platform data.

The design supports personal tracking, public community content, rankings, leaderboards, recommendations, local availability and verified business accounts.

## Platform Goals

- Give every user a private account and a configurable public profile.
- Provide a consistent PintPal experience across Android, mobile browsers, tablets, laptops and desktop computers.
- Allow users to record, rate, review and compare products across multiple drink categories.
- Provide trustworthy best-in-category rankings based on weighted community ratings.
- Create leaderboards that reward helpful reviews, accurate data and community participation.
- Build personal taste profiles and explainable recommendations.
- Help users find products, producers and venues locally.
- Give administrators strong category, moderation, product and leaderboard controls.
- Create future revenue opportunities through premium features and verified business accounts.

## Core Questions PintPal Should Answer

- What drinks have I tried, and what did I think of them?
- What products match my personal taste?
- What is currently considered the best beer, wine, cider or spirit?
- What is trending in my area or among people I follow?
- Which users have similar tastes to me?
- Where can I find a particular product nearby?

## Feature Areas

### 1. User Accounts and Profiles

Multiple users are supported through Firebase Authentication. Each registered user has private account data and a separate public profile.

**Registration and sign-in:** email and password, Google, Apple where supported, phone, and a guest account with an upgrade path to a full account.

**Private account data:** email address, date of birth and age confirmation, notification preferences, location permissions, saved drafts, private lists, blocked users, account security settings, subscription information, and data export and account deletion controls. Private information is only accessible to the user and authorised administrators, subject to strict Firebase security rules.

**Public profile:** display name, unique username, profile photograph, biography, general location, favourite categories and products, public reviews, followers and following counts, achievements, public lists, contribution score, member-since date, top-rated product, and most-reviewed category.

Profiles can be set to Public, Friends Only or Private. Individual reviews and lists have their own visibility controls.

### 2. User Roles and Permissions

Role-based permissions keep normal users, contributors, moderators, administrators and businesses clearly separated.

- **Standard User:** rate drinks, write reviews, upload photographs, create lists, follow users, comment, suggest new drinks, report availability, vote on helpful reviews, join categories, view rankings and leaderboards.
- **Trusted Contributor:** suggest edits to drink profiles, confirm duplicate products, verify availability reports, help classify drinks, flag inaccurate information, submit missing producer information.
- **Moderator:** review reported content, remove inappropriate comments, hide misleading reviews, suspend users, review disputed listings, merge duplicate drinks, approve community photographs, manage public discussions.
- **Administrator:** create and edit categories and subcategories, manage users and roles, approve or reject drinks, configure leaderboards and points, feature products, manage reports and moderation, configure achievements, create competitions, manage venue and business accounts, publish announcements, view analytics, suspend or delete accounts.
- **Business Account:** claim a verified producer or venue profile, add products, update official information, upload official images, publish availability and pricing, post events, respond to reviews, manage menus, promote new releases with clearly labelled sponsored content.

### 3. Dynamic Categories

The category system is controlled from the administration dashboard rather than hard-coded into the Android or web clients, so administrators can create new categories and subcategories without a client release.

**Initial categories:** Beer, Cider, Wine, Spirits. Future categories could include alcohol-free drinks, cocktails, mead, sake, liqueurs, ready-to-drink cans, craft soft drinks and seasonal drinks.

Each category has example subcategories (for instance Lager, Stout, IPA under Beer; Red Wine, Sparkling Wine under Wine; Irish Whiskey, Gin, Rum under Spirits), and administrators can define custom fields per category.

### 4. Public Community Area

Organised by category, with a combined activity feed on top.

- **Category pages:** top-rated, trending and recently added products, latest reviews, most discussed products, new releases, popular users, featured lists, nearby availability, category-specific rankings.
- **Public activity feed:** new reviews, new products, photographs, achievements, public lists, recommendations, trending discussions, venue updates, producer announcements. Filterable by category, friends, nearby, trending, most recent, highest rated, and similar tastes.
- **Public discussions:** topic-based threads (for example "Best Irish Stout", "Wines to Try"), with pinning, locking and moderation available to administrators and moderators.

### 5. Drink Profiles

Every drink has a dedicated public product profile: name, category and subcategory, producer, brewery/winery/distillery, country and region, alcohol percentage, description, official and community photographs, average rating, number of ratings, rating distribution, current user rating, reviews, flavour profile, similar products, availability, price range, awards, barcode, year or vintage, serving recommendations, food pairings, date added, and verification status.

Users can rate, review, save, compare, share, report availability, suggest edits, mark as tried, or add a product to a want-to-try list.

### 6. Rating and Review System

Star ratings from 1 to 5, including half-star ratings. The overall rating is the main score used by rankings and recommendations.

Reviews can include a written review, photographs, flavour tags, serving type, venue, price, date tried, would-buy-again and would-recommend flags, and public or private visibility. Other users can like, mark helpful, reply to, share or report a review. Reviews disclose whether a product was purchased, sampled at a venue, provided free by a business, or part of sponsored content.

### 7. Best Drink Rankings

Ranking pages exist for each major category and subcategory, transparent, resistant to manipulation and separate from short-term trending lists (for example Best Beer Overall, Best Irish Whiskey, Best Wine Under €15).

**Ranking calculation** considers average rating, number of ratings, recent rating activity, rating consistency, verified user ratings, suspicious voting patterns, helpful reviews, geographic relevance, availability, and category-specific rules. A product with one 5-star review should not outrank one with thousands of consistently high ratings.

Suggested eligibility rules require at least 20 ratings for local rankings, 50 for category rankings and 100 for national rankings. New products appear in a separate Rising or Trending section until they reach the required threshold.

### 8. Leaderboards

Reward useful participation, credibility and community value. Leaderboards never reward the total amount of alcohol consumed.

- **User contribution leaderboard:** points for helpful reviews, valid product additions, confirming accurate information, reporting availability, uploading approved photographs, identifying duplicates, receiving helpful votes, and creating popular public lists.
- **Reviewer leaderboards:** Top Beer Reviewer, Top Wine Reviewer, Top Cider Reviewer, Top Whiskey Reviewer, Most Helpful Reviewer, Best New Reviewer.
- **Discovery leaderboard:** rewards adding verified products, reporting new venues, reporting local availability, and adding useful missing product data.
- **Regional and friends leaderboards:** filterable by country, county, city or local area.
- **Business leaderboards:** Best-Rated Brewery, Best-Rated Winery, Best-Rated Distillery, Best Beer Venue, and similar.

Rate limits, verification checks and duplicate-action detection prevent users farming points.

### 9. Trending Products

Separate from best-rated rankings. A trending score considers recent ratings, review activity, saves, shares, searches, availability reports and discussion activity. Includes Trending Today, This Week, This Month, Near You, and Fastest Rising per category.

### 10. Personal Taste Profile

Calculated from ratings, review tags and recommendation feedback: favourite categories, subcategories and producers, preferred alcohol strength, sweetness, bitterness and flavour types, preferred price range, preferred countries and regions, and products or characteristics usually disliked.

### 11. Recommendations

Built from previous ratings, category and flavour preferences, similar users, favourite producers, price range, location, local availability, saved products, rejected recommendations, and seasonal trends.

Every recommendation includes a clear explanation, for example "Recommended because you rated three Irish stouts above 4 stars" or "Users with similar wine preferences rate this product highly." Feedback controls include Interested, Not Interested, Save for Later, Already Tried, Hide This Producer, and Show More Like This.

### 12. Friends, Followers and Social Features

Follow users, send and manage friend requests, view public reviews and activity, recommend products to friends, compare taste profiles, create shared lists, join private groups, block and report users. Following does not automatically expose private activity.

**Taste compatibility:** a match percentage based on shared ratings, category preferences, flavour profiles, favourite producers, shared dislikes and price preferences.

### 13. Lists and Collections

Private, Friends Only, Public or Collaborative lists (for example "Best Irish Beers", "Wines to Try", "Drinks Under €20"). Popular public lists can appear in category discovery pages.

### 14. Search, Filters and Comparison

Search and filter by product name, category, subcategory, producer, country, region, alcohol percentage, price, rating, flavour, barcode, venue, availability and alcohol-free status. Filters adapt to the category, for example vintage and grape variety for wine, age and cask type for whiskey.

Product comparison adapts its fields to the products being compared: personal and community rating, category, subcategory, producer, alcohol percentage, price, country, flavour profile, availability, number of reviews and would-buy-again percentage.

### 15. Photo, Barcode and Menu Recognition

Barcode scanning, label text recognition, product and menu photography, with manual search and correction always available. Automatic recognition always asks the user to confirm the result. Community photographs may require moderation before appearing publicly.

### 16. Nearby Discovery and Availability

Find pubs, bars, restaurants, breweries, wineries, distilleries, off-licences, bottle shops, festivals and tastings. Search for a specific product nearby, highly rated venues, strong beer or wine selections, whiskey bars, alcohol-free options and local events.

**Availability reporting** captures product, venue, date, price, serving type, draft/bottle/can, in stock or out of stock, photograph and confirmation from other users. Confidence labels include Verified Today, Reported Recently, Possibly Available and Information May Be Outdated.

### 17. Notifications

Friend requests, new followers, replies to reviews, helpful votes, achievement unlocks, saved product available nearby, favourite producer releases, category leaderboard changes, new competitions, business announcements and moderator messages. Each notification type is separately configurable.

### 18. Achievements and Awards

Achievements such as First Review, Trusted Reviewer, Beer Explorer, Ten Categories Tried, Local Discovery Expert and Community Helper. Monthly and yearly awards such as Beer of the Month, Best New Product, Most Helpful Reviewer and Best Beer of the Year.

### 19. Administration Dashboard

Category management (create, edit, disable categories and subcategories, custom fields, icons, colours, ranking and eligibility settings), product management (approve, edit, merge, verify, remove, lock official fields), user and role management (search, review reports, assign roles, warn, suspend, ban, restore), leaderboard management (points, exclusions, seasonal resets, regional leaderboards), and moderation (reported reviews, users, photographs, spam, fake or duplicate products, offensive comments, suspicious rating activity).

### 20. Anti-Abuse and Ranking Integrity

Detects and responds to multiple accounts from the same device, large numbers of ratings in a short period, repeated one-sided ratings for one business, fake helpful votes, duplicate reviews, business employees rating their own products, and suspicious referral activity. Controls include email verification, rate limits, device checks, minimum account age for leaderboard eligibility, review quality scoring, moderator review, ranking exclusions and server-side Cloud Function validation.

### 21. Firebase Backend Structure

Security requirements: users can only change their own private account data, public profile fields are readable according to visibility settings, roles are set through trusted server-side administration only, rating aggregates and leaderboards and contribution points are calculated server-side, uploaded files are validated for type and size, moderation and audit records are protected from standard users, location data is optional and consent-based, and account deletion removes or anonymises associated personal data according to policy.

### 22. Responsive Web Application and Progressive Web App

Delivered as a cross-platform service rather than an Android-only product, with the same account, profile, ratings, reviews, lists, recommendations, rankings and community features available through a modern browser, adapting to phones, tablets, laptops, desktops and foldable devices.

**Platform delivery model:** native Android app for camera-first use, barcode scanning, notifications and mobile convenience; responsive public website and signed-in web app; installable Progressive Web App; protected web administration dashboard; one shared Firebase backend across everything.

**Public website:** selected content viewable without signing in, so new users can understand the platform and search engines can index public pages. Includes a public landing page, category pages, product pages, leaderboard and best-in-category pages, producer/venue/business pages, and public profiles, reviews and lists where enabled.

**Signed-in web experience:** the same core actions available on Android, including rating, reviewing, photo upload, search, lists, personal history, achievements, taste profile, following, recommendations, rankings, nearby availability, and account settings.

**Shared accounts and synchronisation:** one PintPal identity across Android and web via Firebase Authentication, with Cloud Firestore and Firebase Storage holding shared account data, ratings, reviews, lists, photographs and community content. A rating submitted on Android appears on web immediately, and vice versa. Draft reviews stored locally sync when the user reconnects.

**Progressive Web App:** installable home-screen or desktop shortcut, app-like full-screen presentation, cached shell and recently viewed content, offline access to saved data and draft reviews, automatic sync on reconnect, push notifications where supported, and graceful fallback to the normal website when a PWA feature is unavailable.

**Web camera, image and scan features:** direct camera capture on supported mobile browsers, image upload on desktop and laptop, barcode and label recognition where the browser and device allow it, with manual search always available as a fallback.

**Search engine visibility:** readable, stable URLs (for example `pintpal.example/drinks/guinness-draught`, `pintpal.example/beer`, `pintpal.example/leaderboards/best-beer`), social preview metadata, canonical URLs and structured data. Private profiles, private lists and private account data are never indexed.

**Web administration dashboard:** separate from the normal user interface, designed for laptop and desktop use, with secure role-based access, multi-factor authentication for privileged accounts where possible, and complete audit logging.

## Shared Cross-Platform Architecture

### Recommended Web Technology

Next.js with TypeScript, supporting responsive interfaces, search-friendly public pages, Firebase integration, server-rendered content and Progressive Web App features. A shared component library and design system keeps terminology, colours, icons and interaction patterns consistent with Android.

### Web Security Requirements

- Do not trust client-side role or leaderboard values.
- Enforce permissions through Firebase Security Rules and trusted server-side functions.
- Protect administrative routes with role checks and stronger authentication requirements.
- Validate uploaded files, limit file sizes and remove unsafe metadata where appropriate.
- Use rate limits and anti-automation controls on sign-up, review, voting and reporting actions.
- Prevent private account, location and moderation data from appearing in public pages or search indexes.
- Keep an audit trail of administrator and moderator actions.

## Development Phases

**Phase 1: Core Multi-User Platform**
Registration and login, responsive web application and installable PWA foundation, public and private profiles, admin roles, dynamic categories, product database, ratings and reviews, personal history, public category pages, search.

**Phase 2: Rankings and Leaderboards**
Best beer/cider/wine/spirit rankings, weighted rating calculations, user contribution points, reviewer leaderboards, trending products, monthly rankings.

**Phase 3: Social Features**
Friends, followers, activity feed, comments, helpful votes, shared lists, taste compatibility.

**Phase 4: Recommendations**
Taste profiles, personal recommendations, similar-user recommendations, category-specific recommendations, recommendation feedback.

**Phase 5: Location and Businesses**
Nearby venues, availability reporting, venue profiles, business accounts, verified menus, product events.

**Phase 6: Advanced Administration**
Advanced web administration dashboard and operational tooling, moderation queue, fraud detection, ranking configuration, platform analytics, automated reports.

**Phase 7: Mini-Games**
Two bartender skill mini-games with their own scoreboards, Pour the Perfect Pint and Serving Rush. See the Mini-Games section below for detail.

## Mini-Games (implemented)

Both games are bartender skill challenges (pour / serve accuracy only). Scores never reward drinking volume or speed. Public boards are opt-in and separate from beer ratings.

### Pour the Perfect Pint

- **Web:** `/games/pour` — practice, timed (30/60/90/120s), scoreboard  
- **Android:** Pour hub from Public → Pour the Perfect Pint  
- **Firestore:** `pour_game_scores` + profile bests on `users/{uid}`

### Serving Rush

- **Web:** `/games/serving` — queue of drink orders; pick the correct tap, then pour before the order timer; wrong tap / timeout = miss (−10)  
- **Android:** Serving Rush from Public  
- **Firestore:** `serving_game_scores` + `servingGameBestScore` on the user profile  

### Public community hub

Signed-in members use **Public** for games, chats (placeholder), beer ratings (placeholder), and scoreboards. A **top scoreboard** on Public shows the current best pint (practice accuracy) and Serving Rush lead with the player’s display name. **Private** is profile-only. **Admin** (`canViewAdmin`) can list all users and open the same community surfaces.

### App shell routes (web)

| Route | Purpose |
|-------|---------|
| `/public` | Community hub + top scoreboard |
| `/private` | Own profile |
| `/admin` | Admin dashboard (all users) |
| `/games/pour` | Pour the Perfect Pint |
| `/games/serving` | Serving Rush |
| `/ratings` | Beer ratings placeholder |

Responsive layout targets phone, tablet, and laptop browsers (flexible grids, sticky nav, 44px+ tap targets).

## Minimum Viable Product

The first public version focuses on a reliable multi-user foundation rather than every long-term feature:

- Multi-user registration and login
- Responsive web application supporting mobile, tablet, laptop and desktop browsers
- Basic Progressive Web App installation and offline draft support
- User profiles, with public and private visibility settings
- Beer, cider, wine and spirits categories
- Administrator category creation and product approval
- Product search and product profiles
- 1-to-5-star ratings, written reviews, photographs
- Personal rating history
- Public category pages
- Weighted best-rated rankings and trending rankings
- Basic user contribution leaderboard
- Content reporting
- Firebase security rules
- Basic administration dashboard

Friends, advanced location services, business accounts and machine-learning recommendations follow once the core platform is stable and users are actively contributing ratings and reviews.

## Suggested Technology Stack

| Area                               | Choice                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Android application                | Kotlin or Java                                                           |
| Android UI                         | Jetpack Compose or XML layouts                                           |
| Responsive web application and PWA | Next.js with TypeScript                                                  |
| Web UI                             | Responsive, accessible component library and shared design system        |
| Authentication                     | Firebase Authentication                                                  |
| Database                           | Cloud Firestore                                                          |
| Images                             | Firebase Storage                                                         |
| Server logic                       | Firebase Cloud Functions                                                 |
| Notifications                      | Firebase Cloud Messaging                                                 |
| Analytics                          | Firebase Analytics                                                       |
| Crash reporting                    | Firebase Crashlytics                                                     |
| Barcode scanning and OCR           | Google ML Kit                                                            |
| Maps and nearby discovery          | Google Maps SDK and Android Fused Location Provider                      |
| Administration dashboard           | Protected Next.js web application connected to the same Firebase project |

## Privacy, Age and Responsible Design

- Age confirmation appropriate to the user's country.
- Optional location access.
- Clear public and private content controls.
- No leaderboards based on alcohol quantity.
- No drinking speed challenges.
- No achievements for excessive consumption.
- Alcohol-free categories and recommendations.
- Ability to download personal data.
- Ability to delete ratings, photographs, location information and the full account.
- Clear labelling of sponsored products and business promotions.

## Monetisation Options

**Free user features:** ratings and reviews, personal history, basic recommendations, favourite products, category rankings, nearby discovery, community participation, basic lists and statistics.

**Premium user features:** advanced taste analysis, detailed statistics, unlimited lists, advanced comparison tools, group recommendations, travel discovery tools, data export, no advertising, early access to new features.

**Business revenue:** verified profiles, live menus, enhanced product pages, featured events, business analytics, new release promotions, clearly marked sponsored placements.

## Long-Term Vision

PintPal could become a complete cross-platform drinks discovery service where users track what they have tried, build a personal taste profile, discover suitable products, follow trusted reviewers, view the best products in every category, participate in public communities, earn recognition for useful contributions and find products nearby from any supported phone, tablet, laptop or desktop computer.

The strongest part of the concept is the combination of personal tracking, dynamic categories, community reviews, trustworthy rankings, user leaderboards and explainable recommendations. The system should remain useful to casual users while offering deeper data and social tools to enthusiasts, reviewers and businesses.

