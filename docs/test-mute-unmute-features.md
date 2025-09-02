# Test Guide: Mute/Unmute Features & Viewer Name Display

## Overview
This guide will help you test the newly implemented features:
1. **Mute/Unmute functionality** with admin approval for unmuting
2. **Display viewer names** from their logged-in profiles in the database

## Prerequisites
- Backend server running (`cd backend && npm start`)
- At least one registered user account
- Admin account logged in
- Browser with microphone permissions

## Feature 1: Mute/Unmute Functionality

### Test Steps:

#### 1. Start Live Stream (Admin)
1. Open admin dashboard: `http://localhost:3000/admin/dashboard.html`
2. Login with admin credentials
3. Click on "Live Stream" tab
4. Click "Start Live Stream" button
5. Allow screen sharing when prompted
6. Verify stream status shows "LIVE"

#### 2. Join as Viewer (User)
1. Open viewer page: `http://localhost:3000/en/livestream.html`
2. Login with user credentials (or register a new user)
3. Verify you can see the live stream
4. Click "🎤 Request to Speak" button
5. Allow microphone access when prompted

#### 3. Test Mute/Unmute Flow
1. **After mic approval**, you should see two new buttons:
   - 🔇 Mute (red button)
   - 🔊 Unmute (yellow button)

2. **Test Mute:**
   - Click "🔇 Mute" button
   - Verify the button changes to "🔊 Unmute"
   - Your microphone should be muted (no audio sent to admin)

3. **Test Unmute Request:**
   - Click "🔊 Unmute" button
   - Button should show "Requesting..." and be disabled
   - After 3 seconds, it should return to normal state

#### 4. Admin Approval Process
1. **In admin dashboard**, you should see unmute requests in the mic requests list
2. **Request format:** `[User Name] (Phone) - Unmute Request`
3. **Admin actions:**
   - Click "✅ Approve" to allow unmuting
   - Click "❌ Reject" to deny unmuting

#### 5. Verify Unmute Approval
1. **After admin approval**, the viewer should:
   - See alert: "🎤 Your microphone has been unmuted!"
   - Button should change back to "🔇 Mute"
   - Microphone should be active again

## Feature 2: Viewer Name Display

### Test Steps:

#### 1. Verify User Profile Data
1. Register/login with a user account
2. Go to profile page and verify your name is set
3. Note your phone number and other details

#### 2. Test Name Display in Requests
1. **Start live stream as admin**
2. **Join as viewer with logged-in account**
3. **Request microphone access**
4. **In admin dashboard**, verify the request shows:
   - Your actual name (not "Viewer" or "Anonymous")
   - Your phone number in parentheses
   - Example: `John Doe (123456789)`

#### 3. Test Unmute Request Name Display
1. **As viewer**, mute your microphone
2. **Request unmute**
3. **In admin dashboard**, verify the unmute request shows:
   - Your actual name
   - Phone number
   - "Unmute Request" label
   - Example: `John Doe (123456789) - Unmute Request`

#### 4. Test Anonymous Users
1. **Join stream without logging in**
2. **Request microphone access**
3. **Verify admin sees:** `Anonymous` (no phone number)

## Feature 3: Arabic Interface Testing

### Test Steps:

#### 1. Arabic Livestream Page
1. Open: `http://localhost:3000/ar/livestream.html`
2. Login with Arabic user account
3. Test all mute/unmute functionality in Arabic
4. Verify Arabic button labels:
   - "🎤 طلب التحدث" (Request to Speak)
   - "🔇 كتم الصوت" (Mute)
   - "🔊 إلغاء كتم الصوت" (Unmute)

#### 2. Arabic User Names
1. **Create user with Arabic name**
2. **Test name display in admin dashboard**
3. **Verify Arabic names appear correctly**

## Console Logs to Monitor

### Viewer Console (F12 → Console):
```
🎤 Mic approved - requesting microphone access...
✅ Microphone access granted
🔇 Microphone muted
🔊 Microphone unmuted
```

### Admin Console:
```
🎤 Mic request from [User Name] (socketId)
🔊 Unmute request from [User Name] (socketId)
✅ mic approved for: [socketId]
✅ unmute approved for: [socketId]
```

### Backend Console:
```
🎤 mic request: {socketId, user, userInfo}
🔊 unmute request: {socketId, user, userInfo}
✅ mic approved for: [socketId]
✅ unmute approved for: [socketId]
```

## Expected Behavior

### Mute/Unmute Flow:
1. **User gets mic approval** → Mute/Unmute buttons appear
2. **User clicks Mute** → Audio stops, button changes to Unmute
3. **User clicks Unmute** → Request sent to admin
4. **Admin approves** → Audio resumes, button changes to Mute
5. **Admin rejects** → Request removed, user stays muted

### Name Display:
1. **Logged-in users** → Show real name + phone
2. **Anonymous users** → Show "Anonymous"
3. **All requests** → Include user info in admin dashboard

## Troubleshooting

### Common Issues:

1. **Buttons don't appear after mic approval:**
   - Check browser console for errors
   - Verify microphone permissions
   - Refresh page and try again

2. **Names not showing correctly:**
   - Verify user is logged in
   - Check user profile has name set
   - Clear browser cache and try again

3. **Unmute requests not appearing:**
   - Check admin dashboard console
   - Verify socket connection
   - Restart backend server

4. **Audio not working:**
   - Check browser microphone permissions
   - Verify WebRTC is supported
   - Try different browser

### Debug Commands:
```javascript
// In browser console to check user info
console.log(localStorage.getItem('userToken'));

// To check mic stream status
console.log(userMicStream?.getAudioTracks()[0]?.enabled);
```

## Success Criteria

✅ **Mute/Unmute works correctly**
✅ **Admin approval system functions**
✅ **User names display properly**
✅ **Arabic interface works**
✅ **Anonymous users handled correctly**
✅ **Console logs show proper flow**
✅ **No errors in browser console**

## Notes

- The mute/unmute functionality only works after microphone approval
- User names are fetched from the `/api/users/me` endpoint
- All requests include user information for admin review
- Arabic interface mirrors English functionality
- Anonymous users can still request mic access but show as "Anonymous" 