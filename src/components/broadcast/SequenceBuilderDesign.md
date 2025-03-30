# Multi-Day Campaign Sequence Builder: Architecture Design

## 1. System Architecture Overview

![Architecture Overview](https://mermaid.ink/img/pako:eNqNkk1PwzAMhv9KlBMgdegNcUBo0jjsDpfkYo1ZSVwlLlOF-O-4bVdgE0icnNjP69hv9Fo5tAE1qMTZLdpJDavwTYPdgJuhOXo6wGIdTnBkCEWNhraQ7vIRFfQXjTMO3C_E47WAtweHW1DLssT4gPlJi6a0dYE0NZA7pwkC5mD3CnqKAOF8ggTWPqLnBMLaRO5YBt_5_N4rN7YGdtwnhqXAPcmtUIN3hg_Kd3bIUCeI1r9goIdPwlDpnqG9Jw82q7eTVXfkLZpw64hKgX04mf8ZzGdQKbZ4Jy6BrfUODsrQQ2EvDc0dRxtyDXGAO99C9sMWV45WQTWpMTJqfEOWA7X0rOK9TsGhPz8l-DkJQa2G-vJ3UZRyJuZ8YdJHxraSW_XKyKV-qGVnX1Q2xOkfLflBrJ_qcFmp)

### Core Components

1. **Campaign Manager**
   - Centralized control of campaign metadata
   - Campaign creation, editing, and management
   - Audience selection and targeting
   - Campaign activation/deactivation

2. **Sequence Builder**
   - Visual drag-and-drop sequence editor
   - Timing configuration for each step
   - Branching logic based on recipient actions
   - Wait periods and specific time scheduling

3. **Message Template System**
   - Reusable message templates
   - Channel-specific formatting (SMS, Email)
   - Personalization tokens
   - Template version control

4. **Scheduling Engine**
   - Time-zone aware scheduling
   - Intelligent delivery optimization
   - Blackout period configuration
   - Delivery throttling

5. **Analytics & Reporting**
   - Real-time campaign performance tracking
   - Engagement metrics by sequence step
   - A/B test performance comparison
   - Conversion tracking

## 2. Data Model

```sql
-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    audience_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    workspace_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Sequences table
CREATE TABLE sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Sequence steps table
CREATE TABLE sequence_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    message_template_id UUID NOT NULL REFERENCES message_templates(id),
    channel VARCHAR(50) NOT NULL, -- 'sms', 'email', etc.
    wait_duration INTERVAL, -- e.g., '1 day', '4 hours'
    wait_until TIME, -- specific time of day, e.g., '08:00'
    conditions JSONB DEFAULT '{}'::jsonb, -- for branching logic
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Message templates table
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    subject VARCHAR(255), -- for email
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    workspace_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Campaign recipients
CREATE TABLE campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    current_step_id UUID REFERENCES sequence_steps(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, contact_id)
);

-- Campaign message deliveries
CREATE TABLE campaign_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    sequence_step_id UUID NOT NULL REFERENCES sequence_steps(id),
    contact_id UUID NOT NULL REFERENCES contacts(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    message_id TEXT, -- external message ID from provider
    error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

## 3. Frontend Components

### Campaign Creation & Management

1. **Campaign Dashboard**
   - List of all campaigns with status
   - Quick filters and sorting
   - Campaign performance metrics
   - Campaign duplication, archiving, deletion

2. **Campaign Setup**
   - Campaign metadata (name, description)
   - Channel selection (SMS, Email, or both)
   - Audience selection with filtering
   - Campaign scheduling options

### Sequence Builder Interface

1. **Visual Sequence Editor**
   - Drag-and-drop interface for adding steps
   - Timeline view with wait periods
   - Branching paths based on user interactions
   - Preview mode

2. **Step Configuration Panel**
   - Message template selection/creation
   - Timing configuration
   - Wait duration or specific time setting
   - Conditions for branching

3. **Message Template Editor**
   - WYSIWYG editor for content
   - Personalization token insertion
   - Character count for SMS
   - Preview on different devices

### Analytics Dashboard

1. **Performance Overview**
   - Delivery, open, and click rates
   - Sequence step effectiveness
   - Conversion metrics
   - Audience engagement over time

2. **Detailed Reports**
   - Step-by-step performance analysis
   - Contact-level engagement data
   - A/B testing results
   - Export options

## 4. Backend Services

### Campaign Processing Service

```javascript
// Campaign processor
class CampaignProcessor {
  constructor() {
    this.queueService = new QueueService();
    this.contactService = new ContactService();
  }

  async activateCampaign(campaignId) {
    // Get campaign data
    const campaign = await this.getCampaign(campaignId);
    if (campaign.status !== 'draft') {
      throw new Error('Campaign must be in draft status to activate');
    }

    // Get contacts based on audience criteria
    const contacts = await this.contactService.getContactsByFilter(
      campaign.workspace_id,
      campaign.audience_criteria
    );

    // Get first sequence step
    const sequence = await this.getSequence(campaign.id);
    const firstStep = await this.getFirstSequenceStep(sequence.id);

    // Add contacts to campaign and queue first messages
    for (const contact of contacts) {
      await this.addContactToCampaign(campaign.id, contact.id, firstStep.id);
      await this.scheduleStepForContact(firstStep.id, contact.id);
    }

    // Update campaign status
    await this.updateCampaignStatus(campaignId, 'active');
  }

  async scheduleStepForContact(stepId, contactId) {
    const step = await this.getSequenceStep(stepId);
    const contact = await this.contactService.getContact(contactId);

    // Calculate delivery time
    let deliveryTime = new Date();
    
    // Add wait duration if specified
    if (step.wait_duration) {
      deliveryTime = addInterval(deliveryTime, step.wait_duration);
    }
    
    // Set to specific time of day if specified
    if (step.wait_until) {
      deliveryTime = setTimeOfDay(deliveryTime, step.wait_until);
    }

    // Create delivery record
    const delivery = await this.createDelivery({
      campaign_id: step.campaign_id,
      sequence_step_id: step.id,
      contact_id: contact.id,
      scheduled_at: deliveryTime,
      status: 'scheduled'
    });

    // Add to queue
    await this.queueService.addToQueue({
      type: step.channel,
      delivery_id: delivery.id,
      contact_id: contact.id,
      scheduled_time: deliveryTime
    });
  }
}
```

### Message Queue Processing

```javascript
// Queue processor service
class QueueProcessor {
  constructor() {
    this.deliveryService = new DeliveryService();
    this.smsService = new SMSService();
    this.emailService = new EmailService();
  }

  async processQueueItem(queueItem) {
    try {
      const delivery = await this.deliveryService.getDelivery(queueItem.delivery_id);
      const step = await this.deliveryService.getSequenceStep(delivery.sequence_step_id);
      const contact = await this.contactService.getContact(delivery.contact_id);
      const template = await this.deliveryService.getMessageTemplate(step.message_template_id);
      
      // Apply personalization
      const content = this.personalizeContent(template.content, contact);
      
      // Send based on channel
      let result;
      if (step.channel === 'sms') {
        result = await this.smsService.send({
          to: contact.phone_number,
          message: content,
          contactId: contact.id
        });
      } else if (step.channel === 'email') {
        result = await this.emailService.send({
          to: contact.email,
          subject: template.subject,
          html: content,
          contactId: contact.id
        });
      }
      
      // Update delivery status
      await this.deliveryService.updateDelivery(delivery.id, {
        status: 'sent',
        sent_at: new Date(),
        message_id: result.id
      });
      
      // Process next step if appropriate
      const nextStep = await this.deliveryService.getNextStep(step.id);
      if (nextStep) {
        await this.scheduleNextStep(nextStep.id, contact.id);
      }
      
      return { success: true };
    } catch (error) {
      // Handle error and retry logic
      return { success: false, error: error.message };
    }
  }
}
```

## 5. Adaptability & Extensibility

### Modular Component Design

1. **Channel Adapters**
   - Abstract interface for different channels (SMS, Email, Push)
   - Easy addition of new channels
   - Channel-specific formatting and limitations

2. **Custom Trigger System**
   - Event-based triggers for sequence advancement
   - API webhooks for external system integration
   - Custom conditions for branching logic

3. **Template Variable System**
   - Extensible personalization system
   - Custom variables per workspace
   - Dynamic content based on recipient data

## 6. Scalability Considerations

### Performance Optimization

1. **Database Indexing**
   - Optimize common queries with proper indexes
   - Partitioning for large campaign data
   - Efficient joins for reporting queries

2. **Job Queue Design**
   - Distributed message processing
   - Rate limiting to prevent provider throttling
   - Priority queues for immediate vs scheduled messages

3. **Caching Strategy**
   - Redis for frequently accessed campaign data
   - Template caching for fast message generation
   - Contact data caching for personalization

### High-Volume Handling

1. **Batch Processing**
   - Process campaign recipients in batches
   - Chunked database operations
   - Parallel processing for high-volume campaigns

2. **Rate Limiting & Throttling**
   - Provider-specific rate limits
   - Adaptive throttling based on error responses
   - Retry mechanism with exponential backoff

3. **Monitoring & Alerting**
   - Real-time performance monitoring
   - Alert thresholds for delivery failures
   - Queue backlog monitoring

## 7. Adjustment & Control Features

### Campaign Management Tools

1. **Pause/Resume Controls**
   - Ability to pause entire campaigns or specific steps
   - Emergency stop for all pending messages
   - Schedule adjustment for paused campaigns

2. **A/B Testing Framework**
   - Split testing for message variants
   - Statistical significance calculations
   - Dynamic winner selection

3. **Dynamic Content Adjustments**
   - Update templates for pending messages
   - Preview changes before applying
   - Version control for templates

## 8. Implementation Roadmap

### Phase 1: Core Foundation
- Basic campaign creation
- Simple sequential steps
- Single channel support (SMS)
- Basic scheduling

### Phase 2: Enhanced Sequencing
- Visual sequence builder
- Wait times and specific scheduling
- Message template system
- Basic reporting

### Phase 3: Advanced Features
- Multi-channel support
- Branching logic
- A/B testing
- Advanced analytics

### Phase 4: Enterprise Capabilities
- API integration
- Custom event triggers
- Advanced personalization
- Team collaboration features

## 9. Technical Stack Recommendations

- **Frontend**: React with Redux for state management
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with JSONB for flexible data
- **Queue**: Redis + Bull for job processing
- **Caching**: Redis
- **Monitoring**: Prometheus + Grafana

## 10. Integration Points

### External Systems Integration

1. **CRM Integration**
   - Bidirectional data sync
   - Contact status updates
   - Campaign result import/export

2. **Analytics Platforms**
   - Google Analytics
   - Mixpanel/Amplitude
   - Custom tracking endpoints

3. **Message Service Providers**
   - Twilio for SMS
   - SendGrid/Mailgun for Email
   - Easy addition of new providers 