# Broadcast Compose Section Documentation

## 1. Completed Features

### Database Structure
- Verified and tested broadcast message storage
- Implemented type-specific content validation (SMS vs Email)
- Set up sequence management for multi-day broadcasts
- Added data consistency triggers and constraints

### Content Type Handling
- SMS broadcasts: body-only content structure
- Email broadcasts: subject + body content structure
- Sequence messages with type-specific validation
- Automatic subject field management

## 2. Files Involved

### Frontend Components
- `BroadcastManager.js`: Main broadcast management component
- `BroadcastComposer.js`: Message composition interface
- `AboutBroadcast.md`: Feature documentation

### Database Tables
- `broadcasts`: Main broadcast records
- `broadcast_sequences`: Sequence/multi-day messages
- `active_broadcasts`: View combining broadcast data
- `broadcast_analytics`: Analytics tracking
- `broadcast_delivery_stats`: Delivery statistics
- `broadcast_filters`: Audience filtering
- `broadcast_queue`: Message queue management
- `broadcast_recipient_details`: Detailed recipient tracking
- `broadcast_recipients`: Core recipient records

## 3. SQL Commands Created

### Table Verification
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'broadcasts' 
ORDER BY 
    ordinal_position;
```
Purpose: Inspect table structure and constraints

### Test Data Creation
```sql
INSERT INTO broadcasts (
    campaign_id,
    workspace_id,
    type,
    status,
    content,
    audience,
    estimated_recipients
) VALUES (
    '[campaign_id]',
    '[workspace_id]',
    'sms',
    'draft',
    jsonb_build_object('body', 'message'),
    jsonb_build_object('filters', '[]'::jsonb),
    0
);
```
Purpose: Create test broadcasts with proper structure

### Sequence Management
```sql
INSERT INTO broadcast_sequences (
    broadcast_id,
    day_number,
    scheduled_date,
    content,
    subject,
    metadata
) VALUES (
    '[broadcast_id]',
    1,
    NOW() + interval '1 day',
    'message content',
    NULL,  -- NULL for SMS, value for email
    jsonb_build_object('type', 'type_value')
);
```
Purpose: Create and manage broadcast sequences

## 4. SQL Functions

### validate_broadcast_sequence()
```sql
CREATE OR REPLACE FUNCTION validate_broadcast_sequence()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM broadcasts 
        WHERE id = NEW.broadcast_id 
        AND type = 'sms'
    ) AND NEW.subject IS NOT NULL THEN
        RAISE EXCEPTION 'SMS broadcasts cannot have subjects';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
Purpose: Ensures SMS sequences don't have subjects

### validate_broadcast_content()
```sql
CREATE OR REPLACE FUNCTION validate_broadcast_content()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'sms' AND (NEW.content->>'subject') IS NOT NULL THEN
        NEW.content = NEW.content - 'subject';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
Purpose: Automatically removes subjects from SMS broadcast content

## 5. Roadmap

### Immediate Next Steps
1. Add character limit validation for SMS messages
2. Implement recipient tracking system
3. Add status transition management
4. Set up delivery scheduling system

### Short-term Goals
1. Template system for common messages
2. Variable substitution (e.g., {{firstName}})
3. Message preview with actual contact data
4. Draft saving functionality

### Medium-term Goals
1. A/B testing capability
2. Message version history
3. Advanced analytics tracking
4. Delivery time optimization

### Long-term Goals
1. AI-powered content suggestions
2. Advanced template management
3. Multi-language support
4. Advanced scheduling options

## Notes
- All SMS broadcasts must only contain body content
- Email broadcasts can have both subject and body
- Sequences follow the same content rules as their parent broadcast
- All changes are tracked with timestamps
- Workspace isolation is maintained throughout 