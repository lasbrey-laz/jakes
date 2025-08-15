# Referral System Documentation

## Overview

The referral system allows admins to create unique referral codes to track how users discover your marketplace. It provides comprehensive analytics including visit tracking, conversion rates, and user attribution.

## Features

- **Unique Referral Codes**: Each admin can create multiple referral codes with descriptions
- **Visit Tracking**: Automatically tracks when users visit through referral links
- **Conversion Tracking**: Records when visitors become registered users
- **Analytics Dashboard**: View statistics for each referral code
- **IP & User Agent Tracking**: Captures visitor information for better insights
- **Admin Management**: Full CRUD operations for referral codes

## Database Schema

### Tables Created

1. **`referral_codes`** - Stores referral codes and their metadata
2. **`referral_visits`** - Tracks each visit through a referral link
3. **`referral_conversions`** - Records when visitors convert to users

### Key Functions

- `generate_referral_code()` - Creates unique 8-character codes
- `track_referral_visit()` - Records a visit through a referral link
- `mark_referral_conversion()` - Marks a successful conversion

## Setup Instructions

### 1. Run the Migration

```bash
# Apply the referral system migration
npx supabase db push
```

### 2. Access the Referral Management

Navigate to `/admin/referrals` in your admin panel to:
- Create new referral codes
- View analytics and statistics
- Manage existing codes

## How It Works

### 1. Creating Referral Codes

1. Go to Admin Panel → Referrals
2. Click "Create Code"
3. Add a description (e.g., "Social Media Campaign", "Email Newsletter")
4. System generates a unique 8-character code

### 2. Using Referral Links

Referral links follow this format:
```
https://yoursite.com?ref=ABC12345
```

Where `ABC12345` is your referral code.

### 3. Automatic Tracking

- **Visit Tracking**: When someone visits with `?ref=CODE`, the system automatically:
  - Records the visit timestamp
  - Captures visitor IP and user agent
  - Links the visit to your referral code

- **Conversion Tracking**: When a visitor signs up, the system:
  - Marks the visit as converted
  - Records the conversion source (e.g., "signup")
  - Links the new user to your referral code

## Analytics & Metrics

### Dashboard Overview

- **Total Codes**: Number of active referral codes
- **Total Visits**: Combined visits across all codes
- **Total Conversions**: Combined conversions across all codes
- **Average Conversion Rate**: Overall conversion percentage

### Per-Code Statistics

- **Visits**: Number of unique visits through that code
- **Conversions**: Number of successful conversions
- **Conversion Rate**: Percentage of visitors who became users

## Use Cases

### Marketing Campaigns
- Create codes for different social media platforms
- Track email newsletter effectiveness
- Monitor influencer partnership performance

### Content Marketing
- Different codes for blog posts
- Podcast episode tracking
- Video content attribution

### Partner Programs
- Affiliate partner tracking
- Business partnership attribution
- Referral program management

## Technical Implementation

### Frontend Integration

The referral system is integrated throughout the application:

1. **App.tsx**: Initializes referral tracking on app load
2. **Login.tsx**: Tracks conversions during user registration
3. **AdminReferrals.tsx**: Management interface for admins
4. **useReferralTracking.ts**: Custom hook for referral functionality

### Backend Functions

- **Automatic Code Generation**: Ensures unique, collision-free codes
- **Visit Recording**: Captures comprehensive visitor data
- **Conversion Marking**: Links users to their referral source
- **Data Integrity**: RLS policies ensure data security

## Security Features

- **Row Level Security (RLS)**: Admins can only access their own referral data
- **IP Address Tracking**: Helps prevent abuse and track genuine visits
- **User Agent Logging**: Provides additional visit context
- **Admin-Only Access**: Referral management restricted to admin users

## Customization Options

### Conversion Sources

You can customize conversion sources beyond "signup":
- `purchase` - When users make their first purchase
- `vendor_signup` - When users become vendors
- `wallet_funding` - When users fund their wallet

### Additional Metrics

The system can be extended to track:
- Time to conversion
- Geographic data
- Device information
- Referral chain tracking

## Troubleshooting

### Common Issues

1. **Codes Not Generating**: Check database permissions and function availability
2. **Visits Not Tracking**: Verify RLS policies and function calls
3. **Conversions Not Recording**: Ensure proper user ID linking

### Debug Information

- Check browser console for tracking logs
- Verify referral codes in admin panel
- Monitor database function calls
- Review RLS policy compliance

## Best Practices

1. **Descriptive Names**: Use clear descriptions for each referral code
2. **Regular Monitoring**: Check analytics weekly to optimize campaigns
3. **Code Organization**: Group related codes with consistent naming
4. **Performance Tracking**: Monitor conversion rates to improve effectiveness

## Future Enhancements

Potential improvements include:
- **A/B Testing**: Compare different referral strategies
- **Advanced Analytics**: Geographic and demographic insights
- **Automated Reporting**: Scheduled email reports
- **Integration APIs**: Connect with external analytics tools
- **Multi-Touch Attribution**: Track multiple referral sources per user

## Support

For technical support or feature requests, refer to the main project documentation or contact the development team.
