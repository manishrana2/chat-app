# Feature Suggestions - What to Add Next

## 🚀 High Priority Features (Easy to Implement)

### 1. **Online Status & Last Seen** (WhatsApp Style)
- Show green dot when user is online
- Display "Last seen at 2:30 PM" when offline
- Update status in real-time
- Implementation: Add `lastSeen` and `isOnline` field to users table

```typescript
// Database field
lastSeen: v.number(), // timestamp
isOnline: v.boolean()
```

---

### 2. **Read Receipts** (WhatsApp Style)
- Single tick: Message sent
- Double tick: Message delivered
- Blue double tick: Message read
- Show when user read the message
- Implementation: Already have `readBy` array, just need UI

```typescript
// Status: "sent" | "delivered" | "read"
// Show different tick icons based on status
```

---

### 3. **Muted Conversations**
- Mute notifications for specific chats
- Add mute toggle in conversation options
- Show muted icon on conversation list
- Implementation: Add `mutedUsers` array to conversations

```typescript
conversations: {
  ...
  mutedUsers: v.array(v.string()) // user IDs who muted
}
```

---

### 4. **Message Search** (Already in backend!)
- Search bar in ChatWindow
- Search across all conversations
- Filter by sender, date, type
- Implementation: Use existing `searchMessages` query

---

### 5. **User Profiles**
- Click on username to see full profile
- Show username, name, bio, profile picture
- Show mutual contacts
- Block/unblock from profile
- Implementation: Add profile modal component

```typescript
users: {
  ...
  bio: v.optional(v.string()),
  profileImage: v.optional(v.string()),
  lastSeen: v.optional(v.number()),
  isOnline: v.optional(v.boolean())
}
```

---

### 6. **Conversation Settings**
- Mute conversation
- Archive conversation (hide from list but keep data)
- Pin conversation (keep at top)
- Notification sound preferences
- Implementation: Add settings to conversations table

```typescript
conversations: {
  ...
  archivedBy: v.array(v.string()), // who archived
  pinnedBy: v.array(v.string())    // who pinned
}
```

---

### 7. **Message Timestamps**
- Show "Today", "Yesterday", "2 days ago"
- Show exact time for old messages
- Hover to see full timestamp
- Implementation: Format `createdAt` naively on UI

---

### 8. **Typing Indicators Improvement**
- "User is typing..." for multiple users
- Animation with dots
- Auto-clear after 3 seconds no activity
- Implementation: Enhance existing typing system

---

## 🌟 Medium Priority Features

### 9. **Group Chats** (Major Update)
- Create group with multiple people
- Add/remove members
- Group admins with special permissions
- Group name and picture
- Group notifications settings
- Implementation: New `groups` table + separate group conversations

```typescript
groups: defineTable({
  name: v.string(),
  image: v.optional(v.string()),
  createdBy: v.string(),
  members: v.array(v.string()),
  admins: v.array(v.string()),
  createdAt: v.number()
})
```

---

### 10. **Disappearing Messages**
- Messages that auto-delete after time (like Snapchat)
- Options: 24 hours, 7 days, 30 days
- Show timer on message
- Implementation: Add `expiresAt` field to messages

```typescript
messages: {
  ...
  expiresAt: v.optional(v.number()),
  disappearsIn: v.optional(v.string()) // "24h", "7d", "30d"
}
```

---

### 11. **Document/File Sharing**
- Share PDF, Word, Excel files
- Show file preview/icon
- Download button
- File size display
- Implementation: Allow `mediaType` for documents

---

### 12. **Location Sharing** (Instagram-like)
- Share current location on map
- Show location name/address
- Draw location on story
- Implementation: Use geolocation API + Mapbox/Google Maps

---

### 13. **Broadcasted Messages** (Instagram DM)
- Send message to multiple people at once
- Track who read/received
- Like Instagram broadcast list
- Implementation: New `broadcasts` table

---

### 14. **Message Drafts**
- Auto-save draft while typing
- Show "Draft" label on conversation
- Resume draft when reopening conversation
- Implementation: Store in localStorage or database

---

### 15. **Call Recording**
- Record voice/video calls
- Save to storage
- Access past recordings
- Implementation: Extend WebRTC call logic

---

## ✨ Premium Features (More Complex)

### 16. **Video Messages**
- Record short video message (like WhatsApp)
- Play inline
- Auto-delete option
- Implementation: Add video recording capability

---

### 17. **Voice Messages**
- Record voice note (like WhatsApp audio)
- Play with speed control
- Waveform visualization
- Implementation: Use Web Audio API

---

### 18. **Stickers** (Instagram-like)
- Use sticker packs in stories and messages
- Create custom sticker packs
- Animated stickers
- Implementation: Add stickers library

---

### 19. **Filters for Stories** (Instagram-like)
- Beauty filters
- Face filters
- Fun AR filters
- Color filters
- Implementation: Use Snapchat-like AR libraries

---

### 20. **Story Mentions & Hashtags**
- Tag people in stories (@username)
- Add hashtags (#topic)
- Click to see all stories with hashtag
- Implementation: Parse and store mentions/hashtags

---

### 21. **User Suggestions** (Instagram Explore)
- Show suggested users to follow
- Based on mutual contacts
- Machine learning recommendations
- Implementation: Simple mutual friend logic

---

### 22. **Reels** (Instagram-like Short Videos)
- Upload short videos
- Watch in feed
- Like, comment, share
- Implementation: Video upload and streaming

---

### 23. **Push Notifications**
- Browser/mobile push for messages
- Call notifications
- Story notifications
- System tray integration
- Implementation: Use web push API or service workers

---

### 24. **Chat Theming**
- Change chat bubble colors
- Dark mode for specific chats
- Custom chat wallpaper
- Implementation: Per-conversation theme settings

---

## 🎯 Quick Wins (Easiest to Add)

| Feature | Time | Difficulty | Impact |
|---------|------|-----------|--------|
| Online Status | 1-2 hours | Easy | High |
| Message Timestamps | 30 mins | Easy | High |
| Read Receipts UI | 1 hour | Easy | High |
| Conversation Pin | 2 hours | Easy | Medium |
| Conversation Archive | 2 hours | Easy | Medium |
| Mute Conversation | 1 hour | Easy | High |
| User Bio | 1-2 hours | Easy | Medium |
| Message Search UI | 1 hour | Easy | Medium |
| Last Seen | 1-2 hours | Easy | High |
| Chat Settings | 2-3 hours | Easy | Medium |

## 📊 Feature Difficulty Matrix

### Easy (1-3 hours)
- Online status
- Read receipt UI
- Mute conversation
- Archive conversation
- Pin conversation
- Message timestamps
- User bio
- Last seen

### Medium (3-8 hours)
- User profiles
- Message search UI
- Document sharing
- Message drafts
- Chat theming
- Group settings

### Hard (8-24 hours)
- Group chats (full system)
- Disappearing messages
- Voice messages
- Broadcast lists

### Very Hard (24+ hours)
- Location sharing
- Story filters
- Reels feature
- Push notifications
- Call recording
- Video messages

---

## 🎬 Recommended Next 5 Features

Based on user experience and effort:

1. **Online Status** (1-2h) - Makes app feel alive ✅
2. **Read Receipts UI** (1h) - Expected WhatsApp feature ✅
3. **Mute Conversation** (1h) - Quality of life ✅
4. **User Profiles** (2h) - Learn about contacts ✅
5. **Last Seen** (1-2h) - Know when user was active ✅

**Total Time: 5-8 hours for major improvements!**

---

## 🛠 How to Choose What to Build

### For WhatsApp-like experience:
1. Online status / Last seen
2. Read receipts
3. Group chats
4. Voice messages
5. Disappearing messages
6. Mute notifications

### For Instagram-like experience:
1. User profiles with bio
2. Story filters / AR effects
3. Story mentions & replies
4. Reels feature
5. Explore/recommendations
6. User suggestions

### For Telegram-like experience:
1. Group chats
2. Channels (broadcast)
3. Admin features
4. Message pinning (done!)
5. Fast forwarding
6. Bot support

---

## Implementation Examples

### Example 1: Adding Online Status

**Step 1**: Update schema
```typescript
users: defineTable({
  ...
  isOnline: v.boolean(),
  lastSeen: v.number()
})
```

**Step 2**: Add server mutation
```typescript
export const setUserOnline = mutation({
  args: { userId: v.string(), isOnline: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId as any, {
      isOnline: args.isOnline,
      lastSeen: Date.now()
    });
  }
});
```

**Step 3**: Update UI
```tsx
// Show green dot in Sidebar
{user.isOnline ? (
  <div className="w-3 h-3 bg-green-500 rounded-full" />
) : (
  <p className="text-xs text-gray-500">
    Last seen at {formatTime(user.lastSeen)}
  </p>
)}
```

**Step 4**: Call on connect/disconnect
```tsx
useEffect(() => {
  const handleOnline = async () => {
    await setUserOnlineMut({ userId: user._id, isOnline: true });
  };
  
  window.addEventListener("focus", handleOnline);
  return () => window.removeEventListener("focus", handleOnline);
}, [user._id]);
```

---

### Example 2: Mute Conversation

**Step 1**: Add to schema
```typescript
conversations: defineTable({
  ...
  mutedUsers: v.array(v.string())
})
```

**Step 2**: Add mutation
```typescript
export const toggleMuteConversation = mutation({
  args: { conversationId: v.id("conversations"), userId: v.string() },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Not found");
    
    const isMuted = conv.mutedUsers?.includes(args.userId);
    await ctx.db.patch(args.conversationId, {
      mutedUsers: isMuted 
        ? conv.mutedUsers.filter(id => id !== args.userId)
        : [...(conv.mutedUsers || []), args.userId]
    });
  }
});
```

**Step 3**: Show mute button in ChatWindow
```tsx
<button onClick={() => toggleMuteMut({conversationId, userId})}>
  {isMuted ? "🔔" : "🔕"} Mute
</button>
```

---

## 💡 Integration Notes

- **All features share same database** (Convex schema)
- **Reuse existing components** (ChatWindow, Sidebar)
- **Real-time via Convex subscriptions** (already set up)
- **Authentication ready** (useAuth hook)
- **TypeScript strict mode** (type safe)

---

## Questions to Ask Before Building

1. **Who is your audience?** (Teens, professions, casual users)
2. **What's the main use case?** (Dating, gaming, work, social)
3. **Monetization?** (Free, premium, ads, in-app purchases)
4. **Platform focus?** (Web, mobile, both)
5. **Biggest competitor?** (WhatsApp, Telegram, Instagram, Discord)

Choose features that fit your target audience!

---

**Next Section: Implement one feature from "Quick Wins" list above!** 🎯
